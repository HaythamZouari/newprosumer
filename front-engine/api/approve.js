// Fonction serverless Vercel — approbation d'un compte (lien /confirm/{token} reçu par l'administrateur).
// Utilise la clé « service role » (SECRET, uniquement côté serveur : variable SUPABASE_SERVICE_KEY).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST requis' });
  const base = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) return res.status(500).json({ error: 'Supabase non configuré' });
  const token = req.body && req.body.token;
  if (typeof token !== 'string' || !/^[A-Za-z0-9]{20,64}$/.test(token)) return res.status(400).json({ error: 'jeton invalide' });
  try {
    const r = await fetch(`${base}/rest/v1/profiles?confirmation_token=eq.${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', prefer: 'return=representation' },
      body: JSON.stringify({ enabled: true, confirmation_token: null }),
    });
    if (!r.ok) return res.status(502).json({ error: `Supabase ${r.status}` });
    const rows = await r.json();
    if (!rows.length) return res.status(404).json({ error: 'jeton inconnu ou déjà utilisé' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: 'Supabase injoignable', detail: String(e) });
  }
}
