// Portage fidèle de App\Service\PostHoraire::PostHoraire (src/Service/PostHoraire.php).
//
// Ventile une série horaire [timestamp, valeur] par mois (1-12) et par poste
// tarifaire STEG : jour / ete (pointe d'été) / soir / nuit. Les week-ends
// (dimanche) et les jours fériés tunisiens sont comptés entièrement en "nuit",
// exactement comme le code PHP d'origine (y compris ses particularités).
import { parts } from './tz.js';

// Jours fériés tunisiens codés en dur dans le PHP, au format [jour, mois].
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
 * @returns {Array<{jour:number, ete:number, soir:number, nuit:number}>}
 *   tableau de 13 éléments indexés par mois (index 0 inutilisé, laissé à zéro)
 */
export function postHoraire(data) {
  const month = [];
  for (let i = 0; i < 13; i++) {
    month[i] = { jour: 0, ete: 0, soir: 0, nuit: 0 };
  }

  for (const item of data) {
    const { m, d, H, w } = parts(item[0]);
    const v = item[1];

    if (w === 0) {
      month[m].nuit += v;
    } else if (estFerie(d, m)) {
      month[m].nuit += v;
    } else if (m > 5 && m < 9) {
      // Mois d'été (juin, juillet, août)
      if ((H >= 0 && H <= 6) || (H > 21 && H <= 23)) {
        month[m].nuit += v;
      } else if ((H >= 7 && H <= 8) || (H > 13 && H <= 18)) {
        month[m].jour += v;
      } else if (H >= 9 && H <= 13) {
        month[m].ete += v;
      } else {
        month[m].soir += v;
      }
    } else {
      // Reste de l'année
      if (H >= 7 && H <= 17) {
        month[m].jour += v;
      } else if ((H >= 0 && H <= 6) || (H >= 21 && H <= 23)) {
        month[m].nuit += v;
      } else {
        month[m].soir += v;
      }
    }
  }

  return month;
}
