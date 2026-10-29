// Port de App\Controller\FinanceController (src/Controller/FinanceController.php) : modèle financier sur 30 ans.
// Le JS suit le PHP instruction par instruction (mêmes noms de variables). Particularités reproduites : « PHP : ».
// Les formules de FinanceService sont dans src/financeService.js (déjà validées contre le PHP) ; ce fichier fait
// le même travail que le contrôleur : lire l'entité Project, construire les séries, appeler le service.
import { Finance } from '../entities.js';
import * as FS from '../../src/financeService.js';
import { postHoraire } from '../../src/postHoraire.js';
import { IRR, NPV } from '../lib/spreadsheetFinancial.js';
import { floatval, intval, div } from '../lib/php.js';
import { productionOf } from '../projectListener.js';

const N = 30;
const zeros = (n) => new Array(n).fill(0);

/** Entité Finance -> paramètres scalaires attendus par src/financeService.js */
const params = (f) => ({
  capex: f.getCapex(), opex: f.getOpex(), tauxActualisation: f.getTauxActualisation(), tauxInteret: f.getTauxInteret(),
  montantDette: f.getMontantDette(), maturiteProj: f.getMaturiteProj(), delaiGrace: f.getDelaiGrace(),
  augTarifAchat: f.getAugTarifAchat(), augTarifVende: f.getAugTarifVende(), tarifTransport: f.getTarifTransport(),
});

/** Dégradation : csv, puis pvgis, puis ninja (le dernier non nul l'emporte) — ordre de FinanceService/FinanceController. */
function degradationOf(project) {
  let degradation = null;
  if (project.getCsvProd() != null) degradation = project.getCsvProd().getDegradation();
  if (project.getPvgis() != null) degradation = project.getPvgis().getDegradation();
  if (project.getNinja() != null) degradation = project.getNinja().getDegradation();
  return floatval(degradation);
}

/** Production pour la régularisation : ordre de FinanceService::factureRegularisation (pvgis, ninja, csv). */
function productionForRegularisation(project) {
  let prod = null;
  if (project.getPvgis() != null) prod = project.getPvgis().getResult();
  if (project.getNinja() != null) prod = project.getNinja().getResult();
  if (project.getCsvProd() != null) prod = project.getCsvProd().getResult();
  return prod ?? [];
}

const emptyPH = () => Array.from({ length: 13 }, () => ({ jour: 0, ete: 0, soir: 0, nuit: 0 }));
const sum4 = (ph) => { const p = [0, 0, 0, 0]; for (const t of ph) { p[0] += t.jour; p[1] += t.ete; p[2] += t.soir; p[3] += t.nuit; } return p; };

export async function index(ctx) {
  const { request, repo, params: rp } = ctx;
  const project = await repo.findProject(rp.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  if (!request.isXmlHttpRequest()) return ctx.json(null); // PHP : aucune réponse hors XHR

  let dep = 0;
  const finance = new Finance();
  if (request.get('credit') == null) finance.setCredit(false);
  else {
    finance.setCredit(true);
    finance.setMontantDette(floatval(request.get('dette')));
    finance.setTauxInteret(floatval(request.get('interet')));
    finance.setDelaiGrace(floatval(request.get('delai_grace')));
    finance.setMaturiteProj(floatval(request.get('maturite_proj')));
  }
  const t = project.getConsomation().getTransportEng() == false ? 1 : 0; // eslint-disable-line eqeqeq

  finance.setProject(project);
  finance.setCapex(floatval(request.get('capex')));
  finance.setAugTarifAchat(floatval(request.get('aug_tarif_a')));
  finance.setAugTarifVende(floatval(request.get('aug_tarif_v')));
  finance.setDureeProj(floatval(request.get('duree_proj')));
  finance.setOpex(floatval(request.get('opex')));
  finance.setSubvention(floatval(request.get('subvention')));
  // PHP : tarifs STEG codés en dur dans le contrôleur
  finance.setTarifHoraire({ vende: [0.115, 0.182, 0.168, 0.087], achat: [0.245, 0.371, 0.334, 0.193] });
  finance.setTarifUni(0.256);
  finance.setTarifTransport(0.007);
  finance.setTauxActualisation(floatval(request.get('taux_actualisation')));
  const allautoconsomme = project.getAutoConsomer();
  const replinv = floatval(request.get('replinv'));
  finance.setReplinv(floatval(request.get('replinv')));

  const conso = project.getConsomation().getallConsomationAnnuel();
  const len0 = allautoconsomme[0].length;
  const tottransporte = [];
  for (let i = 0; i < len0; i++) tottransporte[i] = [0, 0];
  for (let i = 0; i < len0; i++) {
    for (let j = t; j < conso.length; j++) {
      tottransporte[i][1] += floatval(allautoconsomme[j][i][1]);
      tottransporte[i][0] = allautoconsomme[0][i][0];
    }
  }
  const totautoconsomme = [];
  for (let i = 0; i < len0; i++) totautoconsomme[i] = [0, 0];
  for (let i = 0; i < len0; i++) {
    for (let j = 0; j < conso.length; j++) {
      totautoconsomme[i][1] += floatval(allautoconsomme[j][i][1]);
      totautoconsomme[i][0] = allautoconsomme[0][i][0];
    }
  }

  let production = null; // PHP : $production (non initialisée si aucune source)
  if (project.getPvgis() != null) production = project.getPvgis().getResult();
  if (project.getCsvProd() != null) production = project.getCsvProd().getResult();
  if (project.getNinja() != null) production = project.getNinja().getResult();
  const degradation = degradationOf(project);

  const CedePH = emptyPH();
  const autconsommePHTot = emptyPH();
  const acPH = project.getauto_consomerPH();
  for (let j = 0; j < conso.length; j++) {
    for (let i = 1; i < 13; i++) {
      autconsommePHTot[i].jour += floatval(acPH[j][i].jour);
      autconsommePHTot[i].ete += floatval(acPH[j][i].ete);
      autconsommePHTot[i].soir += floatval(acPH[j][i].soir);
      autconsommePHTot[i].nuit += floatval(acPH[j][i].nuit);
    }
  }
  let cedeeUsed = CedePH;
  if (conso.length > 1) {
    const cePH = project.getcedeePH();
    for (let j = 1; j < conso.length; j++) {
      for (let i = 1; i < 13; i++) {
        CedePH[i].jour += floatval(cePH[j][i].jour);
        CedePH[i].ete += floatval(cePH[j][i].ete);
        CedePH[i].soir += floatval(cePH[j][i].soir);
        CedePH[i].nuit += floatval(cePH[j][i].nuit);
      }
    }
  } else cedeeUsed = project.getinjectPH();

  let g_E_transporter; let g_E_cedee; let f_transporter; let f_regularisation;
  const fp = params(finance);
  if (project.getConsomation().getTypeTarif() == 0) { // eslint-disable-line eqeqeq
    g_E_transporter = FS.gainEnergieTransporterUnif(finance.getTarifUni(), degradation, totautoconsomme, fp);
    g_E_cedee = gainEnergieCedee(project, finance, degradation);
    f_transporter = FS.facteurTransport(degradation, tottransporte, fp);
    f_regularisation = FS.factureRegularisation(g_E_cedee, productionForRegularisation(project), cedeeUsed);
  } else {
    const auto_consomer_postHor = sum4(autconsommePHTot);
    const tarif = finance.getTarifHoraire();
    let result = [];
    for (let j = 0; j < N; j++) {
      result[j] = 0;
      for (let i = 0; i < 4; i++) {
        result[j] += auto_consomer_postHor[i] * Math.pow(1 - degradation / 100, i) * tarif.achat[i]
          * Math.pow(1 + finance.getAugTarifAchat() / 100, j);
      }
    }
    g_E_transporter = result;
    const cedee_postH = sum4(cedeeUsed);
    g_E_cedee = [];
    for (let j = 0; j < N; j++) {
      g_E_cedee[j] = 0;
      for (let i = 0; i < 4; i++) {
        g_E_cedee[j] += cedee_postH[i] * Math.pow(1 - degradation / 100, j) * tarif.vende[i]
          * Math.pow(1 + finance.getAugTarifVende() / 100, j);
      }
    }
    f_transporter = [];
    const total_auto_consome = auto_consomer_postHor[0] + auto_consomer_postHor[1] + auto_consomer_postHor[2] + auto_consomer_postHor[3];
    for (let i = 0; i < N; i++) f_transporter[i] = total_auto_consome * Math.pow(1 - degradation / 100, i) * finance.getTarifTransport();
    const cedee_total = cedee_postH[0] + cedee_postH[1] + cedee_postH[2] + cedee_postH[3];
    let prod_total = 0;
    for (let i = 0; i < (production || []).length; i++) prod_total += floatval(production[i][1]);
    const taux_cedee = div(cedee_total, prod_total);
    f_regularisation = [];
    for (let i = 0; i < N; i++) {
      if (cedee_total > 0) f_regularisation[i] = div(g_E_cedee[i], cedee_total) * ((taux_cedee - 0.3) * prod_total);
      else f_regularisation[i] = 0;
      if (f_regularisation[i] < 0) f_regularisation[i] = 0;
    }
  }

  const gain = []; let cash_flow = []; const cash_flow_cumule = []; const CFADS = []; const dscr = [];
  let annuite = []; let subvention = [];
  const frais_exp = FS.fraisExploitation(fp);
  const opex = FS.opex(fp, intval(replinv));
  f_transporter = FS.facteurTransport(degradation, tottransporte, fp); // PHP : recalculé (écrase le calcul tarif horaire)
  g_E_cedee.unshift(0);
  g_E_transporter.unshift(0);
  frais_exp.unshift(0);
  opex.unshift(0);
  f_transporter.unshift(0);
  f_regularisation.unshift(0);

  annuite = zeros(N);
  subvention = zeros(N);
  // PHP : clé flottante tronquée en entier ; une clé ≥ 30 allonge le tableau
  subvention[Math.trunc(floatval(request.get('ansubvention')))] = finance.getCapex() * (finance.getSubvention() / 100);

  for (let i = 0; i < N; i++) gain.push(g_E_cedee[i] + g_E_transporter[i]);

  if (finance.getCredit() === true) {
    annuite = FS.anuite(intval(finance.getMaturiteProj()), intval(finance.getDelaiGrace()), fp);
  }
  for (let i = 0; i < N; i++) CFADS[i] = gain[i] - opex[i] - f_transporter[i] - f_regularisation[i];

  const depense = [];
  for (let i = 0; i < N; i++) depense[i] = opex[i] + f_regularisation[i] + f_transporter[i] + floatval(annuite[i]);
  for (let i = 0; i < floatval(request.get('duree_proj')); i++) dep += depense[i];
  for (let i = 0; i < N; i++) cash_flow.push(gain[i] - depense[i]);
  for (let i = 0; i < N; i++) dscr[i] = 0;
  for (let i = 1; i <= finance.getMaturiteProj() + finance.getDelaiGrace(); i++) dscr[i] = div(floatval(CFADS[i]), floatval(annuite[i]));

  const consommation = conso;
  if (project.getCsvProd() != null) production = project.getCsvProd().getResult();
  if (project.getPvgis() != null) production = project.getPvgis().getResult();
  if (project.getNinja() != null) production = project.getNinja().getResult();

  const auto = project.getAutoConsomer();
  const cedee = project.getCedee();
  const importee = project.getImporte();
  for (let i = 0; i < N; i++) cash_flow[i] = cash_flow[i] + subvention[i];
  const cfInt = FS.cashflowInt(fp);
  cash_flow[0] = cash_flow[0] + cfInt;
  cash_flow_cumule[0] = cash_flow[0];
  for (let i = 1; i < cash_flow.length; i++) cash_flow_cumule[i] = cash_flow_cumule[i - 1] + cash_flow[i];

  const duree = floatval(request.get('duree_proj'));
  const cash_flowres = []; const CFADSres = [];
  for (let i = 0; i <= duree; i++) {
    cash_flowres[i] = cash_flow[i];
    CFADSres[i] = CFADS[i] + subvention[i];
  }

  finance.setAnnuite(annuite);
  finance.setSubventionarray(subvention);
  finance.setfactransport(f_transporter);
  finance.setDepense(dep);
  finance.setGainCedee(g_E_cedee);
  finance.setGainTransporter(g_E_transporter);
  finance.setFRegularisation(f_regularisation);
  finance.setCashflow(cash_flow);
  finance.setCashflowCum(cash_flow_cumule);
  finance.setDscr(dscr);
  finance.setCfads([...CFADS]); // copie : PHP affecte les tableaux par valeur (array_unshift ci-dessous ne doit pas l'atteindre)
  finance.setCashflowIn(cfInt);
  finance.setGainAns(gain);
  finance.setLlcr(FS.llcr(fp, annuite, CFADS));
  CFADS.unshift(-1 * finance.getCapex());
  CFADSres.unshift(-1 * finance.getCapex());

  finance.setTri25(floatval(IRR(CFADSres, 0.2)) * 100); // PHP : (float)'#VALUE!' = 0
  finance.setTricapitaux(floatval(IRR(cash_flowres, 0.3)) * 100);
  cash_flowres.unshift(finance.getTauxActualisation() / 100);
  finance.setVan(NPV(cash_flowres));
  await repo.saveProject(project);

  return ctx.json({
    con: consommation, pro: production, aut: auto, ced: cedee, imp: importee, arr: CFADS, tot: totautoconsomme, all: allautoconsomme,
    dep, depense, gain, cash_flow, autoconsoPH: autconsommePHTot,
  });
}

/** FinanceService::gainEnergieCedee : somme des cédées par poste (multi-sites : sites ≥ 1 ; sinon injectPH). */
function gainEnergieCedee(project, finance, degradation) {
  const CedePH = emptyPH();
  const conso = project.getConsomation().getallConsomationAnnuel();
  let ph = CedePH;
  if (conso.length > 1) {
    const cePH = project.getcedeePH();
    for (let j = 1; j < conso.length; j++) {
      for (let i = 1; i < 13; i++) {
        CedePH[i].jour += floatval(cePH[j][i].jour); CedePH[i].ete += floatval(cePH[j][i].ete);
        CedePH[i].soir += floatval(cePH[j][i].soir); CedePH[i].nuit += floatval(cePH[j][i].nuit);
      }
    }
  } else ph = project.getinjectPH();
  return FS.gainEnergieCedee(finance.getTarifHoraire(), degradation, ph, params(finance));
}
