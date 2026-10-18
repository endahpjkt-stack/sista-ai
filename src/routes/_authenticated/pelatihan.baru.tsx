import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/pelatihan/baru")({ head: () => pageHead("Unggah bukti pelatihan", "Unggah dokumen bukti pelatihan untuk direkapitulasi."), component: UploadPelatihan });
function UploadPelatihan() {
  const navigate = useNavigate();
  const [judul, setJudul] = useState("");
  const [bukti, setBukti] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(e: React.FormEvent) {
    e.preventDefault(); if (!bukti) return;
    setBusy(true); setError("");
    try {
      if (!["application/pdf", "image/jpeg", "image/png"].includes(bukti.type) || bukti.size > 20 * 1024 * 1024) throw new Error("Gunakan PDF, JPG, atau PNG maksimal 20 MB.");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sesi berakhir. Silakan masuk kembali.");
      const id = crypto.randomUUID();
      const path = `pelatihan/${id}/bukti.${bukti.type === "application/pdf" ? "pdf" : bukti.type === "image/png" ? "png" : "jpg"}`;
      const { error: upErr } = await supabase.storage.from("surat").upload(path, bukti);
      if (upErr) throw new Error("File tidak dapat diunggah. Silakan coba lagi.");
      const result = await supabase.from("pelatihan").insert({ id, judul: judul.trim(), file_bukti: path, dibuat_oleh: auth.user.id });
      if (result.error) throw new Error("Bukti pelatihan belum tersimpan. Silakan coba lagi.");
      await navigate({ to: "/pelatihan/$id", params: { id } });
    } catch (e) { setError(e instanceof Error ? e.message : "Unggah gagal."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-3xl"><Button asChild variant="ghost" className="mb-5 -ml-3"><Link to="/pelatihan"><ArrowLeft />Bukti pelatihan</Link></Button><h1 className="font-display text-4xl">Unggah bukti pelatihan</h1>
    <form onSubmit={upload} className="mt-8 space-y-7"><div className="space-y-2"><Label htmlFor="judul">Judul pelatihan</Label><Input id="judul" required value={judul} onChange={e => setJudul(e.target.value)} placeholder="Nama pelatihan atau bimtek" className="h-11 bg-card" /></div>
      <div><Label htmlFor="bukti">Dokumen bukti</Label><div className="mt-2 flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed border-input bg-card p-5"><FileText className="mb-3 size-7 text-muted-foreground" /><span className="mb-3 max-w-full break-all text-center text-sm">{bukti?.name || "Sertifikat / surat keterangan / daftar hadir · PDF, JPG, PNG · maks. 20 MB"}</span><Input id="bukti" type="file" accept="application/pdf,image/jpeg,image/png" required onChange={e => setBukti(e.target.files?.[0] ?? null)} className="h-auto max-w-full text-xs" /></div></div>
      {error && <p role="alert" className="bg-danger-soft p-3 text-sm text-destructive">{error}</p>}
      <div className="border-t border-border pt-5"><Button type="submit" variant="seal" disabled={busy || !bukti}><Upload />{busy ? "Mengunggah…" : "Unggah & lanjutkan"}</Button></div>
    </form>
  </div>;
}
