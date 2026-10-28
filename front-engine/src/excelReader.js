// Portage fidèle de App\Service\ExcelReader::createDataFromSpreadsheet
// (src/Service/ExcelReader.php) vers SheetJS.
//
// Objectif : reproduire à l'identique la série horaire [timestamp, puissance]
// produite par le PHP pour les 3 structures de courbe de charge reconnues
// (distinguées par le nombre de feuilles). Le sous-échantillonnage 10 min -> 1 h
// est conservé tel quel : une seule valeur par heure (le relevé ~xx:10), pas une
// moyenne. Les timestamps sont des instants Unix (secondes) correspondant à
// l'heure murale Africa/Tunis (voir tz.js).
import { TZ_OFFSET_SECONDS } from './tz.js';

// Instant Unix (s) d'une heure murale exprimée en Africa/Tunis.
function tsFromTunis(y, m, d, H = 0, i = 0) {
  return Date.UTC(y, m - 1, d, H, i, 0) / 1000 - TZ_OFFSET_SECONDS;
}

// Décalage série Excel -> Unix : Excel compte les jours depuis le 1899-12-30,
// l'écart avec l'epoch Unix (1970-01-01) est de 25569 jours.
const EXCEL_EPOCH_OFFSET_DAYS = 25569;

const MOIS_FR = {
  janvier: 1, 'février': 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, 'août': 8, aout: 8, septembre: 9, octobre: 10, novembre: 11,
  'décembre': 12, decembre: 12,
};

// Équivalent de ExcelReader::frenshdate : extrait [année, mois, jour] du titre
// d'une feuille « jeudi 1 mars 2018 ». Le PHP prend parts[1]=jour, parts[2]=mois,
// parts[3]=année ; on reproduit ce découpage.
function dateFromSheetTitle(title) {
  const parts = title.trim().split(/\s+/);
  const jour = parseInt(parts[1], 10);
  const mois = MOIS_FR[parts[2]?.toLowerCase()];
  const annee = parseInt(parts[3], 10);
  return { annee, mois, jour };
}

// Lignes brutes d'une feuille, en-tête compris (index 0), valeurs non formatées.
function rowsOf(XLSX, ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
}

// --- Type 1 : classeur à 1 feuille ---------------------------------------
// col0 = date-série Excel (chaque ligne), col1 = fraction de jour, col3 = puissance.
// Le PHP ne garde que les lignes d'indice key%6==2 (sous-échantillonnage horaire,
// relevé ~xx:10) et convertit la date via la formule série.
function parseType1(XLSX, wb) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = rowsOf(XLSX, ws); // rows[0] = en-tête (comme la clé 0 du PHP)
  const out = [];
  for (let key = 0; key < rows.length; key++) {
    if (key % 6 !== 2) continue;
    const r = rows[key];
    if (!r) continue;
    const serial = Number(r[0]);
    const frac = Number(r[1]);
    const power = Number(r[3]);
    if (!Number.isFinite(serial) || !Number.isFinite(frac)) continue;
    const ts = Math.round((serial - EXCEL_EPOCH_OFFSET_DAYS + frac) * 86400);
    out.push([ts, power]);
  }
  return out;
}

// --- Type 2 : classeur à 2 feuilles --------------------------------------
// Données en 2e feuille. col0 = date JJ/MM/AAAA (remplie au changement de jour),
// col1 = heure HH:MM, col2 = puissance. Le PHP ne garde que les relevés dont les
// minutes valent « 10 » (un par heure).
function parseType2(XLSX, wb) {
  const ws = wb.Sheets[wb.SheetNames[1]];
  const rows = rowsOf(XLSX, ws);
  const out = [];
  let datevoid = null; // dernière date rencontrée (report sur les lignes vides)
  for (const r of rows) {
    if (!r) continue;
    if (r[0] != null && r[0] !== '') datevoid = String(r[0]);
    const heure = r[1];
    if (heure == null) continue;
    const min = String(heure).split(':');
    if (min[1] !== '10') continue;
    if (!datevoid) continue;
    const [jj, mm, aaaa] = datevoid.split('/').map((x) => parseInt(x, 10));
    const [H, i] = min.map((x) => parseInt(x, 10));
    const ts = tsFromTunis(aaaa, mm, jj, H, i);
    out.push([ts, Number(r[2])]);
  }
  return out;
}

// --- Type 3 : classeur à plus de 2 feuilles ------------------------------
// 1re feuille = couverture (ignorée). Chaque feuille suivante = un jour, titre =
// date française. col0 = fraction de jour, col1 = puissance. Le PHP garde les
// lignes dont round(frac*144)%6==1 (un relevé par heure, ~xx:10).
function parseType3(XLSX, wb) {
  const out = [];
  for (let s = 1; s < wb.SheetNames.length; s++) {
    const { annee, mois, jour } = dateFromSheetTitle(wb.SheetNames[s]);
    if (!annee || !mois || !jour) continue;
    const base = tsFromTunis(annee, mois, jour, 0, 0);
    const rows = rowsOf(XLSX, wb.Sheets[wb.SheetNames[s]]);
    for (const r of rows) {
      if (!r) continue;
      const frac = Number(r[0]);
      if (!Number.isFinite(frac)) continue;
      if (Math.round(frac * 144) % 6 !== 1) continue;
      out.push([Math.round(base + frac * 86400), Number(r[1])]);
    }
  }
  return out;
}

/**
 * Détecte la structure par le nombre de feuilles et renvoie la série horaire
 * [timestampUnixSecondes, puissance], comme le PHP d'origine.
 * @param {object} XLSX instance SheetJS
 * @param {object} wb classeur déjà lu (XLSX.read / XLSX.readFile)
 */
export function parseWorkbook(XLSX, wb) {
  const n = wb.SheetNames.length;
  if (n === 1) return parseType1(XLSX, wb);
  if (n === 2) return parseType2(XLSX, wb);
  return parseType3(XLSX, wb); // n > 2
}

export { parseType1, parseType2, parseType3, dateFromSheetTitle, tsFromTunis };
