// Table de routes : reprise des annotations @Route des contrôleurs Symfony d'origine
// (src/Controller/*.php), dans le MÊME ordre (l'ordre compte : /project/new avant /project/{id}).
//
// Deux modes de routage (config.js) :
//  - "clean" : URL d'origine (/project/7), servies par la coquille via vercel.json.
//  - "hash"  : ancres (#project-7), pour les hébergements sans rewrites (aperçu artifact).
//    Seuls les caractères [A-Za-z0-9-] sont admis dans l'ancre ; le paramètre est donc
//    séparé du nom de page par le premier tiret.

export const ROUTES = [
  { name: 'dashboard', path: '/', methods: ['GET', 'POST'], hash: 'home' },
  { name: 'project_index', path: '/project/', methods: ['GET', 'POST'], hash: 'projects' },
  { name: 'project_new', path: '/project/new', methods: ['GET', 'POST'], hash: 'new' },
  { name: 'excelupload', path: '/project/excelupload/{id}', ajax: true },
  { name: 'project_show', path: '/project/{id}', methods: ['GET', 'POST'], hash: 'project', param: 'id' },
  { name: 'suppsite', path: '/project/suppsite/{id}', ajax: true },
  { name: 'suppcc', path: '/project/suppcc/{id}', ajax: true },
  { name: 'editpro', path: '/project/editpro/{id}', ajax: true },
  { name: 'project_edit', path: '/project/{id}/edit', methods: ['GET', 'POST'], hash: 'edit', param: 'id' },
  { name: 'project_delete', path: '/project/{id}', methods: ['DELETE'] },
  { name: 'pvgis', path: '/pvgis/{id}', ajax: true },
  { name: 'ninja', path: '/ninja/{id}', ajax: true },
  { name: 'readcsv', path: '/readcsv/{id}', ajax: true },
  { name: 'finance', path: '/{id}/finance', ajax: true },
  { name: 'project_results', path: '/result/{id}/project_results', ajax: true },
  { name: 'results', path: '/result/{id}/results', hash: 'results', param: 'id' },
  { name: 'rapport', path: '/rapport/{id}', hash: 'rapport', param: 'id' },
  { name: 'offres', path: '/offres', hash: 'offres' },
  { name: 'product', path: '/product', hash: 'product' },
  { name: 'contact', path: '/contact', methods: ['GET', 'POST'], hash: 'contact' },
  { name: 'security_login', path: '/login', hash: 'login' },
  { name: 'security_logout', path: '/logout', hash: 'logout' },
  { name: 'security_confirm', path: '/confirm/{token}', hash: 'confirm', param: 'token' },
  { name: 'user_register', path: '/register', hash: 'register' },
];

const compiled = ROUTES.map((r) => {
  const keys = [];
  const re = new RegExp('^' + r.path.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, (_m, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  return { ...r, re, keys };
});
const byName = Object.fromEntries(ROUTES.map((r) => [r.name, r]));

/** Équivalent de UrlGenerator::generate : /project/{id} + {id:7} -> /project/7 */
export function generate(name, params = {}) {
  const r = byName[name];
  if (!r) throw new Error(`Route inconnue : ${name}`);
  return r.path.replace(/\{(\w+)\}/g, (_m, k) => encodeURIComponent(params[k]));
}

/** Routeur : (méthode, chemin) -> { route, params } ou null. Ordre = ordre de la table. */
export function match(method, path) {
  const clean = path.replace(/\/index\.html$/, '/') || '/';
  for (const r of compiled) {
    const methods = r.methods || ['GET', 'POST'];
    const m = clean.match(r.re);
    if (!m || !methods.includes(method)) continue;
    const params = {};
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    return { route: r, params };
  }
  return null;
}

// ---- mode "hash" : chemin <-> ancre ----

/** /project/7 -> "project-7" (null si la route n'est pas une page navigable). */
export function pathToHashKey(path) {
  const hit = match('GET', path);
  if (!hit || !hit.route.hash) return null;
  const p = hit.route.param ? hit.params[hit.route.param] : null;
  return p !== null && p !== undefined ? `${hit.route.hash}-${p}` : hit.route.hash;
}

/** "project-7" -> "/project/7" ('' ou 'home' -> '/') */
export function hashKeyToPath(key) {
  const k = String(key || '').replace(/^#/, '');
  if (!k) return '/';
  const i = k.indexOf('-');
  const base = i < 0 ? k : k.slice(0, i);
  const param = i < 0 ? null : k.slice(i + 1);
  const r = ROUTES.find((x) => x.hash === base);
  if (!r) return null;
  return generate(r.name, r.param ? { [r.param]: param } : {});
}

/** Lien produit par path() dans les templates. */
export function urlFor(mode, name, params = {}) {
  const r = byName[name];
  if (mode === 'hash' && r && r.hash) {
    const p = r.param ? params[r.param] : null;
    return `./#${r.hash}${p !== null && p !== undefined ? '-' + p : ''}`;
  }
  return generate(name, params);
}
