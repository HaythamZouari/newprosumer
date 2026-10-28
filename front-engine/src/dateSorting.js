// Portage fidèle de App\Service\Datesorting::SorteDate (src/Service/Datesorting.php).
//
// Aligne une série de production sur l'axe temporel de la consommation : on
// cherche dans la production l'index dont le mois/jour/heure correspond au début
// de la consommation, puis on "fait tourner" les valeurs de production pour les
// réindexer sur les dates de consommation. Les valeurs de production sont
// conservées dans l'ordre ; seules les dates (timestamps) sont remplacées par
// celles de la consommation.
import { parts } from './tz.js';

/**
 * @param {number} consomationTs timestamp Unix (s) du premier point de consommation
 * @param {Array<[number, number]>} production série [timestamp, valeur]
 * @param {Array<[number, number]>} dateConsommation série de consommation [timestamp, valeur]
 * @returns {Array<[number, number]>} production réalignée sur les dates de consommation
 */
export function sorteDate(consomationTs, production, dateConsommation) {
  const target = parts(consomationTs);

  // Dernier index de production correspondant au début de la consommation.
  // (Le PHP écrase $start à chaque correspondance, donc on garde la dernière.)
  let start = 0;
  for (let i = 0; i < production.length; i++) {
    const p = parts(production[i][0]);
    if (p.m === target.m && p.d === target.d && p.H === target.H) {
      start = i;
    }
  }

  const firstpart = [];
  const secondpart = [];
  let j = 0;

  for (let i = start; i < production.length; i++) {
    firstpart.push([dateConsommation[j][0], production[i][1]]);
    j++;
  }
  for (let i = 0; i < start; i++) {
    secondpart.push([dateConsommation[j][0], production[i][1]]);
    j++;
  }

  return firstpart.concat(secondpart);
}
