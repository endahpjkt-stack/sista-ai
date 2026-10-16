export type TemplateFormat = "tanpa_lampiran" | "dengan_lampiran";

export const TEMPLATE_LABEL: Record<TemplateFormat, string> = {
  tanpa_lampiran: "Tanpa lampiran",
  dengan_lampiran: "Dengan lampiran",
};

export const KATEGORI_PENGECUALIAN = [
  "Perintah khusus pimpinan pada disposisi",
  "Ketentuan penyelenggara kegiatan",
  "Alasan lain",
] as const;

/** Aturan 6.3 Tata Naskah Dinas: 1–3 orang tanpa lampiran, 4+ dengan lampiran. */
export function formatDariAturan(jumlah: number): TemplateFormat | null {
  if (!Number.isInteger(jumlah) || jumlah < 1) return null;
  return jumlah <= 3 ? "tanpa_lampiran" : "dengan_lampiran";
}

export interface ChecklistInput {
  jumlah: number;
  cocok: boolean;
  pengecualian: boolean;
  pilihanPengecualian?: TemplateFormat | null;
  kategori?: string | null;
  alasan?: string | null;
}

export interface ChecklistResult {
  ok: boolean;
  template: TemplateFormat | null;
  isPengecualian: boolean;
  errors: string[];
}

export function tentukanTemplate(i: ChecklistInput): ChecklistResult {
  const errors: string[] = [];
  const aturan = formatDariAturan(i.jumlah);
  if (!aturan) errors.push("Jumlah pegawai harus bilangan bulat minimal 1.");
  if (!i.cocok) errors.push("Centang konfirmasi bahwa jumlah pegawai sudah dicocokkan.");
  let template = aturan;
  if (i.pengecualian) {
    if (!i.pilihanPengecualian) errors.push("Pilih format untuk versi pengecualian.");
    if (!i.kategori) errors.push("Pilih kategori alasan pengecualian.");
    if (!i.alasan || i.alasan.trim().length < 5) errors.push("Alasan pengecualian wajib diisi (min. 5 karakter).");
    template = i.pilihanPengecualian ?? null;
  }
  return { ok: errors.length === 0 && !!template, template, isPengecualian: i.pengecualian, errors };
}

/** Penamaan baku arsip: ST_[nomor]_[YYYYMMDD]_[ringkas-kegiatan].pdf */
export function namaFileArsip(nomor: string, tanggal: string, kegiatan: string): string {
  const n = nomor.trim().replace(/[\\/]+/g, "-").replace(/[^A-Za-z0-9.\-]+/g, "");
  const t = tanggal.replace(/-/g, "").slice(0, 8);
  const k = kegiatan
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 5)
    .join("-");
  return `ST_${n}_${t}_${k || "kegiatan"}.pdf`;
}
