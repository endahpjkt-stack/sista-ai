import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Archive, ArrowUpRight, Download, FileSpreadsheet, Search, X, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { archiveQuery } from "@/lib/surat-queries";
import { archiveCsv, filterArchive, type ArchiveFilters } from "@/lib/archive";
import { archiveExcel } from "@/lib/archive-export";
import { deliverFile } from "@/lib/download";
import { STATUS_LABEL, STATUS_ORDER, tanggalIndo } from "@/lib/letters";
import { pageHead } from "@/lib/page-head";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/arsip")({ head: () => pageHead("Arsip internal", "Arsip internal Surat Tugas SISTA AI dengan filter dan unduhan Excel serta CSV."), loader: ({context}) => context.queryClient.ensureQueryData(archiveQuery()), component: ArchivePage });
const INITIAL: ArchiveFilters = { search:"", status:"semua", template:"semua", from:"", to:"" };
function ArchivePage() {
  const {data:rows} = useSuspenseQuery(archiveQuery());
  const [filters,setFilters] = useState(INITIAL);
  const [excel,setExcel] = useState<{blob:Blob; key:string} | null>(null);
  const [exportError,setExportError] = useState(false);
  const invalidDates = !!filters.from && !!filters.to && filters.from > filters.to;
  const filtered = invalidDates ? [] : filterArchive(rows,filters);
  const key = JSON.stringify(filtered);
  useEffect(() => {
    let cancelled = false;
    setExportError(false);
    if (filtered.length) archiveExcel(filtered,STATUS_LABEL).then(blob=>{if(!cancelled)setExcel({blob,key});}).catch(()=>{if(!cancelled)setExportError(true);});
    return () => { cancelled = true; };
  },[key]);
  const ready = excel?.key === key;
  const update = (field:keyof ArchiveFilters,value:string) => setFilters(f=>({...f,[field]:value}));
  const filename = `Arsip_SISTA_AI_${new Date().toISOString().slice(0,10)}`;
  const download = (type:"csv"|"xlsx") => {
    const blob = type === "csv" ? new Blob([archiveCsv(filtered,STATUS_LABEL)],{type:"text/csv;charset=utf-8"}) : ready ? excel?.blob : undefined;
    if (blob) void deliverFile(blob,`${filename}.${type}`).catch(()=>toast.error("Unduhan gagal. Silakan coba kembali."));
  };
  return <>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 font-mono text-xs text-muted-foreground">PERSURATAN / ARSIP</p><h1 className="font-display text-4xl">Arsip internal</h1><p className="mt-2 text-sm text-muted-foreground">{rows.length} surat · {rows.filter(r=>r.sumber==="Final terkonfirmasi").length} final terkonfirmasi</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!filtered.length || invalidDates} onClick={()=>download("csv")}><Download />Unduh CSV</Button><Button variant="seal" disabled={!filtered.length || !ready || invalidDates} onClick={()=>download("xlsx")}>{!ready && filtered.length && !exportError ? <LoaderCircle className="animate-spin" /> : <FileSpreadsheet />}Unduh Excel</Button></div></div>
    <div className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-3">{[["Seluruh surat",rows.length],["Draf siap",rows.filter(r=>r.status==="draf_siap").length],["Selesai",rows.filter(r=>r.status==="selesai").length]].map(([label,count])=><div key={label} className="flex items-center gap-4"><span className="font-mono text-3xl">{String(count).padStart(2,"0")}</span><span className="text-sm text-muted-foreground">{label}</span></div>)}</div>
    <div className="mt-6 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5"><div className="sm:col-span-2 lg:col-span-1"><Label htmlFor="archive-search">Cari arsip</Label><div className="relative mt-2"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="archive-search" className="pl-9" placeholder="Nomor, kegiatan, pegawai…" value={filters.search} onChange={e=>update("search",e.target.value)} /></div></div><div><Label htmlFor="archive-status">Status</Label><select id="archive-status" className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={filters.status} onChange={e=>update("status",e.target.value)}><option value="semua">Semua status</option>{STATUS_ORDER.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div><div><Label htmlFor="archive-template">Format</Label><select id="archive-template" className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={filters.template} onChange={e=>update("template",e.target.value)}><option value="semua">Semua format</option><option value="tanpa_lampiran">Tanpa lampiran</option><option value="dengan_lampiran">Dengan lampiran</option></select></div><div><Label htmlFor="archive-from">Tanggal mulai</Label><Input id="archive-from" type="date" className="mt-2" value={filters.from} onChange={e=>update("from",e.target.value)} /></div><div><Label htmlFor="archive-to">Tanggal akhir</Label><Input id="archive-to" type="date" className="mt-2" value={filters.to} onChange={e=>update("to",e.target.value)} /></div></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} dari {rows.length} surat</p><Button variant="ghost" size="sm" onClick={()=>setFilters(INITIAL)}><X />Reset filter</Button></div>
    {invalidDates && <p role="alert" className="mt-3 text-sm text-destructive">Tanggal akhir tidak boleh sebelum tanggal mulai.</p>}
    {exportError && <p role="alert" className="mt-3 text-sm text-destructive">Excel belum dapat disiapkan. Unduhan CSV tetap tersedia.</p>}
    <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr>{["SURAT / KEGIATAN","NOMOR / TANGGAL","PEGAWAI","FORMAT","STATUS","AKSI"].map(h=><th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id} className="border-t border-border hover:bg-card"><td className="max-w-xs p-4"><Link to="/surat/$id" params={{id:r.id}} className="font-medium hover:text-seal">{r.judul || "Surat tanpa judul"}</Link><p className="mt-2 text-xs text-muted-foreground">{r.pengirim || "—"}</p></td><td className="p-4"><p className="font-mono text-xs">{r.nomor || "—"}</p><p className="mt-2">{tanggalIndo(r.tanggal) || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{r.sumber}</p></td><td className="max-w-48 p-4"><p>{r.pegawai || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{r.jumlah} pegawai</p></td><td className="p-4 text-xs">{r.template==="dengan_lampiran" ? "Dengan lampiran" : r.template==="tanpa_lampiran" ? "Tanpa lampiran" : "—"}</td><td className="p-4"><span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-xs ${r.status==="draf_siap" || r.status==="selesai" ? "bg-success-soft text-success" : "bg-accent text-accent-foreground"}`}>{STATUS_LABEL[r.status]}</span></td><td className="p-4"><Button asChild variant="ghost" size="icon" title="Buka surat"><Link to="/surat/$id" params={{id:r.id}} aria-label={`Buka ${r.judul}`}><ArrowUpRight /></Link></Button></td></tr>)}</tbody></table>{!filtered.length && <div className="py-16 text-center"><Archive className="mx-auto mb-4 size-8 text-muted-foreground" /><h2 className="text-lg font-medium">{rows.length ? "Tidak ada arsip yang cocok" : "Belum ada arsip surat"}</h2></div>}</div>
  </>;
}