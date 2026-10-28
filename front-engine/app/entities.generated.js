// FICHIER GÉNÉRÉ par build/gen-entities.mjs à partir de src/Entity/*.php — ne pas éditer à la main.
// Les classes reprennent les noms de getters/setters des entités Doctrine d'origine.

export class Consomation {
  constructor() {
    this.id = null;
    this.allDateDeb = [];
    this.allDateFin = [];
    this.allConsomation_annuel = [];
    this.allTarif = [];
    this.transportEng = null;
    this.dateDeb = null;
    this.dateFin = null;
    this.consomation_annuel = [];
    this.url_ccv = null;
    this.allurl_ccv = null;
    this.type_tarif = null;
    this.project = null;
    this.cm_month = [];
    this.allcm_month = [];
    this.avgweek = [];
    this.Activite = [];
    this.Dateconge_deb = [];
    this.Dateconge_deb1 = [];
    this.Dateconge_deb2 = [];
    this.Dateconge_fin = [];
    this.Dateconge_fin1 = [];
    this.Dateconge_fin2 = [];
    this.HourSlider1 = [];
    this.HourSlider2 = [];
    this.HourSlider3 = [];
    this.HourSlider_dimanche = [];
    this.HourSlider_samedi = [];
    this.MonthSlider1 = [];
    this.MonthSlider2 = [];
    this.MonthSlider3 = [];
    this.Saison = [];
    this.congeCheck = [];
    this.dimancheCheck = [];
    this.samediCheck = [];
    this.vershoraire = [];
    this.dateDebForm = null;
    this.ferieCheck = [];
    this.transportEng = false;
  }
  getId() { return this.id; }
  getallDateDeb() { return this.allDateDeb; }
  setallDateDeb(allDateDeb) { this.allDateDeb = allDateDeb; return this; }
  getallDateFin() { return this.allDateFin; }
  setallDateFin(allDateFin) { this.allDateFin = allDateFin; return this; }
  getallConsomationAnnuel() { return this.allConsomation_annuel; }
  setallConsomationAnnuel(allConsomation_annuel) { this.allConsomation_annuel = allConsomation_annuel; return this; }
  getTabTarif() { return this.allTarif; }
  setTabTarif(allTarif) { this.allTarif = allTarif; return this; }
  getTransportEng() { return this.transportEng; }
  setTransportEng(transportEng) { this.transportEng = transportEng; return this; }
  getDateDeb() { return this.dateDeb; }
  setDateDeb(dateDeb) { this.dateDeb = dateDeb; return this; }
  getDateFin() { return this.dateFin; }
  setDateFin(dateFin) { this.dateFin = dateFin; return this; }
  getConsomationAnnuel() { return this.consomation_annuel; }
  setConsomationAnnuel(consomation_annuel) { this.consomation_annuel = consomation_annuel; return this; }
  getUrlCcv() { return this.url_ccv; }
  setUrlCcv(url_ccv) { this.url_ccv = this.url_ccv + "///" + url_ccv; return this; }
  getallUrlCcv() { return this.allurl_ccv; }
  setallUrlCcv(allurl_ccv) { this.allurl_ccv = allurl_ccv; return this; }
  getTypeTarif() { return this.type_tarif; }
  setTypeTarif(type_tarif) { this.type_tarif = type_tarif; return this; }
  getProject() { return this.project; }
  setProject(project) { this.project = project; if (project !== null && project.getConsomation() !== this) project.setConsomation(this); return this; }
  getCmMonth() { return this.cm_month; }
  setCmMonth(cm_month) { this.cm_month = cm_month; return this; }
  getallCmMonth() { return this.allcm_month; }
  setallCmMonth(allcm_month) { this.allcm_month = allcm_month; return this; }
  getAvgweek() { return this.avgweek; }
  setAvgweek(avgweek) { this.avgweek = avgweek; return this; }
  getActivite() { return this.Activite; }
  setActivite(Activite) { this.Activite = Activite; return this; }
  getDatecongeDeb() { return this.Dateconge_deb; }
  setDatecongeDeb(Dateconge_deb) { this.Dateconge_deb = Dateconge_deb; return this; }
  getDatecongeDeb1() { return this.Dateconge_deb1; }
  setDatecongeDeb1(Dateconge_deb1) { this.Dateconge_deb1 = Dateconge_deb1; return this; }
  getDatecongeDeb2() { return this.Dateconge_deb2; }
  setDatecongeDeb2(Dateconge_deb2) { this.Dateconge_deb2 = Dateconge_deb2; return this; }
  getDatecongeFin() { return this.Dateconge_fin; }
  setDatecongeFin(Dateconge_fin) { this.Dateconge_fin = Dateconge_fin; return this; }
  getDatecongeFin1() { return this.Dateconge_fin1; }
  setDatecongeFin1(Dateconge_fin1) { this.Dateconge_fin1 = Dateconge_fin1; return this; }
  getDatecongeFin2() { return this.Dateconge_fin2; }
  setDatecongeFin2(Dateconge_fin2) { this.Dateconge_fin2 = Dateconge_fin2; return this; }
  getHourSlider1() { return this.HourSlider1; }
  setHourSlider1(HourSlider1) { this.HourSlider1 = HourSlider1; return this; }
  getHourSlider2() { return this.HourSlider2; }
  setHourSlider2(HourSlider2) { this.HourSlider2 = HourSlider2; return this; }
  getHourSlider3() { return this.HourSlider3; }
  setHourSlider3(HourSlider3) { this.HourSlider3 = HourSlider3; return this; }
  getHourSliderDimanche() { return this.HourSlider_dimanche; }
  setHourSliderDimanche(HourSlider_dimanche) { this.HourSlider_dimanche = HourSlider_dimanche; return this; }
  getHourSliderSamedi() { return this.HourSlider_samedi; }
  setHourSliderSamedi(HourSlider_samedi) { this.HourSlider_samedi = HourSlider_samedi; return this; }
  getMonthSlider1() { return this.MonthSlider1; }
  setMonthSlider1(MonthSlider1) { this.MonthSlider1 = MonthSlider1; return this; }
  getMonthSlider2() { return this.MonthSlider2; }
  setMonthSlider2(MonthSlider2) { this.MonthSlider2 = MonthSlider2; return this; }
  getMonthSlider3() { return this.MonthSlider3; }
  setMonthSlider3(MonthSlider3) { this.MonthSlider3 = MonthSlider3; return this; }
  getSaison() { return this.Saison; }
  setSaison(Saison) { this.Saison = Saison; return this; }
  getCongeCheck() { return this.congeCheck; }
  setCongeCheck(congeCheck) { this.congeCheck = congeCheck; return this; }
  getDimancheCheck() { return this.dimancheCheck; }
  setDimancheCheck(dimancheCheck) { this.dimancheCheck = dimancheCheck; return this; }
  getSamediCheck() { return this.samediCheck; }
  setSamediCheck(samediCheck) { this.samediCheck = samediCheck; return this; }
  getVershoraire() { return this.vershoraire; }
  setVershoraire(vershoraire) { this.vershoraire = vershoraire; return this; }
  getDateDebForm() { return this.dateDebForm; }
  setDateDebForm(dateDebForm) { this.dateDebForm = dateDebForm; return this; }
  getFerieCheck() { return this.ferieCheck; }
  setFerieCheck(ferieCheck) { this.ferieCheck = ferieCheck; return this; }
}

export class CsvProd {
  constructor() {
    this.id = null;
    this.path = null;
    this.puissence = null;
    this.degradation = null;
    this.result = [];
    this.project = null;
  }
  getId() { return this.id; }
  getPath() { return this.path; }
  setPath(path) { this.path = path; return this; }
  getPuissence() { return this.puissence; }
  setPuissence(puissence) { this.puissence = puissence; return this; }
  getDegradation() { return this.degradation; }
  setDegradation(degradation) { this.degradation = degradation; return this; }
  getResult() { return this.result; }
  setResult(result) { this.result = result; return this; }
  getProject() { return this.project; }
  setProject(project) { this.project = project; if (project !== null && project.getCsvProd() !== this) project.setCsvProd(this); return this; }
}

export class Finance {
  constructor() {
    this.id = null;
    this.capex = null;
    this.subvention = null;
    this.subventionarray = null;
    this.duree_proj = null;
    this.aug_tarif_vende = null;
    this.aug_tarif_achat = null;
    this.taux_actualisation = null;
    this.credit = null;
    this.montant_dette = null;
    this.taux_interet = null;
    this.delai_grace = null;
    this.maturite_proj = null;
    this.tarifUni = null;
    this.tarifHoraire = [];
    this.opex = null;
    this.replinv = null;
    this.tarifTransport = null;
    this.project = null;
    this.f_regularisation = [];
    this.factransport = [];
    this.van = null;
    this.tri25 = null;
    this.wacc = null;
    this.annuite = null;
    this.depense = null;
    this.Gain_cedee = [];
    this.Gain_transporter = [];
    this.cashflow = [];
    this.cashflow_cum = [];
    this.cfads = [];
    this.dscr = [];
    this.gain_ans = [];
    this.llcr = [];
    this.cashflowIn = null;
    this.tricapitaux = null;
    this.soldrep = [];
    this.wacc = 0; this.tri25 = 0; this.tricapitaux = 0; this.van = 0; this.maturite_proj = 0; this.delai_grace = 0; this.taux_interet = 0; this.montant_dette = 0;
  }
  getId() { return this.id; }
  getCapex() { return this.capex; }
  setCapex(capex) { this.capex = capex; return this; }
  getSubvention() { return this.subvention; }
  setSubvention(subvention) { this.subvention = subvention; return this; }
  getSubventionarray() { return this.subventionarray; }
  setSubventionarray(subventionarray) { this.subventionarray = subventionarray; return this; }
  getDureeProj() { return this.duree_proj; }
  setDureeProj(duree_proj) { this.duree_proj = duree_proj; return this; }
  getAugTarifVende() { return this.aug_tarif_vende; }
  setAugTarifVende(aug_tarif_vende) { this.aug_tarif_vende = aug_tarif_vende; return this; }
  getAugTarifAchat() { return this.aug_tarif_achat; }
  setAugTarifAchat(aug_tarif_achat) { this.aug_tarif_achat = aug_tarif_achat; return this; }
  getTauxActualisation() { return this.taux_actualisation; }
  setTauxActualisation(taux_actualisation) { this.taux_actualisation = taux_actualisation; return this; }
  getCredit() { return this.credit; }
  setCredit(credit) { this.credit = credit; return this; }
  getMontantDette() { return this.montant_dette; }
  setMontantDette(montant_dette) { this.montant_dette = montant_dette; return this; }
  getTauxInteret() { return this.taux_interet; }
  setTauxInteret(taux_interet) { this.taux_interet = taux_interet; return this; }
  getDelaiGrace() { return this.delai_grace; }
  setDelaiGrace(delai_grace) { this.delai_grace = delai_grace; return this; }
  getMaturiteProj() { return this.maturite_proj; }
  setMaturiteProj(maturite_proj) { this.maturite_proj = maturite_proj; return this; }
  getTarifUni() { return this.tarifUni; }
  setTarifUni(tarifUni) { this.tarifUni = tarifUni; return this; }
  getTarifHoraire() { return this.tarifHoraire; }
  setTarifHoraire(tarifHoraire) { this.tarifHoraire = tarifHoraire; return this; }
  getOpex() { return this.opex; }
  setOpex(opex) { this.opex = opex; return this; }
  getReplinv() { return this.replinv; }
  setReplinv(replinv) { this.replinv = replinv; return this; }
  getTarifTransport() { return this.tarifTransport; }
  setTarifTransport(tarifTransport) { this.tarifTransport = tarifTransport; return this; }
  getProject() { return this.project; }
  setProject(project) { this.project = project; if (project !== null && project.getFinance() !== this) project.setFinance(this); return this; }
  getFRegularisation() { return this.f_regularisation; }
  getfactransport() { return this.factransport; }
  setFRegularisation(f_regularisation) { this.f_regularisation = f_regularisation; return this; }
  setfactransport(factransport) { this.factransport = factransport; return this; }
  getVan() { return this.van; }
  setVan(van) { this.van = van; return this; }
  getTri25() { return this.tri25; }
  setTri25(tri25) { this.tri25 = tri25; return this; }
  getWacc() { return this.wacc; }
  setWacc(wacc) { this.wacc = wacc; return this; }
  getAnnuite() { return this.annuite; }
  setAnnuite(annuite) { this.annuite = annuite; return this; }
  getDepense() { return this.depense; }
  setDepense(depense) { this.depense = depense; return this; }
  getGainCedee() { return this.Gain_cedee; }
  setGainCedee(Gain_cedee) { this.Gain_cedee = Gain_cedee; return this; }
  getGainTransporter() { return this.Gain_transporter; }
  setGainTransporter(Gain_transporter) { this.Gain_transporter = Gain_transporter; return this; }
  getCashflow() { return this.cashflow; }
  setCashflow(cashflow) { this.cashflow = cashflow; return this; }
  getCashflowCum() { return this.cashflow_cum; }
  setCashflowCum(cashflow_cum) { this.cashflow_cum = cashflow_cum; return this; }
  getCfads() { return this.cfads; }
  setCfads(cfads) { this.cfads = cfads; return this; }
  getDscr() { return this.dscr; }
  setDscr(dscr) { this.dscr = dscr; return this; }
  getGainAns() { return this.gain_ans; }
  setGainAns(gain_ans) { this.gain_ans = gain_ans; return this; }
  getLlcr() { return this.llcr; }
  setLlcr(llcr) { this.llcr = llcr; return this; }
  getCashflowIn() { return this.cashflowIn; }
  setCashflowIn(cashflowIn) { this.cashflowIn = cashflowIn; return this; }
  getTricapitaux() { return this.tricapitaux; }
  setTricapitaux(tricapitaux) { this.tricapitaux = tricapitaux; return this; }
  getSoldrep() { return this.soldrep; }
  setSoldrep(soldrep) { this.soldrep = soldrep; return this; }
}

export class Ninja {
  constructor() {
    this.id = null;
    this.lat = null;
    this.lon = null;
    this.tracking = null;
    this.raddatabase = null;
    this.tilt = null;
    this.azimuth = null;
    this.capacity = null;
    this.loss = null;
    this.degradation = null;
    this.result = [];
    this.project = null;
  }
  getId() { return this.id; }
  getLat() { return this.lat; }
  setLat(lat) { this.lat = lat; return this; }
  getLon() { return this.lon; }
  setLon(lon) { this.lon = lon; return this; }
  getTracking() { return this.tracking; }
  setTracking(tracking) { this.tracking = tracking; return this; }
  getTilt() { return this.tilt; }
  setTilt(tilt) { this.tilt = tilt; return this; }
  getAzimuth() { return this.azimuth; }
  setAzimuth(azimuth) { this.azimuth = azimuth; return this; }
  getRaddatabase() { return this.raddatabase; }
  setRaddatabase(raddatabase) { this.raddatabase = raddatabase; return this; }
  getCapacity() { return this.capacity; }
  setCapacity(capacity) { this.capacity = capacity; return this; }
  getLoss() { return this.loss; }
  setLoss(loss) { this.loss = loss; return this; }
  getDegradation() { return this.degradation; }
  setDegradation(degradation) { this.degradation = degradation; return this; }
  getResult() { return this.result; }
  setResult(result) { this.result = result; return this; }
  getProject() { return this.project; }
  setProject(project) { this.project = project; if (project !== null && project.getNinja() !== this) project.setNinja(this); return this; }
}

export class Project {
  constructor() {
    this.id = null;
    this.name = null;
    this.adress = null;
    this.description = null;
    this.user = null;
    this.pvwatt = null;
    this.pvgis = null;
    this.ninja = null;
    this.consomation = null;
    this.auto_consomer = [];
    this.cedee = [];
    this.importe = [];
    this.csvProd = null;
    this.finance = null;
    this.consomationPH = [];
    this.productionPH = [];
    this.auto_consomerPH = [];
    this.importerPH = [];
    this.cedeePH = [];
    this.injectPH = [];
    this.inject = [];
    this.consomation = new Consomation();
  }
  getId() { return this.id; }
  getName() { return this.name; }
  setName(name) { this.name = name; return this; }
  getAdress() { return this.adress; }
  setAdress(adress) { this.adress = adress; return this; }
  getDescription() { return this.description; }
  setDescription(description) { this.description = description; return this; }
  getUser() { return this.user; }
  setUser(user) { this.user = user; return this; }
  getPvwatt() { return this.pvwatt; }
  setPvwatt(pvwatt) { this.pvwatt = pvwatt; return this; }
  getPvgis() { return this.pvgis; }
  setPvgis(pvgis) { this.pvgis = pvgis; return this; }
  getNinja() { return this.ninja; }
  setNinja(ninja) { this.ninja = ninja; return this; }
  getConsomation() { return this.consomation; }
  setConsomation(consomation) { this.consomation = consomation; return this; }
  getAutoConsomer() { return this.auto_consomer; }
  setAutoConsomer(auto_consomer) { this.auto_consomer = auto_consomer; return this; }
  getCedee() { return this.cedee; }
  setCedee(cedee) { this.cedee = cedee; return this; }
  getImporte() { return this.importe; }
  setImporte(importe) { this.importe = importe; return this; }
  getCsvProd() { return this.csvProd; }
  setCsvProd(csvProd) { this.csvProd = csvProd; return this; }
  getFinance() { return this.finance; }
  setFinance(finance) { this.finance = finance; return this; }
  getconsomationPH() { return this.consomationPH; }
  setconsomationPH(consomationPH) { this.consomationPH = consomationPH; return this; }
  getproductionPH() { return this.productionPH; }
  setproductionPH(productionPH) { this.productionPH = productionPH; return this; }
  getauto_consomerPH() { return this.auto_consomerPH; }
  setauto_consomerPH(auto_consomerPH) { this.auto_consomerPH = auto_consomerPH; return this; }
  getimporterPH() { return this.importerPH; }
  setimporterPH(importerPH) { this.importerPH = importerPH; return this; }
  getcedeePH() { return this.cedeePH; }
  setcedeePH(cedeePH) { this.cedeePH = cedeePH; return this; }
  getinjectPH() { return this.injectPH; }
  setinjectPH(injectPH) { this.injectPH = injectPH; return this; }
  getinject() { return this.inject; }
  setinject(inject) { this.inject = inject; return this; }
}

export class Pvgis {
  constructor() {
    this.id = null;
    this.lat = null;
    this.lon = null;
    this.mounting_type = null;
    this.slop = null;
    this.azimuth = null;
    this.pv_tech = null;
    this.peak_power = null;
    this.loss = null;
    this.degradation = null;
    this.result = [];
    this.project = null;
  }
  getId() { return this.id; }
  getLat() { return this.lat; }
  setLat(lat) { this.lat = lat; return this; }
  getLon() { return this.lon; }
  setLon(lon) { this.lon = lon; return this; }
  getMountingType() { return this.mounting_type; }
  setMountingType(mounting_type) { this.mounting_type = mounting_type; return this; }
  getSlop() { return this.slop; }
  setSlop(slop) { this.slop = slop; return this; }
  getAzimuth() { return this.azimuth; }
  setAzimuth(azimuth) { this.azimuth = azimuth; return this; }
  getPvTech() { return this.pv_tech; }
  setPvTech(pv_tech) { this.pv_tech = pv_tech; return this; }
  getPeakPower() { return this.peak_power; }
  setPeakPower(peak_power) { this.peak_power = peak_power; return this; }
  getLoss() { return this.loss; }
  setLoss(loss) { this.loss = loss; return this; }
  getDegradation() { return this.degradation; }
  setDegradation(degradation) { this.degradation = degradation; return this; }
  getResult() { return this.result; }
  setResult(result) { this.result = result; return this; }
  getProject() { return this.project; }
  setProject(project) { this.project = project; if (project !== null && project.getPvgis() !== this) project.setPvgis(this); return this; }
}

export class Pvwatt {
  constructor() {
    this.id = null;
    this.lat = null;
    this.lon = null;
    this.module_type = null;
    this.losses = null;
    this.array_type = null;
    this.azimuth = null;
    this.tilts = null;
    this.result = [];
    this.project = null;
  }
  getId() { return this.id; }
  getLat() { return this.lat; }
  setLat(lat) { this.lat = lat; return this; }
  getLon() { return this.lon; }
  setLon(lon) { this.lon = lon; return this; }
  getModuleType() { return this.module_type; }
  setModuleType(module_type) { this.module_type = module_type; return this; }
  getLosses() { return this.losses; }
  setLosses(losses) { this.losses = losses; return this; }
  getArrayType() { return this.array_type; }
  setArrayType(array_type) { this.array_type = array_type; return this; }
  getAzimuth() { return this.azimuth; }
  setAzimuth(azimuth) { this.azimuth = azimuth; return this; }
  getTilts() { return this.tilts; }
  setTilts(tilts) { this.tilts = tilts; return this; }
  getResult() { return this.result; }
  setResult(result) { this.result = result; return this; }
  getProject() { return this.project; }
  setProject(project) { this.project = project; if (project !== null && project.getPvwatt() !== this) project.setPvwatt(this); return this; }
}

export class User {
  static ROLE_USER = 'ROLE_USER';
  static ROLE_ADMIN = 'ROLE_ADMIN';
  constructor() {
    this.id = null;
    this.username = null;
    this.password = null;
    this.plainPassword = null;
    this.email = null;
    this.fullName = null;
    this.roles = null;
    this.confirmationToken = null;
    this.enabled = null;
    this.abon1 = 0;
    this.abon2 = 0;
    this.img_URL = null;
    this.projects = null;
    this.societe = null;
    this.roles = [User.ROLE_USER]; this.enabled = false; this.img_URL = null;
  }
  getRoles() { return this.roles; }
  setRoles(roles) { this.roles = roles; return this; }
  getPassword() { return this.password; }
  getUsername() { return this.username; }
  getEmail() { return this.email; }
  setEmail(email) { this.email = email; return this; }
  getFullName() { return this.fullName; }
  setFullName(fullName) { this.fullName = fullName; return this; }
  setUsername(username) { this.username = username; return this; }
  setPassword(password) { this.password = password; return this; }
  getId() { return this.id; }
  getPlainPassword() { return this.plainPassword; }
  setPlainPassword(plainPassword) { this.plainPassword = plainPassword; return this; }
  getConfirmationToken() { return this.confirmationToken; }
  setConfirmationToken(confirmationToken) { this.confirmationToken = confirmationToken; return this; }
  getEnabled() { return this.enabled; }
  getabon1() { return this.abon1; }
  setabon1(abon1) { this.abon1 = abon1; return this; }
  getabon2() { return this.abon2; }
  setabon2(abon2) { this.abon2 = abon2; return this; }
  setEnabled(enabled) { this.enabled = enabled; return this; }
  isEnabled() { return this.enabled; }
  getImgURL() { return this.img_URL; }
  setImgURL(img_URL) { this.img_URL = img_URL; return this; }
  getProjects() { return this.projects; }
  getSociete() { return this.societe; }
  setSociete(societe) { this.societe = societe; return this; }
}

export const ENTITY_CLASSES = { Consomation, CsvProd, Finance, Ninja, Project, Pvgis, Pvwatt, User };
export const BACKREFS = {"Consomation":["project"],"CsvProd":["project","projects"],"Finance":["project"],"Ninja":["project"],"Pvgis":["project"],"Pvwatt":["project"],"Project":["user","consomations"],"User":["projects"]};
