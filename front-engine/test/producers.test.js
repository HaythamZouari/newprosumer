// Tests hors-ligne des parsers de production (PVGIS « basic » et ninja JSON) et
// de la construction d'URL. Pas d'appel réseau : les fonctions pures sont
// validées sur des échantillons représentatifs des formats réels.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parsePvgisBasic, combineSeries, buildPvgisUrl } from '../src/producers/pvgis.js';
import { parseNinja, buildNinjaUrl } from '../src/producers/ninja.js';

// Extrait du format « basic » de PVGIS seriescalc : 2 lignes d'en-tête, des
// lignes « AAAAMMJJ:HHMM,P(W),... », puis un pied de page.
const PVGIS_SAMPLE = [
  'Latitude (decimal degrees):\t36.800',
  'Longitude (decimal degrees):\t10.200',
  '20200101:0010,0.0,0.0,0.0,8.2',
  '20200101:0110,0.0,0.0,0.0,7.9',
  '20200101:0210,1500.0,620.3,0.0,6.5',
  '20200101:0310,3000.0,900.0,0.0,6.1',
  '',
  'P: PV system power (W)',
].join('\n');

test('parsePvgisBasic : extrait la colonne P et convertit en kW', () => {
  const v = parsePvgisBasic(PVGIS_SAMPLE);
  assert.deepEqual(v, [0, 0, 1.5, 3.0]); // W/1000
});

test('parsePvgisBasic : ignore en-têtes et pied de page', () => {
  assert.equal(parsePvgisBasic('entete\nblabla\nP: ...').length, 0);
});

test('combineSeries : somme les sous-systèmes élément par élément', () => {
  assert.deepEqual(combineSeries([[1, 2, 3], [10, 20, 30], [100, 200, 300]]), [111, 222, 333]);
  assert.deepEqual(combineSeries([[1, 2, 3], []]), [1, 2, 3]); // ignore les vides
  assert.deepEqual(combineSeries([[1, 2, 3], [10, 20]]), [11, 22]); // tronque au plus court
});

test('buildPvgisUrl : endpoint v5_2 et paramètres attendus', () => {
  const url = buildPvgisUrl({ lat: 36.8, lon: 10.2, peakpower: 5, loss: 14, angle: 30, aspect: 0 });
  assert.ok(url.startsWith('https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?'));
  assert.match(url, /pvtechchoice=crystSi/);
  assert.match(url, /outputformat=basic/);
  assert.match(url, /peakpower=5/);
});

// Format ninja : data indexé par horodatage, chaque ligne { electricity: kW }.
const NINJA_SAMPLE = {
  data: {
    '2015-01-01 00:00': { electricity: 0.0 },
    '2015-01-01 01:00': { electricity: 0.0 },
    '2015-01-01 12:00': { electricity: 3.42 },
    '2015-01-01 13:00': { electricity: 2.98 },
  },
};

test('parseNinja : extrait la série electricity dans l\'ordre', () => {
  assert.deepEqual(parseNinja(NINJA_SAMPLE), [0, 0, 3.42, 2.98]);
});

test('parseNinja : data manquant -> série vide', () => {
  assert.deepEqual(parseNinja({}), []);
});

test('buildNinjaUrl : convertit loss en fraction et pose le format json', () => {
  const url = buildNinjaUrl({ lat: 36.8, lon: 10.2, capacity: 5, loss: 14, tilt: 30, azim: 180 });
  assert.match(url, /system_loss=0\.14/);
  assert.match(url, /format=json/);
  assert.match(url, /capacity=5/);
});
