import { describe, expect, it } from "vitest";
import { archiveCsv, filterArchive, type ArchiveRow } from "./archive";
const row: ArchiveRow = { id:"test",judul:"Surat uji",status:"draf_siap",nomor:"UJI-ST/001/TU/X/2026",tanggal:"2026-10-16",pengirim:"Panitia Uji",kegiatan:"Arsip Uji",tempat:"Jakarta",pegawai:"Pegawai Uji SISTA",jumlah:1,template:"tanpa_lampiran",diunggah:"2026-10-16",sumber:"Draf disetujui" };
const filters = {search:"",status:"semua",template:"semua",from:"",to:""};
describe("arsip surat yang tersedia",()=>{
  it("filters draft-ready letters",()=>{ expect(filterArchive([row],{...filters,status:"selesai"})).toHaveLength(0); expect(filterArchive([row],{...filters,status:"draf_siap"})).toEqual([row]); });
  it("filters the official format",()=>{ expect(filterArchive([row],{...filters,template:"dengan_lampiran"})).toHaveLength(0); });
  it("keeps both date boundaries inclusive",()=>{ expect(filterArchive([row],{...filters,from:"2026-10-16",to:"2026-10-16"})).toEqual([row]); expect(filterArchive([row],{...filters,from:"2026-10-17"})).toHaveLength(0); });
  it("searches the existing test letter number",()=>{ expect(filterArchive([row],{...filters,search:"uji-st/001"})).toEqual([row]); });
  it("exports the original test number and ISO date",()=>{const csv=archiveCsv([row],{});expect(csv).toContain('"UJI-ST/001/TU/X/2026","2026-10-16"');});
  it("neutralizes CSV spreadsheet formulas",()=>{expect(archiveCsv([{...row,judul:'=1+1'}],{})).toContain('"\'=1+1"');});
});