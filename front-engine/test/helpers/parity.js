// Outils de parité : exécute un scénario sur le VRAI contrôleur PHP (test/php/*.php) et sur le port JS,
// puis compare réponses et état persistant.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import assert from 'node:assert/strict';
import { MemoryBackend, Repo } from '../../app/db.js';
import { Kernel } from '../../app/kernel.js';
import { Request } from '../../app/http.js';
import { CONTROLLERS } from '../../app/controllers/index.js';
import { Project, User } from '../../app/entities.js';
import { parsePvgisLines } from '../../src/producers/pvgis.js';
import { PhpMt } from '../../app/lib/phpRandom.js';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
export const PHP_DIR = join(here, '..', 'php');
export const havePhp = existsSync(join(PHP_DIR, 'vendor', 'autoload.php'));
export const SAMPLES = join(here, '..', '..', '..', '.samples');
export const sample = (t) => join(SAMPLES, `type${t}`, `Type_${t}.xlsx`);

export function runPhp(script, spec) {
  return JSON.parse(execFileSync('php', [join(PHP_DIR, script)], { input: JSON.stringify(spec), encoding: 'utf8', maxBuffer: 1 << 29 }));
}

/** Rejoue `steps` sur le port JS avec le même état initial ; renvoie les réponses et l'état final. */
export async function runJs(spec, { controllers = CONTROLLERS } = {}) {
  const repo = new Repo(new MemoryBackend());
  await repo.boot();
  const user = new User(); user.setUsername('parity').setEmail('p@x.tn'); user.enabled = true;
  await repo.saveUser(user); await repo.setCurrentUser(user);
  for (const [k, v] of Object.entries(spec.session || {})) repo.session.set(k, v);

  const project = new Project();
  project.setUser(user);
  Object.assign(project.getConsomation(), structuredClone(spec.project?.consomation || {}));
  for (const [k, v] of Object.entries(spec.project?.project || {})) project[k] = structuredClone(v);
  for (const [k, ctor] of Object.entries(spec.project?.entities || {})) Object.assign(project[k] = new (ctor.cls)(), structuredClone(ctor.props));
  await repo.saveProject(project);

  const mt = new PhpMt(spec.seed ?? 1);
  // Réponses d'API rejouées (mêmes corps que ceux donnés au HttpClient doublé côté PHP)
  let queue = [];
  const producers = {
    pvgis: async () => ({ lines: parsePvgisLines(queue.shift()) }),
    ninja: async () => JSON.parse(queue.shift()),
  };
  const services = {
    producers,
    rand: (a, b) => mt.rand(a, b), uniqid: () => 'fixed',
    xlsx: async () => require('xlsx'), ...(spec.services || {}),
  };
  const kernel = new Kernel({ repo, twig: null, controllers, services });
  const out = [];
  for (const step of spec.steps) {
    const files = {};
    queue = [...(step.http || [])];
    if (step.csv !== undefined) files.file = new File([step.csv], 'prod.csv');
    if (step.file) files.file = new File([readFileSync(step.file)], basename(step.file));
    const route = step.path ? step.path.replace('{id}', project.id) : `/project/${project.id}`;
    const req = new Request({ method: step.method || 'POST', path: route, request: step.request || {}, files, headers: { 'x-requested-with': 'XMLHttpRequest' } });
    const res = await kernel.handle(req);
    if (res.status >= 400) throw new Error(`étape ${step.call} : HTTP ${res.status} ${res.body}`);
    out.push(JSON.parse(res.body));
  }
  const saved = await repo.findProject(project.id);
  const dump = (o, skip = []) => Object.fromEntries(Object.entries(o).filter(([k, v]) => !skip.includes(k) && (v === null || typeof v !== 'object' || Array.isArray(v) || !('project' in v && v.constructor !== Object))));
  return { steps: out, consomation: dump(saved.getConsomation(), ['project']), project: dump(saved, ['user', 'userId', 'consomation', 'pvgis', 'ninja', 'csvProd', 'finance', 'pvwatt']), session: repo.session.data, saved,
    entities: Object.fromEntries(['pvgis', 'ninja', 'csvProd'].map((k) => [k, saved[`get${k[0].toUpperCase()}${k.slice(1)}`]()]).map(([k, e]) => [k, e && dump(e, ['project'])])) };
}

/** Comparaison récursive tolérante sur les flottants ; null/undefined/absent sont équivalents. */
export function assertClose(a, b, path = '$', tol = 1e-9) {
  const isNum = (x) => typeof x === 'number';
  if (a === undefined) a = null;
  if (b === undefined) b = null;
  if (isNum(a) && isNum(b)) {
    const ok = a === b || Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
    assert.ok(ok, `${path}: JS=${a} PHP=${b}`);
    return;
  }
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    // un tableau PHP "liste" et un objet de clés 0..n-1 sont équivalents
    const ka = Array.isArray(a) ? a.map((_, i) => String(i)) : Object.keys(a);
    const kb = Array.isArray(b) ? b.map((_, i) => String(i)) : Object.keys(b);
    const keys = new Set([...ka, ...kb]);
    for (const k of keys) assertClose(a[k], b[k], `${path}.${k}`, tol);
    return;
  }
  assert.deepEqual(a, b, `${path}: JS=${JSON.stringify(a)} PHP=${JSON.stringify(b)}`);
}
