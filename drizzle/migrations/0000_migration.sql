create type public.app_role as enum ('admin', 'pegawai');
create type public.letter_status as enum ('diunggah','diekstrak','ditinjau','draf_siap','menunggu_tte','selesai');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id) $$;

create policy "own role or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()) or id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

-- First user becomes admin, others pegawai
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'pegawai');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  status letter_status not null default 'diunggah',
  judul text not null default '',
  file_surat text not null,
  file_disposisi text,
  jumlah_pegawai int,
  checklist_cocok boolean not null default false,
  pengecualian boolean not null default false,
  template_rekomendasi text,
  template_dipilih text,
  alasan_pengecualian text,
  dibuat_oleh uuid not null default auth.uid(),
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);
create table public.extractions (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null references public.letters(id) on delete cascade,
  json_hasil jsonb not null,
  versi_prompt text not null,
  model text not null,
  dibuat_pada timestamptz not null default now()
);
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null references public.letters(id) on delete cascade,
  data_disetujui jsonb not null,
  template text not null,
  file_draf text,
  disetujui_oleh uuid not null default auth.uid(),
  disetujui_pada timestamptz not null default now()
);
create table public.finals (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null unique references public.letters(id) on delete cascade,
  file_pdf_final text not null,
  nomor_surat text,
  tanggal_surat date,
  dikonfirmasi boolean not null default false,
  drive_url text,
  sheet_row int,
  dicatat_oleh uuid default auth.uid(),
  dicatat_pada timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid references public.letters(id) on delete set null,
  pengguna uuid not null default auth.uid(),
  aksi text not null,
  detail jsonb not null default '{}'::jsonb,
  waktu timestamptz not null default now()
);

grant select, insert, update, delete on public.letters, public.extractions, public.drafts, public.finals to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant all on public.letters, public.extractions, public.drafts, public.finals, public.audit_logs to service_role;

alter table public.letters enable row level security;
alter table public.extractions enable row level security;
alter table public.drafts enable row level security;
alter table public.finals enable row level security;
alter table public.audit_logs enable row level security;

create policy "staff all letters" on public.letters for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff all extractions" on public.extractions for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff all drafts" on public.drafts for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff all finals" on public.finals for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff insert audit" on public.audit_logs for insert to authenticated with check (public.is_staff(auth.uid()) and pengguna = auth.uid());
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "staff read surat" on storage.objects for select to authenticated using (bucket_id = 'surat' and public.is_staff(auth.uid()));
create policy "staff upload surat" on storage.objects for insert to authenticated with check (bucket_id = 'surat' and public.is_staff(auth.uid()) and (storage.foldername(name))[1] <> 'templates');
create policy "admin templates insert" on storage.objects for insert to authenticated with check (bucket_id = 'surat' and (storage.foldername(name))[1] = 'templates' and public.has_role(auth.uid(),'admin'));
create policy "admin templates update" on storage.objects for update to authenticated using (bucket_id = 'surat' and (storage.foldername(name))[1] = 'templates' and public.has_role(auth.uid(),'admin'));
create policy "admin delete surat" on storage.objects for delete to authenticated using (bucket_id = 'surat' and public.has_role(auth.uid(),'admin'));