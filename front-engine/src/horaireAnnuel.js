// Portage fidèle de App\Service\Horaireannuel::Horaireannuel (src/Service/Horaireannuel.php).
//
// Même ventilation par poste tarifaire que postHoraire, mais agrégée sur toute
// l'année en un seul total (pas de ventilation par mois).
import { parts } from './tz.js';

const JOURS_FERIES = [
  [1, 1], [14, 1], [20, 3], [9, 4], [1, 5], [25, 7], [13, 8], [15, 10],
];

function estFerie(d, m) {
  for (const [jj, mm] of JOURS_FERIES) {
    if (d === jj && m === mm) return true;
  }
  return false;
}

/**
 * @param {Array<[number, number]>} data série [timestampUnixSecondes, valeur]
 * @returns {{jour:number, ete:number, soir:number, nuit:number}}
 */
export function horaireAnnuel(data) {
  const month = { jour: 0, ete: 0, soir: 0, nuit: 0 };

  for (const item of data) {
    const { m, d, H, w } = parts(item[0]);
    const v = item[1];

    if (w === 0) {
      month.nuit += v;
    } else if (estFerie(d, m)) {
      month.nuit += v;
    } else if (m > 5 && m < 9) {
      if ((H >= 0 && H <= 6) || (H > 21 && H <= 23)) {
        month.nuit += v;
      } else if ((H >= 7 && H <= 8) || (H > 13 && H <= 18)) {
        month.jour += v;
      } else if (H >= 9 && H <= 13) {
        month.ete += v;
      } else {
        month.soir += v;
      }
    } else {
      if (H >= 7 && H <= 17) {
        month.jour += v;
      } else if ((H >= 0 && H <= 6) || (H >= 21 && H <= 23)) {
        month.nuit += v;
      } else {
        month.soir += v;
      }
    }
  }

  return month;
}
