// Dates PHP (DateTime / DateInterval / CarbonPeriod) sur le fuseau Africa/Tunis figé (voir src/tz.js).
// On manipule des timestamps Unix (secondes), comme le PHP d'origine (getTimestamp / setTimestamp).
import { TZ_OFFSET_SECONDS, parts } from '../../src/tz.js';

export { parts, TZ_OFFSET_SECONDS };

/** Timestamp d'une heure murale Africa/Tunis. */
export function tsFromParts(y, m, d, H = 0, i = 0, s = 0) {
  return Date.UTC(y, m - 1, d, H, i, s) / 1000 - TZ_OFFSET_SECONDS;
}

export const nowTs = () => Math.floor(Date.now() / 1000);

/**
 * new \DateTime($str)->getTimestamp() pour les formats utilisés par l'application :
 *   'YYYY-MM' (input type=month), 'YYYY-MM-DD' (input type=date), 'yy-mm-dd', 'YYYY-MM-DD HH:MM'.
 * Chaîne vide ou null => maintenant (comportement de `new DateTime('')`).
 */
export function parseDateTime(str) {
  if (str === null || str === undefined || String(str).trim() === '') return nowTs();
  const s = String(str).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return tsFromParts(+m[1], +m[2], 1);
  m = s.match(/^(\d{2}|\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    let y = +m[1];
    if (m[1].length === 2) y += y < 70 ? 2000 : 1900;
    return tsFromParts(y, +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return Math.floor(t / 1000);
  throw new Error(`Failed to parse time string (${s})`);
}

/** $date->add(new DateInterval('P1Y')) : même jour/heure, année + 1. */
export function addYears(ts, n = 1) {
  const p = parts(ts);
  return tsFromParts(p.y + n, p.m, p.d, p.H, p.i);
}

/** $date->format('y-m-d') */
export function formatYmd2(ts) {
  const p = parts(ts);
  const z = (n) => String(n).padStart(2, '0');
  return `${z(p.y % 100)}-${z(p.m)}-${z(p.d)}`;
}

/**
 * CarbonPeriod::create(start, 'PT1H', end, EXCLUDE_START_DATE) : instants start+1h, start+2h, ... end (inclus).
 * @returns {number[]} timestamps Unix
 */
export function hourlyPeriod(startTs, endTs) {
  const out = [];
  for (let t = startTs + 3600; t <= endTs; t += 3600) out.push(t);
  return out;
}

/** Représentation JSON d'un \DateTime Symfony (sérialisation par défaut). */
export function dateTimeJson(ts, tz = 'Africa/Tunis') {
  const p = parts(ts);
  const z = (n, w = 2) => String(n).padStart(w, '0');
  return { date: `${z(p.y, 4)}-${z(p.m)}-${z(p.d)} ${z(p.H)}:${z(p.i)}:00.000000`, timezone_type: 3, timezone: tz };
}
