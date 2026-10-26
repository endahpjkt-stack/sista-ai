import { describe, expect, it } from "vitest";
import { historyStatus, filterHistory } from "./history";
import type { ArchiveRow } from "./archive";

describe("Riwayat surat", () => {
  it("groups draft-ready letters as Draf", () => {
    expect(historyStatus({ status: "draf_siap", sumber: "Draf disetujui" })).toBe("draf");
  });
  it("keeps uploaded, extracted, reviewed and waiting-for-signature letters in Proses", () => {
    for (const status of ["diunggah", "diekstrak", "ditinjau", "menunggu_tte"])
      expect(historyStatus({ status, sumber: "Draf disetujui" })).toBe("proses");
  });
  it("requires a confirmed final before marking a letter Resmi", () => {
    expect(historyStatus({ status: "selesai", sumber: "Draf disetujui" })).toBe("proses");
    expect(historyStatus({ status: "selesai", sumber: "Final terkonfirmasi" })).toBe("resmi");
  });
  it("filters category and searches the exact letter number together", () => {
    const base = { judul: "Surat uji", nomor: "UJI-ST/002/TU/X/2026", pengirim: "TU", kegiatan: "Arsip", pegawai: "Pegawai Uji" };
    const rows = [
      { ...base, id: "draft", status: "draf_siap", sumber: "Draf disetujui" },
      { ...base, id: "final", status: "selesai", sumber: "Final terkonfirmasi" },
    ] as ArchiveRow[];
    expect(filterHistory(rows, "draf", "uji-st/002").map(r => r.id)).toEqual(["draft"]);
    expect(filterHistory(rows, "resmi", "tidak ada")).toEqual([]);
  });
});