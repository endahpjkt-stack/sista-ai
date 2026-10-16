import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ShieldCheck, Sparkles, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SISTA AI — Surat Tugas BLSDM Komdigi Jakarta" },
      { name: "description", content: "Otomasi ekstraksi data, pemilihan template, draf, dan arsip Surat Tugas dengan verifikasi pegawai." },
      { property: "og:title", content: "SISTA AI — Surat Tugas BLSDM Komdigi Jakarta" },
      { property: "og:description", content: "Otomasi administrasi Surat Tugas dengan verifikasi manusia di setiap tahap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const steps = [
    { icon: FileText, t: "Unggah", d: "Surat masuk & lembar disposisi dari SRIKANDI." },
    { icon: Sparkles, t: "Ekstraksi AI", d: "Data kunci dibaca, isian ragu ditandai — tidak ditebak." },
    { icon: ShieldCheck, t: "Tinjau & setujui", d: "Pegawai memeriksa, memilih template, dan menyetujui." },
    { icon: Archive, t: "Arsip", d: "PDF ber-TTE dicatat dengan penamaan baku." },
  ];
  return (
    <div className="min-h-screen bg-ink text-ink-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-seal font-display text-lg font-semibold text-primary-foreground">S</div>
          <div className="text-sm leading-tight">
            <div className="font-semibold tracking-wide">SISTA AI</div>
            <div className="text-ink-muted">BLSDM Komdigi Jakarta</div>
          </div>
        </header>
        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-ink-muted">Sistem Inteligensi Surat Tugas dan Administrasi</p>
          <h1 className="max-w-3xl font-display text-5xl font-medium leading-[1.05] md:text-7xl">
            Dari disposisi ke Surat Tugas, <span className="text-seal">tanpa salin-tempel.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            AI membantu pekerjaan berulang. Verifikasi berjenjang dan TTE tetap di tangan pejabat berwenang.
          </p>
          <div className="mt-10">
            {!loading && (
              <Button asChild size="lg" variant="seal">
                <Link to={user ? "/dashboard" : "/auth"}>{user ? "Buka daftar surat" : "Masuk ke aplikasi"}</Link>
              </Button>
            )}
          </div>
          <ol className="mt-20 grid gap-px overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-border md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.t} className="bg-ink p-6">
                <div className="mb-6 flex items-center justify-between text-ink-muted">
                  <s.icon className="h-5 w-5" />
                  <span className="font-mono text-xs">0{i + 1}</span>
                </div>
                <div className="font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-ink-muted">{s.d}</div>
              </li>
            ))}
          </ol>
        </main>
      </div>
    </div>
  );
}
