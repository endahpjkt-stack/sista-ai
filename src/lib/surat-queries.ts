import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formFromExtraction, type FormData } from "./letters";
import type { ArchiveRow } from "./archive";

export const archiveQuery = () => queryOptions({
  queryKey: ["letters", "archive"],
  queryFn: async (): Promise<ArchiveRow[]> => {
    const { data, error } = await supabase.from("letters").select("*, drafts(*), finals(*), extractions(*)").order("dibuat_pada", { ascending: false });
    if (error) throw new Error("Arsip surat tidak dapat dimuat.");
    return data.map(l => {
      const draft = [...l.drafts].sort((a,b)=>b.disetujui_pada.localeCompare(a.disetujui_pada))[0];
      const final = [...l.finals].filter(f=>f.dikonfirmasi).sort((a,b)=>b.dicatat_pada.localeCompare(a.dicatat_pada))[0];
      const extraction = [...l.extractions].sort((a,b)=>b.dibuat_pada.localeCompare(a.dibuat_pada))[0];
      const form = draft ? draft.data_disetujui as unknown as FormData : formFromExtraction(extraction?.json_hasil);
      return { id:l.id, judul:l.judul, status:l.status, nomor:final ? final.nomor_surat || "" : form.nomor_surat || "", tanggal:final ? final.tanggal_surat || "" : form.tanggal_surat || "", sumber:final ? "Final terkonfirmasi" : draft ? "Draf disetujui" : "Belum ada draf", pengirim:form.pengirim || "", kegiatan:form.nama_kegiatan || "", tempat:form.tempat || "", pegawai:(form.pegawai || []).map(p=>p.nama).join("; "), jumlah:form.pegawai?.length || l.jumlah_pegawai || 0, template:draft?.template || l.template_dipilih || "", diunggah:l.dibuat_pada.slice(0,10) };
    });
  },
});

export const lettersQuery = () => queryOptions({
  queryKey: ["letters"],
  queryFn: async () => {
    const { data, error } = await supabase.from("letters").select("*").order("dibuat_pada", { ascending: false });
    if (error) throw new Error("Daftar surat tidak dapat dimuat.");
    return data;
  },
});

export const letterQuery = (id: string) => queryOptions({
  queryKey: ["letter", id],
  queryFn: async () => {
    const [letter, extraction, draft] = await Promise.all([
      supabase.from("letters").select("*").eq("id", id).single(),
      supabase.from("extractions").select("*").eq("letter_id", id).order("dibuat_pada", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("drafts").select("*").eq("letter_id", id).order("disetujui_pada", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (letter.error || extraction.error || draft.error) throw new Error("Surat tidak ditemukan atau tidak ada akses.");
    return { letter: letter.data, extraction: extraction.data, draft: draft.data };
  },
});