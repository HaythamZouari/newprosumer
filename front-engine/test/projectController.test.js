// Parité du ProjectController : le VRAI contrôleur PHP (test/php/projectController.php) vs le port JS
// (app/controllers/project.js), sur la réponse JSON de chaque étape et l'état final des entités.
// Même graine pseudo-aléatoire des deux côtés (mt_srand / PhpMt) : les courbes « activité » sont donc comparables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { havePhp, runPhp, runJs, assertClose, sample } from './helpers/parity.js';
import { ACTIVITES } from '../app/controllers/project.js';

const skip = !havePhp && 'vendor PHP absent (composer install dans test/php)';
const months = (v) => Object.fromEntries([...Array(12)].map((_, i) => [i + 1, String(typeof v === 'function' ? v(i + 1) : v)]));
const postes = (jour = 4000, nuit = 3000, soir = 2000, ete = 1500) => ({ jour: months(jour), nuit: months(nuit), soir: months(soir), ete: months(ete) });

const base = (over = {}) => ({
  number: '0', activite: 'Electromecanique', saison: '1',
  monthSlider1: '1,12', hourSlider1: 'Minuit,23', monthSlider2: '1,12', hourSlider2: 'Minuit,23', monthSlider3: '1,12', hourSlider3: 'Minuit,23',
  hourSlider_samedi: 'Minuit,23', hourSlider_dimanche: 'Minuit,23',
  tarif: '0', dateDeb: '2019-01', date: months(100000), ...over,
});

async function compare(spec) {
  const php = runPhp('projectController.php', spec);
  const js = await runJs(spec);
  assert.equal(js.steps.length, php.steps.length);
  php.steps.forEach((p, i) => assertClose(js.steps[i], p, `étape ${i} (${spec.steps[i].call})`));
  for (const o of [js.consomation, php.consomation, js.project, php.project]) delete o.id; // clé primaire : attribuée par la base
  assertClose(js.consomation, php.consomation, 'consomation');
  assertClose(js.project, php.project, 'project');
  assertClose(js.session, php.session, 'session');
  return { php, js };
}
const sc = (steps, extra = {}) => ({ seed: 7, project: {}, session: {}, steps, ...extra });

// ---------- courbe synthétique (activité) ----------
test('show — synthétique de base (1 saison, tarif uniforme)', { skip }, () => compare(sc([{ call: 'show', request: base() }])));

test('show — 3 saisons, samedi/dimanche travaillés, congés, jours fériés chômés', { skip }, () => compare(sc([{ call: 'show', request: base({
  saison: '3', activite: 'Abattoir', monthSlider1: '1,4', hourSlider1: '8,17', monthSlider2: '5,8', hourSlider2: '6,19', monthSlider3: '9,12', hourSlider3: '9,16',
  samediCheck: 'on', hourSlider_samedi: '8,13', dimancheCheck: 'on', hourSlider_dimanche: '9,12',
  congeCheck: 'on', dateconge_deb: '2019-08-01', dateconge_fin: '2019-08-15', dateconge_deb1: '2019-12-24', dateconge_fin1: '2019-12-31', dateconge_deb2: '2019-03-04', dateconge_fin2: '2019-03-08',
}) }])));

test('show — 2 saisons, jours fériés travaillés (ferieCheck)', { skip }, () => compare(sc([{ call: 'show', request: base({
  saison: '2', activite: 'Hotellerie', monthSlider1: '1,6', hourSlider1: '7,22', monthSlider2: '7,12', hourSlider2: '10,18', ferieCheck: 'on',
}) }])));

test('show — tarif à 4 postes horaires (datehoraire)', { skip }, () => compare(sc([{ call: 'show', request: base({
  tarif: '1', activite: 'Textile', datehoraire: postes(), hourSlider1: '6,20',
}) }])));

test('show — régime horaire demandé sur tarif uniforme (vershoraire)', { skip }, () => compare(sc([{ call: 'show', request: base({ vershoraire: 'on', transport_energie: 'on' }) }])));

test('show — année bissextile (29 février supprimé)', { skip }, () => compare(sc([{ call: 'show', request: base({ dateDeb: '2020-01', activite: 'Laitiere' }) }])));

test('show — début de simulation en cours d\'année', { skip }, () => compare(sc([{ call: 'show', request: base({ dateDeb: '2019-07', activite: 'Datacenter' }) }])));

for (const act of Object.keys(ACTIVITES)) {
  test(`show — activité ${act}`, { skip }, () => compare(sc([{ call: 'show', request: base({ activite: act, hourSlider1: '8,18', samediCheck: 'on', hourSlider_samedi: '9,14' }) }])));
}

test('show — deux sites puis suppression du premier', { skip }, () => compare(sc([
  { call: 'show', request: base({ activite: 'Plastique' }) },
  { call: 'show', request: base({ number: '1', activite: 'Frigorifique', hourSlider1: '6,16', date: months(50000) }) },
  { call: 'suppsite', path: '/project/suppsite/{id}', request: { number: '0' } },
  { call: 'getdata', path: '/project/editpro/{id}', request: { number: '0' } },
])));

// ---------- courbe importée (3 formes de fichiers réels) ----------
for (const t of [1, 2, 3]) {
  const file = sample(t);
  const skipFile = skip || (!existsSync(file) && 'fichier exemple absent');
  test(`excelupload + show — fichier de type ${t} (tarif uniforme)`, { skip: skipFile }, () => compare(sc([
    { call: 'excelupload', path: '/project/excelupload/{id}', file, request: { number: '0', tarif: '0' } },
    { call: 'show', request: base({ dateDeb: t === 3 ? '2018-03' : '2018-09' }) },
  ])));
}
test('excelupload + show — fichier de type 2, 4 postes horaires', { skip: skip || (!existsSync(sample(2)) && 'fichier exemple absent') }, () => compare(sc([
  { call: 'excelupload', path: '/project/excelupload/{id}', file: sample(2), request: { number: '0', tarif: '1' } },
  { call: 'show', request: base({ tarif: '1', datehoraire: postes(8000, 6000, 4000, 3000), dateDeb: '2018-09' }) },
])));
test('excelupload puis suppression de la courbe (suppcc)', { skip: skip || (!existsSync(sample(2)) && 'fichier exemple absent') }, () => compare(sc([
  { call: 'excelupload', path: '/project/excelupload/{id}', file: sample(2), request: { number: '0' } },
  { call: 'suppcc', path: '/project/suppcc/{id}', request: { number: '0' } },
])));
test('getdata — projet vierge (valeurs par défaut de l\'original)', { skip }, () => compare(sc([{ call: 'getdata', path: '/project/editpro/{id}', request: { number: '0' } }])));
