// Configuration Supabase pour le front.
// Ces deux valeurs sont PUBLIQUES par conception (la clé « publishable/anon »
// est destinée au navigateur ; la sécurité réelle vient des politiques RLS
// définies dans supabase/migrations/0002_rls.sql). Ne jamais mettre ici la clé
// service_role ni le mot de passe Postgres.
export const SUPABASE_URL = 'https://strocizwjvxwranzamdq.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_7SjhMd5KLjGMTdk2k8jrYA_5M8mllJa';
