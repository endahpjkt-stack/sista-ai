export interface ArchiveRow {
  id: string;
  judul: string;
  status: string;
  nomor: string;
  tanggal: string;
  pengirim: string;
  kegiatan: string;
  tempat: string;
  pegawai: string;
  jumlah: number;
  template: string;
  diunggah: string;
  sumber: string;
}
export interface ArchiveFilters { search: string; status: string; template: string; from: string; to: string }
export function filterArchive(rows: ArchiveRow[], f: ArchiveFilters) {
  const term = f.search.trim().toLocaleLowerCase("id");
  return rows.filter(r => (f.status === "semua" || r.status === f.status)
    && (f.template === "semua" || r.template === f.template)
    && (!f.from || (r.tanggal || r.diunggah) >= f.from)
    && (!f.to || (r.tanggal || r.diunggah) <= f.to)
    && (!term || [r.judul,r.nomor,r.pengirim,r.kegiatan,r.pegawai].join(" ").toLocaleLowerCase("id").includes(term)));
}
export const ARCHIVE_HEADERS = ["Judul surat", "Nomor Surat Tugas", "Tanggal Surat Tugas", "Status", "Sumber nomor/tanggal", "Pengirim", "Kegiatan", "Tempat", "Pegawai", "Jumlah pegawai", "Format", "Tanggal unggah"];
export function archiveValues(r: ArchiveRow, labels: Record<string,string>): (string | number)[] {
  return [r.judul,r.nomor,r.tanggal,labels[r.status] || r.status,r.sumber,r.pengirim,r.kegiatan,r.tempat,r.pegawai,r.jumlah,r.template === "dengan_lampiran" ? "Dengan lampiran" : r.template === "tanpa_lampiran" ? "Tanpa lampiran" : "",r.diunggah];
}
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}
export function archiveCsv(rows: ArchiveRow[], labels: Record<string,string>) {
  return "\uFEFF" + [ARCHIVE_HEADERS,...rows.map(r=>archiveValues(r,labels))].map(row=>row.map(csvCell).join(",")).join("\r\n");
}