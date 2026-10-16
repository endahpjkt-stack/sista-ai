import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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