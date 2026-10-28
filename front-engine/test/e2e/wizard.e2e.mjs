// E2E : parcours complet de l'application d'origine (Twig/JS d'origine exécutés dans le navigateur) :
// inscription -> connexion -> projet -> consommation (activité PUIS fichiers réels Type 1/2/3) -> production PVGIS
// -> finance -> résultats -> rapport. API externes simulées (le sandbox n'a pas de réseau).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { startServer, launch } from './harness.mjs';
import { pvgisBody } from '../helpers/fixtures.js';

const sample = (t) => new URL(`../../../.samples/type${t}/Type_${t}.xlsx`, import.meta.url).pathname;
const MAPBOX_STUB = `window.mapboxgl={accessToken:'',Map:function(){this.resize=function(){};this.addControl=function(){}},
 Marker:function(){this.setLngLat=function(){return this};this.addTo=function(){return this};this.on=function(){};this.getLngLat=function(){return {lng:10,lat:36}}}};
 window.MapboxGeocoder=function(){};`;

async function session() {
  const { url, server } = await startServer({ spaFallback: true });
  const { browser } = await launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(15000); page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.route('**/api/mail', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.route(/mapbox-gl\.js|mapbox-gl-geocoder/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: MAPBOX_STUB }));
  await page.route('**/api/pvgis**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lines: pvgisBody().split('\n') }) }));
  return { url, server, browser, page, errors };
}

/** Le « serveur » démarre dans le navigateur (document.write) : on laisse la page se stabiliser avant de remplir. */
const settle = async (page, sel) => { await page.waitForSelector(sel); await page.waitForLoadState('load'); await page.waitForTimeout(900); };

async function loginNewProject({ url, page }) {
  await page.goto(url + '/register'); await settle(page, '#user_username');
  await page.fill('#user_username', 'alice'); await page.fill('#user_email', 'alice@example.tn');
  await page.fill('#user_plainPassword_first', 'secret123'); await page.fill('#user_plainPassword_second', 'secret123');
  await page.fill('#user_fullName', 'Alice Test'); await page.fill('#user_societe', 'Societe');
  await page.click('#user_Register'); await settle(page, '#username');
  await page.fill('#username', 'alice'); await page.fill('#password', 'secret123'); await page.click('#Login');
  await page.waitForURL('**/project/');
  await page.goto(url + '/project/new'); await settle(page, '#project_name');
  await page.fill('#project_name', 'Projet'); await page.fill('#project_adress', 'Client'); await page.fill('#project_description', 'd');
  await page.click('form button.btn'); await page.waitForURL('**/project/1');
  await settle(page, '#consomationForm');
}

test('parcours complet : consommation par activité -> production -> finance -> résultats -> rapport', async () => {
  const s = await session(); const { page, url } = s;
  try {
    await loginNewProject(s);
    for (let m = 1; m <= 12; m++) await page.fill(`[name="date[${m}]"]`, '100000');
    await page.click('#continue');
    await page.waitForFunction(() => !document.getElementById('continuer').disabled, null, { timeout: 15000 });
    assert.ok(await page.locator('#successconso').isVisible(), 'consommation validée');
    await page.click('#continuer');
    await page.waitForSelector('#tabs-icons-text-2', { state: 'visible' });

    // production PVGIS
    await page.evaluate(() => pvgisbtn());
    await page.fill('#peakpower', '100'); await page.fill('#angle', '30'); await page.fill('#aspect', '0');
    await page.evaluate(() => pvgisSubmit());
    await page.waitForFunction(() => !document.getElementById('prodavancer').disabled, null, { timeout: 30000 });
    await page.evaluate(() => prodavancer());

    // finance
    await page.waitForSelector('#capex', { state: 'visible' });
    await page.fill('#capex', '20000'); await page.fill('#opex', '1.5'); await page.fill('#replinv', '1500');
    await page.fill('#aug_tarif_v', '2'); await page.fill('#aug_tarif_a', '3'); await page.fill('#taux_actualisation', '6');
    await page.evaluate(() => financeSubmit());
    await page.waitForFunction(() => !document.getElementById('financeavancer').disabled, null, { timeout: 30000 });
    await page.evaluate(() => finavance());
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/e2e/results.png', fullPage: true });

    // page Résultats dédiée + rapport
    await page.goto(url + '/result/1/results'); await page.waitForTimeout(2500);
    const txt = await page.locator('body').innerText();
    assert.match(txt, /TRI|Tri|Cash|VAN/i, 'page résultats rendue');
    await page.goto(url + '/rapport/1'); await page.waitForTimeout(2500);
    const rap = await page.locator('body').innerText();
    assert.match(rap, /RAPPORT D'ETUDE ENERGETIQUE/i, 'rapport rendu');
    await page.screenshot({ path: '/tmp/e2e/rapport.png' });
    console.log('erreurs de page :', [...new Set(s.errors)]);
  } finally { await s.browser.close(); s.server.close(); }
});

for (const t of [1, 2, 3]) {
  test(`import de la courbe de charge réelle Type ${t} (Dropzone) puis validation du site`, { skip: !existsSync(sample(t)) && '.samples absent' }, async () => {
    const s = await session(); const { page } = s;
    try {
      await loginNewProject(s);
      await page.click('#tabs-icons-text-s-3-tab');
      await page.locator('input.dz-hidden-input').first().setInputFiles(sample(t));
      await page.waitForSelector('#success', { state: 'visible', timeout: 30000 });
      assert.ok(await page.locator('#plot').isVisible(), 'courbe tracée');
      await page.screenshot({ path: `/tmp/e2e/import${t}.png` });
      await page.click('#continue');
      await page.waitForFunction(() => !document.getElementById('continuer').disabled, null, { timeout: 20000 });
    } finally { await s.browser.close(); s.server.close(); }
  });
}

test('administration (équivalent EasyAdmin) : liste, modification, suppression, accès refusé aux non-admins', async () => {
  const s = await session(); const { page, url } = s;
  try {
    await loginNewProject(s); // alice = 1er compte => ROLE_ADMIN (mode local)
    await page.goto(url + '/admin/'); await settle(page, 'table');
    assert.match(page.url(), /\/admin\/User$/);
    assert.match(await page.locator('table').innerText(), /alice/);
    await page.click('a:has-text("modifier")'); await settle(page, '#f_societe');
    await page.fill('#f_societe', 'Nouvelle Soc'); await page.click('button.btn-primary'); await page.waitForURL('**/admin/User');
    assert.match(await page.locator('table').innerText(), /Nouvelle Soc/);
    await page.goto(url + '/admin/Project'); await settle(page, 'table');
    assert.match(await page.locator('table').innerText(), /Projet/);
    await page.goto(url + '/admin/Consomation'); await settle(page, 'table');
    await page.goto(url + '/admin/Project'); await settle(page, 'table');
    await page.click('a:has-text("supprimer")'); await settle(page, 'form button.btn-danger'); await page.click('form button.btn-danger');
    await page.waitForURL('**/admin/Project'); await page.waitForTimeout(500);
    assert.doesNotMatch(await page.locator('table').innerText(), /Client/);
    // un second compte (non admin) est refusé
    await page.goto(url + '/logout'); await page.waitForTimeout(1000);
    await page.goto(url + '/register'); await settle(page, '#user_username');
    await page.fill('#user_username', 'bobby'); await page.fill('#user_email', 'bob@example.tn');
    await page.fill('#user_plainPassword_first', 'secret123'); await page.fill('#user_plainPassword_second', 'secret123');
    await page.fill('#user_fullName', 'Bob Marley'); await page.fill('#user_societe', 'Societe');
    await page.click('#user_Register'); await settle(page, '#username');
    await page.fill('#username', 'bobby'); await page.fill('#password', 'secret123'); await page.click('#Login'); await page.waitForURL('**/project/');
    await page.goto(url + '/admin/User'); await page.waitForTimeout(1500);
    assert.match(await page.locator('body').innerText(), /Access Denied/);
  } finally { await s.browser.close(); s.server.close(); }
});
