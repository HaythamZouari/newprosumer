// Entités (classes générées depuis src/Entity/*.php) + (dé)hydratation d'un agrégat Project.
// Un Project est stocké comme UN enregistrement qui embarque ses entités liées (OneToOne,
// cascade persist/remove dans Doctrine), sans les références inverses (project) pour éviter
// les cycles ; elles sont recâblées au chargement.
import * as G from './entities.generated.js';

export const { Project, Consomation, Finance, Pvgis, Ninja, CsvProd, Pvwatt, User } = G;

const CHILDREN = { consomation: Consomation, pvgis: Pvgis, ninja: Ninja, csvProd: CsvProd, finance: Finance, pvwatt: Pvwatt };

/** Project -> enregistrement sérialisable (sans cycles ; l'utilisateur est réduit à son id). */
export function dehydrateProject(project) {
  const rec = {};
  for (const [k, v] of Object.entries(project)) {
    if (k === 'user' || k === 'consomations') continue;
    if (k in CHILDREN) {
      if (v) {
        const child = {};
        for (const [ck, cv] of Object.entries(v)) if (ck !== 'project') child[ck] = cv;
        rec[k] = child;
      } else rec[k] = null;
    } else rec[k] = v;
  }
  rec.userId = project.user ? project.user.id : (project.userId ?? null);
  return structuredClone(rec);
}

/** Enregistrement -> Project (entités liées réhydratées et recâblées). */
export function hydrateProject(rec, user = null) {
  const project = new Project();
  for (const [k, v] of Object.entries(rec)) {
    if (k === 'userId') continue;
    if (k in CHILDREN) {
      if (v) {
        const child = Object.assign(new CHILDREN[k](), structuredClone(v));
        child.project = project;
        project[k] = child;
      } else project[k] = null;
    } else project[k] = structuredClone(v);
  }
  project.user = user;
  project.userId = rec.userId ?? null;
  return project;
}

export function hydrateUser(rec) {
  return rec ? Object.assign(new User(), structuredClone(rec)) : null;
}

// __toString() des entités PHP : Twig affiche `{{ app.user }}` via la conversion en chaîne.
User.prototype.toString = function () { return String(this.getUsername() ?? ''); };
for (const C of [Project, Consomation, Finance, Pvgis, Ninja, CsvProd, Pvwatt]) {
  C.prototype.toString = function () { return String(this.id ?? ''); };
}
