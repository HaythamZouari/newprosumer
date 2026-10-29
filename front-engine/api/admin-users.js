// Fonction serverless Vercel — administration des comptes (équivalent de l'écran User d'EasyAdmin).
// L'appelant s'authentifie avec son jeton Supabase ; il doit avoir ROLE_ADMIN dans `profiles.roles` (vérifié ICI, côté
// serveur, avec la clé service — jamais déduit du navigateur).
//   GET                      -> liste des profils
//   PATCH  ?id=<uuid>  {…}   -> modifie username/full_name/societe/enabled/roles/abon1/abon2
//   DELETE ?id=<uuid>        -> supprime le compte (cascade sur le profil et les documents)
const FIELDS = ['username', 'full_name', 'societe', 'enabled', 'roles', 'abon1', 'abon2'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const base = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return res.status(500).json({ error: 'Supabase non configuré' });
  const svc = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' };

  const bearer = String(req.headers.authorization || '').replace(/^Bearer /i, '');
  if (!bearer) return res.status(401).json({ error: 'authentification requise' });
  const who = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${bearer}` } });
  if (!who.ok) return res.status(401).json({ error: 'jeton invalide' });
  const { id: callerId } = await who.json();
  const me = await (await fetch(`${base}/rest/v1/profiles?id=eq.${callerId}&select=roles,enabled`, { headers: svc })).json();
  if (!me[0] || !me[0].enabled || !(me[0].roles || []).includes('ROLE_ADMIN')) return res.status(403).json({ error: 'ROLE_ADMIN requis' });

  const id = req.query && req.query.id;
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'id invalide' });
  try {
    if (req.method === 'GET') {
      const r = await fetch(`${base}/rest/v1/profiles?select=id,username,full_name,societe,enabled,roles,abon1,abon2,created_at&order=created_at.desc`, { headers: svc });
      return res.status(r.status).json(await r.json());
    }
    if (!id) return res.status(400).json({ error: 'id requis' });
    if (req.method === 'PATCH') {
      const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => FIELDS.includes(k)));
      const r = await fetch(`${base}/rest/v1/profiles?id=eq.${id}`, { method: 'PATCH', headers: { ...svc, prefer: 'return=minimal' }, body: JSON.stringify(patch) });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }
    if (req.method === 'DELETE') {
      if (id === callerId) return res.status(400).json({ error: 'impossible de supprimer son propre compte' });
      const r = await fetch(`${base}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: svc });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }
    return res.status(405).json({ error: 'méthode non permise' });
  } catch (e) {
    return res.status(502).json({ error: 'Supabase injoignable', detail: String(e) });
  }
}
