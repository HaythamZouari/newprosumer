-- Synchronisation de l'application (agrégats projet) + flux d'approbation des comptes.
-- À appliquer APRÈS 0001-0003.

-- 1) Documents applicatifs : un projet = un document JSON (même forme que dans le navigateur).
create table if not exists public.np_docs (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null,
  id         text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);
alter table public.np_docs enable row level security;
create policy np_docs_owner on public.np_docs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2) Approbation : le compte reste désactivé jusqu'à /confirm/{token} (lien reçu par l'administrateur).
alter table public.profiles add column if not exists confirmation_token text;
alter table public.profiles alter column enabled set default false;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, societe, enabled, confirmation_token)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'societe', false, new.raw_user_meta_data->>'confirmation_token')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Connexion par nom d'utilisateur (comme l'original) : retrouve l'e-mail associé.
create or replace function public.email_for_username(u text) returns text
language sql stable security definer set search_path = public, auth as $$
  select au.email from public.profiles p join auth.users au on au.id = p.id where p.username = u limit 1;
$$;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- Les utilisateurs ne doivent pas pouvoir s'auto-activer ni lire le jeton de confirmation.
revoke update (enabled, confirmation_token, roles) on public.profiles from authenticated;
revoke select (confirmation_token) on public.profiles from authenticated, anon;
