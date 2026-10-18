export const PELATIHAN_STATUS_LABEL: Record<string, string> = {
  diunggah: "Diunggah",
  diekstrak: "Diekstrak",
  ditinjau: "Ditinjau",
  draf_siap: "Draf Siap",
};
export const PELATIHAN_STATUS_ORDER = ["diunggah", "diekstrak", "ditinjau", "draf_siap"];

export interface Peserta {
  nama: string;
  nip: string;
  jabatan: string;
}
export interface PelatihanFormData {
  nomor: string;
  nama_pelatihan: string;
  penyelenggara: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tempat: string;
  durasi: string;
  dasar_dokumen: string;
  catatan: string;
  peserta: Peserta[];
}

// deno-lint-ignore no-explicit-any
export function formFromPelatihanExtraction(x: any): PelatihanFormData {
  const v = (s: unknown) => (typeof s === "string" ? s : "");
  return {
    nomor: "",
    nama_pelatihan: v(x?.pelatihan?.nama),
    penyelenggara: v(x?.pelatihan?.penyelenggara),
    tanggal_mulai: v(x?.pelatihan?.tanggal_mulai),
    tanggal_selesai: v(x?.pelatihan?.tanggal_selesai),
    tempat: v(x?.pelatihan?.tempat),
    durasi: v(x?.pelatihan?.durasi),
    dasar_dokumen: v(x?.dasar_dokumen),
    catatan: "",
    peserta: Array.isArray(x?.peserta)
      ? x.peserta.map((p: Record<string, unknown>) => ({ nama: v(p["nama"]), nip: v(p["nip"]), jabatan: v(p["jabatan"]) }))
      : [],
  };
}
