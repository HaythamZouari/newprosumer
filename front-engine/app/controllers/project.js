// Port de App\Controller\ProjectController (src/Controller/ProjectController.php) :
//   show (POST XHR)  : construction de la courbe de consommation d'un site
//   excelupload      : import d'une courbe de charge + semaine-type moyenne
//   suppsite / suppcc: suppression d'un site / de sa courbe importée
//   getdata (editpro): relecture de tous les réglages du projet
//
// Le code JS suit le PHP instruction par instruction (mêmes noms de variables) afin que les
// particularités du PHP d'origine soient conservées — elles sont signalées « PHP : » ci-dessous.
import { postHoraire, posteOf } from '../../src/postHoraire.js';
import { parseWorkbook } from '../../src/excelReader.js';
import { rand as phpRand } from '../lib/phpRandom.js';
import { empty, intval, floatval, round, div, explode, arrayValues, arr } from '../lib/php.js';
import { parts, parseDateTime, addYears, hourlyPeriod, dateTimeJson, nowTs } from '../lib/dates.js';

// Puissances caractéristiques par domaine d'activité : [Phd, Phf, Phm, Phad, Pham, Phn]
// (début de plage, fin, milieu, entre début et milieu, entre milieu et fin, nuit).
export const ACTIVITES = {
  Abattoir: [119, 120, 494, 360, 372, 63],
  Biscuiterie: [134, 104, 175, 209, 195, 50],
  Administrative: [404, 418, 590, 618, 632, 100],
  Extraction: [394, 336, 496, 269, 457, 19],
  Datacenter: [496, 493, 520, 510, 510, 490],
  Electromecanique: [1486, 1519, 1876, 1832, 1703, 1150],
  Frigorifique: [140, 160, 200, 140, 180, 130],
  Hotellerie: [247, 294, 308, 346, 326, 187],
  Hypermarche: [677, 676, 826, 848, 827, 416],
  Laitiere: [800, 900, 1200, 1270, 1100, 820],
  Mobilier: [118, 80, 170, 180, 90, 42],
  Plastique: [123, 122, 264, 262, 274, 115],
  Poulailler: [175, 178, 173, 165, 166, 32],
  Textile: [129, 122, 87, 120, 130, 25],
  Pharmaceutique: [47, 68, 120, 78, 92, 36],
};

// Jours fériés (jour, mois) du code d'origine : [1/1, 14/1, 20/3, 9/4, 1/5, 25/7, 13/8, 15/10]
const FERIES = [[1, 1], [14, 1], [20, 3], [9, 4], [1, 5], [25, 7], [13, 8], [15, 10]];
const isFerie = (d, m) => FERIES.some(([jj, mm]) => d === jj && m === mm);

const MAX_FILE_BYTES = 20 * 1024 * 1024; // Dropzone : maxFilesize 20 Mo

// ---------------------------------------------------------------------------
// Synthèse d'une semaine-type (7 jours × 24 h) pour une saison
// ---------------------------------------------------------------------------
/**
 * @param {object} p   { hd, hf, hm, had, ham } plage horaire de la saison
 * @param {object} s   { hdS, hfS, hmS, hadS, hamS } samedi ; { hdD, ... } dimanche
 * @param {number[]} P [Phd, Phf, Phm, Phad, Pham, Phn]
 * @param {boolean} samediOn @param {boolean} dimancheOn
 * @param {boolean} sundayUsesPham PHP : la 3e saison tire le dimanche entre Phad et **Pham** (les autres, entre Phad et Phm)
 */
function synWeek(p, sat, sun, P, samediOn, dimancheOn, sundayUsesPham, rand) {
  const [Phd, Phf, Phm, Phad, Pham, Phn] = P;
  const week = [];
  const lo = (a, b) => Math.min(a, b); const hi = (a, b) => Math.max(a, b);

  // jours ouvrés 1..5 : points caractéristiques, sinon tirage entre Phad et Phm
  for (let i = 1; i < 6; i++) {
    week[i] = [];
    for (let j = 0; j <= 23; j++) {
      if (j >= p.hd && j <= p.hf) {
        if (j === p.hd) week[i][j] = Phd;
        else if (j === p.hf) week[i][j] = Phf;
        else if (j === p.hm) week[i][j] = Phm;
        else if (j === p.had) week[i][j] = Phad;
        else if (j === p.ham) week[i][j] = Pham;
        else week[i][j] = rand(Phad, Phm);
      } else week[i][j] = Phn;
    }
  }

  // PHP : samedi/dimanche utilisent une suite de `if` indépendants suivie d'un `else` qui ne se
  // rattache QU'AU DERNIER `if` ($j==$ham) : toute heure de la plage autre que « ham » est donc tirée
  // au hasard (les valeurs Phd/Phf/Phm/Phad affectées avant sont écrasées).
  const weekend = (idx, w, on, useHi) => {
    week[idx] = [];
    for (let j = 0; j <= 23; j++) {
      if (on && j >= w.hd && j <= w.hf) {
        if (j === w.ham) week[idx][j] = Pham;
        else week[idx][j] = rand(lo(Phad, useHi), hi(Phad, useHi));
      } else week[idx][j] = Phn;
    }
  };
  weekend(6, sat, samediOn, Phm);
  weekend(0, sun, dimancheOn, sundayUsesPham ? Pham : Phm);
  return week;
}

/** Points caractéristiques d'une plage horaire [hd, hf] : milieu et quarts (round de PHP). */
function plage(hd, hf) {
  const hm = round((hd + hf) / 2);
  return { hd, hf, hm, had: round((hd + hm) / 2), ham: round((hf + hm) / 2) };
}

/** Rééchelonne la courbe horaire par poste tarifaire : $data[i][1] *= $month[mois][poste]. */
function scaleByPoste(data, month) {
  for (let i = 0; i < data.length; i++) {
    const p = parts(data[i][0]);
    data[i][1] *= month[p.m][posteOf(data[i][0])];
  }
}

// ---------------------------------------------------------------------------
// show() — branche XHR : construit et enregistre la courbe de consommation d'un site
// ---------------------------------------------------------------------------
export async function show(ctx) {
  const { request, repo, session, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  const rand = ctx.services.rand || phpRand;

  const consomation = project.getConsomation();
  const cp = (a) => [...arr(a)]; // copie par valeur d'un tableau PHP
  let allDateDeb = cp(consomation.getallDateDeb());
  let allDateFin = cp(consomation.getallDateFin());
  let allDataAvgW = cp(consomation.getallConsomationAnnuel());
  let allTarif = cp(consomation.getTabTarif());
  let allcm_month = cp(consomation.getallCmMonth());
  const allActivite = cp(consomation.getActivite());
  const allDateconge_deb = cp(consomation.getDatecongeDeb());
  const allDateconge_deb1 = cp(consomation.getDatecongeDeb1());
  const allDateconge_deb2 = cp(consomation.getDatecongeDeb2());
  const allDateconge_fin = cp(consomation.getDatecongeFin());
  const allDateconge_fin1 = cp(consomation.getDatecongeFin1());
  const allDateconge_fin2 = cp(consomation.getDatecongeFin2());
  const allHourSlider1 = cp(consomation.getHourSlider1());
  const allHourSlider2 = cp(consomation.getHourSlider2());
  const allHourSlider3 = cp(consomation.getHourSlider3());
  const allHourSlider_dimanche = cp(consomation.getHourSliderDimanche());
  const allHourSlider_samedi = cp(consomation.getHourSliderSamedi());
  const allMonthSlider1 = cp(consomation.getMonthSlider1());
  const allMonthSlider2 = cp(consomation.getMonthSlider2());
  const allMonthSlider3 = cp(consomation.getMonthSlider3());
  const allSaison = cp(consomation.getSaison());
  const allCongeCheck = cp(consomation.getCongeCheck());
  const allDimancheCheck = cp(consomation.getDimancheCheck());
  const allSamediCheck = cp(consomation.getSamediCheck());
  const allVershoraire = cp(consomation.getVershoraire());
  const allFerieCheck = cp(consomation.getFerieCheck());

  const dateDebTs = parseDateTime(request.get('dateDeb'));
  const dateDebForm = request.get('dateDeb');
  const dateFinTs = addYears(dateDebTs, 1); // new DateTime(dateDeb)->add(P1Y)
  const avgweek = arr(consomation.getAvgweek());
  const dataexl = session.get('data');
  const activite = request.get('activite');
  const dimancheCheck = request.get('dimancheCheck');
  const hourSlider_dimanche = request.get('hourSlider_dimanche');
  const hourSlider_samedi = request.get('hourSlider_samedi');
  const hourSlider1 = request.get('hourSlider1');
  const hourSlider2 = request.get('hourSlider2');
  const hourSlider3 = request.get('hourSlider3');
  const monthSlider1 = request.get('monthSlider1');
  const monthSlider2 = request.get('monthSlider2');
  const monthSlider3 = request.get('monthSlider3');
  const saison = request.get('saison');
  const samediCheck = request.get('samediCheck');
  // PHP : new DateTime('') / new DateTime(null) valent « maintenant » (aucune période de congé saisie)
  const dateconge_deb = parseDateTime(request.get('dateconge_deb'));
  const dateconge_fin = parseDateTime(request.get('dateconge_fin'));
  const dateconge_deb1 = parseDateTime(request.get('dateconge_deb1'));
  const dateconge_fin1 = parseDateTime(request.get('dateconge_fin1'));
  const dateconge_deb2 = parseDateTime(request.get('dateconge_deb2'));
  const dateconge_fin2 = parseDateTime(request.get('dateconge_fin2'));
  const number = intval(request.get('number'));
  const allUrlCcv = cp(consomation.getallUrlCcv());
  const FerieCheck = request.get('ferieCheck');

  if (empty(allUrlCcv[number])) allUrlCcv[number] = '';
  consomation.setallUrlCcv(allUrlCcv);
  if (empty(allDataAvgW[number])) allDataAvgW[number] = [];

  allActivite[number] = request.get('activite');
  allDateconge_deb[number] = request.get('dateconge_deb');
  allDateconge_deb1[number] = request.get('dateconge_deb1');
  allDateconge_deb2[number] = request.get('dateconge_deb2');
  allDateconge_fin[number] = request.get('dateconge_fin');
  allDateconge_fin1[number] = request.get('dateconge_fin1');
  allDateconge_fin2[number] = request.get('dateconge_fin2');
  allHourSlider1[number] = hourSlider1;
  allHourSlider2[number] = hourSlider2;
  allHourSlider3[number] = hourSlider3;
  allHourSlider_dimanche[number] = hourSlider_dimanche;
  allHourSlider_samedi[number] = hourSlider_samedi;
  allMonthSlider1[number] = monthSlider1;
  allMonthSlider2[number] = monthSlider2;
  allMonthSlider3[number] = monthSlider3;
  allSaison[number] = saison;
  allCongeCheck[number] = request.get('congeCheck');
  allDimancheCheck[number] = dimancheCheck;
  allSamediCheck[number] = samediCheck;
  allVershoraire[number] = request.get('vershoraire');
  allFerieCheck[number] = FerieCheck;

  consomation.setActivite(allActivite);
  consomation.setDatecongeDeb(allDateconge_deb);
  consomation.setDatecongeDeb1(allDateconge_deb1);
  consomation.setDatecongeDeb2(allDateconge_deb2);
  consomation.setDatecongeFin(allDateconge_fin);
  consomation.setDatecongeFin1(allDateconge_fin1);
  consomation.setDatecongeFin2(allDateconge_fin2);
  consomation.setHourSlider1(allHourSlider1);
  consomation.setHourSlider2(allHourSlider2);
  consomation.setHourSlider3(allHourSlider3);
  consomation.setHourSliderDimanche(allHourSlider_dimanche);
  consomation.setHourSliderSamedi(allHourSlider_samedi);
  consomation.setMonthSlider1(allMonthSlider1);
  consomation.setMonthSlider2(allMonthSlider2);
  consomation.setMonthSlider3(allMonthSlider3);
  consomation.setSaison(allSaison);
  consomation.setCongeCheck(allCongeCheck);
  consomation.setDimancheCheck(allDimancheCheck);
  consomation.setSamediCheck(allSamediCheck);
  consomation.setVershoraire(allVershoraire);
  consomation.setFerieCheck(allFerieCheck);

  const period = hourlyPeriod(dateDebTs, dateFinTs); // CarbonPeriod 'y-m-d' + PT1H, début exclu
  let dataAvgW = [];
  let dataAvgWtm = [];
  let monthtmp;

  const siteAvg = avgweek[number];
  // PHP : empty($avgweek[$number][0][0][0]) — vrai aussi quand la 1re valeur est 0 (dimanche minuit à 0 kW)
  if (empty(siteAvg && siteAvg[0] && siteAvg[0][0] && siteAvg[0][0][0])) {
    // ------------------------- mode « activité » : courbe synthétique -------------------------
    let hourSliderreq1 = explode(',', hourSlider1);
    let hourSliderreq2 = explode(',', hourSlider2);
    let hourSliderreq3 = explode(',', hourSlider3);
    const hourSliderreqS = explode(',', hourSlider_samedi);
    const hourSliderreqD = explode(',', hourSlider_dimanche);
    let monthSliderreq1 = explode(',', monthSlider1);
    let monthSliderreq2 = explode(',', monthSlider2);
    let monthSliderreq3 = explode(',', monthSlider3);

    // PHP : 1 saison -> les saisons 2 et 3 sont neutralisées ; 2 saisons -> la 3e l'est
    if (saison == 1) { hourSliderreq2 = [24, 24]; hourSliderreq3 = [24, 24]; monthSliderreq2 = [24, 24]; monthSliderreq3 = [24, 24]; } // eslint-disable-line eqeqeq
    else if (saison == 2) { hourSliderreq3 = [24, 24]; monthSliderreq3 = [24, 24]; } // eslint-disable-line eqeqeq

    const P = ACTIVITES[activite] || [0, 0, 0, 0, 0, 0];
    const Phn = P[5];
    // PHP : les comparaisons `$hourSliderreqN=="Minuit"` portent sur un tableau et sont toujours fausses ;
    // « Minuit » est converti en 0 par le (int) ci-dessous.
    const sat = plage(intval(hourSliderreqS[0]), intval(hourSliderreqS[1]));
    const dim = plage(intval(hourSliderreqD[0]), intval(hourSliderreqD[1]));
    const sw1 = synWeek(plage(intval(hourSliderreq1[0]), intval(hourSliderreq1[1])), sat, dim, P, samediCheck === 'on', dimancheCheck === 'on', false, rand);
    const sw2 = synWeek(plage(intval(hourSliderreq2[0]), intval(hourSliderreq2[1])), sat, dim, P, samediCheck === 'on', dimancheCheck === 'on', false, rand);
    const sw3 = synWeek(plage(intval(hourSliderreq3[0]), intval(hourSliderreq3[1])), sat, dim, P, samediCheck === 'on', dimancheCheck === 'on', true, rand);

    const dataSynW = [];
    for (const ts of period) {
      const p = parts(ts);
      let v;
      if (p.m >= floatval(monthSliderreq1[0]) && p.m <= floatval(monthSliderreq1[1])) v = sw1[p.w][p.H];
      else if (p.m >= floatval(monthSliderreq2[0]) && p.m <= floatval(monthSliderreq2[1])) v = sw2[p.w][p.H];
      else v = sw3[p.w][p.H];
      dataSynW.push([ts, v]);
    }

    // congés / jours fériés
    // PHP : les deux premiers `if` sont indépendants, le `else` ne se rattache qu'au 3e : les jours
    // fériés ne sont appliqués que hors de la 3e période de congé.
    // PHP : `for ($i=0; $i<count($dataSynW); $i++)` avec `unset` du 29 février — count() diminue à chaque
    // suppression, la boucle s'arrête donc avant la fin : les (24 × nb de 29/02) dernières heures ne sont
    // ni mises en congé ni traitées comme fériées (visible sur une simulation à cheval sur une année bissextile).
    const removed = new Set();
    let count = dataSynW.length;
    for (let i = 0; i < count; i++) {
      const ts = dataSynW[i][0];
      const p = parts(ts);
      if (ts >= dateconge_deb && ts <= dateconge_fin) dataSynW[i][1] = Phn;
      if (ts >= dateconge_deb1 && ts <= dateconge_fin1) dataSynW[i][1] = Phn;
      if (ts >= dateconge_deb2 && ts <= dateconge_fin2) dataSynW[i][1] = Phn;
      else if (FerieCheck !== 'on' && isFerie(p.d, p.m)) dataSynW[i][1] = Phn;
      if (p.d === 29 && p.m === 2) { removed.add(i); count--; }
    }
    const kept = dataSynW.filter((_, i) => !removed.has(i));
    let data = kept;

    if (request.get('tarif') == 0) { // eslint-disable-line eqeqeq
      const monthp = request.get('date') || {};
      let month = new Array(13).fill(0);
      for (const item of data) month[parts(item[0]).m] += item[1];
      monthtmp = [...month];
      for (let i = 1; i < 13; i++) month[i] = monthtmp[i] == 0 ? 0 : div(floatval(monthp[i]), month[i]); // eslint-disable-line eqeqeq
      dataAvgWtm = data.map((x) => [x[0], x[1]]);
      for (let i = 0; i < data.length; i++) data[i][1] *= month[parts(data[i][0]).m];
      consomation.setCmMonth(postHoraire(data));
      allcm_month[number] = request.get('date');
      dataAvgW = data;
    } else {
      const monthp = request.get('datehoraire') || {};
      dataAvgWtm = data.map((x) => [x[0], x[1]]);
      const month = postHoraire(data);
      monthtmp = month;
      consomation.setCmMonth(month.map((o) => ({ ...o })));
      allcm_month[number] = request.get('datehoraire');
      const ratio = month.map((o) => ({ ...o }));
      for (let i = 1; i < 13; i++) {
        ratio[i].jour = div(monthp.jour && monthp.jour[i], month[i].jour);
        ratio[i].nuit = div(monthp.nuit && monthp.nuit[i], month[i].nuit);
        ratio[i].soir = div(monthp.soir && monthp.soir[i], month[i].soir);
        if (i > 5 && i < 9) ratio[i].ete = div(monthp.ete && monthp.ete[i], month[i].ete);
      }
      scaleByPoste(data, ratio);
      dataAvgW = data;
    }
  } else {
    // ------------------------- mode « fichier » : données + semaine-type moyenne -------------------------
    const exl = arr(dataexl);
    let i = 0;
    for (const ts of period) {
      if (exl.length && ts >= exl[i][0] - 1000 && ts <= exl[i][0] + 1000 && i < exl.length - 1) {
        dataAvgW.push([ts, exl[i][1]]);
        i++;
      } else {
        const p = parts(ts);
        const season = p.m > 5 && p.m < 9 ? 0 : 1;
        dataAvgW.push([ts, siteAvg[season][p.w][p.H]]);
      }
    }
    dataAvgWtm = dataAvgW.map((x) => [x[0], x[1]]);

    // jours fériés : profil du dimanche (d'hiver, sauf 25/7 et 13/8 : d'été) ; 29/2 supprimé
    // PHP : même boucle à `count()` décroissant que ci-dessus (arrêt prématuré après un 29 février)
    const removed = new Set();
    let count = dataAvgW.length;
    for (let k = 0; k < count; k++) {
      const p = parts(dataAvgW[k][0]);
      if ((p.d === 1 && p.m === 1) || (p.d === 14 && p.m === 1) || (p.d === 20 && p.m === 3)
        || (p.d === 9 && p.m === 4) || (p.d === 1 && p.m === 5) || (p.d === 15 && p.m === 10)) {
        dataAvgW[k][1] = siteAvg[1][0][p.H];
      } else if ((p.d === 25 && p.m === 7) || (p.d === 13 && p.m === 8)) {
        dataAvgW[k][1] = siteAvg[0][0][p.H];
      } else if (p.d === 29 && p.m === 2) { removed.add(k); count--; }
    }
    const out = dataAvgW.filter((_, k) => !removed.has(k));
    dataAvgW = out;

    if (request.get('tarif') == 0) { // eslint-disable-line eqeqeq
      const monthp = request.get('date') || {};
      const month = new Array(13).fill(0);
      for (const item of dataAvgW) month[parts(item[0]).m] += item[1];
      monthtmp = [...month];
      for (let m = 1; m < 13; m++) month[m] = monthtmp[m] == 0 ? 0 : div(floatval(monthp[m]), month[m]); // eslint-disable-line eqeqeq
      dataAvgWtm = dataAvgW.map((x) => [x[0], x[1]]);
      for (let k = 0; k < dataAvgW.length; k++) dataAvgW[k][1] *= month[parts(dataAvgW[k][0]).m];
      consomation.setCmMonth(postHoraire(dataAvgW));
      allcm_month[number] = request.get('date');
    } else {
      const monthp = request.get('datehoraire') || {};
      dataAvgWtm = dataAvgW.map((x) => [x[0], x[1]]);
      const month = postHoraire(dataAvgW);
      monthtmp = month;
      consomation.setCmMonth(month.map((o) => ({ ...o })));
      allcm_month[number] = request.get('datehoraire');
      const ratio = month.map((o) => ({ ...o }));
      for (let m = 1; m < 13; m++) {
        ratio[m].jour = div(monthp.jour && monthp.jour[m], month[m].jour);
        ratio[m].nuit = div(monthp.nuit && monthp.nuit[m], month[m].nuit);
        ratio[m].soir = div(monthp.soir && monthp.soir[m], month[m].soir);
        if (m > 5 && m < 9) ratio[m].ete = div(monthp.ete && monthp.ete[m], month[m].ete);
      }
      scaleByPoste(dataAvgW, ratio);
    }
  }

  consomation.setTransportEng(request.get('transport_energie') !== null);
  // PHP : `(vershoraire <> null) & (tarif == 0)` (ET binaire, sans court-circuit)
  const tarif = request.get('tarif');
  if (request.get('vershoraire') !== null && tarif == 0) consomation.setTypeTarif(true); // eslint-disable-line eqeqeq
  else consomation.setTypeTarif(tarif !== null && tarif != 0); // eslint-disable-line eqeqeq

  allDateDeb[number] = dateTimeJson(dateDebTs);
  allDateFin[number] = dateTimeJson(dateFinTs);
  allDataAvgW[number] = dataAvgW;
  allTarif[number] = tarif;

  consomation.setallDateDeb(allDateDeb);
  consomation.setDateDeb(dateTimeJson(dateDebTs));
  consomation.setDateDebForm(dateDebForm);
  consomation.setallDateFin(allDateFin);
  consomation.setDateFin(dateTimeJson(dateFinTs));
  consomation.setallConsomationAnnuel(allDataAvgW);
  consomation.setConsomationAnnuel(dataAvgW);
  consomation.setTabTarif(allTarif);
  consomation.setallCmMonth(allcm_month);

  const alldata1 = consomation.getallConsomationAnnuel();
  consomation.project = project;
  project.setConsomation(consomation);
  await repo.saveProject(project);

  const exl0 = arr(dataexl);
  return ctx.json({
    tabTarif: consomation.getTabTarif(),
    allCmMonth: consomation.getallCmMonth(),
    virgdata: dataAvgW,
    data: dataAvgWtm,
    data2: monthtmp,
    dataexl: round(exl0[0] ? exl0[0][0] : 0),
    period: period.length ? period[period.length - 1] : nowTs(),
    newdata: dataAvgW,
    alldata: allDataAvgW,
    nbre: allDateDeb.length,
    alldata1,
    allActivite,
  });
}

// ---------------------------------------------------------------------------
// excelupload — import d'une courbe de charge (Dropzone) + semaine-type moyenne
// ---------------------------------------------------------------------------
const uniqid = () => Date.now().toString(16).padStart(8, '0') + Math.floor(Math.random() * 0xfffff).toString(16).padStart(5, '0');

/** FileUpload::upload : nom = <nom sans extension>-<uniqid>.<extension> ; le fichier est conservé. */
export async function storeUpload(repo, file, uid = uniqid) {
  const dot = file.name.lastIndexOf('.');
  const base = dot < 0 ? file.name : file.name.slice(0, dot);
  const ext = dot < 0 ? '' : file.name.slice(dot + 1);
  const fileName = `${base}-${uid()}${ext ? '.' + ext : ''}`;
  await repo.b.put('kv', { name: file.name, type: file.type || '', buf: await file.arrayBuffer() }, `file:${fileName}`);
  return fileName;
}

export async function excelupload(ctx) {
  const { request, repo, session, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  const file = request.files.file;
  if (!file) return ctx.json({ error: 'Aucun fichier' }, 400);
  if (file.size > MAX_FILE_BYTES) return ctx.json({ error: 'Fichier trop volumineux' }, 413);

  const filePath = await storeUpload(repo, file, ctx.services.uniqid || uniqid);
  const XLSX = await ctx.services.xlsx();
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', raw: true });
  const data = parseWorkbook(XLSX, wb); // ExcelReader::createDataFromSpreadsheet

  const dateDebexl = data[0][0];
  const dateFinexl = data[data.length - 1][0];
  session.set('dateDebExl', dateDebexl);
  session.set('dateFinExl', dateFinexl);

  // $factor[2][7] = [24] ; $tarifUni[2][7] = [24] : éléments parasites conservés par le PHP
  const grid = () => [[...Array(7)].map(() => new Array(24).fill(0)), [...Array(7)].map(() => new Array(24).fill(0)), { 7: [24] }];
  const factor = grid();
  const tarifUni = grid();
  for (const datum of data) {
    const p = parts(datum[0]);
    const s = p.m > 5 && p.m < 9 ? 0 : 1; // été (juin-août) / reste de l'année
    tarifUni[s][p.w][p.H] += intval(datum[1]); // PHP : (int)$datum[1]
    factor[s][p.w][p.H]++;
  }
  const tariftmp = JSON.parse(JSON.stringify(tarifUni));
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= 23; j++) {
      if (factor[0][i][j] === 0) factor[0][i][j] = factor[1][i][j];
      if (tarifUni[0][i][j] === 0) tarifUni[0][i][j] = tarifUni[1][i][j];
      if (factor[1][i][j] === 0) factor[1][i][j] = factor[0][i][j];
      if (tarifUni[1][i][j] === 0) tarifUni[1][i][j] = tarifUni[0][i][j];
    }
  }
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= 23; j++) {
      tarifUni[0][i][j] = div(tarifUni[0][i][j], factor[0][i][j]);
      tarifUni[1][i][j] = div(tarifUni[1][i][j], factor[1][i][j]);
    }
  }

  const number = intval(request.get('number'));
  const consomation = project.getConsomation();
  const allAvgweek = [...arr(consomation.getAvgweek())];
  const allUrlCcv = [...arr(consomation.getallUrlCcv())];
  allUrlCcv[number] = filePath;
  allAvgweek[number] = tarifUni;
  consomation.setAvgweek(allAvgweek);
  consomation.url_ccv = consomation.url_ccv === null ? '' : consomation.url_ccv;
  consomation.setUrlCcv(filePath);
  consomation.setallUrlCcv(allUrlCcv);
  await repo.saveProject(project);
  session.set('data', data);

  return ctx.json({ data: consomation.getAvgweek(), factor, somme: tariftmp, info: data, tt: dateDebexl });
}

// ---------------------------------------------------------------------------
// suppsite — supprime un site de consommation (et tout ce qui en dérive)
// ---------------------------------------------------------------------------
export async function suppsite(ctx) {
  const { request, repo, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  const number = intval(request.get('number'));
  const c = project.getConsomation();
  const drop = (a) => { const x = [...arr(a)]; x.splice(number, 1); return arrayValues(x); }; // unset + array_values

  c.setAvgweek(drop(c.getAvgweek()));
  c.setallDateDeb(drop(c.getallDateDeb()));
  c.setallDateFin(drop(c.getallDateFin()));
  c.setallConsomationAnnuel(drop(c.getallConsomationAnnuel()));
  c.setTabTarif(drop(c.getTabTarif()));
  c.setallCmMonth(drop(c.getallCmMonth()));
  c.setActivite(drop(c.getActivite()));
  c.setDatecongeDeb(drop(c.getDatecongeDeb()));
  c.setDatecongeDeb1(drop(c.getDatecongeDeb1()));
  c.setDatecongeDeb2(drop(c.getDatecongeDeb2()));
  c.setDatecongeFin(drop(c.getDatecongeFin()));
  c.setDatecongeFin1(drop(c.getDatecongeFin1()));
  c.setDatecongeFin2(drop(c.getDatecongeFin2()));
  c.setHourSlider1(drop(c.getHourSlider1()));
  c.setHourSlider2(drop(c.getHourSlider2()));
  c.setHourSlider3(drop(c.getHourSlider3()));
  c.setHourSliderDimanche(drop(c.getHourSliderDimanche()));
  c.setHourSliderSamedi(drop(c.getHourSliderSamedi()));
  c.setMonthSlider1(drop(c.getMonthSlider1()));
  c.setMonthSlider2(drop(c.getMonthSlider2()));
  c.setMonthSlider3(drop(c.getMonthSlider3()));
  c.setSaison(drop(c.getSaison()));
  c.setCongeCheck(drop(c.getCongeCheck()));
  c.setDimancheCheck(drop(c.getDimancheCheck()));
  c.setSamediCheck(drop(c.getSamediCheck()));
  c.setVershoraire(drop(c.getVershoraire()));
  c.setFerieCheck(drop(c.getFerieCheck()));
  c.setallUrlCcv(drop(c.getallUrlCcv()));

  // les résultats dérivés doivent être recalculés
  project.setconsomationPH([]); project.setproductionPH([]); project.setauto_consomerPH([]);
  project.setimporterPH([]); project.setcedeePH([]); project.setinjectPH([]);
  project.setinject([]); project.setAutoConsomer([]); project.setCedee([]); project.setImporte([]);

  c.project = project;
  project.setConsomation(c);
  await repo.saveProject(project);
  return ctx.json({ avg: c.getAvgweek(), cm: c.getallCmMonth(), aut: project.getAutoConsomer(), ced: project.getCedee(), imp: project.getImporte() });
}

// suppcc — supprime la courbe importée d'un site
export async function suppcc(ctx) {
  const { request, repo, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  const number = intval(request.get('number'));
  const c = project.getConsomation();
  const avgweek = [...arr(c.getAvgweek())];
  const allUrlCcv = [...arr(c.getallUrlCcv())];
  avgweek[number] = [];
  allUrlCcv[number] = '';
  c.setAvgweek(avgweek);
  c.setallUrlCcv(allUrlCcv);
  c.project = project;
  project.setConsomation(c);
  await repo.saveProject(project);
  return ctx.json({ avg: c.getAvgweek() });
}

// ---------------------------------------------------------------------------
// getdata (editpro) — relit tous les réglages du projet pour préremplir les formulaires
// ---------------------------------------------------------------------------
export async function getdata(ctx) {
  const { repo, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  const c = project.getConsomation();

  let srcprod = 0;
  let pv;
  if (project.getPvgis() != null) {
    srcprod = 1;
    const g = project.getPvgis();
    pv = { lat: g.getLat(), azimuth: g.getAzimuth(), lon: g.getLon(), loss: g.getLoss(), mount: g.getMountingType(), power: g.getPeakPower(), pvtech: g.getPvTech(), deg: g.getDegradation(), slop: g.getSlop() };
  } else {
    pv = { lat: 36, azimuth: [0, 0, 0], lon: 10, loss: 14, mount: 0, power: [0, 0, 0], pvtech: '', deg: 0.5, slop: [30, 30, 30] };
  }

  let nj;
  if (project.getNinja() != null) {
    srcprod = 2;
    const n = project.getNinja();
    nj = { lat_n: n.getLat(), azimuth_n: n.getAzimuth(), lon_n: n.getLon(), loss_n: n.getLoss(), track_n: n.getTracking(), capacity: n.getCapacity(), radd_n: n.getRaddatabase(), tilt_n: n.getTilt(), deg_n: n.getDegradation() };
  } else {
    nj = { lat_n: 36, azimuth_n: 0, lon_n: 10, loss_n: 14, track_n: 0, capacity: 0, radd_n: '', tilt_n: 30, deg_n: 0.5 };
  }

  let csv;
  if (project.getCsvProd() != null) {
    srcprod = 3;
    const cp = project.getCsvProd();
    csv = { deg_c: cp.getDegradation(), pui_c: cp.getPuissence(), path_c: cp.getPath() };
  } else csv = { deg_c: 0.5, pui_c: 0, path_c: '' };

  let fin;
  if (project.getFinance() != null) {
    const f = project.getFinance();
    // PHP : `getCredit() != null` — false, 0 et '' sont égaux à null en comparaison lâche
    const cr = f.getCredit();
    const credited = !(cr === null || cr === undefined || cr === false || cr === 0 || cr === '');
    fin = {
      dette: credited ? f.getMontantDette() : 0, interet: credited ? f.getTauxInteret() : 0,
      grace: credited ? f.getDelaiGrace() : 0, matur: credited ? f.getMaturiteProj() : 0,
      capex: f.getCapex(), atachat: f.getAugTarifAchat(), atvente: f.getAugTarifVende(), duree: f.getDureeProj(),
      opex: f.getOpex(), sub: f.getSubvention(), actu: f.getTauxActualisation(), credit: f.getCredit(),
    };
  } else {
    fin = { dette: 0, interet: 9, grace: 0, matur: 7, capex: 1000, atachat: 7, atvente: 5, duree: 25, opex: 1, sub: 0, actu: 8, credit: 0 };
  }

  return ctx.json({
    tabTarif: c.getTabTarif(), allCmMonth: c.getallCmMonth(), allActivite: c.getActivite(),
    allDateconge_deb: c.getDatecongeDeb(), allDateconge_deb1: c.getDatecongeDeb1(), allDateconge_deb2: c.getDatecongeDeb2(),
    allDateconge_fin: c.getDatecongeFin(), allDateconge_fin1: c.getDatecongeFin1(), allDateconge_fin2: c.getDatecongeFin2(),
    allHourSlider1: c.getHourSlider1(), allHourSlider2: c.getHourSlider2(), allHourSlider3: c.getHourSlider3(),
    allHourSlider_dimanche: c.getHourSliderDimanche(), allHourSlider_samedi: c.getHourSliderSamedi(),
    allMonthSlider1: c.getMonthSlider1(), allMonthSlider2: c.getMonthSlider2(), allMonthSlider3: c.getMonthSlider3(),
    allSaison: c.getSaison(), allCongeCheck: c.getCongeCheck(), allDimancheCheck: c.getDimancheCheck(),
    allSamediCheck: c.getSamediCheck(), allVershoraire: c.getVershoraire(), transport: c.getTransportEng(),
    datedeb: c.getDateDeb(), urlccv: c.getallUrlCcv(), datedebform: c.getDateDebForm(), allFerieCheck: c.getFerieCheck(),
    lat: pv.lat, azimuth: pv.azimuth, lon: pv.lon, loss: pv.loss, mount: pv.mount, power: pv.power, pvtech: pv.pvtech, deg: pv.deg, slop: pv.slop,
    lat_n: nj.lat_n, azimuth_n: nj.azimuth_n, lon_n: nj.lon_n, loss_n: nj.loss_n, track_n: nj.track_n,
    capacity_n: nj.track_n, // PHP : 'capacity_n' => $getTracking_n (champ erroné conservé)
    radd_n: nj.radd_n, tilt_n: nj.tilt_n, deg_n: nj.deg_n,
    deg_c: csv.deg_c, pui_c: csv.pui_c, path_c: csv.path_c,
    srcprod,
    capex: fin.capex, atachat: fin.atachat, atvente: fin.atvente, duree: fin.duree, opex: fin.opex, sub: fin.sub, actu: fin.actu,
    credit: fin.credit, dette: fin.dette, interet: fin.interet, grace: fin.grace, matur: fin.matur,
  });
}
