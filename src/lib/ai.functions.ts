import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";
export const PROMPT_VERSION = "ekstraksi-v0.1";

const SYSTEM_EKSTRAKSI = `Anda adalah asisten administrasi persuratan di BLSDM Komdigi Jakarta.
Tugas: membaca surat masuk dan lembar disposisi pimpinan, lalu mengekstrak informasi untuk pembuatan Surat Tugas.
Aturan:
1. Keluarkan HANYA data sesuai skema fungsi.
2. Ambil data hanya dari dokumen. JANGAN menebak atau mengarang.
3. Jika data tidak ada, tulis null dan catat di isian_bermasalah.
4. Jika tulisan tangan tidak terbaca jelas, tandai tulisan_tidak_terbaca.
5. Salin nama, NIP, dan jabatan persis seperti tertulis (termasuk gelar).
6. Format tanggal YYYY-MM-DD.
7. Isi perintah_surat_tugas = true hanya jika disposisi jelas memerintahkan pembuatan surat tugas atau penugasan pegawai.
8. Pilih rekomendasi_template: 1-3 pegawai = tanpa_lampiran, 4 atau lebih = dengan_lampiran. Jelaskan alasannya singkat.
9. tingkat_keyakinan berisi angka 0.0-1.0 untuk setiap isian dengan kunci jalur seperti "surat_masuk.nomor", "kegiatan.tempat", "pegawai_ditugaskan".`;

const SYSTEM_FINAL = `Tugas: membaca PDF Surat Tugas yang sudah ditandatangani elektronik (TTE), lalu mengeluarkan nomor surat, tanggal surat (YYYY-MM-DD), nama-nama pegawai, dan judul kegiatan. Jangan menebak; tulis null bila tidak ditemukan.`;

const s = { type: ["string", "null"] };
const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    surat_masuk: { type: "object", properties: { nomor: s, tanggal: s, pengirim: s, perihal: s } },
    disposisi: {
      type: "object",
      properties: { dari_pimpinan: s, instruksi: s, perintah_surat_tugas: { type: "boolean" }, tanggal_disposisi: s },
    },
    kegiatan: {
      type: "object",
      properties: { nama: s, tanggal_mulai: s, tanggal_selesai: s, tempat: s, penyelenggara: s },
    },
    pegawai_ditugaskan: {
      type: "array",
      items: { type: "object", properties: { nama: s, nip: s, jabatan: s, unit: s } },
    },
    rekomendasi_template: { type: "string", enum: ["dengan_lampiran", "tanpa_lampiran"] },
    alasan_template: { type: "string" },
    isian_bermasalah: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          masalah: { type: "string", enum: ["tidak_ditemukan", "ambigu", "tulisan_tidak_terbaca"] },
          catatan: { type: "string" },
        },
        required: ["field", "masalah"],
      },
    },
    tingkat_keyakinan: { type: "object", additionalProperties: { type: "number" } },
  },
  required: ["surat_masuk", "disposisi", "kegiatan", "pegawai_ditugaskan", "isian_bermasalah", "tingkat_keyakinan"],
};

const FINAL_SCHEMA = {
  type: "object",
  properties: {
    nomor_surat: s,
    tanggal_surat: s,
    judul_kegiatan: s,
    nama_pegawai: { type: "array", items: { type: "string" } },
  },
  required: ["nomor_surat", "tanggal_surat"],
};

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

type Supa = { storage: { from: (b: string) => { download: (p: string) => Promise<{ data: Blob | null; error: unknown }> } } };

async function filePart(supabase: Supa, path: string, label: string) {
  const { data, error } = await supabase.storage.from("surat").download(path);
  if (error || !data) throw new Error(`Gagal membaca file ${label}`);
  const mime = data.type || (path.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
  const url = `data:${mime};base64,${toBase64(await data.arrayBuffer())}`;
  if (mime === "application/pdf") {
    return { type: "file", file: { filename: `${label}.pdf`, file_data: url } };
  }
  return { type: "image_url", image_url: { url } };
}

async function callAI(system: string, content: unknown[], schema: object, fnName: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Layanan AI belum dikonfigurasi");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
      tools: [{ type: "function", function: { name: fnName, description: "Keluaran terstruktur", parameters: schema } }],
      tool_choice: { type: "function", function: { name: fnName } },
    }),
  });
  if (res.status === 429) throw new Error("Batas permintaan AI tercapai, coba lagi sebentar.");
  if (res.status === 402) throw new Error("Kredit AI habis. Tambahkan kredit di pengaturan workspace.");
  if (!res.ok) {
    console.error("AI error", res.status, await res.text());
    throw new Error("Pemrosesan AI gagal");
  }
  const json = await res.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI tidak mengembalikan data terstruktur");
  return JSON.parse(args);
}

export const extractLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ letterId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: letter, error } = await supabase
      .from("letters")
      .select("id, file_surat, file_disposisi")
      .eq("id", data.letterId)
      .single();
    if (error || !letter) throw new Error("Surat tidak ditemukan atau tidak ada akses");
    const parts: unknown[] = [{ type: "text", text: "Dokumen 1: Surat masuk." }];
    parts.push(await filePart(supabase as unknown as Supa, letter.file_surat, "surat_masuk"));
    if (letter.file_disposisi) {
      parts.push({ type: "text", text: "Dokumen 2: Lembar disposisi pimpinan." });
      parts.push(await filePart(supabase as unknown as Supa, letter.file_disposisi, "disposisi"));
    }
    const hasil = await callAI(SYSTEM_EKSTRAKSI, parts, EXTRACTION_SCHEMA, "hasil_ekstraksi");
    const { error: insErr } = await supabase
      .from("extractions")
      .insert({ letter_id: letter.id, json_hasil: hasil, versi_prompt: PROMPT_VERSION, model: MODEL });
    if (insErr) throw new Error("Gagal menyimpan hasil ekstraksi");
    await supabase.from("letters").update({ status: "diekstrak", diperbarui_pada: new Date().toISOString() }).eq("id", letter.id);
    await supabase.from("audit_logs").insert({
      letter_id: letter.id,
      pengguna: context.userId,
      aksi: "ekstraksi",
      detail: { model: MODEL, versi_prompt: PROMPT_VERSION, isian_bermasalah: hasil?.isian_bermasalah?.length ?? 0 },
    });
    return hasil;
  });

export const extractFinal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ letterId: z.string().uuid(), path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: letter } = await supabase.from("letters").select("id").eq("id", data.letterId).single();
    if (!letter || !data.path.startsWith(`letters/${data.letterId}/`)) throw new Error("Tidak ada akses");
    const part = await filePart(supabase as unknown as Supa, data.path, "final");
    const hasil = await callAI(SYSTEM_FINAL, [part], FINAL_SCHEMA, "hasil_final");
    await supabase.from("audit_logs").insert({
      letter_id: data.letterId,
      pengguna: context.userId,
      aksi: "ekstraksi_pdf_final",
      detail: { nomor_surat: hasil?.nomor_surat ?? null },
    });
    return hasil as { nomor_surat: string | null; tanggal_surat: string | null; judul_kegiatan?: string | null; nama_pegawai?: string[] };
  });
