// Parité du FinanceController : le VRAI contrôleur PHP + FinanceService + PhpSpreadsheet (IRR/NPV) vs le port JS.
// Chaque scénario enchaîne une production (pvgis/ninja/csv) puis le calcul financier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { havePhp, runPhp, runJs, assertClose } from './helpers/parity.js';
import { consoProject, pvgisBody, ninjaBody, csvBody } from './helpers/fixtures.js';

const skip = !havePhp && 'vendor PHP absent (composer install dans test/php)';
const pv = (over = {}) => ({ lat: '36.8', lon: '10.18', peakpower: '100', loss: '14', angle: '30', aspect: '0', trackingtype: '0', degradationp: '0.5', peakpower2: '0', peakpower3: '0', ...over });
const fin = (over = {}) => ({ capex: '300000', aug_tarif_a: '3', aug_tarif_v: '2', duree_proj: '25', opex: '1.5', subvention: '10', taux_actualisation: '6', replinv: '15000', ansubvention: '1', ...over });
const credit = { credit: 'on', dette: '200000', interet: '8', delai_grace: '2', maturite_proj: '10' };

async function compare(spec) {
  const php = runPhp('productionController.php', spec);
  const js = await runJs(spec, {});
  assert.equal(js.steps.length, php.steps.length);
  php.steps.forEach((p, i) => assertClose(js.steps[i], p, `étape ${i} (${spec.steps[i].call})`, 1e-9));
  const a = js.entities.finance; const b = php.finance;
  delete a.id; delete b.id;
  assertClose(a, b, 'finance', 1e-9);
  return { php, js };
}
const prodStep = { call: 'pvgis', path: '/pvgis/{id}', request: pv(), http: [pvgisBody()] };
const finStep = (over, extra = {}) => ({ call: 'finance', path: '/{id}/finance', request: fin(over), ...extra });

test('finance — tarif uniforme, sans crédit, pvgis', { skip }, () => compare({ ...consoProject(), steps: [prodStep, finStep()] }));
test('finance — tarif uniforme, avec crédit (délai de grâce + maturité)', { skip }, () => compare({ ...consoProject(), steps: [prodStep, finStep(credit)] }));
test('finance — tarif horaire (4 postes), avec crédit', { skip }, () => compare({ ...consoProject(2019, { typeTarif: 1 }), steps: [prodStep, finStep(credit)] }));
test('finance — tarif horaire, sans crédit, subvention en année 0', { skip }, () => compare({ ...consoProject(2019, { typeTarif: 1 }), steps: [prodStep, finStep({ ansubvention: '0' })] }));
test('finance — plusieurs sites, tarif uniforme', { skip }, () => compare({ ...consoProject(2019, { sites: 3 }), steps: [prodStep, finStep(credit)] }));
test('finance — plusieurs sites, tarif horaire', { skip }, () => compare({ ...consoProject(2019, { sites: 3, typeTarif: 1 }), steps: [prodStep, finStep()] }));
test('finance — transport énergie (tout injecté)', { skip }, () => compare({ ...consoProject(2019, { transportEng: true }), steps: [prodStep, finStep()] }));
test('finance — production ninja', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'ninja', path: '/ninja/{id}', request: { lat: '36.8', lon: '10.18', capacity: '100', loss: '14', tracking: '0', tilt: '30', azimuth: '0', degradationn: '0.7' }, http: [ninjaBody()] }, finStep(credit)] }));
test('finance — production csv', { skip }, () => compare({ ...consoProject(), steps: [{ call: 'readcsv', path: '/readcsv/{id}', request: { csvpuiss: '120', degradationc: '0.4' }, csv: csvBody() }, finStep()] }));
test('finance — pvgis 3 champs, durée 20 ans, remplacement onduleurs', { skip }, () => compare({ ...consoProject(), steps: [{ ...prodStep, request: pv({ peakpower: '300', peakpower2: '200', loss2: '10', angle2: '20', aspect2: '90', peakpower3: '100', loss3: '8', angle3: '10', aspect3: '-90' }), http: [pvgisBody(), pvgisBody(0.5), pvgisBody(0.25)] }, finStep({ duree_proj: '20', replinv: '40000', capex: '800000', ...credit })] }));
test('finance — projet non rentable (TRI introuvable => 0)', { skip }, () => compare({ ...consoProject(), steps: [prodStep, finStep({ capex: '50000000', opex: '5' })] }));
