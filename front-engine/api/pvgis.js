// Fonction serverless Vercel — proxy PVGIS.
// Contourne le CORS (le navigateur ne peut pas appeler PVGIS directement) et
// additionne jusqu'à 3 sous-systèmes PV. Ne renvoie que la série de puissances
// horaires (kW) ; l'alignement sur la consommation (Datesorting) et le reste du
// calcul se font côté client avec front-engine.
//
// Déploiement : placer ce fichier dans /api à la racine du projet Vercel.
import { buildPvgisUrl, parsePvgisBasic, parsePvgisLines, combineSeries } from '../src/producers/pvgis.js';

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const q = req.query || {};
  // Mode « un champ » (utilisé par le contrôleur porté) : renvoie les lignes brutes de la réponse, à partir de l'en-tête
  if (q.raw) {
    try {
      const r = await fetch(buildPvgisUrl({ lat: num(q.lat), lon: num(q.lon), peakpower: num(q.peakpower), loss: num(q.loss, 14), angle: num(q.angle), aspect: num(q.aspect) }, process.env.PVGIS_BASE || undefined));
      if (!r.ok) return res.status(502).json({ error: `PVGIS ${r.status}` });
      return res.status(200).json({ lines: parsePvgisLines(await r.text()) });
    } catch (e) {
      return res.status(502).json({ error: 'PVGIS injoignable', detail: String(e) });
    }
  }
  // Jusqu'à 3 champs PV : (peakpower, angle, aspect, loss[, trackingtype]) indexés.
  const commun = { lat: num(q.lat), lon: num(q.lon), trackingtype: num(q.trackingtype), raddatabase: q.raddatabase };
  const champs = [];
  for (const sfx of ['', '2', '3']) {
    const pk = num(q[`peakpower${sfx}`]);
    if (pk > 0) {
      champs.push({
        ...commun,
        peakpower: pk,
        loss: num(q[`loss${sfx}`] || q.loss, 14),
        angle: num(q[`angle${sfx}`] || q.angle),
        aspect: num(q[`aspect${sfx}`] || q.aspect),
        trackingtype: num(q[`trackingtype${sfx}`] || q.trackingtype),
      });
    }
  }
  if (!champs.length) return res.status(400).json({ error: 'peakpower requis' });

  try {
    const series = [];
    for (const p of champs) {
      const r = await fetch(buildPvgisUrl(p, process.env.PVGIS_BASE || undefined));
      if (!r.ok) return res.status(502).json({ error: `PVGIS ${r.status}` });
      series.push(parsePvgisBasic(await r.text()));
    }
    const values = combineSeries(series);
    return res.status(200).json({ source: 'pvgis', count: values.length, values });
  } catch (e) {
    return res.status(502).json({ error: 'PVGIS injoignable', detail: String(e) });
  }
}
