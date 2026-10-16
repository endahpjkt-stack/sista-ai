import { describe, it, expect } from "vitest";
import { formatDariAturan, tentukanTemplate, namaFileArsip } from "./template-rules";

describe("aturan template 6.3", () => {
  it("3 pegawai memakai template tanpa lampiran", () => {
    expect(formatDariAturan(3)).toBe("tanpa_lampiran");
  });
  it("4 pegawai memakai template dengan lampiran", () => {
    expect(formatDariAturan(4)).toBe("dengan_lampiran");
  });
  it("jumlah 0 ditolak", () => {
    expect(formatDariAturan(0)).toBeNull();
  });
  it("tidak bisa lanjut sebelum checklist pencocokan dicentang", () => {
    expect(tentukanTemplate({ jumlah: 2, cocok: false, pengecualian: false }).ok).toBe(false);
  });
  it("pengecualian tanpa alasan ditolak", () => {
    const r = tentukanTemplate({ jumlah: 5, cocok: true, pengecualian: true, pilihanPengecualian: "tanpa_lampiran", kategori: "Alasan lain", alasan: "" });
    expect(r.ok).toBe(false);
  });
  it("pengecualian dengan alasan memakai format pilihan pegawai", () => {
    const r = tentukanTemplate({ jumlah: 5, cocok: true, pengecualian: true, pilihanPengecualian: "tanpa_lampiran", kategori: "Alasan lain", alasan: "Diminta penyelenggara" });
    expect(r.ok).toBe(true);
    expect(r.template).toBe("tanpa_lampiran");
  });
});

describe("penamaan arsip", () => {
  it("mengikuti pola ST_[nomor]_[YYYYMMDD]_[kegiatan].pdf", () => {
    expect(namaFileArsip("B-123/BLSDM/KP.01/10/2026", "2026-10-15", "Rapat Koordinasi Nasional")).toBe(
      "ST_B-123-BLSDM-KP.01-10-2026_20261015_rapat-koordinasi-nasional.pdf",
    );
  });
});
