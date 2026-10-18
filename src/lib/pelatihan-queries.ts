import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const pelatihanListQuery = () => queryOptions({
  queryKey: ["pelatihan"],
  queryFn: async () => {
    const { data, error } = await supabase.from("pelatihan").select("*").order("dibuat_pada", { ascending: false });
    if (error) throw new Error("Daftar bukti pelatihan tidak dapat dimuat.");
    return data;
  },
});

export const pelatihanQuery = (id: string) => queryOptions({
  queryKey: ["pelatihan", id],
  queryFn: async () => {
    const [row, extraction, draft] = await Promise.all([
      supabase.from("pelatihan").select("*").eq("id", id).single(),
      supabase.from("pelatihan_extractions").select("*").eq("pelatihan_id", id).order("dibuat_pada", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("pelatihan_drafts").select("*").eq("pelatihan_id", id).order("disetujui_pada", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (row.error || extraction.error || draft.error) throw new Error("Bukti pelatihan tidak ditemukan atau tidak ada akses.");
    return { pelatihan: row.data, extraction: extraction.data, draft: draft.data };
  },
});
