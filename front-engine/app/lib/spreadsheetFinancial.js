// PhpOffice\PhpSpreadsheet\Calculation\Financial (version 1.13) : NPV et IRR, algorithme identique
// (dichotomie de Numerical Recipes avec bornes élargies), car l'application d'origine en dépend pour
// TRI et VAN. IRR renvoie '#VALUE!' (chaîne) en cas d'échec, comme PhpSpreadsheet.
const FINANCIAL_MAX_ITERATIONS = 128;
const FINANCIAL_PRECISION = 1.0e-08;

/** NPV(rate, v1, v2, …) : arguments aplatis (tableaux acceptés), le premier est le taux. */
export function NPV(...args) {
  const flat = args.flat(3);
  const rate = flat.shift();
  let ret = 0;
  for (let i = 1; i <= flat.length; i++) {
    const v = flat[i - 1];
    if (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))) {
      const d = (1 + rate) ** i;
      ret += d === 0 ? 0 : Number(v) / d; // PHP 7 : division par zéro => FALSE
    }
  }
  return ret;
}

export function IRR(values, guess = 0.1) {
  const vals = values.flat(3);
  let x1 = 0.0; let x2 = guess;
  let f1 = NPV(x1, vals); let f2 = NPV(x2, vals);
  for (let i = 0; i < FINANCIAL_MAX_ITERATIONS; i++) {
    if (f1 * f2 < 0.0) break;
    if (Math.abs(f1) < Math.abs(f2)) { x1 += 1.6 * (x1 - x2); f1 = NPV(x1, vals); } else { x2 += 1.6 * (x2 - x1); f2 = NPV(x2, vals); }
  }
  if (f1 * f2 > 0.0) return '#VALUE!';
  const f = NPV(x1, vals);
  let rtb; let dx;
  if (f < 0.0) { rtb = x1; dx = x2 - x1; } else { rtb = x2; dx = x1 - x2; }
  for (let i = 0; i < FINANCIAL_MAX_ITERATIONS; i++) {
    dx *= 0.5;
    const xMid = rtb + dx;
    const fMid = NPV(xMid, vals);
    if (fMid <= 0.0) rtb = xMid;
    if (Math.abs(fMid) < FINANCIAL_PRECISION || Math.abs(dx) < FINANCIAL_PRECISION) return xMid;
  }
  return '#VALUE!';
}
