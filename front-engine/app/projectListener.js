// Port de App\Event\ProjectListner::onProjectEvent : après chaque (re)définition de la production,
// croise consommation et production et enregistre les résultats sur le projet.
// Le calcul lui-même est dans src/projectData.js (validé en parité avec le PHP).
import { computeProjectData } from '../src/projectData.js';

/** Production retenue : PVGIS, puis CSV, puis Ninja — chacun écrase le précédent s'il existe (comme le PHP). */
export function productionOf(project) {
  let production = null;
  if (project.getPvgis() != null) production = project.getPvgis().getResult();
  if (project.getCsvProd() != null) production = project.getCsvProd().getResult();
  if (project.getNinja() != null) production = project.getNinja().getResult();
  return production;
}

export function onProjectEvent(project) {
  const c = project.getConsomation();
  const production = productionOf(project);
  const res = computeProjectData({
    consomation: c.getallConsomationAnnuel(),
    production,
    // PHP : getTransportEng()==0 / getTypeTarif()==1 (comparaisons lâches sur des booléens)
    transportEng: c.getTransportEng() ? 1 : 0,
    typeTarif: c.getTypeTarif() == 1 ? 1 : 0, // eslint-disable-line eqeqeq
  });
  project.setconsomationPH(res.consomationPH);
  project.setproductionPH(res.productionPH);
  project.setauto_consomerPH(res.autoConsomerPH);
  project.setimporterPH(res.importerPH);
  project.setcedeePH(res.cedeePH);
  project.setinjectPH(res.injectPH);
  project.setinject(res.inject);
  project.setAutoConsomer(res.autoConsomer);
  project.setCedee(res.cedee);
  project.setImporte(res.importer);
  return res;
}
