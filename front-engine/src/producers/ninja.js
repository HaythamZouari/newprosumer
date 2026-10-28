// Récupération de la production solaire via renewables.ninja.
// Logique PURE (pas de réseau) : construction d'URL et parsing du JSON.
// Le handler serverless (api/ninja.js) fait le fetch avec le token (secret
// serveur, jamais exposé au navigateur).
//
// L'API renvoie { data: { "<horodatage>": { electricity: <kW> }, ... } } ;
// le PHP prenait la 1re valeur de chaque ligne (electricity).

const NINJA_BASE = 'https://www.renewables.ninja/api/data/pv';

/**
 * Construit l'URL de l'API ninja.
 * @param {object} p { lat, lon, date_from, date_to, dataset, capacity, loss,
 *                      tracking, tilt, azim }
 */
export function buildNinjaUrl(p) {
  const q = new URLSearchParams({
    lat: p.lat,
    lon: p.lon,
    date_from: p.date_from ?? '2015-01-01',
    date_to: p.date_to ?? '2015-12-31',
    dataset: p.dataset ?? 'sarah',
    capacity: p.capacity,
    system_loss: (p.loss ?? 0) / 100, // PHP : loss/100
    tracking: p.tracking ?? 0,
    tilt: p.tilt ?? 0,
    azim: p.azim ?? 180,
    format: 'json',
  });
  return `${NINJA_BASE}?${q.toString()}`;
}

/**
 * Parse la réponse JSON ninja en série de puissances horaires (kW).
 * @param {object} json objet décodé { data: {...} }
 * @returns {number[]}
 */
export function parseNinja(json) {
  const data = (json && json.data) || {};
  const out = [];
  for (const key of Object.keys(data)) {
    const row = data[key];
    const v = Array.isArray(row) ? row[0] : Object.values(row)[0];
    out.push(Number(v));
  }
  return out;
}
