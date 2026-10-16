import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

export function DocumentViewer({ path }: { path: string }) {
  const [url,setUrl] = useState("");
  const [error,setError] = useState(false);
  useEffect(()=>{
    let active = true; let objectUrl = "";
    setUrl(""); setError(false);
    supabase.storage.from("surat").download(path).then(({data,error})=>{
      if (!active) return;
      if (error || !data) { setError(true); return; }
      objectUrl=URL.createObjectURL(data); setUrl(objectUrl);
    });
    return ()=>{ active=false; if(objectUrl)URL.revokeObjectURL(objectUrl); };
  },[path]);
  if(error) return <div className="p-8 text-sm text-destructive">Dokumen tidak dapat dibuka.</div>;
  if(!url)return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground"><FileText className="size-5" />Memuat dokumen…</div>;
  return path.endsWith(".pdf") ? <iframe src={url} title="Dokumen asli" className="h-[650px] w-full bg-card" /> : <img src={url} alt="Dokumen asli" className="max-h-[750px] w-full object-contain" />;
}