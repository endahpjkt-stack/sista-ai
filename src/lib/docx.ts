import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
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

/** Prefer the admin-uploaded official template; fall back to the bundled sample. */
export async function loadTemplate(t: TemplateFormat): Promise<{ buf: ArrayBuffer; sumber: string }> {
  const { data } = await supabase.storage.from("surat").download(templatePath(t));
  if (data) return { buf: await data.arrayBuffer(), sumber: "resmi" };
  const res = await fetch(DEFAULT_TEMPLATE_URL[t]);
  return { buf: await res.arrayBuffer(), sumber: "contoh" };
}

export function buildDocx(buf: ArrayBuffer, f: FormData): Blob {
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: () => "",
  });
  doc.render({
    nomor_surat: "…………………",
    tanggal_surat: "…………………",
    dasar_surat: `Surat ${f.pengirim} Nomor ${f.nomor_surat_masuk} tanggal ${tanggalIndo(f.tanggal_surat_masuk)} perihal ${f.perihal}`,
    nomor_surat_masuk: f.nomor_surat_masuk,
    tanggal_surat_masuk: tanggalIndo(f.tanggal_surat_masuk),
    pengirim: f.pengirim,
    perihal: f.perihal,
    nama_kegiatan: f.nama_kegiatan,
    tanggal_kegiatan: rentangTanggal(f.tanggal_mulai, f.tanggal_selesai),
    tempat: f.tempat,
    penyelenggara: f.penyelenggara,
    jabatan_penandatangan: "Kepala Balai",
    nama_penandatangan: "…………………",
    pegawai: f.pegawai.map((p, i) => ({ no: i + 1, ...p })),
  });
  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }) as Blob;
}
