// Fuseau horaire de référence du calcul.
//
// Le code PHP d'origine lit les composantes de date (heure, jour, mois, jour de
// semaine) via \DateTime sur le fuseau par défaut du serveur. Les jours fériés
// codés en dur (14/01, 20/03, 09/04, 01/05, 25/07, 13/08, 15/10) et le découpage
// des postes horaires correspondent au calendrier et aux tarifs tunisiens (STEG).
// Le fuseau de référence est donc Africa/Tunis : UTC+1 toute l'année (la Tunisie
// n'applique plus l'heure d'été depuis 2009), soit un décalage fixe de +3600 s.
//
// On fige ce décalage explicitement pour que les agrégations horaires soient
// identiques quel que soit le fuseau du navigateur ou du serveur qui exécute le JS.
export const TZ_OFFSET_SECONDS = 3600;

/**
 * Composantes "horloge murale" d'un timestamp Unix (secondes) dans le fuseau de
 * référence, équivalentes à ce que PHP `\DateTime::format` renvoie sur Africa/Tunis.
 *
 * @param {number} tsSeconds timestamp Unix en secondes
 * @param {number} [offsetSeconds] décalage du fuseau (défaut : Africa/Tunis)
 * @returns {{y:number,m:number,d:number,H:number,i:number,w:number}}
 *   y = année, m = mois (1-12), d = jour du mois (1-31),
 *   H = heure (0-23), i = minutes (0-59), w = jour de semaine (0=dimanche)
 */
export function parts(tsSeconds, offsetSeconds = TZ_OFFSET_SECONDS) {
  // On ajoute le décalage puis on lit les composantes UTC : cela reproduit
  // l'heure murale du fuseau de référence sans dépendre du fuseau de la machine.
  const d = new Date((tsSeconds + offsetSeconds) * 1000);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    H: d.getUTCHours(),
    i: d.getUTCMinutes(),
    w: d.getUTCDay(),
  };
}
