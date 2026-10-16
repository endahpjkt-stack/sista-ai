import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/auth")({ head: () => pageHead("Masuk", "Masuk ke aplikasi internal administrasi Surat Tugas SISTA AI."), component: Auth });
function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) { setError("Email atau kata sandi tidak sesuai, atau email belum dikonfirmasi."); return; }
      const verified = await supabase.auth.getUser();
      if (!verified.data.user) { setError("Sesi belum tersedia. Silakan coba kembali."); return; }
      await navigate({ to: "/surat", replace: true });
    } catch { setError("Tidak dapat terhubung. Silakan coba kembali."); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background">
    <header className="bg-ink px-6 py-6 text-ink-foreground"><div className="mx-auto flex max-w-6xl items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-seal font-display text-2xl">S</span><span className="text-xl font-semibold">SISTA AI</span></div></header>
    <main className="mx-auto max-w-md px-6 py-16 md:py-24">
      <div className="mb-7 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-4" />SUB BAGIAN TATA USAHA</div>
      <h1 className="font-display text-4xl">Masuk ke SISTA AI</h1><p className="mt-3 text-sm text-muted-foreground">Sistem Inteligensi Surat Tugas dan Administrasi</p>
      <form onSubmit={login} className="mt-9 space-y-6">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@instansi.go.id" className="h-12 bg-card" /></div>
        <div className="space-y-2"><Label htmlFor="password">Kata sandi</Label><div className="relative"><Input id="password" type={visible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-card pr-12" /><Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1.5" aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button></div></div>
        {error && <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="seal" className="h-12 w-full" disabled={busy}><LogIn />{busy ? "Memeriksa…" : "Masuk"}</Button>
      </form>
      <div className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">Akses untuk pegawai yang memiliki akun SISTA AI.</div>
    </main>
  </div>;
}