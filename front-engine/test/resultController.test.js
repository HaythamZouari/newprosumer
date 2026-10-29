// Parité du ResultController (project_results) : VRAI contrôleur PHP (après production + finance) vs port JS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { havePhp, runPhp, runJs, assertClose } from './helpers/parity.js';
import { consoProject, pvgisBody, ninjaBody, csvBody } from './helpers/fixtures.js';

const skip = !havePhp && 'vendor PHP absent (composer install dans test/php)';
const pv = (over = {}) => ({ lat: '36.8', lon: '10.18', peakpower: '100', loss: '14', angle: '30', aspect: '0', trackingtype: '0', degradationp: '0.5', peakpower2: '0', peakpower3: '0', ...over });
const fin = (over = {}) => ({ capex: '20000', aug_tarif_a: '3', aug_tarif_v: '2', duree_proj: '25', opex: '1.5', subvention: '10', taux_actualisation: '6', replinv: '1500', ansubvention: '1', ...over });
const credit = { credit: 'on', dette: '12000', interet: '8', delai_grace: '2', maturite_proj: '10' };
const prodStep = { call: 'pvgis', path: '/pvgis/{id}', request: pv(), http: [pvgisBody()] };
const finStep = (over) => ({ call: 'finance', path: '/{id}/finance', request: fin(over) });
const resStep = { call: 'results', path: '/result/{id}/project_results' };

async function compare(spec) {
  const php = runPhp('productionController.php', spec);
  const js = await runJs(spec, {});
  const i = spec.steps.length - 1;
  assertClose(js.steps[i], php.steps[i], 'results', 1e-9);
  assert.ok(Object.keys(php.steps[i]).length > 40, 'réponse complète');
}

test('résultats — pvgis, tarif uniforme, sans crédit', { skip }, () => compare({ ...consoProject(), steps: [prodStep, finStep({}), resStep] }));
test('résultats — pvgis, tarif uniforme, avec crédit', { skip }, () => compare({ ...consoProject(), steps: [prodStep, finStep(credit), resStep] }));
test('résultats — tarif horaire', { skip }, () => compare({ ...consoProject(2019, { typeTarif: 1 }), steps: [prodStep, finStep(credit), resStep] }));
test('résultats — plusieurs sites, tarif uniforme', { skip }, () => compare({ ...consoProject(2019, { sites: 3 }), steps: [prodStep, finStep(credit), resStep] }));
test('résultats — plusieurs sites, tarif horaire', { skip }, () => compare({ ...consoProject(2019, { sites: 3, typeTarif: 1 }), steps: [prodStep, finStep({}), resStep] }));
test('résultats — transport énergie', { skip }, () => compare({ ...consoProject(2019, { transportEng: true }), steps: [prodStep, finStep({}), resStep] }));
test('résultats — ninja', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'ninja', path: '/ninja/{id}', request: { lat: '36.8', lon: '10.18', capacity: '100', loss: '14', tracking: '0', tilt: '30', azimuth: '0', degradationn: '0.7' }, http: [ninjaBody()] }, finStep(credit), resStep] }));
test('résultats — csv PVsyst', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'readcsv', path: '/readcsv/{id}', request: { csvpuiss: '120', degradationc: '0.4' }, csv: csvBody() }, finStep({}), resStep] }));
test('résultats — pvgis 3 champs', { skip }, () => compare({ ...consoProject(), steps: [{ ...prodStep, request: pv({ peakpower: '300', peakpower2: '200', loss2: '10', angle2: '20', aspect2: '90', peakpower3: '100', loss3: '8', angle3: '10', aspect3: '-90' }), http: [pvgisBody(), pvgisBody(0.5), pvgisBody(0.25)] }, finStep({ duree_proj: '20', replinv: '4000', capex: '50000' }), resStep] }));
