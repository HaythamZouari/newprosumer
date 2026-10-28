// Prétraitement des templates Twig d'origine pour qu'ils tournent sous Twig.js dans le
// navigateur, SANS en changer le contenu fonctionnel :
//
//  1. `{{ include('x.twig') }}`  -> `{% include 'x.twig' %}`  (Twig.js ne connaît pas include() en fonction)
//  2. `range(0, ((v|length)-1))` -> `range(0, v|length - 1)`   (parenthésage non supporté par Twig.js)
//  3. Ressources externes mortes ou tierces -> copies locales fournies par le build
//     (rawgit.com est arrêté, netdna/stackpath sont retirés ; les versions sont conservées).
//  4. Chemins absolus `/build/...` -> relatifs `build/...` (le site peut être servi hors racine).
//
// Les ressources métier tierces à clé (Mapbox, Sejda) sont laissées telles quelles.

const LOCAL = {
  dropzoneJs: 'build/js/dropzone.js',
  dropzoneCss: 'build/vendor/dropzone-5.5.0.css',
  plotly: 'build/js/plotly-latest.min.js',
  bootstrapCss: 'build/js/plugins/bootstrap/dist/css/bootstrap.min.css',
  bootstrapJs: 'build/js/plugins/bootstrap/dist/js/bootstrap.min.js',
  popper: 'build/vendor/popper-1.11.0.min.js',
  dygraphJs: 'build/vendor/dygraph-2.1.0.min.js',
  dygraphCss: 'build/vendor/dygraph-2.1.0.css',
  jquery341: 'build/vendor/jquery-3.4.1.min.js',
  jquery1102: 'build/js/vendor/jquery-1.10.2.min.js',
  fontAwesome: 'build/js/plugins/@fortawesome/fontawesome-free/css/all.min.css',
};

/** Réécritures d'URL exactes (clé = URL d'origine, avec ou sans protocole). */
const URL_REWRITES = [
  [/https?:\/\/rawgit\.com\/enyo\/dropzone\/master\/dist\/dropzone\.js/g, LOCAL.dropzoneJs],
  [/https?:\/\/rawgit\.com\/enyo\/dropzone\/master\/dist\/dropzone\.css/g, LOCAL.dropzoneCss],
  [/https?:\/\/cdn\.plot\.ly\/plotly-latest\.min\.js/g, LOCAL.plotly],
  [/https:\/\/stackpath\.bootstrapcdn\.com\/bootstrap\/4\.3\.1\/css\/bootstrap\.min\.css/g, LOCAL.bootstrapCss],
  [/https:\/\/stackpath\.bootstrapcdn\.com\/bootstrap\/4\.3\.1\/js\/bootstrap\.min\.js/g, LOCAL.bootstrapJs],
  [/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/popper\.js\/1\.11\.0\/umd\/popper\.min\.js/g, LOCAL.popper],
  [/(?:https:)?\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/dygraph\/2\.1\.0\/dygraph\.min\.js/g, LOCAL.dygraphJs],
  [/(?:https:)?\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/dygraph\/2\.1\.0\/dygraph\.min\.css/g, LOCAL.dygraphCss],
  [/https:\/\/ajax\.googleapis\.com\/ajax\/libs\/jquery\/3\.4\.1\/jquery\.min\.js/g, LOCAL.jquery341],
  [/(?:https:)?\/\/ajax\.googleapis\.com\/ajax\/libs\/jquery\/1\.10\.2\/jquery\.min\.js/g, LOCAL.jquery1102],
  [/(?:https:)?\/\/netdna\.bootstrapcdn\.com\/font-awesome\/4\.0\.3\/css\/font-awesome\.css/g, LOCAL.fontAwesome],
  // Mapbox : l'ancien hôte api.tiles.mapbox.com a été remplacé par api.mapbox.com (mêmes fichiers).
  [/https:\/\/api\.tiles\.mapbox\.com\/mapbox-gl-js\//g, 'https://api.mapbox.com/mapbox-gl-js/'],
];

/** <link> inutiles vers un service arrêté (aucun effet visuel dans l'original). */
const DROP_TAGS = [
  /<link[^>]*api\.mqcdn\.com[^>]*>\s*/g,
];

export function preprocessTemplate(src) {
  let out = src;

  // 1. include() fonction -> balise {% include %}
  out = out.replace(/\{\{\s*include\(\s*(['"][^'"]+['"])\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)\s*\}\}/g,
    (_m, tpl, ctx) => (ctx ? `{% include ${tpl} with ${ctx} %}` : `{% include ${tpl} %}`));

  // 2. range(0, ((x|length)-1)) -> range(0, x|length - 1)
  out = out.replace(/range\(\s*0\s*,\s*\(\(\s*([\w.]+)\|length\s*\)\s*-\s*1\s*\)\s*\)/g,
    (_m, v) => `range(0, ${v}|length - 1)`);

  // 3. ressources externes -> locales
  for (const [re, local] of URL_REWRITES) out = out.replace(re, local);
  for (const re of DROP_TAGS) out = out.replace(re, '');

  // Les attributs SRI ne valent plus pour une copie locale.
  out = out.replace(/(<(?:link|script)[^>]*build\/js\/plugins\/bootstrap[^>]*?)\s+integrity="[^"]*"/g, '$1')
    .replace(/(<(?:link|script)[^>]*build\/js\/plugins\/bootstrap[^>]*?)\s+crossorigin="[^"]*"/g, '$1');

  // 4. /build/ absolu -> relatif (uniquement dans les attributs src/href/url)
  out = out.replace(/(src|href)=(['"])\/build\//g, '$1=$2build/')
    .replace(/(src|href)=\/build\//g, '$1=build/');

  return out;
}

/** Noms des templates référencés par extends/include/embed dans une source (déjà prétraitée). */
export function templateDeps(src) {
  const deps = new Set();
  for (const m of src.matchAll(/\{%\s*(?:extends|include|embed)\s+['"]([^'"]+)['"]/g)) deps.add(m[1]);
  return [...deps];
}
