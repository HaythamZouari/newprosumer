// Parité ProjectListner : JS (src/projectData.js) vs PHP d'origine piloté par
// stubs (test/php/projectData.php), sur plusieurs configurations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { computeProjectData } from '../src/projectData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHP = join(__dirname, 'php', 'projectData.php');

function php(spec) {
  return JSON.parse(execFileSync('php', [PHP], { input: JSON.stringify(spec), encoding: 'utf8' }));
}

// Comparaison récursive tolérante aux flottants.
function deepEq(a, b, path = '') {
  if (typeof a === 'number' || typeof b === 'number') {
    const x = Number(a), y = Number(b);
    assert.ok(Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)), `${path}: JS=${a} PHP=${b}`);
    return;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    assert.ok(Array.isArray(a) && Array.isArray(b), `${path}: type tableau`);
    assert.equal(a.length, b.length, `${path}: longueur`);
    for (let i = 0; i < a.length; i++) deepEq(a[i], b[i], `${path}[${i}]`);
    return;
  }
  if (a && b && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) deepEq(a[k], b[k], `${path}.${k}`);
    return;
  }
  assert.equal(a, b, path);
}

// Jeu de données : 72 h à partir du dimanche 14 juin 2015 (couvre w=0 et l'été).
function datasets() {
  const start = Date.UTC(2015, 5, 14, 0, 0) / 1000;
  const site1 = [], site2 = [], site0 = [], prod = [];
  for (let i = 0; i < 72; i++) {
    const ts = start + i * 3600;
    const v1 = i % 7;            // inclut des 0
    const v2 = (i * 3) % 5;      // inclut des 0
    site1.push([ts, v1]);
    site2.push([ts, v2]);
    site0.push([ts, v1 + v2]);   // site 0 = total agrégé
    prod.push([ts, (i * 2) % 11]);
  }
  return { site0, site1, site2, prod };
}

function run(spec) {
  const js = computeProjectData(spec);
  const ph = php(spec);
  // Mêmes clés de part et d'autre.
  deepEq(
    { inject: js.inject, autoConsomer: js.autoConsomer, cedee: js.cedee, importer: js.importer,
      consomationPH: js.consomationPH, productionPH: js.productionPH, autoConsomerPH: js.autoConsomerPH,
      importerPH: js.importerPH, cedeePH: js.cedeePH, injectPH: js.injectPH },
    ph, 'out');
}

test('multi-sites, transportEng=0, typeTarif=1', () => {
  const { site0, site1, site2, prod } = datasets();
  run({ consomation: [site0, site1, site2], production: prod, transportEng: 0, typeTarif: 1 });
});

test('multi-sites, transportEng=0, typeTarif=0', () => {
  const { site0, site1, site2, prod } = datasets();
  run({ consomation: [site0, site1, site2], production: prod, transportEng: 0, typeTarif: 0 });
});

test('multi-sites, transportEng=1 (tout injecté), typeTarif=0', () => {
  const { site0, site1, site2, prod } = datasets();
  run({ consomation: [site0, site1, site2], production: prod, transportEng: 1, typeTarif: 0 });
});

test('mono-site, transportEng=0, typeTarif=0 (cedeePH[0] via postHoraire)', () => {
  const { site0, prod } = datasets();
  run({ consomation: [site0], production: prod, transportEng: 0, typeTarif: 0 });
});

test('mono-site, transportEng=0, typeTarif=1', () => {
  const { site0, prod } = datasets();
  run({ consomation: [site0], production: prod, transportEng: 0, typeTarif: 1 });
});
