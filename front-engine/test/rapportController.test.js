// Parité du RapportController : variables passées à rapport/index.html.twig, VRAI PHP vs port JS.
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
const repStep = { call: 'rapport', path: '/rapport/{id}', method: 'GET' };

async function compare(spec) {
  const php = runPhp('productionController.php', spec);
  const js = await runJs(spec, {});
  const i = spec.steps.length - 1;
  assert.equal(js.steps[i].render, 'rapport/index.html.twig');
  assert.equal(php.steps[i].render, 'rapport/index.html.twig');
  assertClose(js.steps[i].params, php.steps[i].params, 'rapport', 1e-9);
  assert.ok(Object.keys(php.steps[i].params).length >= 30);
  // le rapport ne doit pas modifier les entités (PHP : copies par valeur)
  assertClose(js.project.consomationPH, php.project.consomationPH, 'consomationPH');
}

test('rapport — pvgis, tarif uniforme', { skip }, () => compare({ ...consoProject(), steps: [prodStep, finStep({}), repStep] }));
test('rapport — pvgis, tarif horaire avec crédit', { skip }, () => compare({ ...consoProject(2019, { typeTarif: 1 }), steps: [prodStep, finStep(credit), repStep] }));
test('rapport — plusieurs sites', { skip }, () => compare({ ...consoProject(2019, { sites: 3 }), steps: [prodStep, finStep(credit), repStep] }));
test('rapport — ninja', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'ninja', path: '/ninja/{id}', request: { lat: '36.8', lon: '10.18', capacity: '100', loss: '14', tracking: '0', tilt: '30', azimuth: '0', degradationn: '0.7' }, http: [ninjaBody()] }, finStep(credit), repStep] }));
test('rapport — csv PVsyst', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'readcsv', path: '/readcsv/{id}', request: { csvpuiss: '120', degradationc: '0.4' }, csv: csvBody() }, finStep({}), repStep] }));
test('rapport — pvgis 3 champs', { skip }, () => compare({ ...consoProject(), steps: [{ ...prodStep, request: pv({ peakpower: '300', peakpower2: '200', loss2: '10', angle2: '20', aspect2: '90', peakpower3: '100', loss3: '8', angle3: '10', aspect3: '-90' }), http: [pvgisBody(), pvgisBody(0.5), pvgisBody(0.25)] }, finStep({ capex: '50000' }), repStep] }));
