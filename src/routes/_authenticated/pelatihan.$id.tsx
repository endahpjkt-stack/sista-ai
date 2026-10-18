import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileText, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { DocumentViewer } from "@/components/document-viewer";
import { pelatihanQuery } from "@/lib/pelatihan-queries";
import { extractPelatihan } from "@/lib/pelatihan-ai.functions";
import { formFromPelatihanExtraction, PELATIHAN_STATUS_LABEL, type PelatihanFormData } from "@/lib/pelatihan";
import { buildPelatihanDocx } from "@/lib/pelatihan-docx";
import { deliverFile } from "@/lib/download";
import { pageHead } from "@/lib/page-head";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pelatihan/$id")({
  head: () => pageHead("Tinjau bukti pelatihan", "Tinjau hasil ekstraksi bukti pelatihan dan buat draf rekapitulasi."),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(pelatihanQuery(params.id)),
  component: PelatihanDetail,
});

function PelatihanDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(pelatihanQuery(id));
  const { pelatihan, extraction, draft } = data;
  const client = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<PelatihanFormData>(() =>
    draft ? (draft.data_disetujui as unknown as PelatihanFormData) : formFromPelatihanExtraction(extraction?.json_hasil));
  // deno-lint-ignore no-explicit-any
  const hasil = extraction?.json_hasil as any;
  const bermasalah: { field: string; masalah: string; catatan?: string }[] = hasil?.isian_bermasalah ?? [];
  const keyakinan: Record<string, number> = hasil?.tingkat_keyakinan ?? {};
  const flag = (path: string) => {
    const b = bermasalah.find(x => x.field === path);
    const k = keyakinan[path];
    if (b) return { warn: true, note: `${b.masalah.replaceAll("_", " ")}${b.catatan ? ` — ${b.catatan}` : ""}` };
    if (typeof k === "number" && k < 0.7) return { warn: true, note: `Keyakinan AI rendah (${k.toFixed(2)})` };
    return { warn: false, note: "" };
  };
  const set = (k: keyof PelatihanFormData, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setPeserta = (i: number, k: "nama" | "nip" | "jabatan", v: string) =>
    setForm(f => ({ ...f, peserta: f.peserta.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));

  async function proses() {
    setBusy("proses"); setError("");
    try {
      await extractPelatihan({ data: { pelatihanId: id } });
      await client.invalidateQueries({ queryKey: ["pelatihan"] });
      toast.success("Ekstraksi selesai. Silakan tinjau hasilnya.");
    } catch (e) { setError(e instanceof Error ? e.message : "Pemrosesan gagal."); }
    finally { setBusy(""); }
  }

  async function buatDraf() {
    setBusy("draf"); setError("");
    try {
      if (!form.nama_pelatihan.trim()) throw new Error("Nama pelatihan wajib diisi.");
      if (!form.peserta.length || !form.peserta.some(p => p.nama.trim())) throw new Error("Minimal satu peserta dengan nama wajib diisi.");
      const blob = await buildPelatihanDocx(form);
      const path = `pelatihan/${id}/draf_${crypto.randomUUID()}.docx`;
      const { error: upErr } = await supabase.storage.from("surat").upload(path, blob);
      if (upErr) throw new Error("Draf tidak dapat diunggah. Silakan coba lagi.");
      const { data: auth } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("pelatihan_drafts").insert({
        pelatihan_id: id, data_disetujui: form as never, file_draf: path, disetujui_oleh: auth.user?.id ?? "",
      });
      if (insErr) throw new Error("Draf belum tersimpan. Silakan coba lagi.");
      await supabase.from("pelatihan").update({ status: "draf_siap", diperbarui_pada: new Date().toISOString() }).eq("id", id);
      await client.invalidateQueries({ queryKey: ["pelatihan"] });
      await deliverFile(blob, `Rekap_Bukti_Pelatihan_${form.nama_pelatihan.slice(0, 40) || id}.docx`);
      toast.success("Draf rekapitulasi dibuat dan diunduh.");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal membuat draf."); }
    finally { setBusy(""); }
  }

  async function unduhDraf() {
    if (!draft?.file_draf) return;
    setBusy("unduh");
    const { data: blob, error: dlErr } = await supabase.storage.from("surat").download(draft.file_draf);
    setBusy("");
    if (dlErr || !blob) { toast.error("Draf tidak dapat diunduh."); return; }
    await deliverFile(blob, `Rekap_Bukti_Pelatihan_${id}.docx`);
  }

  const field = (label: string, key: keyof PelatihanFormData, path: string, area = false) => {
    const f = flag(path);
    return <div className="space-y-1.5">
      <Label htmlFor={key} className="flex items-center gap-2">{label}{f.warn && <span className="inline-flex items-center gap-1 text-xs text-amber-600"><TriangleAlert className="size-3.5" />{f.note}</span>}</Label>
      {area
        ? <Textarea id={key} value={String(form[key])} onChange={e => set(key, e.target.value)} className="bg-card" />
        : <Input id={key} value={String(form[key])} onChange={e => set(key, e.target.value)} className="bg-card" />}
    </div>;
  };

  return <div>
    <Button asChild variant="ghost" className="mb-5 -ml-3"><Link to="/pelatihan"><ArrowLeft />Bukti pelatihan</Link></Button>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 font-mono text-xs text-muted-foreground">PELATIHAN / {PELATIHAN_STATUS_LABEL[pelatihan.status] ?? pelatihan.status}</p><h1 className="font-display text-3xl">{pelatihan.judul || "Bukti tanpa judul"}</h1></div>
      <div className="flex gap-2">
        {!extraction && <Button variant="seal" onClick={proses} disabled={!!busy}>{busy === "proses" ? <Loader2 className="animate-spin" /> : <Sparkles />}Proses dengan AI</Button>}
        {extraction && !draft && <Button variant="seal" onClick={buatDraf} disabled={!!busy}>{busy === "draf" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Setujui & buat draf</Button>}
        {draft && <Button variant="seal" onClick={unduhDraf} disabled={!!busy}><Download />Unduh draf</Button>}
      </div>
    </div>
    {error && <p role="alert" className="mt-5 bg-danger-soft p-3 text-sm text-destructive">{error}</p>}
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <section><h2 className="mb-3 flex items-center gap-2 text-sm font-medium"><FileText className="size-4" />Dokumen bukti</h2><div className="overflow-hidden rounded-md border border-border"><DocumentViewer path={pelatihan.file_bukti} /></div></section>
      <section>
        {!extraction && <div className="flex min-h-60 flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Unggahan belum diproses. Jalankan &quot;Proses dengan AI&quot; untuk membaca isi dokumen bukti pelatihan.</div>}
        {extraction && <div className="space-y-5">
          <h2 className="text-sm font-medium">Hasil tinjauan</h2>
          {field("Nomor rekapitulasi", "nomor", "nomor")}
          {field("Nama pelatihan", "nama_pelatihan", "pelatihan.nama")}
          {field("Penyelenggara", "penyelenggara", "pelatihan.penyelenggara")}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("Tanggal mulai", "tanggal_mulai", "pelatihan.tanggal_mulai")}
            {field("Tanggal selesai", "tanggal_selesai", "pelatihan.tanggal_selesai")}
          </div>
          {field("Tempat", "tempat", "pelatihan.tempat")}
          {field("Durasi", "durasi", "pelatihan.durasi")}
          {field("Dasar dokumen", "dasar_dokumen", "dasar_dokumen")}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Peserta{flag("peserta").warn && <span className="inline-flex items-center gap-1 text-xs text-amber-600"><TriangleAlert className="size-3.5" />{flag("peserta").note}</span>}</Label>
            <div className="space-y-3">{form.peserta.map((p, i) => <div key={i} className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-3">
              <Input aria-label={`Nama peserta ${i + 1}`} placeholder="Nama" value={p.nama} onChange={e => setPeserta(i, "nama", e.target.value)} />
              <Input aria-label={`NIP peserta ${i + 1}`} placeholder="NIP" value={p.nip} onChange={e => setPeserta(i, "nip", e.target.value)} />
              <Input aria-label={`Jabatan peserta ${i + 1}`} placeholder="Jabatan" value={p.jabatan} onChange={e => setPeserta(i, "jabatan", e.target.value)} />
            </div>)}</div>
            <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, peserta: [...f.peserta, { nama: "", nip: "", jabatan: "" }] }))}>Tambah peserta</Button>
          </div>
          {field("Catatan verifikasi", "catatan", "catatan", true)}
          {draft && <p className="text-sm text-muted-foreground">Draf disetujui pada {new Date(draft.disetujui_pada).toLocaleString("id-ID")}. Gunakan tombol unduh di atas untuk mengambilnya kembali.</p>}
        </div>}
      </section>
    </div>
    <div className="mt-8"><Button variant="ghost" onClick={() => navigate({ to: "/pelatihan" })}><ArrowLeft />Kembali ke daftar</Button></div>
  </div>;
}
