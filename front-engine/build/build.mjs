// Construit le site statique dans dist/ :
//  - templates.js : tous les templates Twig d'origine, prétraités (voir preprocess.mjs)
//  - build/       : assets d'origine (public/build, liste blanche) + libs tierces (third_party)
//  - app/, src/   : code "serveur dans le navigateur" + moteur de calcul
//  - index.html   : coquille unique ; config.js : mode de routage et clés publiques
//
// Usage : node build/build.mjs [--mode=hash|clean] [--out=dist]
//   hash  : routes par ancre (#project-7)  -> aperçu artifact, hébergements sans rewrites
//   clean : routes d'origine (/project/7)  -> Vercel (voir vercel.json)
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preprocessTemplate } from './preprocess.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FE = join(here, '..');                 // front-engine/
const ROOT = join(FE, '..');                 // racine du dépôt
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const MODE = arg('mode', 'hash');
const OUT = join(FE, arg('out', 'dist'));
const PUB = join(ROOT, 'public', 'build');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

function walk(dir, filter = () => true) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p, filter) : filter(p) ? [p] : [];
  });
}

// ---------- 1. templates ----------
const TPL = join(ROOT, 'templates');
const templates = {};
for (const f of walk(TPL, (p) => p.endsWith('.twig'))) {
  templates[relative(TPL, f).split(sep).join('/')] = preprocessTemplate(readFileSync(f, 'utf8'), { absoluteAssets: MODE === 'clean' });
}
writeFileSync(join(OUT, 'templates.js'), `window.__NP_TEMPLATES__ = ${JSON.stringify(templates)};\n`);

// ---------- 2. assets d'origine (liste blanche) ----------
const keep = (p) => !p.endsWith('.map');
const copyDir = (rel, filter = keep) => {
  const src = join(PUB, rel);
  if (!existsSync(src)) { console.warn('asset absent:', rel); return; }
  for (const f of walk(src, filter)) {
    const to = join(OUT, 'build', rel, relative(src, f));
    mkdirSync(dirname(to), { recursive: true });
    cpSync(f, to);
  }
};
const copyFile = (rel) => {
  const src = join(PUB, rel);
  if (!existsSync(src)) { console.warn('asset absent:', rel); return; }
  mkdirSync(dirname(join(OUT, 'build', rel)), { recursive: true });
  cpSync(src, join(OUT, 'build', rel));
};
copyDir('css');
copyDir('fonts');
copyDir('img');
copyDir('js/vendor');
for (const f of readdirSync(join(PUB, 'js'))) if (f.endsWith('.js')) copyFile(`js/${f}`);
copyFile('js/plugins/jquery/dist/jquery.min.js');
copyDir('js/plugins/bootstrap/dist');
copyDir('js/plugins/chart.js/dist');
copyDir('js/plugins/nouislider/distribute');
copyDir('js/plugins/nucleo');
copyDir('js/plugins/@fortawesome/fontawesome-free/css');
copyDir('js/plugins/@fortawesome/fontawesome-free/webfonts');

// libs tierces (versions identiques à celles de l'original)
const TP = join(FE, 'third_party');
mkdirSync(join(OUT, 'build', 'vendor'), { recursive: true });
for (const f of readdirSync(TP)) cpSync(join(TP, f), join(OUT, 'build', 'vendor', f));

// ---------- 3. code applicatif ----------
cpSync(join(FE, 'src'), join(OUT, 'src'), { recursive: true });
if (existsSync(join(FE, 'app'))) cpSync(join(FE, 'app'), join(OUT, 'app'), { recursive: true });

// ---------- 4. coquille + config ----------
writeFileSync(join(OUT, 'config.js'),
  `window.NP_CONFIG = ${JSON.stringify({ mode: MODE, supabaseUrl: process.env.SUPABASE_URL || 'https://strocizwjvxwranzamdq.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_7SjhMd5KLjGMTdk2k8jrYA_5M8mllJa' })};\n`);
writeFileSync(join(OUT, 'index.html'), `<meta charset="utf-8">
<title>Prosumers</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body>
<script src="config.js" charset="utf-8"></script>
<script src="build/vendor/twig-1.17.1.min.js" charset="utf-8"></script>
<script src="templates.js" charset="utf-8"></script>
<script type="module" src="app/boot.js"></script>
</body>
`);

// ---------- 5. contrôle : toute ressource référencée existe ----------
const missing = new Set();
const check = (p) => { if (!existsSync(join(OUT, p.split(/[?#]/)[0]))) missing.add(p); };
for (const [name, src] of Object.entries(templates)) {
  for (const m of src.matchAll(/asset\(\s*['"]([^'"]+)['"]/g)) check(m[1]);
  for (const m of src.matchAll(/(?:src|href)=["']?\/?(build\/[^"'\s>]+)/g)) if (!m[1].includes('{{')) check(m[1]);
}
const files = walk(OUT);
const size = files.reduce((s, f) => s + statSync(f).size, 0);
console.log(`dist/ : ${files.length} fichiers, ${(size / 1e6).toFixed(1)} Mo — mode=${MODE}, ${Object.keys(templates).length} templates`);
if (missing.size) { console.error('RESSOURCES MANQUANTES :\n  ' + [...missing].join('\n  ')); process.exit(1); }
