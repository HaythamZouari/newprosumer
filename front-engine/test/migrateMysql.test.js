// Migration MySQL : dump synthétique (colonnes sérialisées par le VRAI PHP) -> documents au format de l'application.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { parseDump } from '../scripts/lib/mysqlDump.mjs';
import { unserialize } from '../scripts/lib/phpUnserialize.mjs';
import { convert, uuidFor } from '../scripts/lib/convert.mjs';
import { userSql, docSql } from '../scripts/migrate-mysql.mjs';

const phpSerialize = (v) => execFileSync('php', ['-r', 'echo serialize(json_decode(stream_get_contents(STDIN), true));'], { input: JSON.stringify(v), encoding: 'utf8' });
const sq = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

test('unserialize : types PHP (entiers, flottants, bool, null, chaînes UTF-8, tableaux, DateTime)', () => {
  const php = execFileSync('php', ['-r', 'echo serialize([1, 2.5, true, null, "é à", ["a"=>1,"b"=>[3,4]], new DateTime("2019-01-01 00:00:00", new DateTimeZone("Africa/Tunis"))]);'], { encoding: 'utf8' });
  const v = unserialize(php);
  assert.deepEqual(v.slice(0, 5), [1, 2.5, true, null, 'é à']);
  assert.deepEqual(v[5], { a: 1, b: [3, 4] });
  assert.equal(v[6].date, '2019-01-01 00:00:00.000000'); assert.equal(v[6].timezone, 'Africa/Tunis');
});

test('parseDump : échappements, NULL, multi-lignes, apostrophes', () => {
  const t = parseDump("CREATE TABLE `t` (\n  `id` int NOT NULL,\n  `s` text\n) ENGINE=InnoDB;\nINSERT INTO `t` VALUES (1,'a\\'b\\nc'),(2,NULL),(3,'x''y');");
  assert.deepEqual(t.t.rows, [{ id: 1, s: "a'b\nc" }, { id: 2, s: null }, { id: 3, s: "x'y" }]);
});

function syntheticDump() {
  const curve = Array.from({ length: 48 }, (_, i) => [1546300800 + i * 3600, i % 5]);
  const cols = (o) => Object.keys(o).map((c) => `\`${c}\``).join(',');
  const vals = (o) => Object.values(o).map((v) => (v === null ? 'NULL' : typeof v === 'number' ? v : sq(v))).join(',');
  const ins = (t, o) => `INSERT INTO \`${t}\` (${cols(o)}) VALUES (${vals(o)});\n`;
  return `CREATE TABLE \`user\` (\n  \`id\` int NOT NULL,\n  \`username\` varchar(50)\n) ENGINE=InnoDB;\n`
    + ins('user', { id: 7, username: 'sami', password: '$2y$13$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234', email: 'sami@ex.tn', full_name: 'Sami Ben Ali', societe: 'STEG', roles: 'ROLE_USER,ROLE_ADMIN', enabled: 1, abon1: 0, abon2: 1, confirmation_token: null, img_url: null })
    + ins('consomation', { id: 3, consomation_annuel: phpSerialize(curve), all_consomation_annuel: phpSerialize([curve]), transport_eng: 0, type_tarif: 1, url_ccv: '///courbe-5.xlsx' })
    + ins('pvgis', { id: 4, lat: 36.8, lon: 10.18, loss: 14, degradation: 0.5, result: phpSerialize(curve), peak_power: phpSerialize([100, 0, 0]), azimuth: phpSerialize([0, 0, 0]), slop: phpSerialize([30, 0, 0]), mounting_type: 0, pv_tech: 'crystSi' })
    + ins('finance', { id: 5, capex: 20000, credit: 1, duree_proj: 25, cashflow: phpSerialize([1.5, -2]), tri25: 4.2 })
    + ins('project', { id: 12, name: "Projet d'essai", adress: 'Tunis', description: null, user_id: 7, consomation_id: 3, pvgis_id: 4, finance_id: 5, ninja_id: null, csv_prod_id: null, pvwatt_id: null, inject: phpSerialize(curve) });
}

test('conversion : utilisateur, projet agrégé (enfants, tableaux, booléens), propriétaire = uuid stable', () => {
  const { users, docs, files, report } = convert(parseDump(syntheticDump()));
  assert.equal(users.length, 1); assert.equal(users[0].uuid, uuidFor('user', 7));
  assert.deepEqual(users[0].roles, ['ROLE_USER', 'ROLE_ADMIN']); assert.equal(users[0].enabled, true); assert.equal(users[0].abon2, true);
  assert.equal(docs.length, 1);
  const p = docs[0].value;
  assert.equal(docs[0].id, 'm12'); assert.equal(p.userId, users[0].uuid); assert.equal(p.name, "Projet d'essai");
  assert.equal(p.pvgis.lat, 36.8); assert.deepEqual(p.pvgis.peak_power ?? p.pvgis.peakPower, [100, 0, 0]);
  assert.equal(p.pvgis.result.length, 48); assert.equal(p.consomation.type_tarif, true); assert.equal(p.finance.credit, true);
  assert.equal(p.inject.length, 48); assert.equal(p.ninja, null);
  assert.deepEqual(files, ['///courbe-5.xlsx'.replace('///', '')]);
  assert.deepEqual(report.errors, []);
});

test('SQL généré : compte avec bcrypt $2a$, projet en dollar-quoting, rejouable (on conflict)', () => {
  const { users, docs } = convert(parseDump(syntheticDump()));
  const u = userSql(users[0]);
  assert.match(u, /'\$2a\$13\$abcdefghij/); assert.match(u, /insert into auth\.identities/); assert.match(u, /enabled = true/);
  const d = docSql(docs[0]);
  assert.match(d, /\$np\$\{.*"name":"Projet d'essai".*\}\$np\$::jsonb/s); assert.match(d, /on conflict/);
});

test('dump sans table projet : erreur signalée, pas de plantage', () => {
  const { report } = convert(parseDump('CREATE TABLE `user` (\n  `id` int\n) ;'));
  assert.ok(report.errors.some((e) => /project/.test(e)));
});

test('le projet migré se recharge dans l\'application (hydratation des entités)', async () => {
  const { hydrateProject } = await import('../app/entities.js');
  const { docs } = convert(parseDump(syntheticDump()));
  const p = hydrateProject(docs[0].value, null);
  assert.deepEqual(p.getPvgis().getPeakPower(), [100, 0, 0]);
  assert.equal(p.getConsomation().getTypeTarif(), true);
  assert.equal(p.getFinance().getCapex(), 20000);
  assert.equal(p.getinject().length, 48);
});

test('CLI : --check puis génération des fichiers', () => {
  const { mkdtempSync, writeFileSync, readdirSync, readFileSync } = require_fs();
  const dir = mkdtempSync('/tmp/np-mig-');
  writeFileSync(`${dir}/d.sql`, syntheticDump());
  const chk = execFileSync('node', ['scripts/migrate-mysql.mjs', '--dump', `${dir}/d.sql`, '--check'], { encoding: 'utf8' });
  assert.match(chk, /utilisateurs : 1 — projets : 1/);
  execFileSync('node', ['scripts/migrate-mysql.mjs', '--dump', `${dir}/d.sql`, '--out', `${dir}/out`], { encoding: 'utf8' });
  assert.deepEqual(readdirSync(`${dir}/out`).sort(), ['01_users.sql', '02_projects_001.sql', '03_files.sh']);
  assert.match(readFileSync(`${dir}/out/03_files.sh`, 'utf8'), /courbe-5\.xlsx/);
});
import fs from 'node:fs';
function require_fs() { return fs; }
