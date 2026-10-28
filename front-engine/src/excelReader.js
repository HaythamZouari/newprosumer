// Portage fidèle de App\Service\ExcelReader::createDataFromSpreadsheet (src/Service/ExcelReader.php).
//
// Le PHP lit le classeur avec PhpSpreadsheet en `setReadDataOnly(true)` (aucun format de cellule) et
// utilise `$cell->getFormattedValue()` : un nombre devient donc sa représentation texte "General",
// c'est-à-dire un `(string)` de float à 14 chiffres significatifs (ini `precision=14`), qui est ensuite
// reconverti en nombre dans les calculs. Cette perte de précision est REPRODUITE (formatted()) car
// elle est visible dans les timestamps du Type 1 (…999.9999998).
//
// Les 3 structures reconnues (par nombre de feuilles) sont décrites dans README.md. Les timestamps
// calculés à partir de dates "murales" sont exprimés sur Africa/Tunis (voir tz.js).
import { TZ_OFFSET_SECONDS } from './tz.js';

const tsFromTunis = (y, m, d, H = 0, i = 0) => Date.UTC(y, m - 1, d, H, i, 0) / 1000 - TZ_OFFSET_SECONDS;

// Excel compte les jours depuis le 1899-12-30 ; l'écart avec l'epoch Unix est de 25569 jours.
const EXCEL_EPOCH_OFFSET_DAYS = 25569;

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Cell::getFormattedValue() en lecture "données seules" : texte "General" ('' pour une cellule vide). */
function formatted(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(parseFloat(v.toPrecision(14)));
  if (typeof v === 'boolean') return v ? '1' : '';
  return String(v);
}
const toNum = (s) => { const m = String(s).match(/^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/); return m ? parseFloat(m[0]) : 0; };

/**
 * Lignes d'une feuille (cellules vides comprises) jusqu'à la DERNIÈRE LIGNE CONTENANT UNE DONNÉE :
 * getRowIterator() de PhpSpreadsheet s'arrête à getHighestRow(), alors que la plage déclarée par le
 * fichier (`!ref`, ex. A1:C1000) peut aller bien au-delà. Les lignes vides intermédiaires sont conservées.
 */
function rowsOf(XLSX, ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true });
  let last = rows.length;
  while (last > 0 && rows[last - 1].every((c) => c === null || c === '')) last--;
  return rows.slice(0, last);
}

/** ExcelReader::frenshdate : « jeudi 1 mars 2018 » -> "3/1/2018" (mois/jour/année) */
export function frenshdate(title) {
  const date1 = title.split(' ');
  let finaldate = 0;
  for (let i = 0; i < 12; i++) if (MOIS[i] === date1[2]) finaldate = i + 1;
  return `${finaldate}/${date1[1]}/${date1[3]}`;
}

/** new \DateTime("m/d/Y")->getTimestamp() (minuit, Africa/Tunis) */
function usDateToTs(s) {
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) throw new Error(`Failed to parse time string (${s})`);
  return tsFromTunis(+m[3], +m[1], +m[2]);
}

/** DateTime::createFromFormat('d/m/Y H:i', $s) -> timestamp, ou false */
function createFromDmyHi(s) {
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})$/);
  if (!m) return false;
  const [d, mo, y, H, i] = [+m[1], +m[2], +m[3], +m[4], +m[5]];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || H > 23 || i > 59) return false;
  return tsFromTunis(y, mo, d, H, i);
}

// --- numsheet === 1 : une feuille ---------------------------------------
// data[0]=col A (date), data[1]=col B (début), data[3]=col D (puissance) ; col C ignorée.
function parseType1(XLSX, wb) {
  const data = [[], [], [], []];
  for (const row of rowsOf(XLSX, wb.Sheets[wb.SheetNames[0]])) {
    const ncols = Math.max(row.length, 4);
    for (let val = 0; val < ncols && val < 4; val++) {
      if (val !== 2) data[val].push(formatted(row[val]));
    }
  }
  data[3] = data[3].map(toNum);
  const out = [];
  let i = 0;
  for (let key = 0; key < data[0].length; key++) {
    const parsed = createFromDmyHi(`${data[0][key]} ${data[1][key]}`);
    if (key % 6 === 2) {
      if (parsed === false) {
        // date-série Excel : (serial - 25569 + fraction) * 86400, même ordre d'opérations que le PHP
        const ts = (toNum(data[0][key]) - EXCEL_EPOCH_OFFSET_DAYS + toNum(data[1][key])) * 86400;
        out[i] = [ts, data[3][key]];
        i++;
      } else {
        out.push([parsed, data[3][key]]);
      }
    }
  }
  return out;
}

// --- numsheet === 2 : données en 2e feuille ------------------------------
// data[0]=date JJ/MM/AAAA (au changement de jour), data[1]=HH:MM, data[2]=puissance ; col D ignorée.
function parseType2(XLSX, wb) {
  const data = [[], [], []];
  for (const row of rowsOf(XLSX, wb.Sheets[wb.SheetNames[1]])) {
    for (let val = 0; val < 4; val++) if (val !== 3) data[val].push(formatted(row[val]));
  }
  data[2] = data[2].map(toNum);
  const out = [];
  let datevoid = data[0][1];
  for (let key = 0; key < data[0].length; key++) {
    if (!(data[0][key] === '' || data[0][key] === '0')) datevoid = data[0][key];
    if (key > 0) {
      const min = String(data[1][key]).split(':');
      if (min[1] === '10') {
        const ts = createFromDmyHi(`${datevoid} ${data[1][key]}`);
        if (ts === false) throw new Error('Call to a member function getTimestamp() on bool');
        out.push([ts, data[2][key]]);
      }
    }
  }
  return out;
}

// --- numsheet > 2 : couverture + une feuille par jour --------------------
// Chaque ligne retenue : [timestamp, puissance, clé, minuit du jour, fraction de jour, reste]
function parseType3(XLSX, wb) {
  const data = [[], [], [], []];
  for (let s = 1; s < wb.SheetNames.length; s++) {
    const title = frenshdate(wb.SheetNames[s]);
    for (const row of rowsOf(XLSX, wb.Sheets[wb.SheetNames[s]])) {
      for (let val = 0; val < 3; val++) data[val].push(formatted(row[val]));
      data[3].push(title);
    }
  }
  const frac = data[0].map(toNum);
  const power = data[1].map(toNum);
  const out = [];
  for (let key = 0; key < frac.length; key++) {
    const r = Math.round(frac[key] * 144);
    if (((r % 6) + 6) % 6 === 1) {
      const midnight = usDateToTs(data[3][key]);
      out.push([midnight + frac[key] * 86400, power[key], key, midnight, frac[key], ((r % 6) + 6) % 6]);
    }
  }
  return out;
}

/**
 * Détecte la structure par le nombre de feuilles et renvoie la même structure que le PHP.
 * @param {object} XLSX instance SheetJS  @param {object} wb classeur lu avec { raw: true }
 */
export function parseWorkbook(XLSX, wb) {
  const n = wb.SheetNames.length;
  if (n === 2) return parseType2(XLSX, wb);
  if (n > 2) return parseType3(XLSX, wb);
  return parseType1(XLSX, wb);
}

export { parseType1, parseType2, parseType3, tsFromTunis };
// compat : l'ancien port exposait cette fonction
export function dateFromSheetTitle(title) {
  const p = title.trim().split(/\s+/);
  return { annee: parseInt(p[3], 10), mois: MOIS.indexOf(p[2]) + 1, jour: parseInt(p[1], 10) };
}
