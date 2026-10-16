import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { toast } from "sonner";

export function SistaShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await client.cancelQueries();
    client.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Gagal keluar. Coba kembali."); return; }
    await navigate({ to: "/auth", replace: true });
  }
  return <div className="min-h-screen bg-background">
    <header className="border-b border-sidebar-border bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link to="/surat" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-seal font-display text-2xl">S</span><span><span className="block text-lg font-semibold">SISTA AI</span><span className="block text-xs text-ink-muted">Sub Bagian Tata Usaha</span></span></Link>
        <div className="flex items-center gap-4"><span className="hidden text-xs text-ink-muted sm:block">{auth.user?.email}</span><span className="flex items-center gap-1 text-xs"><ShieldCheck className="size-4" />{auth.isAdmin ? "Admin" : "Pegawai"}</span><Button variant="ghost" size="icon" title="Keluar" aria-label="Keluar" onClick={signOut}><LogOut /></Button></div>
      </div>
    </header>
    <nav className="border-b border-border"><div className="mx-auto flex max-w-7xl px-5 md:px-8"><Button asChild variant="ghost" className="h-12 rounded-none border-b-2 border-seal"><Link to="/surat"><FileText />Daftar surat</Link></Button></div></nav>
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">{children}</main>
    <footer className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-between gap-2 border-t border-border px-5 py-5 text-xs text-muted-foreground md:px-8"><span>SISTA AI · Administrasi Surat Tugas</span><span>Internal · Akses terbatas</span></footer>
  </div>;
}