import type { ArchiveRow } from "./archive";

export const HISTORY_LABEL = { proses: "Proses", draf: "Draf", resmi: "Resmi" } as const;
export type HistoryStatus = keyof typeof HISTORY_LABEL;

export function historyStatus(row: Pick<ArchiveRow, "status" | "sumber">): HistoryStatus {
  if (row.sumber === "Final terkonfirmasi") return "resmi";
  if (row.status === "draf_siap") return "draf";
  return "proses";
}

export function filterHistory(rows: ArchiveRow[], status: "semua" | HistoryStatus, search: string) {
  const term = search.trim().toLocaleLowerCase("id");
  return rows.filter(row => (status === "semua" || historyStatus(row) === status) &&
    [row.judul, row.nomor, row.pengirim, row.kegiatan, row.pegawai].some(value => value.toLocaleLowerCase("id").includes(term)));
}