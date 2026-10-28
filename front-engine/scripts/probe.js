// Sondage fin d'un type de fichier : étendue temporelle, remplissage colonne
// date, pas d'échantillonnage. Usage : node scripts/probe.js <fichier> <type>
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const file = process.argv[2];
const type = process.argv[3];
const wb = XLSX.readFile(file, { raw: true });

if (type === '1') {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const body = rows.slice(1);
  const dates = new Set(body.map((r) => r[0]).filter((v) => v != null));
  const filled = body.filter((r) => r[0] != null).length;
  console.log('lignes données:', body.length);
  console.log('col0 (Date) remplie sur', filled, '/', body.length, 'lignes');
  console.log('dates-série distinctes:', dates.size, '→', [...dates].slice(0, 3), '...', [...dates].slice(-2));
  console.log('col1 (Début) 2 premiers pas:', body[0][1], body[1][1], '→ pas =', body[1][1] - body[0][1]);
  const vals = body.map((r) => r[3]).filter((v) => typeof v === 'number');
  console.log('col3 valeurs: min', Math.min(...vals), 'max', Math.max(...vals), 'moy', (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
}

if (type === '2') {
  const ws = wb.Sheets[wb.SheetNames[1]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const body = rows.slice(1).filter((r) => r[1] != null);
  const dates = body.map((r) => r[0]).filter((v) => v != null);
  console.log('lignes données:', body.length);
  console.log('col0 (Date) remplie sur', body.filter((r) => r[0] != null).length, 'lignes (dates:', dates.slice(0, 2), '...', dates.slice(-1), ')');
  console.log('col1 (heure) 3 premiers:', body[0][1], body[1][1], body[2][1]);
}

if (type === '3') {
  const names = wb.SheetNames;
  console.log('feuilles:', names.length, '| 1re (couverture):', JSON.stringify(names[0]));
  console.log('2e feuille:', JSON.stringify(names[1]), '| dernière:', JSON.stringify(names[names.length - 1]));
  const ws = wb.Sheets[names[1]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const body = rows.slice(1).filter((r) => typeof r[0] === 'number');
  console.log('lignes/jour:', body.length, '| pas fraction:', body[1][0] - body[0][0], '→', (body[1][0] - body[0][0]) * 1440, 'min');
  console.log('dernière fraction:', body[body.length - 1][0]);
}
