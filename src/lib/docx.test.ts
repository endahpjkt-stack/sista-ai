import { describe, it, expect } from "vitest";
import tanpa from "@/test/fixtures/tanpa-lampiran.xml?raw";
import dengan from "@/test/fixtures/dengan-lampiran.xml?raw";
import { fillOfficialXml } from "./docx";
import type { FormData } from "./letters";

const form: FormData = {
  nomor_surat:"109/BLSDM.31/KP.01.06/10/2026",tanggal_surat:"2026-10-16",
  nomor_surat_masuk:"UJI/001/10/2026",tanggal_surat_masuk:"2026-10-15",pengirim:"Tim Uji Tata Usaha",perihal:"Uji administrasi",dari_pimpinan:"Kepala Balai",instruksi:"Mengikuti",tanggal_disposisi:"2026-10-16",nama_kegiatan:"Kegiatan Uji SISTA",tanggal_mulai:"2026-10-19",tanggal_selesai:"2026-10-20",tempat:"Jakarta",penyelenggara:"Tim Uji",
  pegawai:[{nama:"Pegawai Uji Satu",nip:"199001012020011001",jabatan:"Analis",unit:"TU",pangkat:"Penata, III/c"}],
};
function paragraphs(xml:string) { return Array.from(new DOMParser().parseFromString(xml,"application/xml").getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main","p")).map(p=>p.textContent || ""); }
describe("Pengisian template resmi",()=>{
  it("keeps the supplied letter number verbatim, not the sample number",()=>{
    const result=paragraphs(fillOfficialXml(tanpa,form));
    expect(result).toContain("Nomor: 109/BLSDM.31/KP.01.06/10/2026");
    expect(result.some(p=>p.includes("108/BLSDM"))).toBe(false);
  });
  it("formats the supplied issue date in Indonesian",()=>{
    expect(paragraphs(fillOfficialXml(tanpa,form))).toContain("Jakarta, 16 Oktober 2026");
  });
  it("does not assign an official number or date without input",()=>{
    const result=paragraphs(fillOfficialXml(tanpa,{...form,nomor_surat:undefined,tanggal_surat:undefined}));
    expect(result).toContain("Nomor: …………………");
    expect(result).toContain("Jakarta, …………………");
  });
  it("replaces the sample employees with one real input row",()=>{
    const result=paragraphs(fillOfficialXml(tanpa,form));
    expect(result).toContain("Pegawai Uji Satu");
    expect(result).not.toContain("Lala");
    expect(result).not.toContain("Lili");
  });
  it("fills matching number and date on the attachment",()=>{
    const result=paragraphs(fillOfficialXml(dengan,{...form,pegawai:Array.from({length:4},(_,i)=>({...form.pegawai[0],nama:`Pegawai Uji ${i+1}`,nip:"199001012020011001",jabatan:"Analis",unit:"TU"}))}));
    expect(result.filter(p=>p===`Nomor: ${form.nomor_surat}`)).toHaveLength(2);
    expect(result.filter(p=>p.trim()==="Jakarta, 16 Oktober 2026")).toHaveLength(2);
    expect(result).toContain("Pegawai Uji 4");
    expect(result).not.toContain("Ee");
  });
});