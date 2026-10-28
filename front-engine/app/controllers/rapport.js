// Port de App\Controller\RapportController (src/Controller/RapportController.php) : variables du rapport
// (rapport/index.html.twig). Le rendu est fait par le Twig d'origine ; ce contrôleur calcule les mêmes variables.
// Particularités du PHP d'origine reproduites : « PHP : ».
import { floatval, div } from '../lib/php.js';

const emptyPostes = () => ({ jour: 0, ete: 0, soir: 0, nuit: 0 });
const addPostes = (into, from) => { into.jour += floatval(from.jour); into.ete += floatval(from.ete); into.soir += floatval(from.soir); into.nuit += floatval(from.nuit); };
/** PHP 7 : x / 0 vaut FALSE (affiché « » par Twig) ; sinon le quotient */
const divFalse = (a, b) => (floatval(b) === 0 ? false : floatval(a) / floatval(b));

export async function index(ctx) {
  const project = await ctx.repo.findProject(ctx.params.id);
  if (!project) return ctx.html('<h1>404 Not Found</h1>', 404);
  const finance = project.getFinance();
  const conso = project.getConsomation().getallConsomationAnnuel();

  const TarifSouscrit = project.getConsomation().getTypeTarif() ? 'Postes Horaires' : 'Uniforme';

  let degradation = null;
  if (project.getCsvProd() != null) degradation = project.getCsvProd().getDegradation();
  if (project.getPvgis() != null) degradation = project.getPvgis().getDegradation();
  if (project.getNinja() != null) degradation = project.getNinja().getDegradation();
  const deg = floatval(degradation);

  let incl = 0; let incl1 = null; let incl2 = null;
  let prd_annuel = 0; let prod25ans = 0; let ps_centrale = 0;
  let lat = 0; let lon = 0; let azimut = 0; let azimut1 = null; let azimut2 = null;
  let pschamp = null; let pschamp1 = null; let pschamp2 = null; let loss = 0;

  if (project.getPvgis() != null) {
    const r = project.getPvgis().getResult();
    for (let i = 0; i < r.length; i++) prd_annuel += floatval(r[i][1]);
    const pp = project.getPvgis().getPeakPower();
    ps_centrale = floatval(pp[0]) + floatval(pp[1]) + floatval(pp[2]);
    lat = project.getPvgis().getLat(); lon = project.getPvgis().getLon();
    const az = project.getPvgis().getAzimuth();
    azimut = az[0]; azimut1 = az[1]; azimut2 = az[2];
    const sl = project.getPvgis().getSlop();
    incl = sl[0]; incl1 = sl[1]; incl2 = sl[2];
    pschamp = pp[0]; pschamp1 = pp[1]; pschamp2 = pp[2];
    loss = project.getPvgis().getLoss();
  }
  if (project.getNinja() != null) {
    const r = project.getNinja().getResult();
    for (let i = 0; i < r.length; i++) prd_annuel += floatval(r[i][1]);
    incl1 = 0; incl2 = 0; azimut1 = 0; azimut2 = 0; pschamp = 0; pschamp1 = 0; pschamp2 = 0;
    ps_centrale = project.getNinja().getCapacity();
    lat = project.getNinja().getLat(); lon = project.getNinja().getLon();
    azimut = project.getNinja().getAzimuth();
    incl = project.getNinja().getTilt();
    loss = project.getNinja().getLoss();
  } else if (project.getCsvProd() != null) {
    incl1 = 0; incl2 = 0; azimut1 = 0; azimut2 = 0; pschamp = 0; pschamp1 = 0; pschamp2 = 0;
    const r = project.getCsvProd().getResult();
    for (let i = 0; i < r.length; i++) prd_annuel += floatval(r[i][1]);
    ps_centrale = project.getCsvProd().getPuissence();
  }
  // PHP : pow($degradation,$i)/100 (la dégradation est élevée à la puissance i)
  for (let i = 0; i < 25; i++) prod25ans += floatval(prd_annuel - (prd_annuel * (Math.pow(deg, i) / 100)));
  const productible = divFalse(prd_annuel, ps_centrale);

  const cm_annuel = []; const a_cm_annuel = []; const taux_auto = []; const factureannuel = [];
  const autconsommePHTotps = []; const ImportePHTotps = []; const consommationPHTotps = [];
  for (let j = 0; j < conso.length; j++) {
    cm_annuel[j] = 0; a_cm_annuel[j] = 0; taux_auto[j] = 0; factureannuel[j] = 0;
    autconsommePHTotps[j] = emptyPostes(); ImportePHTotps[j] = emptyPostes(); consommationPHTotps[j] = emptyPostes();
  }
  const CedePH = []; const autconsommePHTot = [];
  for (let i = 0; i < 13; i++) { CedePH[i] = emptyPostes(); autconsommePHTot[i] = emptyPostes(); }

  const cedeePH = project.getcedeePH(); const acPH = project.getauto_consomerPH();
  const imPH = project.getimporterPH(); const coPH = project.getconsomationPH();
  // multi-sites : tous les sites (0 inclus) ; mono-site : le site 0 — dans les deux cas j = 0 .. n-1
  for (let j = 0; j < conso.length; j++) for (let i = 1; i < 13; i++) addPostes(CedePH[i], cedeePH[j][i]);
  for (let j = 0; j < conso.length; j++) for (let i = 1; i < 13; i++) addPostes(autconsommePHTot[i], acPH[j][i]);
  for (let j = 0; j < conso.length; j++) {
    for (let i = 0; i < 13; i++) {
      addPostes(autconsommePHTotps[j], acPH[j][i]);
      addPostes(ImportePHTotps[j], imPH[j][i]);
      addPostes(consommationPHTotps[j], coPH[j][i]);
    }
  }

  const prPH = project.getproductionPH();
  const cedee_postH = [0, 0, 0, 0];
  for (const tmp of CedePH) { cedee_postH[0] += tmp.jour; cedee_postH[1] += tmp.ete; cedee_postH[2] += tmp.soir; cedee_postH[3] += tmp.nuit; }
  const cedee_annuel = cedee_postH[0] + cedee_postH[1] + cedee_postH[2] + cedee_postH[3];

  for (let j = 0; j < conso.length; j++) for (let i = 0; i < conso[0].length; i++) cm_annuel[j] += floatval(conso[j][i][1]);
  for (let j = 0; j < conso.length; j++) {
    a_cm_annuel[j] = autconsommePHTotps[j].jour + autconsommePHTotps[j].ete + autconsommePHTotps[j].soir + autconsommePHTotps[j].nuit;
    taux_auto[j] = div(a_cm_annuel[j], cm_annuel[j]);
  }

  if (project.getConsomation().getTypeTarif() == 0) { // eslint-disable-line eqeqeq
    for (let j = 0; j < conso.length; j++) factureannuel[j] = cm_annuel[j] * finance.getTarifUni();
  } else {
    // PHP : la facture annuelle utilise les tarifs de VENTE ('vende') appliqués à la consommation
    const vende = finance.getTarifHoraire().vende;
    for (let k = 0; k < conso.length; k++) {
      const c = [consommationPHTotps[k].jour, consommationPHTotps[k].ete, consommationPHTotps[k].soir, consommationPHTotps[k].nuit];
      for (let i = 0; i < 4; i++) factureannuel[k] += c[i] * vende[i];
    }
  }

  const f_reg = finance.getFRegularisation()[1];

  // PHP : $month[$j] = consomationPH[$j] (copie) puis ajout de 'total' : l'entité ne doit pas être modifiée
  const month = [];
  for (let j = 0; j < conso.length; j++) {
    month[j] = structuredClone(coPH[j]);
    for (let i = 0; i < 13; i++) month[j][i].total = month[j][i].jour + month[j][i].ete + month[j][i].soir + month[j][i].nuit;
  }

  const credit = finance.getCredit() ? 1 : 0;
  return ctx.render('rapport/index.html.twig', {
    cmmonth: month,
    loss,
    incl,
    incl1,
    incl2,
    f_r: f_reg,
    facture_annuel: factureannuel,
    tri: finance.getTri25(),
    co2evite: prod25ans * (0.57 / 1000),
    productible,
    prod25ans,
    azim: azimut,
    azim1: azimut1,
    azim2: azimut2,
    lat,
    lon,
    puissance_centrale: ps_centrale,
    pschamp,
    pschamp1,
    pschamp2,
    project,
    cm_annual: cm_annuel,
    finance,
    consomation: project.getConsomation(),
    T_autoC: taux_auto,
    degradation,
    T_cedee: div(cedee_annuel, prd_annuel),
    typeTarif: TarifSouscrit,
    coutproj: finance.getDepense() + finance.getCapex() - credit - finance.getSubvention(),
    lcoe: divFalse((finance.getDepense() + finance.getCapex()) - credit - finance.getSubvention(), prod25ans),
    relpin: finance.getReplinv(),
  });
}
