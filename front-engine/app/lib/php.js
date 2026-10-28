// Primitives PHP (7.x) dont dépend la logique portée. Elles existent pour que le code JS puisse
// rester une traduction littérale du PHP, sans réinterpréter les cas limites à chaque ligne.

/** empty($v) */
export function empty(v) {
  if (v === null || v === undefined || v === false || v === 0 || v === '' || v === '0') return true;
  if (typeof v === 'number') return false; // 0 traité plus haut ; NaN est « non vide » en PHP
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  return false;
}

const NUM_PREFIX = /^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;

/** (int)$v */
export function intval(v) {
  if (v === null || v === undefined || v === false) return 0;
  if (v === true) return 1;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : 0;
  if (typeof v === 'string') {
    const m = v.match(NUM_PREFIX);
    return m ? Math.trunc(parseFloat(m[0])) : 0;
  }
  return 0;
}

/** (float)$v */
export function floatval(v) {
  if (v === null || v === undefined || v === false) return 0;
  if (v === true) return 1;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const m = v.match(NUM_PREFIX);
    return m ? parseFloat(m[0]) : 0;
  }
  return 0;
}

/** round($x) : arrondi "loin de zéro" (PHP_ROUND_HALF_UP) */
export function round(x) {
  const n = floatval(x);
  return n >= 0 ? Math.floor(n + 0.5) : Math.ceil(n - 0.5);
}

/**
 * a / b sous PHP 7 : une division par zéro émet un avertissement et vaut FALSE (donc 0 dans les
 * calculs suivants). PHP 8 lèverait DivisionByZeroError ; l'original tourne sous PHP 7.
 */
export function div(a, b) {
  const d = floatval(b);
  return d === 0 ? 0 : floatval(a) / d;
}

/** explode(',', $s) */
export function explode(sep, s) { return String(s ?? '').split(sep); }

/** array_values($a) : liste dense (objets indexés ou tableaux, trous supprimés) */
export function arrayValues(a) {
  if (a === null || a === undefined) return [];
  return Array.isArray(a) ? a.filter((x) => x !== undefined) : Object.values(a);
}

/** Tableau PHP "null => []" lors d'une première écriture $a[$k] = ... */
export const arr = (a) => (a === null || a === undefined || a === '' ? [] : a);

/** unset($a[$k]) sur un tableau JS (laisse un trou, comme PHP laisse une clé absente) */
export function unset(a, k) { if (Array.isArray(a)) delete a[k]; else if (a) delete a[k]; }

/** isset($a[$k]) */
export const isset = (a, k) => a !== null && a !== undefined && a[k] !== undefined && a[k] !== null;
