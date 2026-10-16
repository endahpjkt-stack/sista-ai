import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Sparkles, Check, Download, Plus, Trash2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DocumentViewer } from "@/components/document-viewer";
import { letterQuery } from "@/lib/surat-queries";
import { pageHead } from "@/lib/page-head";
import { extractLetter } from "@/lib/ai.functions";
import { formFromExtraction, logAudit, STATUS_LABEL, type FormData } from "@/lib/letters";
import { buildDocx, loadTemplate } from "@/lib/docx";
import { tentukanTemplate, formatDariAturan, TEMPLATE_LABEL, KATEGORI_PENGECUALIAN, type TemplateFormat } from "@/lib/template-rules";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/surat/$id")({ head: () => pageHead("Tinjau surat", "Tinjau hasil ekstraksi dokumen dan buat draf Surat Tugas resmi."), loader: ({context,params})=>context.queryClient.ensureQueryData(letterQuery(params.id)), component: Letter });
function Letter() {
  const {id}=Route.useParams();
  const {data}=useSuspenseQuery(letterQuery(id));
  return <Review key={`${id}-${data.extraction?.id ?? 'baru'}`} data={data} />;
}
type LetterData = {
  letter: Database["public"]["Tables"]["letters"]["Row"];
  extraction: Database["public"]["Tables"]["extractions"]["Row"] | null;
  draft: Database["public"]["Tables"]["drafts"]["Row"] | null;
};
function Review({data}:{data:LetterData}) {
  const { letter, extraction, draft }=data;
  const router=useRouter(); const client=useQueryClient(); const process=useServerFn(extractLetter);
  const [form,setForm]=useState<FormData>(()=> draft ? draft.data_disetujui as unknown as FormData : formFromExtraction(extraction?.json_hasil));
  const [busy,setBusy]=useState(""); const [error,setError]=useState("");
  const [cocok,setCocok]=useState(false); const [dispositionConfirmed,setDispositionConfirmed]=useState(false);
  const [exception,setException]=useState(false); const [choice,setChoice]=useState<TemplateFormat>("tanpa_lampiran"); const [category,setCategory]=useState(""); const [reason,setReason]=useState("");
  const [source,setSource]=useState<"surat"|"disposisi">("surat");
  const x=extraction?.json_hasil as { isian_bermasalah?:{field:string;masalah:string;catatan?:string}[]; disposisi?:{perintah_surat_tugas?:boolean} }|undefined;
  const selected=tentukanTemplate({jumlah:form.pegawai.length,cocok,pengecualian:exception,pilihanPengecualian:choice,kategori:category,alasan:reason});
  const recommendation=formatDariAturan(form.pegawai.length);
  async function refresh(){await client.invalidateQueries({queryKey:["letter",letter.id]}); await client.invalidateQueries({queryKey:["letters"]}); await router.invalidate();}
  async function run(){setBusy("process");setError("");try{await process({data:{letterId:letter.id}}); await refresh(); toast.success("Ekstraksi selesai. Tinjau data surat.");}catch(e){setError(e instanceof Error?e.message:"Proses gagal.");}finally{setBusy("");}}
  async function approve(){
    setError("");
    if(!selected.ok || !selected.template){setError(selected.errors.join(" "));return;}
    if(!x?.disposisi?.perintah_surat_tugas && !dispositionConfirmed){setError("Konfirmasi perintah penugasan pada disposisi terlebih dahulu.");return;}
    if(!form.nomor_surat_masuk || !form.tanggal_surat_masuk || !form.pengirim || !form.nama_kegiatan || !form.tanggal_mulai || !form.tempat || form.pegawai.some(p=>!p.nama.trim())){setError("Lengkapi dasar surat, kegiatan, tanggal, tempat, dan nama setiap pegawai.");return;}
    if(form.tanggal_selesai && form.tanggal_selesai < form.tanggal_mulai){setError("Tanggal selesai tidak boleh sebelum tanggal mulai.");return;}
    setBusy("draft");
    try{
      const template=await loadTemplate(selected.template);
      const blob=buildDocx(template.buf,form);
      const path=`letters/${letter.id}/draf_${crypto.randomUUID()}.docx`;
      const upload=await supabase.storage.from("surat").upload(path,blob);
      if(upload.error)throw new Error("Draf tidak dapat diunggah.");
      const {data:auth}=await supabase.auth.getUser(); if(!auth.user)throw new Error("Sesi berakhir.");
      const saved=await supabase.from("drafts").insert({letter_id:letter.id,data_disetujui:form as unknown as Json,template:selected.template,file_draf:path,disetujui_oleh:auth.user.id});
      if(saved.error)throw new Error("Draf belum tersimpan.");
      const updated=await supabase.from("letters").update({status:"draf_siap",jumlah_pegawai:form.pegawai.length,checklist_cocok:cocok,template_rekomendasi:recommendation,template_dipilih:selected.template,pengecualian:exception,kategori_pengecualian:exception?category:null,alasan_pengecualian:exception?reason:null,diperbarui_pada:new Date().toISOString()}).eq("id",letter.id);
      if(updated.error)throw new Error("Status surat belum diperbarui.");
      await logAudit(letter.id,"setujui_buat_draf",{template:selected.template,jumlah:form.pegawai.length,pengecualian:exception});
      await refresh(); toast.success("Draf Surat Tugas resmi siap diunduh.");
    }catch(e){setError(e instanceof Error?e.message:"Draf gagal dibuat.");}finally{setBusy("");}
  }
  async function download(){if(!draft?.file_draf)return;setBusy("download");try{const {data:link,error}=await supabase.storage.from("surat").createSignedUrl(draft.file_draf,60,{download:"Draf_Surat_Tugas.docx"});if(error||!link)throw new Error("Unduhan tidak tersedia.");const a=document.createElement("a");a.href=link.signedUrl;a.click();await logAudit(letter.id,"unduh_draf");}catch(e){setError(e instanceof Error?e.message:"Unduh gagal.");}finally{setBusy("");}}
  const fields:[keyof Omit<FormData,"pegawai">,string,string?][]=[["nomor_surat_masuk","Nomor surat masuk"],["tanggal_surat_masuk","Tanggal surat masuk","date"],["pengirim","Pengirim"],["perihal","Perihal"],["nama_kegiatan","Nama kegiatan"],["tanggal_mulai","Tanggal mulai","date"],["tanggal_selesai","Tanggal selesai","date"],["tempat","Tempat"],["penyelenggara","Penyelenggara"],["dari_pimpinan","Pimpinan pemberi disposisi"],["tanggal_disposisi","Tanggal disposisi","date"],["instruksi","Instruksi disposisi"],["nomor_surat","Nomor Surat Tugas (opsional)"],["tanggal_surat","Tanggal Surat Tugas (opsional)","date"]];
  const paths:Record<string,string>={nomor_surat_masuk:"surat_masuk.nomor",tanggal_surat_masuk:"surat_masuk.tanggal",pengirim:"surat_masuk.pengirim",perihal:"surat_masuk.perihal",nama_kegiatan:"kegiatan.nama",tanggal_mulai:"kegiatan.tanggal_mulai",tanggal_selesai:"kegiatan.tanggal_selesai",tempat:"kegiatan.tempat",penyelenggara:"kegiatan.penyelenggara",instruksi:"disposisi.instruksi",dari_pimpinan:"disposisi.dari_pimpinan",tanggal_disposisi:"disposisi.tanggal_disposisi"};
  return <>
    <Button asChild variant="ghost" className="mb-4 -ml-3"><Link to="/surat"><ArrowLeft />Daftar surat</Link></Button>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-display text-3xl">{letter.judul}</h1><p className="mt-2 text-sm text-muted-foreground">{STATUS_LABEL[letter.status]}</p></div>{!extraction && <Button variant="seal" disabled={!!busy} onClick={run}><Sparkles />{busy==="process"?"Memproses…":"Proses surat"}</Button>}</div>
    <ol className="my-7 grid grid-cols-4 border-y border-border py-4 text-xs sm:text-sm">{["Unggah","Proses","Tinjau","Draf siap"].map((s,i)=><li key={s} className={`flex items-center gap-2 ${i<=(draft?3:extraction?2:0)?"text-foreground":"text-muted-foreground"}`}><span className="font-mono">0{i+1}</span>{s}</li>)}</ol>
    {error && <p role="alert" className="mb-5 rounded-md bg-danger-soft p-4 text-sm text-destructive">{error}</p>}
    {draft && <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-success/30 bg-success-soft px-4 py-5"><div className="flex items-center gap-3"><FileCheck className="size-6 text-success" /><div><h2 className="font-semibold">Draf Surat Tugas siap</h2><p className="mt-1 text-xs text-muted-foreground">{TEMPLATE_LABEL[draft.template as TemplateFormat]} · {form.pegawai.length} pegawai</p></div></div><Button disabled={!!busy} onClick={download}><Download />{busy==="download"?"Menyiapkan…":"Unduh draf DOCX"}</Button></div>}
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><section className="min-w-0"><div className="mb-3 flex items-center gap-1"><Button size="sm" variant={source==="surat"?"default":"ghost"} onClick={()=>setSource("surat")}>Surat masuk</Button>{letter.file_disposisi && <Button size="sm" variant={source==="disposisi"?"default":"ghost"} onClick={()=>setSource("disposisi")}>Disposisi</Button>}</div><div className="overflow-hidden rounded-md border border-border"><DocumentViewer path={source==="disposisi" && letter.file_disposisi ? letter.file_disposisi : letter.file_surat} /></div></section>
    <section className="min-w-0">{!extraction ? <div className="border-y border-border py-12"><Sparkles className="mb-4 size-7 text-seal" /><h2 className="font-display text-2xl">Surat siap diproses</h2><p className="mt-3 text-sm text-muted-foreground">Belum ada hasil ekstraksi.</p></div> : <>
      <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">Tinjau data</h2>{!draft && <Button size="sm" variant="ghost" disabled={!!busy} onClick={run}><Sparkles />Proses ulang</Button>}</div>
      {!!x?.isian_bermasalah?.length && <div className="mb-5 bg-warning-soft p-4 text-sm text-warning-foreground"><strong>{x.isian_bermasalah.length} isian perlu diperiksa</strong><ul className="mt-2 space-y-1">{x.isian_bermasalah.map((p,i)=><li key={i}>{p.field}: {p.catatan || p.masalah.replaceAll("_"," ")}</li>)}</ul></div>}
      <fieldset disabled={!!draft || !!busy} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{fields.map(([key,label,type])=>{const flag=x?.isian_bermasalah?.find(p=>p.field===paths[key]); return <div key={key} className={key==="instruksi"||key==="nama_kegiatan"||key==="perihal"?"sm:col-span-2":""}><Label htmlFor={key} className="text-xs">{label}</Label><Input id={key} type={type || "text"} value={form[key] || ""} onChange={e=>setForm({...form,[key]:e.target.value})} className={`mt-1.5 bg-card ${flag?(flag.masalah==="tidak_ditemukan"?"border-destructive bg-danger-soft":"border-warning bg-warning-soft"):""}`} /></div>;})}</div>
      <div className="border-t border-border pt-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Pegawai ditugaskan <span className="font-mono text-muted-foreground">({form.pegawai.length})</span></h3><Button variant="ghost" size="sm" onClick={()=>setForm({...form,pegawai:[...form.pegawai,{nama:"",nip:"",jabatan:"",unit:"",pangkat:""}]})}><Plus />Tambah</Button></div>
      {form.pegawai.map((p,i)=><div key={i} className="mb-4 rounded-md border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">PEGAWAI {i+1}</span><Button variant="ghost" size="icon" aria-label={`Hapus pegawai ${i+1}`} onClick={()=>{setCocok(false);setForm({...form,pegawai:form.pegawai.filter((_,j)=>j!==i)});}}><Trash2 /></Button></div><div className="grid gap-3 sm:grid-cols-2">{([['nama','Nama'],['nip','NIP'],['pangkat','Pangkat / Gol. ruang'],['jabatan','Jabatan'],['unit','Unit']] as const).map(([key,label])=><div key={key}><Label htmlFor={`pegawai-${i}-${key}`} className="text-xs">{label}</Label><Input id={`pegawai-${i}-${key}`} value={p[key] || ""} onChange={e=>setForm({...form,pegawai:form.pegawai.map((v,j)=>j===i?{...v,[key]:e.target.value}:v)})} className="mt-1" /></div>)}</div></div>)}
      </div>
      <div className="space-y-4 border-t border-border pt-5"><p className="text-sm">Format rekomendasi: <strong>{recommendation?TEMPLATE_LABEL[recommendation]:"Belum ada pegawai"}</strong></p><Label className="flex items-start gap-3 text-sm"><Checkbox checked={cocok} onCheckedChange={v=>setCocok(v===true)} /><span>Jumlah dan identitas pegawai sudah dicocokkan dengan disposisi.</span></Label>
      {!x?.disposisi?.perintah_surat_tugas && <Label className="flex items-start gap-3 text-sm"><Checkbox checked={dispositionConfirmed} onCheckedChange={v=>setDispositionConfirmed(v===true)} /><span>Saya mengonfirmasi bahwa disposisi memerintahkan penugasan ini.</span></Label>}
      <Label className="flex items-center gap-3 text-sm"><Checkbox checked={exception} onCheckedChange={v=>setException(v===true)} />Gunakan pengecualian format</Label>
      {exception && <div className="space-y-3"><div className="flex gap-2">{(["tanpa_lampiran","dengan_lampiran"] as const).map(t=><Button key={t} size="sm" variant={choice===t?"default":"outline"} onClick={()=>setChoice(t)}>{TEMPLATE_LABEL[t]}</Button>)}</div><Label htmlFor="kategori">Kategori pengecualian</Label><select id="kategori" value={category} onChange={e=>setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="">Pilih kategori</option>{KATEGORI_PENGECUALIAN.map(c=><option key={c}>{c}</option>)}</select><Label htmlFor="alasan">Alasan pengecualian</Label><Textarea id="alasan" value={reason} onChange={e=>setReason(e.target.value)} /></div>}
      </div></fieldset>
      {!draft && <div className="mt-6 border-t border-border pt-5"><Button variant="seal" disabled={!!busy} onClick={approve}><Check />{busy==="draft"?"Membuat draf…":"Setujui & buat draf"}</Button></div>}
    </>}</section></div>
  </>;
}