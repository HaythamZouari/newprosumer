// Inspecteur de classeur : affiche la structure réelle d'un fichier tableur
// (feuilles, dimensions, premières lignes brutes) pour cadrer le portage du parsing.
// Usage : node scripts/inspect.js <chemin-fichier>
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx'); // build CJS Node (inclut l'accès fichier)

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/inspect.js <fichier>');
  process.exit(1);
}

const wb = XLSX.readFile(file, { cellDates: false, cellNF: false });
console.log('Nombre de feuilles :', wb.SheetNames.length);
console.log('Noms des feuilles  :', JSON.stringify(wb.SheetNames.slice(0, 10)),
  wb.SheetNames.length > 10 ? `… (+${wb.SheetNames.length - 10})` : '');

for (const name of wb.SheetNames.slice(0, 3)) {
  const ws = wb.Sheets[name];
  const ref = ws['!ref'] || '(vide)';
  console.log(`\n=== Feuille "${name}" — étendue ${ref} ===`);
  // Lignes brutes (valeurs telles quelles) : 6 premières + 2 au milieu.
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  console.log('nb lignes:', rows.length);
  const show = [...rows.slice(0, 6)];
  if (rows.length > 100) show.push('…', rows[100], rows[101]);
  for (const r of show) console.log(JSON.stringify(r));
}
