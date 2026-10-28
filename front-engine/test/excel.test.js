// Vérifications structurelles du parser Excel sur les 3 fichiers réels fournis.
// (Validation sans PhpSpreadsheet : nombre de points, plage de dates, pas horaire,
// et quelques valeurs recalculées à la main depuis les cellules brutes.)
//
// Les fichiers sont des données de comptage réelles, non versionnées
// (dossier .samples/). Les tests sont ignorés proprement s'ils sont absents.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { parseWorkbook } from '../src/excelReader.js';
import { parts } from '../src/tz.js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const __dirname = dirname(fileURLToPath(import.meta.url));
const S = (t) => join(__dirname, '..', '..', '.samples', t);

function load(path) {
  return XLSX.readFile(path, { raw: true });
}

// Statistiques utiles sur une série [ts, val].
function stats(serie) {
  const ds = serie.map(([ts]) => ts);
  const diffs = [];
  for (let i = 1; i < ds.length; i++) diffs.push(ds[i] - ds[i - 1]);
  const horaires = diffs.filter((d) => d === 3600).length;
  return {
    n: serie.length,
    first: parts(ds[0]),
    last: parts(ds[ds.length - 1]),
    partHoraire: horaires / diffs.length, // part des écarts == 1 h
    minV: Math.min(...serie.map(([, v]) => v)),
    maxV: Math.max(...serie.map(([, v]) => v)),
  };
}

test('Type 1 (1 feuille) : série horaire sur ~126 jours, relevés xx:10', { skip: !existsSync(S('type1/Type_1.xlsx')) }, () => {
  const serie = parseWorkbook(XLSX, load(S('type1/Type_1.xlsx')));
  const st = stats(serie);
  assert.ok(st.n > 2800 && st.n < 3100, `points: ${st.n}`); // ~125 j * 24 h
  // La date-série Excel 43356 = 2018-09-13 (comme la conversion PHP).
  assert.deepEqual([st.first.y, st.first.m, st.first.d], [2018, 9, 13]);
  assert.equal(st.last.y, 2019); // court jusqu'à 2019-01-16
  assert.equal(st.first.i, 10, 'relevé à la minute :10');
  assert.ok(st.partHoraire > 0.9, `pas horaire dominant: ${st.partHoraire}`);
  assert.ok(st.minV >= 340 && st.maxV <= 1297, `valeurs ${st.minV}..${st.maxV}`);
});

test('Type 2 (2 feuilles) : série horaire sur ~155 jours, relevés xx:10', { skip: !existsSync(S('type2/Type_2.xlsx')) }, () => {
  const serie = parseWorkbook(XLSX, load(S('type2/Type_2.xlsx')));
  const st = stats(serie);
  assert.ok(st.n > 3600 && st.n < 3800, `points: ${st.n}`); // ~155 j * 24 h
  assert.deepEqual([st.first.y, st.first.m, st.first.d, st.first.H, st.first.i], [2018, 8, 9, 0, 10]);
  assert.ok(st.partHoraire > 0.9, `pas horaire dominant: ${st.partHoraire}`);
});

test('Type 3 (>2 feuilles) : 61 jours * 24 h, relevés xx:10', { skip: !existsSync(S('type3/Type_3.xlsx')) }, () => {
  const serie = parseWorkbook(XLSX, load(S('type3/Type_3.xlsx')));
  const st = stats(serie);
  // 61 feuilles-jour ; quelques heures manquantes (trous de comptage réels).
  assert.ok(st.n > 1400 && st.n <= 61 * 24, `points: ${st.n}`);
  assert.deepEqual([st.first.y, st.first.m, st.first.d, st.first.H, st.first.i], [2018, 3, 1, 0, 10]);
  assert.ok(st.partHoraire > 0.95, `pas horaire: ${st.partHoraire}`);
});

test('Type 3 : 1er point recalculé à la main depuis la 2e feuille', { skip: !existsSync(S('type3/Type_3.xlsx')) }, () => {
  const wb = load(S('type3/Type_3.xlsx'));
  const serie = parseWorkbook(XLSX, wb);
  // 2e feuille = "jeudi 1 mars 2018" ; 1er relevé retenu = slot round(frac*144)%6==1
  // soit frac=0.006944 (00:10). Valeur = col1 de cette ligne.
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], { header: 1, raw: true });
  const ligne0010 = rows.find((r) => typeof r[0] === 'number' && Math.round(r[0] * 144) % 6 === 1);
  assert.equal(serie[0][1], Number(ligne0010[1]), 'puissance du 1er point');
});
