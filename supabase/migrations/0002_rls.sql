-- Row Level Security : chaque utilisateur n'accède qu'à ses propres données.
-- RAPPEL : la sécurité réelle est ICI (côté base), jamais dans le front. Le
-- navigateur est contournable ; ces politiques sont la barrière effective.

-- Profils : chacun voit/modifie le sien (id = auth.uid()).
alter table public.profiles enable row level security;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Projets : chacun gère les projets dont il est propriétaire.
alter table public.projects enable row level security;
create policy projects_owner on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tables 1:1 : accès via le projet parent (propriété vérifiée par jointure).
-- Une fonction d'aide évite de répéter la sous-requête.
create or replace function public.owns_project(p uuid)
returns boolean language sql stable security invoker as $$
  select exists (
    select 1 from public.projects pr
    where pr.id = p and pr.user_id = auth.uid()
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['consomation','pvgis','pvwatt','ninja','csv_prod','finance']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy %I_owner on public.%I for all '
      || 'using (public.owns_project(project_id)) '
      || 'with check (public.owns_project(project_id));', t, t);
  end loop;
end $$;
