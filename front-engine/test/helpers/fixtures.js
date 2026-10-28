// Jeux de données communs aux tests de parité des contrôleurs.
export const tz = 3600; // Africa/Tunis = UTC+1 fixe
export const ts = (y, m, d, h = 0) => Date.UTC(y, m - 1, d, h) / 1000 - tz;

/** Courbe de consommation d'un an (heures 01:00 … 00:00), valeurs pseudo-variées. */
export function conso(startYear = 2019) {
  const rows = []; let t = ts(startYear, 1, 1, 1);
  const end = ts(startYear + 1, 1, 1, 0);
  for (let i = 0; t <= end; i++, t += 3600) rows.push([t, (i % 24 > 7 && i % 24 < 20 ? 5 + (i % 5) : 1 + (i % 3))]);
  return rows;
}
/** opts : { typeTarif: 0|1, transportEng: bool, sites: n } — n > 1 : site 0 = total, puis n sites distincts */
export const consoProject = (startYear, opts = {}) => {
  const c = conso(startYear);
  const n = opts.sites || 1;
  const all = [c];
  for (let k = 1; k < n; k++) all.push(c.map(([t, v], i) => [t, k === 1 ? v * 0.6 : v * 0.4]));
  if (n > 1) all[0] = c.map(([t, v], i) => [t, all.slice(1).reduce((a, s) => a + s[i][1], 0)]);
  return { project: { consomation: { consomation_annuel: all[0], allConsomation_annuel: all, transportEng: !!opts.transportEng, type_tarif: opts.typeTarif || 0 } } };
};

/** Corps « basic » de PVGIS : en-tête, lignes de données (W), pied de page. */
export function pvgisBody(scale = 1) {
  const lines = ['time,P,G(i),H_sun,T2m,WS10m,Int'];
  for (let i = 0; i < 8760; i++) {
    const h = i % 24;
    lines.push(`2015${String(1 + Math.floor(i / 744)).padStart(2, '0')}01:${String(h).padStart(2, '0')}10,${Math.max(0, Math.round(scale * 1000 * Math.sin(((h - 6) / 12) * Math.PI)))},0,0,0,0,0`);
  }
  lines.push('', 'P: PV system power (W)');
  return lines.join('\n');
}
export const ninjaBody = () => {
  const data = {}; const t0 = Date.UTC(2015, 0, 1);
  for (let i = 0; i < 8760; i++) data[String(t0 + i * 3600000)] = { electricity: Math.max(0, +(0.6 * Math.sin(((i % 24) - 6) / 12 * Math.PI)).toFixed(4)) };
  return JSON.stringify({ data, metadata: { source: 'test' } });
};
export const csvBody = () => {
  const lines = [];
  for (let i = 0; i < 13; i++) lines.push(`"en-tete ${i}"`);
  for (let i = 0; i < 8760; i++) lines.push(`"01/01/14 ${i};${(i % 24) * 0.5}"`);
  return lines.join('\n');
};

