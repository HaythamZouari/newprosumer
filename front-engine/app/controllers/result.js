// Port de App\Controller\ResultController (src/Controller/ResultController.php) :
//   project_results (XHR) : tous les indicateurs affichés par la page Résultats
//   results               : la page elle-même
// Particularités du PHP d'origine reproduites : « PHP : ».
import * as FS from '../../src/financeService.js';
import { floatval, intval, div } from '../lib/php.js';

const N = 30;
const emptyPostes = () => ({ jour: 0, ete: 0, soir: 0, nuit: 0 });
const sumPostes = (into, from) => { into.jour += floatval(from.jour); into.ete += floatval(from.ete); into.soir += floatval(from.soir); into.nuit += floatval(from.nuit); };

const params = (f) => ({
  capex: f.getCapex(), opex: f.getOpex(), tauxActualisation: f.getTauxActualisation(), tauxInteret: f.getTauxInteret(),
  montantDette: f.getMontantDette(), maturiteProj: f.getMaturiteProj(), delaiGrace: f.getDelaiGrace(),
  augTarifAchat: f.getAugTarifAchat(), augTarifVende: f.getAugTarifVende(), tarifTransport: f.getTarifTransport(),
});

export async function results(ctx) {
  const project = await ctx.repo.findProject(ctx.params.id);
  if (!project) return ctx.html('<h1>404 Not Found</h1>', 404);
  return ctx.render('result/index.html.twig', { project });
}

export async function project_results(ctx) {
  const { request, repo, params: rp } = ctx;
  const project = await repo.findProject(rp.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  if (!request.isXmlHttpRequest()) return ctx.json(null);

  const finance = project.getFinance();
  const f_transport = [];
  let prodvalue = [];
  if (project.getCsvProd() != null) prodvalue = project.getCsvProd().getResult();
  if (project.getPvgis() != null) prodvalue = project.getPvgis().getResult();
  if (project.getNinja() != null) prodvalue = project.getNinja().getResult();

  let prd_annuel = 0; let cedee_annuel = 0; let prod25ans = 0; // eslint-disable-line prefer-const
  let ps_centrale; let pschamp = null; let pschamp1 = null; let pschamp2 = null; // PHP : variables non définies => null
  if (project.getPvgis() != null) {
    const r = project.getPvgis().getResult();
    for (let i = 0; i < r.length; i++) prd_annuel += floatval(r[i][1]);
    const pp = project.getPvgis().getPeakPower();
    ps_centrale = floatval(pp[0]) + floatval(pp[1]) + floatval(pp[2]);
    pschamp = pp[0]; pschamp1 = pp[1]; pschamp2 = pp[2];
  } else if (project.getCsvProd() != null) {
    const r = project.getCsvProd().getResult();
    for (let i = 0; i < r.length; i++) prd_annuel += floatval(r[i][1]);
    ps_centrale = project.getCsvProd().getPuissence();
    pschamp = 0; pschamp1 = 0; pschamp2 = 0;
  } else if (project.getNinja() != null) {
    const r = project.getNinja().getResult();
    for (let i = 0; i < r.length; i++) prd_annuel += floatval(r[i][1]);
    ps_centrale = project.getNinja().getCapacity();
    pschamp = 0; pschamp1 = 0; pschamp2 = 0;
  }

  let degradation = null;
  if (project.getCsvProd() != null) degradation = project.getCsvProd().getDegradation();
  if (project.getPvgis() != null) degradation = project.getPvgis().getDegradation();
  if (project.getNinja() != null) degradation = project.getNinja().getDegradation();
  const deg = floatval(degradation);

  // PHP : pow($degradation, $i)/100 — c'est bien la dégradation ÉLEVÉE à la puissance i (et non l'inverse)
  for (let i = 0; i < 25; i++) prod25ans += floatval(prd_annuel - (prd_annuel * (Math.pow(deg, i) / 100)));
  const productible = div(prd_annuel, floatval(ps_centrale));

  const conso = project.getConsomation().getallConsomationAnnuel();
  const autconsommePHTotps = []; const ImportePHTotps = []; const consommationPHTotps = [];
  for (let j = 0; j < conso.length; j++) {
    autconsommePHTotps[j] = emptyPostes(); ImportePHTotps[j] = emptyPostes(); consommationPHTotps[j] = emptyPostes();
  }
  const CedePH = []; const autconsommePHTot = [];
  for (let i = 0; i < 13; i++) { CedePH[i] = emptyPostes(); autconsommePHTot[i] = emptyPostes(); }
  let Cedetot = [];
  for (let i = 0; i < conso[0].length; i++) Cedetot[i] = [0, 0];

  const cedeePH = project.getcedeePH();
  if (conso.length > 1) {
    for (let j = 0; j < conso.length; j++) for (let i = 1; i < 13; i++) sumPostes(CedePH[i], cedeePH[j][i]);
    for (let i = 0; i < conso[0].length; i++) {
      for (let j = 1; j < conso.length; j++) {
        Cedetot[i][1] += floatval(project.getCedee()[j][i][1]);
        Cedetot[i][0] = conso[0][i][0];
      }
    }
    for (let i = 0; i < conso[0].length; i++) Cedetot[i] = [conso[0][i][0], Cedetot[i][1]];
  } else {
    for (let j = 0; j < conso.length; j++) for (let i = 1; i < 13; i++) sumPostes(CedePH[i], cedeePH[j][i]);
    Cedetot = project.getCedee()[0];
  }

  const acPH = project.getauto_consomerPH();
  for (let j = 0; j < conso.length; j++) for (let i = 1; i < 13; i++) sumPostes(autconsommePHTot[i], acPH[j][i]);
  const imPH = project.getimporterPH(); const coPH = project.getconsomationPH();
  for (let j = 0; j < conso.length; j++) {
    for (let i = 0; i < 13; i++) {
      sumPostes(autconsommePHTotps[j], acPH[j][i]);
      sumPostes(ImportePHTotps[j], imPH[j][i]);
      sumPostes(consommationPHTotps[j], coPH[j][i]);
    }
  }

  const auto_consomer_postHor = [0, 0, 0, 0];
  for (const tmp of autconsommePHTot) {
    auto_consomer_postHor[0] += tmp.jour; auto_consomer_postHor[1] += tmp.ete; auto_consomer_postHor[2] += tmp.soir; auto_consomer_postHor[3] += tmp.nuit;
  }

  const cm_annuel = []; const a_cm_annuel = []; const imp_annuel = []; const taux_auto = [];
  for (let j = 0; j < conso.length; j++) { cm_annuel[j] = 0; a_cm_annuel[j] = 0; imp_annuel[j] = 0; taux_auto[j] = 0; }

  const fp = params(finance);
  const g_E_transporterSite = [];
  if (project.getConsomation().getTypeTarif() == 0) { // eslint-disable-line eqeqeq
    for (let j = 0; j < conso.length; j++) {
      g_E_transporterSite[j] = FS.gainEnergieTransporterUnif(finance.getTarifUni(), deg, project.getAutoConsomer()[j], fp);
    }
  } else {
    for (let k = 0; k < conso.length; k++) {
      auto_consomer_postHor[0] = autconsommePHTotps[k].jour; auto_consomer_postHor[1] = autconsommePHTotps[k].ete;
      auto_consomer_postHor[2] = autconsommePHTotps[k].soir; auto_consomer_postHor[3] = autconsommePHTotps[k].nuit;
      g_E_transporterSite[k] = [];
      for (let j = 0; j < N; j++) {
        let r = 0;
        for (let i = 0; i < 4; i++) {
          r += auto_consomer_postHor[i] * Math.pow(1 - deg / 100, i) * finance.getTarifHoraire().achat[i]
            * Math.pow(1 + finance.getAugTarifAchat() / 100, j);
        }
        g_E_transporterSite[k][j] = r;
      }
    }
  }

  const productiontotPH = emptyPostes();
  const prPH = project.getproductionPH();
  for (let i = 0; i < 13; i++) sumPostes(productiontotPH, prPH[i]);

  const cedee_postH = [0, 0, 0, 0];
  for (const tmp of CedePH) { cedee_postH[0] += tmp.jour; cedee_postH[1] += tmp.ete; cedee_postH[2] += tmp.soir; cedee_postH[3] += tmp.nuit; }
  cedee_annuel = cedee_postH[0] + cedee_postH[1] + cedee_postH[2] + cedee_postH[3];

  for (let j = 0; j < conso.length; j++) for (let i = 0; i < conso[0].length; i++) cm_annuel[j] += floatval(conso[j][i][1]);

  const PH_consomationannuel = []; const PH_auto_consomerannuel = []; const PH_importerannuel = [];
  for (let j = 0; j < conso.length; j++) {
    PH_consomationannuel[j] = consommationPHTotps[j]; PH_auto_consomerannuel[j] = autconsommePHTotps[j]; PH_importerannuel[j] = ImportePHTotps[j];
    a_cm_annuel[j] = autconsommePHTotps[j].jour + autconsommePHTotps[j].ete + autconsommePHTotps[j].soir + autconsommePHTotps[j].nuit;
    taux_auto[j] = div(a_cm_annuel[j], cm_annuel[j]);
    imp_annuel[j] = cm_annuel[j] - a_cm_annuel[j];
  }

  const f_reg = finance.getFRegularisation()[1];
  for (let i = 0; i < finance.getGainTransporter().length; i++) f_transport.push(finance.getfactransport()[i]);
  const opex = FS.opex(fp, intval(finance.getReplinv()));
  opex.unshift(0);

  // PHP : getCredit() est un booléen (true => 1 dans l'arithmétique)
  const credit = finance.getCredit() ? 1 : 0;
  const coutproj = finance.getDepense() + finance.getCapex() - credit - finance.getSubvention();
  return ctx.json({
    consomation: conso,
    peak: ps_centrale,
    productible,
    coutproj,
    lcoe: div((finance.getDepense() + finance.getCapex()) - credit - finance.getSubvention(), prod25ans),
    f_reg,
    t_auto: taux_auto,
    auto_consommationS: a_cm_annuel,
    consommationS: cm_annuel,
    importerS: imp_annuel,
    t_cedee: div(cedee_annuel, prd_annuel),
    prod25: prod25ans,
    production: prodvalue,
    auto_consomer: project.getAutoConsomer(),
    cedee: Cedetot,
    importer: project.getImporte(),
    PH_consomation: coPH,
    PH_production: prPH,
    PH_auto_consomer: acPH,
    PH_cedee: CedePH,
    PH_importer: imPH,
    PH_consomationannuel,
    PH_auto_consomerannuel,
    PH_importerannuel,
    PH_cedeeannuel: cedee_postH,
    PH_productionannuel: productiontotPH,
    dureeProj: finance.getDureeProj(),
    cashflow: finance.getCashflow(),
    cashflow_cum: finance.getCashflowCum(),
    annuite: finance.getAnnuite(),
    cfads: finance.getCfads(),
    dsacr: finance.getDscr(),
    gain_E_transporter: finance.getGainTransporter(),
    g_E_transporterSite,
    inv: finance.getCapex() * (1 - (finance.getSubvention() / 100)),
    gain_E_cedee: finance.getGainCedee(),
    gain_ans: finance.getGainAns(),
    Facture_transport: f_transport,
    opex,
    facture_regrularisation: finance.getFRegularisation(),
    transpE: project.getConsomation().getTransportEng(),
    llcr: finance.getLlcr(),
    cashFlowIn: finance.getCashflowIn(),
    maturiter: finance.getMaturiteProj(),
    delee: finance.getDelaiGrace(),
    capex: finance.getCapex(),
    subv: finance.getSubvention(),
    taux_ac: finance.getTauxActualisation(),
    credit: finance.getMontantDette(),
    taux_credit: finance.getTauxInteret(),
    tricap: finance.getTricapitaux(),
    tri25: finance.getTri25(),
    van: finance.getVan(),
    subventionarray: finance.getSubventionarray(),
    pschamp,
    pschamp1,
    pschamp2,
  });
}
