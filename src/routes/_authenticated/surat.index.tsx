import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABEL, STATUS_ORDER, tanggalIndo } from "@/lib/letters";
import { lettersQuery } from "@/lib/surat-queries";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/surat/")({ head: () => pageHead("Daftar surat", "Daftar Surat Tugas berdasarkan status pemrosesan."), loader: ({ context }) => context.queryClient.ensureQueryData(lettersQuery()), component: Letters });
function Letters() {
  const { data: letters } = useSuspenseQuery(lettersQuery());
  const [status, setStatus] = useState("semua");
  const [search, setSearch] = useState("");
  const filtered = letters.filter(l => (status === "semua" || l.status === status) && l.judul.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 font-mono text-xs text-muted-foreground">PERSURATAN / SURAT TUGAS</p><h1 className="font-display text-4xl">Daftar surat</h1><p className="mt-2 text-sm text-muted-foreground">{letters.length} surat dalam ruang kerja Anda</p></div><Button asChild variant="seal"><Link to="/surat/baru"><Plus />Unggah surat</Link></Button></div>
    <div className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-3">{[["Surat masuk", letters.length], ["Dalam proses", letters.filter(l => !["selesai", "draf_siap", "menunggu_tte"].includes(l.status)).length], ["Draf siap", letters.filter(l => l.status === "draf_siap").length]].map(([title, count]) => <div key={title} className="flex items-center gap-4"><span className="font-mono text-3xl">{String(count).padStart(2,"0")}</span><span className="text-sm text-muted-foreground">{title}</span></div>)}</div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-1">{["semua", ...STATUS_ORDER].map(s => <Button key={s} variant={status === s ? "default" : "ghost"} size="sm" onClick={() => setStatus(s)} aria-pressed={status === s}>{s === "semua" ? "Semua" : STATUS_LABEL[s]} <span className="opacity-60">{s === "semua" ? letters.length : letters.filter(l => l.status === s).length}</span></Button>)}</div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Cari surat" placeholder="Cari judul surat…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
    <div className="mt-5 overflow-x-auto border-y border-border"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-4">SURAT / KEGIATAN</th><th className="p-4">TANGGAL UNGGAH</th><th className="p-4">STATUS</th><th className="p-4">AKSI</th></tr></thead><tbody>{filtered.map(l => <tr key={l.id} className="border-t border-border hover:bg-card"><td className="p-4"><div className="flex items-center gap-3"><FileText className="size-5 shrink-0 text-muted-foreground" /><Link to="/surat/$id" params={{ id:l.id }} className="max-w-md font-medium hover:text-seal">{l.judul || "Surat tanpa judul"}</Link></div></td><td className="p-4 text-muted-foreground">{tanggalIndo(l.dibuat_pada.slice(0,10))}</td><td className="p-4"><span className={`inline-flex rounded px-2 py-1 text-xs ${l.status === "draf_siap" || l.status === "selesai" ? "bg-success-soft text-success" : "bg-accent text-accent-foreground"}`}>{STATUS_LABEL[l.status]}</span></td><td className="p-4"><Button asChild size="icon" variant="ghost" title="Buka surat"><Link to="/surat/$id" params={{ id:l.id }} aria-label={`Buka ${l.judul}`}><ArrowUpRight /></Link></Button></td></tr>)}</tbody></table>{!filtered.length && <div className="py-16 text-center"><FileText className="mx-auto mb-4 size-8 text-muted-foreground" /><h2 className="text-lg font-medium">{letters.length ? "Tidak ada surat yang cocok" : "Belum ada surat"}</h2>{!letters.length && <Button asChild variant="link" className="mt-3"><Link to="/surat/baru">Unggah surat pertama<Plus /></Link></Button>}</div>}</div>
  </>;
}