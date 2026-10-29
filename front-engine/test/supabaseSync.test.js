// Synchronisation Supabase (client REST + écriture différée + auth) contre un « Supabase » simulé en mémoire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Supabase } from '../app/supabase.js';
import { SyncBackend } from '../app/syncBackend.js';
import { SupabaseAuth } from '../app/supabaseAuth.js';
import { MemoryBackend, Repo } from '../app/db.js';

function fakeSupabase() {
  const db = { np_docs: [], profiles: [{ id: 'u1', username: 'alice', full_name: 'Alice Test', societe: 'S', roles: ['ROLE_USER'], enabled: true }] };
  const calls = [];
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const fetchImpl = async (url, opts = {}) => {
    const u = new URL(url); const m = opts.method || 'GET'; calls.push(`${m} ${u.pathname}${u.search}`);
    const body = typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body;
    if (u.pathname === '/rest/v1/rpc/email_for_username') return json(200, body.u === 'alice' ? 'alice@example.tn' : null);
    if (u.pathname === '/auth/v1/token') return body.password === 'secret123' ? json(200, { access_token: 'AT', refresh_token: 'RT', user: { id: 'u1' } }) : json(400, {});
    if (u.pathname === '/rest/v1/profiles') return json(200, db.profiles.filter((p) => u.searchParams.get('id') === `eq.${p.id}`));
    if (u.pathname === '/rest/v1/np_docs') {
      if (m === 'POST') { db.np_docs = db.np_docs.filter((r) => !(r.id === body.id && r.kind === body.kind)); db.np_docs.push(body); return json(201, {}); }
      if (m === 'DELETE') { const id = decodeURIComponent(u.searchParams.get('id').slice(3)); db.np_docs = db.np_docs.filter((r) => r.id !== id); return json(204, {}); }
      return json(200, db.np_docs);
    }
    if (u.pathname.startsWith('/storage/v1/object/uploads/')) { db.uploaded = u.pathname; return json(200, {}); }
    return json(404, {});
  };
  return { db, calls, fetchImpl };
}
const mkStore = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };

async function setup() {
  const fake = fakeSupabase();
  const sb = new Supabase({ url: 'https://x.supabase.co', key: 'anon', fetchImpl: fake.fetchImpl, store: mkStore() });
  const inner = new MemoryBackend(); const sync = new SyncBackend(inner, sb);
  const repo = new Repo(sync); await repo.boot();
  return { fake, sb, inner, sync, repo, auth: new SupabaseAuth({ repo, sb, sync, fetchImpl: fake.fetchImpl }) };
}

test('connexion par nom d\'utilisateur : e-mail retrouvé, profil actif, utilisateur local créé avec l\'uid Supabase', async () => {
  const { auth, repo } = await setup();
  const res = await auth.attempt('alice', 'secret123');
  assert.equal(res.user.id, 'u1'); assert.equal(res.user.getUsername(), 'alice'); assert.equal((await repo.findUser('u1')).getEmail(), 'alice@example.tn');
});
test('mauvais mot de passe / utilisateur inconnu : même message', async () => {
  const { auth } = await setup();
  assert.deepEqual(await auth.attempt('alice', 'nope'), { error: 'Invalid credentials.' });
  assert.deepEqual(await auth.attempt('bob', 'x'), { error: 'Invalid credentials.' });
});
test('compte non approuvé : refus « Account is disabled. » et session fermée', async () => {
  const { auth, fake, sb } = await setup();
  fake.db.profiles[0].enabled = false;
  assert.deepEqual(await auth.attempt('alice', 'secret123'), { error: 'Account is disabled.' });
  assert.equal(sb.uid, null);
});
test('un projet créé est répliqué (id texte), supprimé côté distant à la suppression', async () => {
  const { auth, sync, fake } = await setup();
  await auth.attempt('alice', 'secret123');
  const id = await sync.put('projects', { id: null, name: 'P', userId: 'u1' });
  assert.match(id, /^p[0-9a-z]{12}$/);
  await sync.flush();
  assert.equal(fake.db.np_docs.length, 1); assert.equal(fake.db.np_docs[0].value.name, 'P');
  await sync.put('projects', { id, name: 'P2', userId: 'u1' }); await sync.flush();
  assert.equal(fake.db.np_docs.length, 1); assert.equal(fake.db.np_docs[0].value.name, 'P2');
  await sync.delete('projects', id); await sync.flush();
  assert.equal(fake.db.np_docs.length, 0);
});
test('pull sur un nouvel appareil : les projets distants réapparaissent', async () => {
  const a = await setup(); await a.auth.attempt('alice', 'secret123');
  const id = await a.sync.put('projects', { id: null, name: 'Mon projet', userId: 'u1' }); await a.sync.flush();
  const b = await setup(); b.fake.db.np_docs = a.fake.db.np_docs;
  await b.auth.attempt('alice', 'secret123');
  assert.equal((await b.inner.get('projects', id)).name, 'Mon projet');
});
test('fichier importé : envoyé dans uploads/<uid>/…', async () => {
  const { auth, sync, fake } = await setup(); await auth.attempt('alice', 'secret123');
  await sync.put('kv', { name: 'a.xlsx', type: 'x', buf: new ArrayBuffer(4) }, 'file:courbe-1.xlsx'); await sync.flush();
  assert.equal(fake.db.uploaded, '/storage/v1/object/uploads/u1/courbe-1.xlsx');
});
test('hors ligne : l\'écriture locale réussit, l\'erreur distante est mémorisée sans casser l\'application', async () => {
  const { auth, sync, sb } = await setup(); await auth.attempt('alice', 'secret123');
  sb.fetch = async () => { throw new Error('réseau'); };
  const id = await sync.put('projects', { id: null, name: 'Hors ligne', userId: 'u1' }); await sync.flush();
  assert.equal((await sync.get('projects', id)).name, 'Hors ligne'); assert.equal(sync.errors.length, 1);
});
