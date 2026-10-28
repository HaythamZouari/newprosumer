// Tests de parité : les sorties du portage JS doivent être identiques à celles
// des services PHP d'origine (exécutés via test/php/run.php sur le fuseau Africa/Tunis).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { postHoraire } from '../src/postHoraire.js';
import { horaireAnnuel } from '../src/horaireAnnuel.js';
import { sorteDate } from '../src/dateSorting.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHP_RUNNER = join(__dirname, 'php', 'run.php');

// Lance le service PHP correspondant ; renvoie la sortie JSON décodée.
function php(fn, data) {
  const out = execFileSync('php', [PHP_RUNNER, fn], {
    input: JSON.stringify(data),
    encoding: 'utf8',
  });
  return JSON.parse(out);
}

// Série horaire d'une année complète (8760 points) à partir d'un timestamp de
// départ, avec des valeurs déterministes (reproductibles) mais variées selon
// l'heure et le jour, pour exercer toutes les branches jour/soir/nuit/été.
function serieAnnuelle(startTs) {
  const data = [];
  let ts = startTs;
  for (let i = 0; i < 8760; i++) {
    const h = Math.floor(ts / 3600);
    const val = ((h * 2654435761) % 1000) / 100; // 0..9.99, déterministe
    data.push([ts, val]);
    ts += 3600;
  }
  return data;
}

const EPS = 1e-9;

test('postHoraire : parité JS vs PHP sur une année horaire', () => {
  const data = serieAnnuelle(Date.UTC(2015, 0, 1) / 1000);
  const jsRes = postHoraire(data);
  const phpRes = php('postHoraire', data); // objet { "0":{...}, ..., "12":{...} }

  for (let m = 1; m <= 12; m++) {
    for (const poste of ['jour', 'ete', 'soir', 'nuit']) {
      assert.ok(
        Math.abs(jsRes[m][poste] - phpRes[m][poste]) < EPS,
        `mois ${m} poste ${poste}: JS=${jsRes[m][poste]} PHP=${phpRes[m][poste]}`
      );
    }
  }
});

test('horaireAnnuel : parité JS vs PHP sur une année horaire', () => {
  const data = serieAnnuelle(Date.UTC(2015, 0, 1) / 1000);
  const jsRes = horaireAnnuel(data);
  const phpRes = php('horaireAnnuel', data);

  for (const poste of ['jour', 'ete', 'soir', 'nuit']) {
    assert.ok(
      Math.abs(jsRes[poste] - phpRes[poste]) < EPS,
      `poste ${poste}: JS=${jsRes[poste]} PHP=${phpRes[poste]}`
    );
  }
});

test('horaireAnnuel : la somme des postes = somme des valeurs (invariant)', () => {
  const data = serieAnnuelle(Date.UTC(2015, 0, 1) / 1000);
  const jsRes = horaireAnnuel(data);
  const totalPostes = jsRes.jour + jsRes.ete + jsRes.soir + jsRes.nuit;
  const totalBrut = data.reduce((s, [, v]) => s + v, 0);
  assert.ok(Math.abs(totalPostes - totalBrut) < 1e-6, `${totalPostes} != ${totalBrut}`);
});

test('sorteDate : parité JS vs PHP (production décalée vs consommation)', () => {
  // Production démarrant un autre jour que la consommation, pour forcer un start != 0.
  const production = serieAnnuelle(Date.UTC(2017, 0, 1) / 1000);
  const dateConsommation = serieAnnuelle(Date.UTC(2015, 0, 1) / 1000);
  const consomation = dateConsommation[0][0];

  const jsRes = sorteDate(consomation, production, dateConsommation);
  const phpRes = php('sorteDate', { consomation, production, dateConsommation });

  assert.equal(jsRes.length, phpRes.length);
  for (let i = 0; i < jsRes.length; i++) {
    assert.equal(jsRes[i][0], phpRes[i][0], `date à l'index ${i}`);
    assert.ok(Math.abs(jsRes[i][1] - phpRes[i][1]) < EPS, `valeur à l'index ${i}`);
  }
});
