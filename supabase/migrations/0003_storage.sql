-- Stockage des fichiers importés (.xlsx/.xls/.csv/.ods) dans un bucket privé.
-- Convention de chemin : "<auth.uid()>/<projet>/<fichier>" — le 1er segment du
-- chemin est l'identifiant du propriétaire, ce qui permet d'isoler les fichiers.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- Accès réservé au propriétaire : 1er dossier du chemin == son uid.
create policy uploads_read on storage.objects
  for select using (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy uploads_insert on storage.objects
  for insert with check (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy uploads_update on storage.objects
  for update using (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy uploads_delete on storage.objects
  for delete using (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );
