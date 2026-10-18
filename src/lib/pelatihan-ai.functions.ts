import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3.8-flash";
export const PELATIHAN_PROMPT_VERSION = "pelatihan-v0.1";

const SYSTEM = `Anda adalah asisten administrasi di Sub Bagian Tata Usaha.
Tugas: membaca dokumen bukti pelatihan (sertifikat, surat keterangan, atau daftar hadir), lalu mengekstrak informasi untuk rekapitulasi bukti pelatihan.
Aturan:
1. Keluarkan HANYA data sesuai skema fungsi.
2. Ambil data hanya dari dokumen. JANGAN menebak atau mengarang.
3. Jika data tidak ada, tulis null dan catat di isian_bermasalah.
4. Jika tulisan tidak terbaca jelas, tandai tulisan_tidak_terbaca.
5. Salin nama, NIP, dan jabatan persis seperti tertulis (termasuk gelar).
6. Format tanggal YYYY-MM-DD.
7. durasi berisi lama pelatihan persis seperti tertulis (misalnya "24 JP" atau "3 hari"); null bila tidak tercantum.
8. dasar_dokumen berisi nomor dan tanggal dokumen bukti (misalnya nomor sertifikat); null bila tidak ada.
9. tingkat_keyakinan berisi angka 0.0-1.0 untuk setiap isian dengan kunci jalur seperti "pelatihan.nama", "peserta".`;

const s = { type: ["string", "null"] };
const SCHEMA = {
  type: "object",
  properties: {
    pelatihan: {
      type: "object",
      properties: { nama: s, penyelenggara: s, tanggal_mulai: s, tanggal_selesai: s, tempat: s, durasi: s },
    },
    peserta: { type: "array", items: { type: "object", properties: { nama: s, nip: s, jabatan: s } } },
    dasar_dokumen: s,
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
  required: ["pelatihan", "peserta", "isian_bermasalah", "tingkat_keyakinan"],
};

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

export const extractPelatihan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pelatihanId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("pelatihan")
      .select("id, file_bukti, dibuat_oleh")
      .eq("id", data.pelatihanId)
      .single();
    if (error || !row || row.dibuat_oleh !== context.userId) throw new Error("Bukti pelatihan tidak ditemukan atau tidak ada akses");
    const { data: file, error: dlErr } = await supabase.storage.from("surat").download(row.file_bukti);
    if (dlErr || !file) throw new Error("File bukti tidak dapat dibaca");
    const mime = file.type || (row.file_bukti.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    const url = `data:${mime};base64,${toBase64(await file.arrayBuffer())}`;
    const part = mime === "application/pdf"
      ? { type: "file", file: { filename: "bukti.pdf", file_data: url } }
      : { type: "image_url", image_url: { url } };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Layanan AI belum dikonfigurasi");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [{ type: "text", text: "Dokumen bukti pelatihan." }, part] },
        ],
        tools: [{ type: "function", function: { name: "hasil_ekstraksi", description: "Keluaran terstruktur", parameters: SCHEMA } }],
        tool_choice: { type: "function", function: { name: "hasil_ekstraksi" } },
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
    const hasil = JSON.parse(args);
    const { error: insErr } = await supabase
      .from("pelatihan_extractions")
      .insert({ pelatihan_id: row.id, json_hasil: hasil, versi_prompt: PELATIHAN_PROMPT_VERSION, model: MODEL });
    if (insErr) throw new Error("Gagal menyimpan hasil ekstraksi");
    await supabase.from("pelatihan").update({ status: "diekstrak", diperbarui_pada: new Date().toISOString() }).eq("id", row.id);
    return hasil;
  });
