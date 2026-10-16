create table public.letter_access (
  id uuid primary key default gen_random_uuid(),
  letter_id uuid not null references public.letters(id) on delete cascade,
  user_id uuid not null,
  diberikan_oleh uuid not null default auth.uid(),
  diberikan_pada timestamptz not null default now(),
  unique (letter_id, user_id)
);
grant select, insert, delete on public.letter_access to authenticated;
grant all on public.letter_access to service_role;
alter table public.letter_access enable row level security;

alter table public.letters add column kategori_pengecualian text;

create or replace function public.can_access_letter(_letter_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.letters l where l.id = _letter_id and l.dibuat_oleh = auth.uid())
      or exists (select 1 from public.letter_access a where a.letter_id = _letter_id and a.user_id = auth.uid())
$$;
create or replace function public.is_letter_owner(_letter_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.letters l where l.id = _letter_id and l.dibuat_oleh = auth.uid()) $$;

create policy "owner manages access" on public.letter_access for all to authenticated
  using (public.is_letter_owner(letter_id) or user_id = auth.uid())
  with check (public.is_letter_owner(letter_id) and diberikan_oleh = auth.uid());

drop policy "staff all letters" on public.letters;
drop policy "staff all extractions" on public.extractions;
drop policy "staff all drafts" on public.drafts;
drop policy "staff all finals" on public.finals;

create policy "insert own letters" on public.letters for insert to authenticated with check (public.is_staff(auth.uid()) and dibuat_oleh = auth.uid());
create policy "read accessible letters" on public.letters for select to authenticated using (dibuat_oleh = auth.uid() or public.can_access_letter(id));
create policy "update accessible letters" on public.letters for update to authenticated using (public.can_access_letter(id));
create policy "owner deletes letters" on public.letters for delete to authenticated using (dibuat_oleh = auth.uid());

create policy "access extractions" on public.extractions for all to authenticated using (public.can_access_letter(letter_id)) with check (public.can_access_letter(letter_id));
create policy "access drafts" on public.drafts for all to authenticated using (public.can_access_letter(letter_id)) with check (public.can_access_letter(letter_id));
create policy "access finals" on public.finals for all to authenticated using (public.can_access_letter(letter_id)) with check (public.can_access_letter(letter_id));

drop policy "staff read surat" on storage.objects;
drop policy "staff upload surat" on storage.objects;
drop policy "admin delete surat" on storage.objects;
create policy "read letter files" on storage.objects for select to authenticated using (
  bucket_id = 'surat' and (
    ((storage.foldername(name))[1] = 'templates' and public.is_staff(auth.uid()))
    or ((storage.foldername(name))[1] = 'letters' and public.can_access_letter(((storage.foldername(name))[2])::uuid))
  ));
create policy "upload letter files" on storage.objects for insert to authenticated with check (
  bucket_id = 'surat' and (storage.foldername(name))[1] = 'letters' and public.is_staff(auth.uid())
  and (not exists (select 1 from public.letters where id = ((storage.foldername(name))[2])::uuid)
       or public.can_access_letter(((storage.foldername(name))[2])::uuid)));
create policy "admin delete templates" on storage.objects for delete to authenticated using (bucket_id = 'surat' and (storage.foldername(name))[1] = 'templates' and public.has_role(auth.uid(),'admin'));

-- audit: owners of a letter may also read its log
create policy "owner read letter audit" on public.audit_logs for select to authenticated using (pengguna = auth.uid());