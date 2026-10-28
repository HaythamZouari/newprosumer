// Génère app/entities.generated.js à partir de src/Entity/*.php.
//
// Objectif : que le code JS des contrôleurs portés utilise EXACTEMENT les mêmes appels
// que le PHP (`$project->getConsomation()->getallConsomationAnnuel()` devient
// `project.getConsomation().getallConsomationAnnuel()`), pour limiter les erreurs de traduction.
//
// Règles : getter  = `return $this->prop;`  -> `return this.prop;`
//          setter  = `$this->prop = $v; (return $this;)` -> `this.prop = v; return this;`
// Les méthodes non triviales sont traitées dans SPECIAL ci-dessous.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ENTITY_DIR = join(here, '..', '..', 'src', 'Entity');
const OUT = join(here, '..', 'app', 'entities.generated.js');

// Propriétés qui sont des références inverses (non sérialisées, recâblées au chargement).
const BACKREFS = { Consomation: ['project'], CsvProd: ['project', 'projects'], Finance: ['project'],
  Ninja: ['project'], Pvgis: ['project'], Pvwatt: ['project'], Project: ['user', 'consomations'], User: ['projects'] };

// Corps JS des méthodes non triviales / constructeurs, par classe.
const SPECIAL = {
  Project: { ctor: 'this.consomation = new Consomation();' },
  Consomation: {
    ctor: 'this.transportEng = false;',
    setProject: 'setProject(project) { this.project = project; if (project !== null && project.getConsomation() !== this) project.setConsomation(this); return this; }',
    // PHP : $this->url_ccv = $this->url_ccv."///".$url_ccv;
    setUrlCcv: 'setUrlCcv(url_ccv) { this.url_ccv = this.url_ccv + "///" + url_ccv; return this; }',
  },
  Pvgis: { setProject: 'setProject(project) { this.project = project; if (project !== null && project.getPvgis() !== this) project.setPvgis(this); return this; }' },
  Ninja: { setProject: 'setProject(project) { this.project = project; if (project !== null && project.getNinja() !== this) project.setNinja(this); return this; }' },
  CsvProd: { setProject: 'setProject(project) { this.project = project; if (project !== null && project.getCsvProd() !== this) project.setCsvProd(this); return this; }' },
  Pvwatt: { setProject: 'setProject(project) { this.project = project; if (project !== null && project.getPvwatt() !== this) project.setPvwatt(this); return this; }' },
  Finance: {
    setProject: 'setProject(project) { this.project = project; if (project !== null && project.getFinance() !== this) project.setFinance(this); return this; }',
    ctor: 'this.wacc = 0; this.tri25 = 0; this.tricapitaux = 0; this.van = 0; this.maturite_proj = 0; this.delai_grace = 0; this.taux_interet = 0; this.montant_dette = 0;' },
  User: { ctor: 'this.roles = [User.ROLE_USER]; this.enabled = false; this.img_URL = null;' },
};

function jsDefault(expr) {
  const e = expr.trim();
  if (e === '[]') return '[]';
  if (e === 'null') return 'null';
  if (/^-?\d+(\.\d+)?$/.test(e)) return e;
  if (/^(true|false)$/i.test(e)) return e.toLowerCase();
  if (/^['"].*['"]$/.test(e)) return e;
  return 'null';
}

function parseEntity(src, cls) {
  const props = [];
  for (const m of src.matchAll(/^\s*private\s+\$(\w+)\s*(?:=\s*([^;]+))?;/gm)) {
    props.push({ name: m[1], def: m[2] !== undefined ? jsDefault(m[2]) : 'null' });
  }
  const methods = [];
  for (const m of src.matchAll(/public function (\w+)\s*\(([^)]*)\)(?:\s*:\s*[?\w\\]+)?\s*\{([\s\S]*?)\n    \}/g)) {
    const [, name, args, bodyRaw] = m;
    const body = bodyRaw.trim();
    const getter = body.match(/^return \$this->(\w+)\s*;$/);
    const setter = body.match(/^\$this->(\w+)\s*=\s*\$(\w+)\s*;\s*(?:return \$this;)?$/);
    methods.push({ name, args, getter: getter && getter[1], setter: setter && setter[1] });
  }
  return { props, methods };
}

const files = readdirSync(ENTITY_DIR).filter((f) => f.endsWith('.php')).sort();
let out = `// FICHIER GÉNÉRÉ par build/gen-entities.mjs à partir de src/Entity/*.php — ne pas éditer à la main.\n`
  + `// Les classes reprennent les noms de getters/setters des entités Doctrine d'origine.\n\n`;
const names = [];

for (const f of files) {
  const cls = f.replace('.php', '');
  const src = readFileSync(join(ENTITY_DIR, f), 'utf8');
  const { props, methods } = parseEntity(src, cls);
  const sp = SPECIAL[cls] || {};
  names.push(cls);
  out += `export class ${cls} {\n`;
  if (cls === 'User') out += `  static ROLE_USER = 'ROLE_USER';\n  static ROLE_ADMIN = 'ROLE_ADMIN';\n`;
  out += `  constructor() {\n`;
  for (const p of props) out += `    this.${p.name} = ${p.def};\n`;
  if (sp.ctor) out += `    ${sp.ctor}\n`;
  out += `  }\n`;
  const seen = new Set();
  for (const m of methods) {
    if (seen.has(m.name) || /^(__|serialize|unserialize|getSalt|eraseCredentials|isAccount|isCredentials|addProject|removeProject)/.test(m.name)) continue;
    seen.add(m.name);
    if (sp[m.name]) { out += `  ${sp[m.name]}\n`; continue; }
    if (m.getter) {
      out += `  ${m.name}() { return this.${m.getter}; }\n`;
    } else if (m.setter) {
      const arg = m.args.replace(/^[^$]*\$/, '').replace(/\s*=.*$/, '').trim() || 'v';
      out += `  ${m.name}(${arg}) { this.${m.setter} = ${arg}; return this; }\n`;
    } else {
      // une méthode non triviale non traitée dans SPECIAL doit être signalée, jamais ignorée en silence
      console.warn(`ATTENTION ${cls}::${m.name} non générée (corps non reconnu)`);
    }
  }
  out += `}\n\n`;
}

out += `export const ENTITY_CLASSES = { ${names.join(', ')} };\n`;
out += `export const BACKREFS = ${JSON.stringify(BACKREFS)};\n`;
writeFileSync(OUT, out);
console.log(`généré ${OUT} (${names.length} entités)`);
