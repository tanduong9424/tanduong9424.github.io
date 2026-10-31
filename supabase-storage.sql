insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-documents',
  'private-documents',
  false,
  20971520,
  array['application/pdf', 'text/markdown', 'text/plain']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can list their own private documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own private documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own private documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'private-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
