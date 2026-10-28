// Dump MySQL (tables parsées) -> utilisateurs + documents projet au format de l'application portée.
// Le mappage propriété -> colonne ignore la casse et les « _ » (Doctrine : fullName -> full_name, allConsomation_annuel ->
// all_consomation_annuel…). Tout ce qui ne se mappe pas est SIGNALÉ dans `report` (jamais ignoré en silence).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unserialize } from './phpUnserialize.mjs';
import * as G from '../../app/entities.generated.js';

const here = dirname(fileURLToPath(import.meta.url));
const ENTITY_DIR = join(here, '..', '..', '..', 'src', 'Entity');
const norm = (s) => String(s).toLowerCase().replace(/_/g, '');

/** { Entity: { prop: doctrineType } } lu dans src/Entity/*.php */
export function propertyTypes(dir = ENTITY_DIR) {
  const out = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.php'))) {
    const src = readFileSync(join(dir, f), 'utf8'); const types = {};
    for (const m of src.matchAll(/@ORM\\Column\(([^)]*)\)[\s\S]*?private\s+\$(\w+)/g)) types[m[2]] = (m[1].match(/type="(\w+)"/) || [])[1] || 'string';
    out[f.replace('.php', '')] = types;
  }
  return out;
}

export const uuidFor = (kind, id) => {
  const h = createHash('sha1').update(`newprosumer:${kind}:${id}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.toString('hex').slice(0, 32);
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
};

function convertValue(raw, type, report, where) {
  if (raw === null || raw === undefined) return null;
  switch (type) {
    case 'array': {
      if (raw === '') return null;
      try { return unserialize(raw); } catch (e) { report.errors.push(`${where}: ${e.message}`); return null; }
    }
    case 'simple_array': return raw === '' ? [] : String(raw).split(',');
    case 'boolean': return raw === 1 || raw === '1' || raw === true;
    case 'integer': case 'float': return Number(raw);
    case 'datetime': return { date: `${raw}.000000`, timezone_type: 3, timezone: 'Africa/Tunis' };
    default: return raw;
  }
}

/** Remplit `target` (instance d'entité) depuis une ligne SQL. */
function fill(target, row, entity, types, report, where) {
  const cols = new Map(Object.keys(row).map((c) => [norm(c), c]));
  const used = new Set();
  for (const prop of Object.keys(target)) {
    if (!types[prop]) continue; // relations / champs non persistés
    const col = cols.get(norm(prop));
    if (!col) { report.missingColumns.add(`${entity}.${prop}`); continue; }
    used.add(col);
    target[prop] = convertValue(row[col], types[prop], report, `${where}.${prop}`);
  }
  return used;
}

const CHILD = { pvwatt: 'Pvwatt', pvgis: 'Pvgis', ninja: 'Ninja', consomation: 'Consomation', csvProd: 'CsvProd', finance: 'Finance' };
const FK = { pvwatt: 'pvwatt_id', pvgis: 'pvgis_id', ninja: 'ninja_id', consomation: 'consomation_id', csvProd: 'csv_prod_id', finance: 'finance_id' };
const TABLE = { pvwatt: 'pvwatt', pvgis: 'pvgis', ninja: 'ninja', consomation: 'consomation', csvProd: 'csv_prod', finance: 'finance' };

export function convert(tables, { types = propertyTypes() } = {}) {
  const report = { errors: [], missingColumns: new Set(), warnings: [], counts: {} };
  const need = (t) => { if (!tables[t]) (['user', 'project'].includes(t) ? report.errors : report.warnings).push(`table « ${t} » absente du dump`); return tables[t]?.rows || []; };

  const users = need('user').map((r) => {
    const u = new G.User();
    fill(u, r, 'User', types.User, report, `user#${r.id}`);
    const roles = r.roles === null ? [] : String(r.roles).split(',').filter(Boolean);
    return {
      mysqlId: r.id, uuid: uuidFor('user', r.id), username: r.username, email: r.email, passwordHash: r.password,
      fullName: u.fullName, societe: u.societe, imgUrl: u.img_URL ?? null, roles: roles.length ? roles : ['ROLE_USER'],
      enabled: !!u.enabled, abon1: !!u.abon1, abon2: !!u.abon2, confirmationToken: u.confirmationToken || null,
    };
  });
  const uuidOfUser = new Map(users.map((u) => [u.mysqlId, u.uuid]));
  report.counts.users = users.length;

  const byId = (t) => new Map(need(t).map((r) => [r.id, r]));
  const childTables = Object.fromEntries(Object.entries(TABLE).map(([k, t]) => [k, byId(t)]));
  const files = [];
  const docs = [];
  for (const row of need('project')) {
    const rec = new G.Project(); delete rec.consomation;
    fill(rec, row, 'Project', types.Project, report, `project#${row.id}`);
    for (const [k, cls] of Object.entries(CHILD)) {
      const fk = row[FK[k]];
      if (fk === null || fk === undefined) { rec[k] = null; continue; }
      const crow = childTables[k].get(fk);
      if (!crow) { report.warnings.push(`project#${row.id}: ${TABLE[k]}#${fk} introuvable`); rec[k] = null; continue; }
      const child = new G[cls]();
      fill(child, crow, cls, types[cls], report, `${TABLE[k]}#${fk}`);
      delete child.project;
      rec[k] = { ...child };
      if (k === 'consomation' && child.url_ccv) for (const f of String(child.url_ccv).split('///').filter(Boolean)) files.push(f);
      if (k === 'csvProd' && child.path) files.push(child.path);
    }
    const owner = row.user_id === null ? null : uuidOfUser.get(row.user_id);
    if (!owner) { report.warnings.push(`project#${row.id}: propriétaire user#${row.user_id} introuvable — projet ignoré`); continue; }
    delete rec.user; delete rec.consomations;
    const id = `m${row.id}`;
    docs.push({ owner, id, value: { ...rec, id, userId: owner } });
  }
  report.counts.projects = docs.length;
  report.missingColumns = [...report.missingColumns].sort();
  return { users, docs, files: [...new Set(files)], report };
}
