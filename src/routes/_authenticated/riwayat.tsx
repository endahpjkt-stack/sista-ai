import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, History, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { archiveQuery } from "@/lib/surat-queries";
import { HISTORY_LABEL, filterHistory, historyStatus, type HistoryStatus } from "@/lib/history";
import { STATUS_LABEL, tanggalIndo } from "@/lib/letters";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/riwayat")({
  validateSearch: (search: Record<string, unknown>): { status: "semua" | HistoryStatus; q: string } => ({
    status: search.status === "draf" || search.status === "proses" || search.status === "resmi" ? search.status : "semua",
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => pageHead("Riwayat surat", "Lacak perkembangan surat SISTA AI berdasarkan status Proses, Draf, dan Resmi."),
  loader: ({ context }) => context.queryClient.ensureQueryData(archiveQuery()),
  component: LetterHistory,
  errorComponent: HistoryError,
  notFoundComponent: () => <p>Riwayat surat tidak ditemukan.</p>,
});

function HistoryError() {
  const navigate = useNavigate();
  return <div role="alert" className="space-y-4 py-8"><p>Riwayat surat belum dapat dimuat.</p><Button variant="outline" onClick={() => void navigate({ to: "/riwayat", search: { status: "semua", q: "" }, reloadDocument: true })}><RotateCcw />Coba kembali</Button></div>;
}

const badgeClass = {
  proses: "bg-warning-soft text-warning-foreground",
  draf: "bg-accent text-accent-foreground",
  resmi: "bg-success-soft text-success",
};

function LetterHistory() {
  const { data: rows } = useSuspenseQuery(archiveQuery());
  const { status, q } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const filtered = filterHistory(rows, status, q);
  const update = (next: { status?: "semua" | HistoryStatus; q?: string }) => void navigate({ search: prev => ({ ...prev, ...next }), replace: true });
  return <>
    <div><h1 className="font-display text-4xl">Riwayat surat</h1><p className="mt-2 text-sm text-muted-foreground">{rows.length} surat dalam ruang kerja Anda</p></div>
    <div className="mt-8 grid grid-cols-3 gap-4 border-y border-border py-5">
      {(["proses", "draf", "resmi"] as const).map(category => <div key={category} className="flex flex-wrap items-center gap-3"><span className="font-mono text-3xl">{rows.filter(row => historyStatus(row) === category).length}</span><span className="text-sm text-muted-foreground">{HISTORY_LABEL[category]}</span></div>)}
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-1" aria-label="Filter status riwayat">{(["semua", "proses", "draf", "resmi"] as const).map(category => <Button key={category} size="sm" variant={status === category ? "default" : "ghost"} aria-pressed={status === category} onClick={() => update({ status: category })}>{category === "semua" ? "Semua" : HISTORY_LABEL[category]}</Button>)}</div>
      <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Cari riwayat surat" placeholder="Judul, nomor, atau pegawai…" value={q} onChange={e => update({ q: e.target.value })} className="pl-9" /></div>
    </div>
    <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{filtered.length} dari {rows.length} surat</p>
    <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr>{["SURAT / KEGIATAN", "NOMOR / TANGGAL", "STATUS", "DIUNGGAH", "AKSI"].map(label => <th key={label} className="p-4">{label}</th>)}</tr></thead>
      <tbody>{filtered.map(row => {
        const category = historyStatus(row);
        return <tr key={row.id} className="border-t border-border hover:bg-card"><td className="max-w-sm p-4"><Link to="/surat/$id" params={{ id: row.id }} className="font-medium hover:text-seal">{row.judul || "Surat tanpa judul"}</Link><p className="mt-2 text-xs text-muted-foreground">{row.pengirim || "—"}</p></td><td className="p-4"><p className="font-mono text-xs">{row.nomor || "—"}</p><p className="mt-2">{tanggalIndo(row.tanggal) || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{row.sumber}</p></td><td className="p-4"><span className={`inline-flex rounded px-2 py-1 text-xs ${badgeClass[category]}`}>{HISTORY_LABEL[category]}</span><p className="mt-2 text-xs text-muted-foreground">{STATUS_LABEL[row.status] || row.status}</p></td><td className="whitespace-nowrap p-4 text-muted-foreground">{tanggalIndo(row.diunggah)}</td><td className="p-4"><Button asChild variant="ghost" size="icon" title="Buka surat"><Link to="/surat/$id" params={{ id: row.id }} aria-label={`Buka ${row.judul}`}><ArrowUpRight /></Link></Button></td></tr>;
      })}</tbody></table>{!filtered.length && <div className="py-16 text-center"><History className="mx-auto mb-4 size-8 text-muted-foreground" /><h2 className="text-lg font-medium">{rows.length ? "Tidak ada riwayat yang cocok" : "Belum ada riwayat surat"}</h2>{rows.length > 0 && <Button variant="ghost" className="mt-3" onClick={() => update({ status: "semua", q: "" })}><RotateCcw />Reset filter</Button>}</div>}</div>
  </>;
}