import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const STATUS_LABEL: Record<string, string> = {
  diunggah: "Diunggah",
  diekstrak: "Diekstrak",
  ditinjau: "Ditinjau",
  draf_siap: "Draf Siap",
  menunggu_tte: "Menunggu TTE",
  selesai: "Selesai",
};
export const STATUS_ORDER = ["diunggah", "diekstrak", "ditinjau", "draf_siap", "menunggu_tte", "selesai"];

export async function logAudit(letterId: string | null, aksi: string, detail: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({ letter_id: letterId, pengguna: data.user.id, aksi, detail: detail as Json });
}

export async function signedUrl(path: string) {
  const { data } = await supabase.storage.from("surat").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export interface Pegawai {
  nama: string;
  nip: string;
  jabatan: string;
  unit: string;
}
export interface FormData {
  nomor_surat_masuk: string;
  tanggal_surat_masuk: string;
  pengirim: string;
  perihal: string;
  dari_pimpinan: string;
  instruksi: string;
  tanggal_disposisi: string;
  nama_kegiatan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tempat: string;
  penyelenggara: string;
  pegawai: Pegawai[];
}

// deno-lint-ignore no-explicit-any
export function formFromExtraction(x: any): FormData {
  const v = (s: unknown) => (typeof s === "string" ? s : "");
  return {
    nomor_surat_masuk: v(x?.surat_masuk?.nomor),
    tanggal_surat_masuk: v(x?.surat_masuk?.tanggal),
    pengirim: v(x?.surat_masuk?.pengirim),
    perihal: v(x?.surat_masuk?.perihal),
    dari_pimpinan: v(x?.disposisi?.dari_pimpinan),
    instruksi: v(x?.disposisi?.instruksi),
    tanggal_disposisi: v(x?.disposisi?.tanggal_disposisi),
    nama_kegiatan: v(x?.kegiatan?.nama),
    tanggal_mulai: v(x?.kegiatan?.tanggal_mulai),
    tanggal_selesai: v(x?.kegiatan?.tanggal_selesai),
    tempat: v(x?.kegiatan?.tempat),
    penyelenggara: v(x?.kegiatan?.penyelenggara),
    pegawai: Array.isArray(x?.pegawai_ditugaskan)
      ? x.pegawai_ditugaskan.map((p: Record<string, unknown>) => ({
          nama: v(p["nama"]),
          nip: v(p["nip"]),
          jabatan: v(p["jabatan"]),
          unit: v(p["unit"]),
        }))
      : [],
  };
}

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export function tanggalIndo(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`;
}
export function rentangTanggal(a: string, b: string) {
  if (!a) return "";
  if (!b || a === b) return tanggalIndo(a);
  return `${tanggalIndo(a)} s.d. ${tanggalIndo(b)}`;
}
