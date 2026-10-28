// Parité du ProductionController : le VRAI contrôleur PHP + le VRAI ProjectListner (HttpClient doublé qui rejoue
// des réponses enregistrées) vs le port JS (app/controllers/production.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { havePhp, runPhp, runJs, assertClose } from './helpers/parity.js';

const skip = !havePhp && 'vendor PHP absent (composer install dans test/php)';
const tz = 3600; // Africa/Tunis = UTC+1 fixe
const ts = (y, m, d, h = 0) => Date.UTC(y, m - 1, d, h) / 1000 - tz;

/** Courbe de consommation d'un an (heures 01:00 … 00:00), valeurs pseudo-variées. */
function conso(startYear = 2019) {
  const rows = []; let t = ts(startYear, 1, 1, 1);
  const end = ts(startYear + 1, 1, 1, 0);
  for (let i = 0; t <= end; i++, t += 3600) rows.push([t, (i % 24 > 7 && i % 24 < 20 ? 5 + (i % 5) : 1 + (i % 3))]);
  return rows;
}
const consoProject = (startYear) => {
  const c = conso(startYear);
  return { project: { consomation: { consomation_annuel: c, allConsomation_annuel: [c], transportEng: false, type_tarif: 0 } } };
};

/** Corps « basic » de PVGIS : en-tête, lignes de données (W), pied de page. */
function pvgisBody(scale = 1) {
  const lines = ['time,P,G(i),H_sun,T2m,WS10m,Int'];
  for (let i = 0; i < 8760; i++) {
    const h = i % 24;
    lines.push(`2015${String(1 + Math.floor(i / 744)).padStart(2, '0')}01:${String(h).padStart(2, '0')}10,${Math.max(0, Math.round(scale * 1000 * Math.sin(((h - 6) / 12) * Math.PI)))},0,0,0,0,0`);
  }
  lines.push('', 'P: PV system power (W)');
  return lines.join('\n');
}
const ninjaBody = () => {
  const data = {}; const t0 = Date.UTC(2015, 0, 1);
  for (let i = 0; i < 8760; i++) data[String(t0 + i * 3600000)] = { electricity: Math.max(0, +(0.6 * Math.sin(((i % 24) - 6) / 12 * Math.PI)).toFixed(4)) };
  return JSON.stringify({ data, metadata: { source: 'test' } });
};
const csvBody = () => {
  const lines = [];
  for (let i = 0; i < 13; i++) lines.push(`"en-tete ${i}"`);
  for (let i = 0; i < 8760; i++) lines.push(`"01/01/14 ${i};${(i % 24) * 0.5}"`);
  return lines.join('\n');
};

async function compare(spec) {
  const php = runPhp('productionController.php', spec);
  const js = await runJs(spec, {});
  assert.equal(js.steps.length, php.steps.length);
  php.steps.forEach((p, i) => assertClose(js.steps[i], p, `étape ${i} (${spec.steps[i].call})`));
  for (const k of ['pvgis', 'ninja', 'csvProd']) {
    const a = js.entities[k]; const b = php[k];
    if (b === null) { assert.equal(a, null, `${k} devrait être null`); continue; }
    delete a.id; delete b.id;
    assertClose(a, b, k);
  }
  for (const k of ['inject', 'autoConsomer', 'cedee', 'importe', 'consomationPH', 'productionPH', 'auto_consomerPH', 'importerPH', 'cedeePH', 'injectPH']) {
    if (k in php.project) assertClose(js.project[k], php.project[k], `project.${k}`);
  }
}
const pv = (over = {}) => ({ lat: '36.8', lon: '10.18', peakpower: '100', loss: '14', angle: '30', aspect: '0', trackingtype: '0', raddadtabase: '', degradationp: '0.5', peakpower2: '0', peakpower3: '0', ...over });

test('pvgis — un champ PV', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'pvgis', path: '/pvgis/{id}', request: pv(), http: [pvgisBody()] }] }));
test('pvgis — deux champs PV', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'pvgis', path: '/pvgis/{id}', request: pv({ peakpower2: '50', loss2: '10', angle2: '20', aspect2: '90' }), http: [pvgisBody(), pvgisBody(0.5)] }] }));
test('pvgis — trois champs PV', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'pvgis', path: '/pvgis/{id}', request: pv({ peakpower2: '50', loss2: '10', angle2: '20', aspect2: '90', peakpower3: '25', loss3: '8', angle3: '10', aspect3: '-90' }), http: [pvgisBody(), pvgisBody(0.5), pvgisBody(0.25)] }] }));
test('pvgis — consommation démarrant en milieu d\'année', { skip }, () => compare({ ...consoProject(2018), steps: [{ call: 'pvgis', path: '/pvgis/{id}', request: pv(), http: [pvgisBody()] }] }));
test('ninja', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'ninja', path: '/ninja/{id}', request: { lat: '36.8', lon: '10.18', capacity: '100', loss: '14', tracking: '0', tilt: '30', azimuth: '0', degradationn: '0.5' }, http: [ninjaBody()] }] }));
test('readcsv — PVsyst', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'readcsv', path: '/readcsv/{id}', request: { csvpuiss: '120', degradationc: '0.4' }, csv: csvBody() }] }));
test('chaîne pvgis puis ninja puis readcsv (remises à zéro croisées)', { skip }, () => compare({ ...consoProject(), steps: [
  { call: 'pvgis', path: '/pvgis/{id}', request: pv(), http: [pvgisBody()] },
  { call: 'ninja', path: '/ninja/{id}', request: { lat: '36.8', lon: '10.18', capacity: '100', loss: '14', tracking: '0', tilt: '30', azimuth: '0', degradationn: '0.5' }, http: [ninjaBody()] },
  { call: 'readcsv', path: '/readcsv/{id}', request: { csvpuiss: '120', degradationc: '0.4' }, csv: csvBody() },
] }));
