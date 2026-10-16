import PizZip from "pizzip";
import { supabase } from "@/integrations/supabase/client";
import tanpa from "@/assets/tanpa_lampiran.docx.asset.json";
import dengan from "@/assets/dengan_lampiran.docx.asset.json";
import type { TemplateFormat } from "./template-rules";
import { type FormData, rentangTanggal, tanggalIndo } from "./letters";

export const DEFAULT_TEMPLATE_URL: Record<TemplateFormat, string> = {
  tanpa_lampiran: tanpa.url,
  dengan_lampiran: dengan.url,
};
export const templatePath = (t: TemplateFormat) => `templates/${t}.docx`;

/** Prefer the admin-uploaded template; fall back to the official TU document. */
export async function loadTemplate(t: TemplateFormat): Promise<{ buf: ArrayBuffer; sumber: string }> {
  const { data } = await supabase.storage.from("surat").download(templatePath(t));
  if (data) return { buf: await data.arrayBuffer(), sumber: "resmi" };
  const res = await fetch(DEFAULT_TEMPLATE_URL[t]);
  if (!res.ok) throw new Error("Template resmi tidak dapat dimuat. Silakan coba kembali.");
  return { buf: await res.arrayBuffer(), sumber: "resmi" };
}

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const descendants = (el: Element | Document, tag: string) => Array.from(el.getElementsByTagNameNS(W, tag));
const text = (el: Element) => descendants(el, "t").map(t => t.textContent ?? "").join("");

/** Replace only textual runs; preserve paragraph, cell and run formatting. */
function setParagraph(p: Element, value: string) {
  const runs = descendants(p, "t");
  const first = runs[0];
  if (first) {
    first.textContent = value;
    first.setAttribute("xml:space", "preserve");
    runs.slice(1).forEach(t => { t.textContent = ""; });
  } else {
    const r = p.ownerDocument.createElementNS(W, "w:r");
    const t = p.ownerDocument.createElementNS(W, "w:t");
    t.textContent = value; r.appendChild(t); p.appendChild(r);
  }
  descendants(p, "numPr").forEach(n => n.remove());
}

function setCell(cell: Element, value: string) {
  const paragraphs = descendants(cell, "p");
  if (paragraphs[0]) setParagraph(paragraphs[0], value);
  paragraphs.slice(1).forEach(p => p.remove());
}

export function fillOfficialXml(xml: string, f: FormData): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Format template tidak valid.");
  const nomor = f.nomor_surat?.trim() || "…………………";
  const tanggal = f.tanggal_surat ? tanggalIndo(f.tanggal_surat) : "…………………";
  const dasar = `Surat ${f.pengirim} Nomor ${f.nomor_surat_masuk} tanggal ${tanggalIndo(f.tanggal_surat_masuk)} perihal ${f.perihal};`;
  const disposisi = `Lembar Disposisi ${f.dari_pimpinan || "…………………"} atas Surat ${f.pengirim} Nomor ${f.nomor_surat_masuk} pada tanggal ${f.tanggal_disposisi ? tanggalIndo(f.tanggal_disposisi) : "…………………"}.`;
  for (const p of descendants(doc, "p")) {
    const s = text(p).trim();
    if (s.startsWith("Nomor:")) setParagraph(p, `Nomor: ${nomor}`);
    else if (s.startsWith("Nota Dinas Ketua")) setParagraph(p, dasar);
    else if (s.startsWith("Lembar Disposisi")) setParagraph(p, disposisi);
    else if (s.startsWith("Menjadi")) setParagraph(p, `${f.instruksi || "Melaksanakan"} ${f.nama_kegiatan} di ${f.tempat}.`);
    else if (s.startsWith("Surat Tugas berlaku")) setParagraph(p, `Surat Tugas berlaku hari/tanggal: ${rentangTanggal(f.tanggal_mulai, f.tanggal_selesai)}.`);
    else if (/^Jakarta,/.test(s)) setParagraph(p, `Jakarta, ${tanggal}`);
    else if (s.startsWith("Panitia Pelaksana")) setParagraph(p, `${f.nama_kegiatan} tanggal ${rentangTanggal(f.tanggal_mulai, f.tanggal_selesai)}`);
    // Preserve SRIKANDI's signature placeholders intentionally.
  }
  const tables = descendants(doc, "tbl");
  const inline = tables.find(t => descendants(t, "tr").some(r => descendants(r, "tc").some(c => text(c).trim() === "Nama")) && !descendants(t, "tr").some(r => descendants(r, "tc").some(c => text(c).trim() === "No.")));
  if (inline) {
    const rows = Array.from(inline.children).filter(e => e.localName === "tr");
    const prototypes = rows.slice(1,5);
    if (prototypes.length !== 4) throw new Error("Tabel pegawai template tidak dikenali.");
    rows.slice(1).forEach(r => r.remove());
    f.pegawai.forEach((p,i) => {
      const values = [p.nama, p.nip || "…………………", p.pangkat || "…………………", p.jabatan || "…………………"];
      prototypes.forEach((original,j) => {
        const row = original.cloneNode(true) as Element;
        const cells = Array.from(row.children).filter(e => e.localName === "tc");
        if (cells[0]) setCell(cells[0], i === 0 && j === 0 ? "Kepada" : "");
        if (cells[1]) setCell(cells[1], i === 0 && j === 0 ? ":" : "");
        if (cells[2]) setCell(cells[2], j === 0 ? `${i+1}.` : "");
        if (cells[5]) setCell(cells[5], values[j] ?? "");
        inline.appendChild(row);
      });
    });
  }
  const attachment = tables.find(t => descendants(t,"tr").some(r=>descendants(r,"tc").some(c=>text(c).trim()==="No.")));
  if (attachment) {
    const rows = Array.from(attachment.children).filter(e=>e.localName==="tr");
    const prototype = rows[2];
    if (!prototype) throw new Error("Tabel lampiran template tidak dikenali.");
    const signature = rows.at(-1);
    rows.slice(2,-1).forEach(r=>r.remove());
    f.pegawai.forEach((p,i)=>{
      const row=prototype.cloneNode(true) as Element;
      const cells=Array.from(row.children).filter(e=>e.localName==="tc");
      [String(i+1),p.nama,p.nip || "…………………",p.pangkat || "…………………",p.jabatan || "…………………"].forEach((v,j)=>{if(cells[j])setCell(cells[j],v);});
      attachment.insertBefore(row,signature ?? null);
    });
  }
  return new XMLSerializer().serializeToString(doc);
}

export function buildDocx(buf: ArrayBuffer, f: FormData): Blob {
  const zip = new PizZip(buf);
  const xml = zip.file("word/document.xml")?.asText();
  if (!xml) throw new Error("Dokumen resmi tidak valid.");
  zip.file("word/document.xml", fillOfficialXml(xml,f));
  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }) as Blob;
}
