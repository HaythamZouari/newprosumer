// Parité FinanceService : JS (src/financeService.js) vs PHP d'origine piloté par
// stubs (test/php/finance.php), sur un jeu de paramètres réaliste.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import * as F from '../src/financeService.js';
import { postHoraire } from '../src/postHoraire.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHP = join(__dirname, 'php', 'finance.php');

function php(spec) {
  return JSON.parse(execFileSync('php', [PHP], { input: JSON.stringify(spec), encoding: 'utf8' }));
}

// Égalité flottante relative (les formules enchaînent des pow()).
function eq(a, b, ctx = '') {
  assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)), `${ctx}: JS=${a} PHP=${b}`);
}
function eqArr(a, b, ctx) {
  assert.equal(a.length, b.length, `${ctx} longueur`);
  for (let i = 0; i < a.length; i++) eq(a[i], b[i], `${ctx}[${i}]`);
}

// --- Jeu de données commun -------------------------------------------------
const finance = {
  capex: 1_000_000, opex: 2, tauxActualisation: 5, tauxInteret: 6,
  montantDette: 700_000, maturiteProj: 12, delaiGrace: 2,
  augTarifAchat: 3, augTarifVende: 2.5, tarifTransport: 0.015,
};
const degradation = 0.5;

const autoConsomme = [];
const prod = [];
let ts = Date.UTC(2015, 0, 1) / 1000;
for (let i = 0; i < 8760; i++) {
  autoConsomme.push([ts, ((i * 37) % 100) / 10]); // 0..9.9
  prod.push([ts, ((i * 53) % 120) / 10]);          // 0..11.9
  ts += 3600;
}
const cedePH = [];
for (let i = 0; i < 13; i++) {
  cedePH.push(i === 0 ? { jour: 0, ete: 0, soir: 0, nuit: 0 }
    : { jour: 10 * i, ete: 5 * i, soir: 7 * i, nuit: 3 * i });
}
const arr30 = (f) => Array.from({ length: 30 }, (_, i) => f(i));
const gainCedee = arr30((i) => 1000 + 50 * i);
const annuite = arr30((i) => (i >= 1 && i <= 14 ? 42000 + 100 * i : 0));
const cfads = arr30((i) => 80000 + 500 * i);

const tarifUnif = 0.2;
const tarifHoraire = { achat: [0.25, 0.30, 0.18, 0.12] };
const tarifCedee = { vende: [0.10, 0.12, 0.08, 0.06] };

// --- Tests -----------------------------------------------------------------
test('gainEnergieTransporterUnif', () => {
  eqArr(F.gainEnergieTransporterUnif(tarifUnif, degradation, autoConsomme, finance),
    php({ method: 'unif', finance, degradation, tarif: tarifUnif, autoConsomme }), 'unif');
});

test('gainEnergieTransporterHoraire (bug PHP reproduit)', () => {
  eqArr(F.gainEnergieTransporterHoraire(tarifHoraire, degradation, autoConsomme, finance, postHoraire),
    php({ method: 'horaire', finance, degradation, tarif: tarifHoraire, autoConsomme }), 'horaire');
});

test('gainEnergieCedee', () => {
  eqArr(F.gainEnergieCedee(tarifCedee, degradation, cedePH, finance),
    php({ method: 'cedee', finance, degradation, tarif: tarifCedee, cedePH }), 'cedee');
});

test('fraisExploitation', () => {
  eqArr(F.fraisExploitation(finance), php({ method: 'fraisExp', finance }), 'fraisExp');
});

test('anuite', () => {
  eqArr(F.anuite(12, 2, finance), php({ method: 'anuite', finance, maturite: 12, delee: 2 }), 'anuite');
});

test('factureRegularisation', () => {
  eqArr(F.factureRegularisation(gainCedee, prod, cedePH),
    php({ method: 'factureReg', finance, degradation, prod, cedePH, gainCedee }), 'factureReg');
});

test('facteurTransport', () => {
  eqArr(F.facteurTransport(degradation, autoConsomme, finance),
    php({ method: 'facteurTransport', finance, degradation, autoConsomme }), 'facteurTransport');
});

test('opex (replinv en année 15)', () => {
  eqArr(F.opex(finance, 50000), php({ method: 'opex', finance, replinv: 50000 }), 'opex');
});

test('llcr', () => {
  eqArr(F.llcr(finance, annuite, cfads),
    php({ method: 'llcr', finance, annuite, cfads }), 'llcr');
});

test('cashflowInt', () => {
  eq(F.cashflowInt(finance), php({ method: 'cashflowInt', finance }), 'cashflowInt');
});

test('depenses / depenses2', () => {
  const fraisExp = arr30((i) => 1000 + i);
  const fReg = arr30((i) => 200 + i);
  const fTransport = arr30((i) => 50 + i);
  eqArr(F.depenses(fraisExp, annuite, fReg, fTransport),
    php({ method: 'depenses', fraisExp, annuite, fReg, fTransport }), 'depenses');
  eqArr(F.depenses2(fraisExp, annuite, fReg),
    php({ method: 'depenses2', fraisExp, annuite, fReg }), 'depenses2');
});
