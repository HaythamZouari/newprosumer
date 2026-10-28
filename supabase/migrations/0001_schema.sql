-- Schéma NewProsumer pour Supabase (PostgreSQL).
-- Dérivé des entités Doctrine (src/Entity/*). Correspondances :
--   Doctrine type="array"  -> jsonb (tableaux PHP sérialisés)
--   Doctrine float         -> double precision
--   Doctrine OneToOne      -> table 1:1 reliée au projet (project_id unique)
--   Doctrine ManyToOne User-> colonne user_id vers auth.users (Supabase Auth)
--
-- Les identifiants passent de l'auto-incrément MySQL à des UUID.

-- Profil applicatif, en complément de auth.users (qui porte email + mot de passe).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  full_name   text,
  societe     text,
  img_url     text,
  roles       text[] not null default '{ROLE_USER}',
  enabled     boolean not null default true,
  abon1       boolean not null default false,
  abon2       boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Projet photovoltaïque.
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null,
  adress           text,
  description      text,
  -- résultats horaires du croisement conso/production (voir projectData.js)
  auto_consomer    jsonb,
  cedee            jsonb,
  importe          jsonb,
  inject           jsonb,
  consomation_ph   jsonb,
  production_ph    jsonb,
  auto_consomer_ph jsonb,
  importer_ph      jsonb,
  cedee_ph         jsonb,
  inject_ph        jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects (user_id);

-- Consommation (profil de charge + paramètres de modélisation).
create table if not exists public.consomation (
  id                     uuid primary key default gen_random_uuid(),
  project_id             uuid not null unique references public.projects (id) on delete cascade,
  transport_eng          boolean,
  type_tarif             boolean,
  date_deb               timestamptz,
  date_fin               timestamptz,
  date_deb_form          text,
  url_ccv                text,
  allurl_ccv             jsonb,
  all_date_deb           jsonb,
  all_date_fin           jsonb,
  all_consomation_annuel jsonb,
  all_tarif              jsonb,
  consomation_annuel     jsonb,
  cm_month               jsonb,
  allcm_month            jsonb,
  avgweek                jsonb,
  activite               jsonb,
  dateconge_deb          jsonb,
  dateconge_deb1         jsonb,
  dateconge_deb2         jsonb,
  dateconge_fin          jsonb,
  dateconge_fin1         jsonb,
  dateconge_fin2         jsonb,
  hour_slider1           jsonb,
  hour_slider2           jsonb,
  hour_slider3           jsonb,
  hour_slider_dimanche   jsonb,
  hour_slider_samedi     jsonb,
  month_slider1          jsonb,
  month_slider2          jsonb,
  month_slider3          jsonb,
  saison                 jsonb,
  conge_check            jsonb,
  dimanche_check         jsonb,
  samedi_check           jsonb,
  vershoraire            jsonb,
  ferie_check            jsonb
);

-- Production PVGIS.
create table if not exists public.pvgis (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null unique references public.projects (id) on delete cascade,
  lat           double precision,
  lon           double precision,
  mounting_type integer,
  slop          jsonb,
  azimuth       jsonb,
  pv_tech       text,
  peak_power    jsonb,
  loss          double precision,
  degradation   double precision,
  result        jsonb
);

-- Production PVWatts.
create table if not exists public.pvwatt (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references public.projects (id) on delete cascade,
  lat         double precision,
  lon         double precision,
  module_type integer,
  losses      double precision,
  array_type  integer,
  azimuth     double precision,
  tilts       double precision,
  result      jsonb
);

-- Production renewables.ninja.
create table if not exists public.ninja (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references public.projects (id) on delete cascade,
  lat         double precision,
  lon         double precision,
  tracking    integer,
  raddatabase text,
  tilt        double precision,
  azimuth     double precision,
  capacity    double precision,
  loss        double precision,
  degradation double precision,
  result      jsonb
);

-- Production importée par fichier CSV/Excel.
create table if not exists public.csv_prod (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references public.projects (id) on delete cascade,
  path        text,          -- chemin dans le bucket Storage "uploads"
  puissence   double precision,
  degradation double precision,
  result      jsonb
);

-- Paramètres et résultats financiers.
create table if not exists public.finance (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null unique references public.projects (id) on delete cascade,
  capex              double precision,
  subvention         double precision,
  subventionarray    jsonb,
  duree_proj         double precision,
  aug_tarif_vende    double precision,
  aug_tarif_achat    double precision,
  taux_actualisation double precision,
  credit             boolean,
  montant_dette      double precision not null default 0,
  taux_interet       double precision,
  delai_grace        double precision,
  maturite_proj      double precision,
  tarif_uni          double precision,
  tarif_horaire      jsonb,
  opex               double precision,
  replinv            double precision,
  tarif_transport    double precision,
  f_regularisation   jsonb,
  factransport       jsonb,
  van                double precision,
  tri25              double precision,
  wacc               double precision,
  annuite            jsonb,
  depense            double precision,
  gain_cedee         jsonb,
  gain_transporter   jsonb,
  cashflow           jsonb,
  cashflow_cum       jsonb,
  cfads              jsonb,
  dscr               jsonb,
  gain_ans           jsonb,
  llcr               jsonb,
  cashflow_in        double precision,
  tricapitaux        double precision,
  soldrep            jsonb
);
