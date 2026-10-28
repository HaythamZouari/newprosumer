// Portage fidèle de App\Event\ProjectListner::onProjectEvent
// (src/Event/ProjectListner.php).
//
// Cœur du croisement consommation / production : calcule, par site de
// consommation, l'autoconsommation, l'énergie cédée au réseau, l'énergie
// importée et l'énergie injectée — en horaire puis ventilées par poste tarifaire
// (postHoraire). Gère le multi-sites (répartition au prorata) et les deux modes
// tarifaires (typeTarif).
//
// Entrées (objet) :
//   consomation : tableau de sites, chaque site = série horaire [[ts, val], ...]
//                 (site 0 = consommation totale/agrégée quand transportEng==0)
//   production  : série horaire de production [[ts, val], ...] déjà alignée
//   transportEng: 0 = autoconsommation calculée ; sinon = tout injecté
//   typeTarif   : 1 = répartition par poste avec min() ; sinon = postHoraire direct
//
// Sortie : { inject, autoConsomer, cedee, importer, consomationPH, productionPH,
//            autoConsomerPH, importerPH, cedeePH, injectPH }
//
// Particularité PHP reproduite : le `else` sans accolades (lignes 121-126) fait
// que le calcul cédée/importée/injectée du site 0 s'exécute à chaque itération,
// ce qui revient à auto = min(conso, prod) ; c'est explicité ici.
import { postHoraire } from './postHoraire.js';

const mkPoste = () => ({ jour: 0, ete: 0, soir: 0, nuit: 0 });
const POSTES = ['jour', 'ete', 'soir', 'nuit'];

export function computeProjectData({ consomation, production, transportEng, typeTarif }) {
  // Copie profonde : le PHP travaille sur une copie du tableau renvoyé par
  // l'entité (mutation 0 -> 1e-10 locale), on ne mute donc pas l'appelant.
  consomation = consomation.map((site) => site.map(([t, v]) => [t, v]));
  const nSites = consomation.length;
  const nHours = consomation[0].length;

  // Structures PH par site, 13 mois (index 0 inutilisé), initialisées à zéro.
  const auto_consomerPH = [];
  const consomationPH = [];
  const cedeePH = [];
  const importerPH = [];
  for (let j = 0; j < nSites; j++) {
    auto_consomerPH[j] = []; consomationPH[j] = []; cedeePH[j] = []; importerPH[j] = [];
    for (let i = 0; i < 13; i++) {
      auto_consomerPH[j][i] = mkPoste();
      consomationPH[j][i] = mkPoste();
      cedeePH[j][i] = mkPoste();
      importerPH[j][i] = mkPoste();
    }
  }
  let consomationtotPH = [];
  let injectPH = [];
  let productionPH = [];

  const prod = production; // production[0] en PHP

  const auto_consomer = [];
  const cedee = [];
  const importer = [];
  const inject = [];
  let c;

  if (transportEng === 0) {
    c = 1;
    auto_consomer[0] = []; cedee[0] = []; importer[0] = [];
    for (let i = 0; i < nHours; i++) {
      const ts = consomation[0][i][0];
      const cv = consomation[0][i][1];
      const pv = prod[i][1];
      // if conso<prod -> auto=conso ; sinon auto=prod (le reste s'exécute toujours)
      auto_consomer[0][i] = [ts, cv < pv ? cv : pv];
      const auto = auto_consomer[0][i][1];
      cedee[0][i] = [ts, pv - auto];
      importer[0][i] = [ts, cv - auto];
      inject[i] = [ts, pv - auto];
    }
    consomationPH[0] = postHoraire(consomation[0]);
    auto_consomerPH[0] = postHoraire(auto_consomer[0]);
    importerPH[0] = postHoraire(importer[0]);
    if (nSites === 1) {
      cedeePH[0] = postHoraire(cedee[0]);
    }
  } else {
    c = 0;
    for (let i = 0; i < nHours; i++) {
      inject[i] = [consomation[0][i][0], prod[i][1]];
    }
  }

  // Totaux horaires + remplacement des zéros de conso (évite la division par 0).
  const consomationtot1 = [];
  const consomationtot = [];
  const min = [];
  const ratio = [];
  for (let i = 0; i < nHours; i++) {
    consomationtot1[i] = 0; consomationtot[i] = [0, 0]; min[i] = 0; ratio[i] = 0;
  }
  for (let j = c; j < nSites; j++) {
    for (let i = 0; i < nHours; i++) {
      if (consomation[j][i][1] === 0) consomation[j][i][1] = 0.0000000001;
    }
  }
  for (let i = 0; i < nHours; i++) {
    for (let j = c; j < nSites; j++) {
      consomationtot1[i] = consomation[j][i][1];
      consomationtot[i][1] = consomationtot1[i] + consomationtot[i][1];
    }
  }
  for (let i = 0; i < nHours; i++) {
    consomationtot[i] = [consomation[0][i][0], consomationtot[i][1]];
  }

  for (let j = 0; j < nSites; j++) {
    consomationPH[j] = postHoraire(consomation[j]);
  }
  consomationtotPH = postHoraire(consomationtot);
  injectPH = postHoraire(inject);
  productionPH = postHoraire(prod);

  // Répartition horaire sur les sites de consommation (prorata de la cédée).
  for (let j = c; j < nSites; j++) {
    auto_consomer[j] = auto_consomer[j] || [];
    cedee[j] = cedee[j] || [];
    importer[j] = importer[j] || [];
    for (let i = 0; i < nHours; i++) {
      ratio[i] = consomation[j][i][1] / consomationtot[i][1];
      if (consomation[j][i][1] > ratio[i] * inject[i][1]) {
        min[i] = ratio[i] * inject[i][1];
      } else {
        min[i] = consomation[j][i][1];
      }
      const ts = consomation[0][i][0];
      auto_consomer[j][i] = [ts, min[i]];
      cedee[j][i] = [ts, (consomation[j][i][1] / consomationtot[i][1]) * inject[i][1] - min[i]];
      importer[j][i] = [ts, consomation[j][i][1] - min[i]];
    }
  }

  if (typeTarif === 1) {
    for (let j = c; j < nSites; j++) {
      for (let i = 1; i < 13; i++) {
        // Garde anti-division par zéro (mute consomationtotPH, fidèle au PHP).
        for (const p of POSTES) if (consomationtotPH[i][p] === 0) consomationtotPH[i][p] = 1;
        for (const p of POSTES) {
          const part = injectPH[i][p] * (consomationPH[j][i][p] / consomationtotPH[i][p]);
          auto_consomerPH[j][i][p] = Math.min(consomationPH[j][i][p], part);
          importerPH[j][i][p] = consomationPH[j][i][p] - auto_consomerPH[j][i][p];
          cedeePH[j][i][p] = part - auto_consomerPH[j][i][p];
        }
      }
    }
  } else {
    for (let j = c; j < nSites; j++) {
      auto_consomerPH[j] = postHoraire(auto_consomer[j]);
      importerPH[j] = postHoraire(importer[j]);
      cedeePH[j] = postHoraire(cedee[j]);
    }
  }

  return {
    inject,
    autoConsomer: auto_consomer,
    cedee,
    importer,
    consomationPH,
    productionPH,
    autoConsomerPH: auto_consomerPH,
    importerPH,
    cedeePH,
    injectPH,
  };
}
