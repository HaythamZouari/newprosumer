// Accès Supabase (auth, projets, stockage) pour le front.
//
// Toutes les fonctions supposent que supabase-js (UMD) est chargé dans la page
// (global `window.supabase`). L'init et la joignabilité sont vérifiées par
// `init()` : dans un environnement qui bloque le réseau (aperçu artifact), elle
// renvoie false et l'app reste en mode local.
//
// Mapping vers le schéma supabase/migrations :
//   projects            : name + résultats (auto_consomer, cedee, importe, inject, *_ph)
//   consomation (1:1)   : série de consommation + transport_eng / type_tarif + tarifs
//   csv_prod   (1:1)    : série de production
//   finance    (1:1)    : paramètres financiers
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

let client = null;

export function getClient() {
  if (client) return client;
  const lib = window.supabase;
  if (!lib || !SUPABASE_URL || SUPABASE_URL.includes('VOTRE')) return null;
  client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

// Vérifie que Supabase est configuré ET joignable (timeout court).
// Renvoie false en aperçu artifact (réseau bloqué) -> mode local.
export async function isReachable() {
  if (!getClient()) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY }, signal: ctrl.signal,
    });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

export async function currentUser() {
  const c = getClient();
  if (!c) return null;
  const { data } = await c.auth.getUser();
  return data?.user ?? null;
}

export async function signIn(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await getClient().auth.signOut();
}

// Liste des projets de l'utilisateur (RLS limite déjà aux siens).
export async function listProjects() {
  const { data, error } = await getClient()
    .from('projects').select('id, name, updated_at').order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Enregistre (crée ou met à jour) un projet complet.
// snap = { id?, name, conso, prod, transportEng, typeTarif, degr, finance, tarifs, res }
export async function saveProject(snap) {
  const c = getClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('non connecté');

  const projectRow = {
    user_id: user.id,
    name: snap.name,
    auto_consomer: snap.res.autoConsomer,
    cedee: snap.res.cedee,
    importe: snap.res.importer,
    inject: snap.res.inject,
    consomation_ph: snap.res.consomationPH,
    production_ph: snap.res.productionPH,
    auto_consomer_ph: snap.res.autoConsomerPH,
    importer_ph: snap.res.importerPH,
    cedee_ph: snap.res.cedeePH,
    inject_ph: snap.res.injectPH,
    updated_at: new Date().toISOString(),
  };
  if (snap.id) projectRow.id = snap.id;

  const { data: proj, error } = await c.from('projects').upsert(projectRow).select('id').single();
  if (error) throw error;
  const pid = proj.id;

  const [r1, r2, r3] = await Promise.all([
    c.from('consomation').upsert({
      project_id: pid,
      consomation_annuel: snap.conso,
      transport_eng: snap.transportEng === 1,
      type_tarif: !!snap.typeTarif,
      all_tarif: snap.tarifs,
    }, { onConflict: 'project_id' }),
    c.from('csv_prod').upsert({
      project_id: pid, result: snap.prod, puissence: 0, degradation: snap.degr,
    }, { onConflict: 'project_id' }),
    c.from('finance').upsert({
      project_id: pid,
      capex: snap.finance.capex,
      opex: snap.finance.opex,
      aug_tarif_achat: snap.finance.augTarifAchat,
      aug_tarif_vende: snap.finance.augTarifVende,
      tarif_horaire: snap.tarifs,
    }, { onConflict: 'project_id' }),
  ]);
  for (const r of [r1, r2, r3]) if (r.error) throw r.error;
  return pid;
}

// Recharge un projet : renvoie { name, conso, prod, transportEng, typeTarif, degr, tarifs, finance }.
export async function loadProject(id) {
  const c = getClient();
  const [{ data: proj }, { data: conso }, { data: prod }, { data: fin }] = await Promise.all([
    c.from('projects').select('name').eq('id', id).single(),
    c.from('consomation').select('consomation_annuel, transport_eng, type_tarif, all_tarif').eq('project_id', id).maybeSingle(),
    c.from('csv_prod').select('result, degradation').eq('project_id', id).maybeSingle(),
    c.from('finance').select('capex, opex, aug_tarif_achat, aug_tarif_vende').eq('project_id', id).maybeSingle(),
  ]);
  return {
    id,
    name: proj?.name ?? '',
    conso: conso?.consomation_annuel ?? null,
    prod: prod?.result ?? null,
    transportEng: conso?.transport_eng ? 1 : 0,
    typeTarif: conso?.type_tarif ? 1 : 0,
    degr: prod?.degradation ?? 0.5,
    tarifs: conso?.all_tarif ?? null,
    finance: fin ?? null,
  };
}

// Téléverse le fichier source dans le bucket privé, sous <uid>/<projet>/<nom>.
export async function uploadSourceFile(file, projectId, kind) {
  const c = getClient();
  const { data: { user } } = await c.auth.getUser();
  const path = `${user.id}/${projectId}/${kind}-${file.name}`;
  const { error } = await c.storage.from('uploads').upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}
