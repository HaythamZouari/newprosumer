// Fonction serverless Vercel — proxy renewables.ninja.
// Garde le token API côté serveur (variable d'environnement NINJA_TOKEN) et
// contourne le CORS. Renvoie la série de puissances horaires (kW).
//
// Déploiement : placer dans /api à la racine du projet Vercel, et définir
// NINJA_TOKEN dans les variables d'environnement Vercel (ne JAMAIS committer
// le token — celui présent dans l'ancien ProductionController.php doit être
// révoqué/régénéré car il est exposé publiquement dans l'historique Git).
import { buildNinjaUrl, parseNinja } from '../src/producers/ninja.js';

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const token = process.env.NINJA_TOKEN;
  if (!token) return res.status(500).json({ error: 'NINJA_TOKEN non configuré' });

  const q = req.query || {};
  const url = buildNinjaUrl({
    lat: num(q.lat),
    lon: num(q.lon),
    capacity: num(q.capacity),
    loss: num(q.loss),
    tracking: num(q.tracking),
    tilt: num(q.tilt),
    azim: num(q.azimuth) + 180, // PHP : azimuth + 180
    dataset: q.dataset || 'sarah',
    date_from: q.date_from,
    date_to: q.date_to,
  });

  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return res.status(502).json({ error: `ninja ${r.status}` });
    const values = parseNinja(await r.json());
    return res.status(200).json({ source: 'ninja', count: values.length, values });
  } catch (e) {
    return res.status(502).json({ error: 'ninja injoignable', detail: String(e) });
  }
}
