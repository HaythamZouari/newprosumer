// Portage fidèle de App\Service\FinanceService (src/Service/FinanceService.php).
//
// Modèle financier du projet sur 30 ans. Les fonctions PHP lisaient leurs
// paramètres via l'entité Project ; ici elles prennent un objet `finance` (les
// scalaires) et les séries/tableaux explicitement — forme adaptée au front.
//
// Objectif : parité exacte avec le PHP. Certaines formules PHP comportent des
// bugs/particularités ; ils sont REPRODUITS À L'IDENTIQUE et signalés par
// « BUG PHP » afin que l'application portée donne les mêmes chiffres. Le
// nettoyage éventuel sera une décision ultérieure, pas un écart silencieux.
//
// Champs attendus dans `finance` :
//   capex, opex, tauxActualisation, tauxInteret, montantDette,
//   maturiteProj, delaiGrace, augTarifAchat, augTarifVende, tarifTransport
//
// Convention des postes (comme le PHP) : 0=jour, 1=ete, 2=soir, 3=nuit.

const ANNEES = 30;

// Somme des 4 postes d'un tableau de 13 entrées {jour,ete,soir,nuit}.
function sommePostes(cedePH) {
  const p = [0, 0, 0, 0];
  for (const t of cedePH) {
    p[0] += t.jour; p[1] += t.ete; p[2] += t.soir; p[3] += t.nuit;
  }
  return p;
}

// Gain sur l'énergie autoconsommée, tarif unique.
export function gainEnergieTransporterUnif(tarif, degradation, autoConsomme, finance) {
  let total = 0;
  for (let i = 0; i < 8760; i++) total += autoConsomme[i][1];
  const result = [];
  for (let i = 0; i < ANNEES; i++) {
    result[i] = total
      * Math.pow(1 - degradation / 100, i)
      * tarif
      * Math.pow(1 + finance.augTarifAchat / 100, i);
  }
  return result;
}

// Gain sur l'énergie autoconsommée, tarif par poste horaire (tarif.achat[0..3]).
export function gainEnergieTransporterHoraire(tarif, degradation, autoConsomme, finance, postHoraireFn) {
  // postHoraireFn : la fonction postHoraire (injectée pour éviter un cycle d'import).
  const parMois = postHoraireFn(autoConsomme);
  const postHor = [0, 0, 0, 0];
  for (const t of parMois) {
    postHor[0] += t.jour; postHor[1] += t.ete; postHor[2] += t.soir; postHor[3] += t.nuit;
  }
  const result = [];
  for (let j = 0; j < ANNEES; j++) {
    result[j] = 0;
    for (let i = 0; i < 4; i++) {
      // BUG PHP : l'exposant de dégradation/escalade est l'indice de poste i,
      // et non l'année j — donc result[j] est identique pour toutes les années.
      result[j] += postHor[i]
        * Math.pow(1 - degradation / 100, i)
        * tarif.achat[i]
        * Math.pow(1 + finance.augTarifAchat / 100, i);
    }
  }
  return result;
}

// Gain sur l'énergie cédée au réseau (tarif.vende[0..3]).
// `cedePH` : tableau de 13 entrées {jour,ete,soir,nuit} déjà résolu par l'appelant
// (le PHP choisissait entre cedeePH multi-sites et injectPH ; cette résolution
// relève du portage de ProjectListner).
export function gainEnergieCedee(tarif, degradation, cedePH, finance) {
  const post = sommePostes(cedePH);
  const result = [];
  for (let j = 0; j < ANNEES; j++) {
    result[j] = 0;
    for (let i = 0; i < 4; i++) {
      result[j] += post[i]
        * Math.pow(1 - degradation / 100, j)
        * tarif.vende[i]
        * Math.pow(1 + finance.augTarifVende / 100, j);
    }
  }
  return result;
}

// Frais d'exploitation (OPEX actualisé).
export function fraisExploitation(finance) {
  const result = [];
  for (let i = 0; i < ANNEES; i++) {
    result[i] = finance.capex * (finance.opex / 100)
      * Math.pow(1 + finance.tauxActualisation / 100, i);
  }
  return result;
}

// Annuités de la dette (intérêts seuls pendant le délai de grâce, puis annuité
// constante pendant la maturité). Le dénominateur utilise maturiteProj (fidèle).
export function anuite(maturite, delee, finance) {
  const result = new Array(ANNEES).fill(0);
  for (let i = 1; i <= delee; i++) {
    result[i] = (finance.tauxInteret / 100) * finance.montantDette;
  }
  for (let i = delee + 1; i <= delee + maturite; i++) {
    result[i] = ((finance.tauxInteret / 100) * finance.montantDette)
      / (1 - Math.pow(1 + finance.tauxInteret / 100, -finance.maturiteProj));
  }
  // La boucle de remise à zéro de la queue du PHP est un no-op (déjà à 0).
  return result;
}

// Facture de régularisation (si le taux de cédée dépasse 30 % de la production).
export function factureRegularisation(gainCedee, prod, cedePH) {
  const post = sommePostes(cedePH);
  const cedeeTotal = post[0] + post[1] + post[2] + post[3];
  let prodTotal = 0;
  for (let i = 0; i < prod.length; i++) prodTotal += prod[i][1];
  const tauxCedee = cedeeTotal / prodTotal;
  const result = [];
  for (let i = 0; i < ANNEES; i++) {
    if (cedeeTotal > 0) {
      result[i] = (gainCedee[i] / cedeeTotal) * ((tauxCedee - 0.3) * prodTotal);
    } else {
      result[i] = 0;
    }
    if (result[i] < 0) result[i] = 0;
  }
  return result;
}

// Facteur de transport sur l'énergie autoconsommée.
export function facteurTransport(degradation, autoConsomme, finance) {
  let total = 0;
  for (const a of autoConsomme) total += a[1];
  const result = [];
  for (let i = 0; i < ANNEES; i++) {
    result[i] = total * Math.pow(1 - degradation / 100, i) * finance.tarifTransport;
  }
  return result;
}

// Dépenses totales (version avec facteur de transport).
export function depenses(fraisExp, annuite_, fReg, fTransport) {
  const result = [];
  for (let i = 0; i < ANNEES; i++) {
    result[i] = fraisExp[i] + fReg[i] + fTransport[i] + annuite_[i];
  }
  return result;
}

// Dépenses totales (version sans transport).
export function depenses2(fraisExp, annuite_, fReg) {
  const result = [];
  for (let i = 0; i < fraisExp.length; i++) {
    result[i] = fraisExp[i] + annuite_[i] + fReg[i];
  }
  return result;
}

// OPEX avec investissement de renouvellement (replinv) injecté en année 15.
export function opex(finance, replinv) {
  const result = [];
  for (let i = 0; i < ANNEES; i++) {
    result.push(finance.capex * (finance.opex / 100)
      * Math.pow(1 + finance.tauxActualisation * 0.01, i));
  }
  result[15] = result[15] + Math.trunc(replinv); // (int) en PHP
  return result;
}

// LLCR : Loan Life Coverage Ratio année par année.
export function llcr(finance, annuite_, cfads) {
  const result = new Array(ANNEES).fill(0);
  const solderep = [];
  const tmp = [];
  const fin = finance.maturiteProj + finance.delaiGrace;
  for (let i = 1; i <= fin; i++) {
    tmp[i] = 0;
    let k = 1;
    for (let j = i; j <= fin; j++) {
      tmp[i] += cfads[j] / Math.pow(1 + finance.tauxInteret / 100, k);
      k++;
    }
    solderep[1] = finance.montantDette;
    solderep[i + 1] = solderep[i] * (1 + finance.tauxInteret / 100) - annuite_[i];
    result[i] = tmp[i] / solderep[i];
  }
  return result;
}

// Cashflow initial (apport en fonds propres, négatif).
export function cashflowInt(finance) {
  return -(finance.capex - finance.montantDette);
}
