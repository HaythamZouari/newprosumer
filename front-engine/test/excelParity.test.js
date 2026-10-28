// Parité exacte du parseur Excel : JS (src/excelReader.js) vs le VRAI App\Service\ExcelReader
// (PhpSpreadsheet 1.13) sur les 3 fichiers réels. Nécessite test/php/vendor (composer install) et
// les fichiers de comptage .samples/ (non versionnés) ; sinon les tests sont ignorés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseWorkbook } from '../src/excelReader.js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const here = dirname(fileURLToPath(import.meta.url));
const PHP = join(here, 'php', 'excel.php');
const haveVendor = existsSync(join(here, 'php', 'vendor', 'autoload.php'));

for (const t of [1, 2, 3]) {
  const file = join(here, '..', '..', '.samples', `type${t}`, `Type_${t}.xlsx`);
  test(`ExcelReader Type ${t} : JS identique au PHP (valeurs, timestamps flottants, colonnes)`,
    { skip: !(haveVendor && existsSync(file)) && 'vendor PHP ou fichier exemple absent' }, () => {
      const php = JSON.parse(execFileSync('php', [PHP, file], { encoding: 'utf8', maxBuffer: 1 << 28 }));
      const js = parseWorkbook(XLSX, XLSX.readFile(file, { raw: true }));
      assert.equal(js.length, php.length, 'nombre de points');
      for (let i = 0; i < php.length; i++) assert.deepEqual(js[i], php[i], `point ${i}`);
    });
}
