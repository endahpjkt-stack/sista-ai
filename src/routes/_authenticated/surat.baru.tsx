import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/letters";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/surat/baru")({ head: () => pageHead("Unggah surat", "Unggah surat masuk dan lembar disposisi untuk Surat Tugas."), component: UploadLetter });
function UploadLetter() {
  const navigate = useNavigate();
  const [judul, setJudul] = useState("");
  const [surat, setSurat] = useState<File | null>(null);
  const [disposisi, setDisposisi] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(e: React.FormEvent) {
    e.preventDefault(); if (!surat) return;
    setBusy(true); setError("");
    try {
      for (const f of [surat, disposisi]) if (f && (!['application/pdf','image/jpeg','image/png'].includes(f.type) || f.size > 20*1024*1024)) throw new Error("Gunakan PDF, JPG, atau PNG maksimal 20 MB per file.");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sesi berakhir. Silakan masuk kembali.");
      const id = crypto.randomUUID();
      async function store(f: File, name: string) {
        const path = `letters/${id}/${name}.${f.type === 'application/pdf' ? 'pdf' : f.type === 'image/png' ? 'png' : 'jpg'}`;
        const { error } = await supabase.storage.from("surat").upload(path,f);
        if (error) throw new Error("File tidak dapat diunggah. Silakan coba lagi.");
        return path;
      }
      const file_surat = await store(surat,"surat_masuk");
      const file_disposisi = disposisi ? await store(disposisi,"disposisi") : null;
      const result = await supabase.from("letters").insert({ id, judul:judul.trim(), file_surat, file_disposisi, dibuat_oleh:auth.user.id });
      if (result.error) throw new Error("Surat belum tersimpan. Silakan coba lagi.");
      await logAudit(id,"unggah_surat",{ nama_file:surat.name });
      await navigate({ to:"/surat/$id",params:{id} });
    } catch(e) { setError(e instanceof Error ? e.message : "Unggah gagal."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-3xl"><Button asChild variant="ghost" className="mb-5 -ml-3"><Link to="/surat"><ArrowLeft />Daftar surat</Link></Button><h1 className="font-display text-4xl">Unggah surat</h1>
    <form onSubmit={upload} className="mt-8 space-y-7"><div className="space-y-2"><Label htmlFor="judul">Judul surat / kegiatan</Label><Input id="judul" required value={judul} onChange={e=>setJudul(e.target.value)} placeholder="Nama kegiatan atau perihal surat" className="h-11 bg-card" /></div>
      <div className="grid gap-5 md:grid-cols-2">{[{id:"surat",title:"Surat masuk",file:surat,set:setSurat,required:true},{id:"disposisi",title:"Lembar disposisi",file:disposisi,set:setDisposisi,required:false}].map(item=><div key={item.id}><Label htmlFor={item.id}>{item.title}{!item.required && <span className="ml-2 text-xs text-muted-foreground">Opsional</span>}</Label><div className="mt-2 flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed border-input bg-card p-5"><FileText className="mb-3 size-7 text-muted-foreground" /><span className="mb-3 max-w-full break-all text-center text-sm">{item.file?.name || "PDF, JPG, PNG · maks. 20 MB"}</span><Input id={item.id} type="file" accept="application/pdf,image/jpeg,image/png" required={item.required} onChange={e=>item.set(e.target.files?.[0] ?? null)} className="h-auto max-w-full text-xs" /></div></div>)}</div>
      {error && <p role="alert" className="bg-danger-soft p-3 text-sm text-destructive">{error}</p>}
      <div className="border-t border-border pt-5"><Button type="submit" variant="seal" disabled={busy || !surat}><Upload />{busy ? "Mengunggah…" : "Unggah & lanjutkan"}</Button></div>
    </form>
  </div>;
}