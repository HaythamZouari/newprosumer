// Récupération de la production solaire via PVGIS (JRC, Commission européenne).
// Logique PURE (pas de réseau) : construction d'URL et parsing du format « basic »
// de seriescalc. Le handler serverless (api/pvgis.js) s'occupe du fetch.
//
// NOTE : le code PHP d'origine appelait http://re.jrc.ec.europa.eu/pvgis5/
// seriescalc.php, endpoint aujourd'hui HORS SERVICE. On vise l'API actuelle
// v5_2 (https). Le format « basic » reste : des lignes « AAAAMMJJ:HHMM,P,... »
// où P est la puissance PV en watts ; on la convertit en kW (/1000), comme le PHP.

// Endpoint par défaut (v5_2). Surchargeable au déploiement via la variable
// d'environnement PVGIS_BASE (ex. .../api/v5_3/seriescalc) sans changer le code.
export const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc';

/**
 * Construit l'URL seriescalc pour un sous-système.
 * @param {object} p { lat, lon, peakpower, loss, angle, aspect, trackingtype,
 *                      startyear, endyear, raddatabase }
 * @param {string} [base] endpoint seriescalc (défaut PVGIS_BASE)
 */
export function buildPvgisUrl(p, base = PVGIS_BASE) {
  const q = new URLSearchParams({
    lat: p.lat,
    lon: p.lon,
    peakpower: p.peakpower,
    pvtechchoice: 'crystSi',
    loss: p.loss ?? 14,
    angle: p.angle ?? 0,
    aspect: p.aspect ?? 0,
    trackingtype: p.trackingtype ?? 0,
    outputformat: 'basic',
    startyear: p.startyear ?? 2020,
    endyear: p.endyear ?? 2020,
    pvcalculation: 1,
  });
  if (p.raddatabase) q.set('raddatabase', p.raddatabase);
  return `${base}?${q.toString()}`;
}

// Détecte une ligne de données « AAAAMMJJ:HHMM ».
const DATA_ROW = /^\d{8}:\d{3,4}$/;

/**
 * Parse la sortie « basic » de PVGIS en série de puissances horaires (kW).
 * Ignore les lignes d'en-tête et de pied ; prend la colonne P (index 1), /1000.
 * @param {string} text corps de la réponse PVGIS
 * @returns {number[]} puissances horaires en kW
 */
export function parsePvgisBasic(text) {
  const out = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cols = line.split(',');
    if (!DATA_ROW.test(cols[0])) continue; // saute en-têtes/pied de page
    const p = Number(cols[1]);
    if (!Number.isFinite(p)) continue;
    out.push(p / 1000);
  }
  return out;
}

/**
 * Somme élément par élément plusieurs séries de sous-systèmes (champs PV
 * multiples : peakpower + peakpower2 + peakpower3), comme le PHP.
 * @param {number[][]} series
 * @returns {number[]}
 */
export function combineSeries(series) {
  const valid = series.filter((s) => s && s.length);
  if (!valid.length) return [];
  const n = Math.min(...valid.map((s) => s.length));
  const out = new Array(n).fill(0);
  for (const s of valid) for (let i = 0; i < n; i++) out[i] += s[i];
  return out;
}

/**
 * Lignes de la réponse « basic » à partir de la ligne d'en-tête (« time,P,… »), telles que le
 * ProductionController d'origine les voyait avec explode(PHP_EOL) : ligne 0 = en-tête, 1.. = données,
 * puis pied de page. L'API actuelle (v5_2) fait précéder l'en-tête de lignes de métadonnées : on les écarte
 * pour que les indices (premier index lu = 2) restent ceux du contrôleur d'origine.
 */
export function parsePvgisLines(text) {
  const lines = String(text).split('\n').map((l) => l.replace(/\r$/, ''));
  const h = lines.findIndex((l) => /^time,/i.test(l));
  return h < 0 ? lines : lines.slice(h);
}
