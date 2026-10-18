import PizZip from "pizzip";
import bukti from "@/assets/bukti_pelatihan.docx.asset.json";
import { rentangTanggal, tanggalIndo } from "./letters";
import type { PelatihanFormData } from "./pelatihan";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const descendants = (el: Element | Document, tag: string) => Array.from(el.getElementsByTagNameNS(W, tag));
const text = (el: Element) => descendants(el, "t").map(t => t.textContent ?? "").join("");

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
}

function setCell(cell: Element, value: string) {
  const paragraphs = descendants(cell, "p");
  if (paragraphs[0]) setParagraph(paragraphs[0], value);
  paragraphs.slice(1).forEach(p => p.remove());
}

export function fillPelatihanXml(xml: string, f: PelatihanFormData): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Format template tidak valid.");
  const kosong = "…………………";
  for (const p of descendants(doc, "p")) {
    const s = text(p).trim();
    if (s.startsWith("Nomor:")) setParagraph(p, `Nomor: ${f.nomor.trim() || kosong}`);
    else if (s.startsWith("Nama Pelatihan:")) setParagraph(p, `Nama Pelatihan: ${f.nama_pelatihan || kosong}`);
    else if (s.startsWith("Penyelenggara:")) setParagraph(p, `Penyelenggara: ${f.penyelenggara || kosong}`);
    else if (s.startsWith("Tanggal Pelaksanaan:")) setParagraph(p, `Tanggal Pelaksanaan: ${rentangTanggal(f.tanggal_mulai, f.tanggal_selesai) || kosong}`);
    else if (s.startsWith("Tempat:")) setParagraph(p, `Tempat: ${f.tempat || kosong}`);
    else if (s.startsWith("Durasi:")) setParagraph(p, `Durasi: ${f.durasi || kosong}`);
    else if (s.startsWith("Dasar Dokumen:")) setParagraph(p, `Dasar Dokumen: ${f.dasar_dokumen || kosong}`);
    else if (s.startsWith("Catatan Verifikasi:")) setParagraph(p, `Catatan Verifikasi: ${f.catatan || kosong}`);
    else if (/^Jakarta,/.test(s)) setParagraph(p, `Jakarta, ${tanggalIndo(new Date().toISOString().slice(0, 10))}`);
  }
  const table = descendants(doc, "tbl").find(t => descendants(t, "tr").some(r => descendants(r, "tc").some(c => text(c).trim() === "No.")));
  if (!table) throw new Error("Tabel peserta template tidak dikenali.");
  const rows = Array.from(table.children).filter(e => e.localName === "tr");
  const prototype = rows[1];
  if (!prototype) throw new Error("Tabel peserta template tidak dikenali.");
  rows.slice(1).forEach(r => r.remove());
  f.peserta.forEach((p, i) => {
    const row = prototype.cloneNode(true) as Element;
    const cells = Array.from(row.children).filter(e => e.localName === "tc");
    [String(i + 1) + ".", p.nama || kosong, p.nip || kosong, p.jabatan || kosong].forEach((v, j) => { if (cells[j]) setCell(cells[j], v); });
    table.appendChild(row);
  });
  return new XMLSerializer().serializeToString(doc);
}

export async function buildPelatihanDocx(f: PelatihanFormData): Promise<Blob> {
  const res = await fetch(bukti.url);
  if (!res.ok) throw new Error("Template bukti pelatihan tidak dapat dimuat. Silakan coba kembali.");
  const zip = new PizZip(await res.arrayBuffer());
  const xml = zip.file("word/document.xml")?.asText();
  if (!xml) throw new Error("Template bukti pelatihan tidak valid.");
  zip.file("word/document.xml", fillPelatihanXml(xml, f));
  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }) as Blob;
}
