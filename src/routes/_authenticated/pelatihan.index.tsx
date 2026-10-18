import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, GraduationCap, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tanggalIndo } from "@/lib/letters";
import { PELATIHAN_STATUS_LABEL, PELATIHAN_STATUS_ORDER } from "@/lib/pelatihan";
import { pelatihanListQuery } from "@/lib/pelatihan-queries";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/pelatihan/")({ head: () => pageHead("Bukti pelatihan", "Daftar bukti pelatihan berdasarkan status pemrosesan."), loader: ({ context }) => context.queryClient.ensureQueryData(pelatihanListQuery()), component: PelatihanList });
function PelatihanList() {
  const { data: items } = useSuspenseQuery(pelatihanListQuery());
  const [status, setStatus] = useState("semua");
  const [search, setSearch] = useState("");
  const filtered = items.filter(l => (status === "semua" || l.status === status) && l.judul.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 font-mono text-xs text-muted-foreground">KEPEGAWAIAN / PELATIHAN</p><h1 className="font-display text-4xl">Bukti pelatihan</h1><p className="mt-2 text-sm text-muted-foreground">{items.length} bukti pelatihan dalam ruang kerja Anda</p></div><Button asChild variant="seal"><Link to="/pelatihan/baru"><Plus />Unggah bukti</Link></Button></div>
    <div className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-3">{[["Bukti masuk", items.length], ["Dalam proses", items.filter(l => !["draf_siap"].includes(l.status)).length], ["Draf siap", items.filter(l => l.status === "draf_siap").length]].map(([title, count]) => <div key={title} className="flex items-center gap-4"><span className="font-mono text-3xl">{String(count).padStart(2, "0")}</span><span className="text-sm text-muted-foreground">{title}</span></div>)}</div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-1">{["semua", ...PELATIHAN_STATUS_ORDER].map(s => <Button key={s} variant={status === s ? "default" : "ghost"} size="sm" onClick={() => setStatus(s)} aria-pressed={status === s}>{s === "semua" ? "Semua" : PELATIHAN_STATUS_LABEL[s]} <span className="opacity-60">{s === "semua" ? items.length : items.filter(l => l.status === s).length}</span></Button>)}</div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Cari bukti pelatihan" placeholder="Cari judul pelatihan…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
    <div className="mt-5 overflow-x-auto border-y border-border"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-4">PELATIHAN</th><th className="p-4">TANGGAL UNGGAH</th><th className="p-4">STATUS</th><th className="p-4">AKSI</th></tr></thead><tbody>{filtered.map(l => <tr key={l.id} className="border-t border-border hover:bg-card"><td className="p-4"><div className="flex items-center gap-3"><GraduationCap className="size-5 shrink-0 text-muted-foreground" /><Link to="/pelatihan/$id" params={{ id: l.id }} className="max-w-md font-medium hover:text-seal">{l.judul || "Bukti tanpa judul"}</Link></div></td><td className="p-4 text-muted-foreground">{tanggalIndo(l.dibuat_pada.slice(0, 10))}</td><td className="p-4"><span className={`inline-flex rounded px-2 py-1 text-xs ${l.status === "draf_siap" ? "bg-success-soft text-success" : "bg-accent text-accent-foreground"}`}>{PELATIHAN_STATUS_LABEL[l.status] ?? l.status}</span></td><td className="p-4"><Button asChild size="icon" variant="ghost" title="Buka bukti pelatihan"><Link to="/pelatihan/$id" params={{ id: l.id }} aria-label={`Buka ${l.judul}`}><ArrowUpRight /></Link></Button></td></tr>)}</tbody></table>{!filtered.length && <div className="py-16 text-center"><GraduationCap className="mx-auto mb-4 size-8 text-muted-foreground" /><h2 className="text-lg font-medium">{items.length ? "Tidak ada bukti yang cocok" : "Belum ada bukti pelatihan"}</h2>{!items.length && <Button asChild variant="link" className="mt-3"><Link to="/pelatihan/baru">Unggah bukti pertama<Plus /></Link></Button>}</div>}</div>
  </>;
}
