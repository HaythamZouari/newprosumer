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

async function loginNewProject({ url, page }) {
  await page.goto(url + '/register'); await page.waitForSelector('#user_username'); await page.waitForTimeout(1200);
  await page.fill('#user_username', 'alice'); await page.fill('#user_email', 'alice@example.tn');
  await page.fill('#user_plainPassword_first', 'secret123'); await page.fill('#user_plainPassword_second', 'secret123');
  await page.fill('#user_fullName', 'Alice Test'); await page.fill('#user_societe', 'Societe');
  await page.click('#user_Register'); await page.waitForSelector('#username');
  await page.fill('#username', 'alice'); await page.fill('#password', 'secret123'); await page.click('#Login');
  await page.waitForURL('**/project/');
  await page.goto(url + '/project/new'); await page.waitForSelector('#project_name');
  await page.fill('#project_name', 'Projet'); await page.fill('#project_adress', 'Client'); await page.fill('#project_description', 'd');
  await page.click('form button.btn'); await page.waitForURL('**/project/1');
  await page.waitForSelector('#consomationForm');
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
