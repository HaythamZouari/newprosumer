// Équivalent de l'administration EasyAdmin d'origine (config/packages/easy_admin.yaml) : liste / création / édition /
// suppression de User, Project, Finance, Consomation, Pvgis, CsvProd, Ninja. Accès réservé à ROLE_ADMIN (kernel.js).
// Les entités liées (Finance…) sont stockées DANS leur projet : leur identifiant d'administration est celui du projet.
import { User, Project } from '../entities.js';

const ENTITIES = {
  User: { label: 'User', cols: ['id', 'username', 'email', 'fullName', 'societe', 'enabled', 'roles'] },
  Project: { label: 'Project', cols: ['id', 'name', 'adress', 'description', 'userId'] },
  Finance: { label: 'Finance', child: 'finance' },
  Consomation: { label: 'Consomation', child: 'consomation' },
  Pvgis: { label: 'Pvgis', child: 'pvgis' },
  CsvProd: { label: 'CsvProd', child: 'csvProd' },
  Ninja: { label: 'Ninja', child: 'ninja' },
};
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HEAVY = 200000; // au-delà, la valeur n'est pas affichée ni modifiable (courbes annuelles)

const page = (ctx, title, body) => ctx.html(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/build/css/argon-dashboard.min.css">
<style>body{padding:1rem 2rem}table{font-size:.85rem}td,th{max-width:18rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style></head><body>
<nav class="mb-3"><b>Administration</b> — ${Object.keys(ENTITIES).map((e) => `<a class="mr-3" href="/admin/${e}">${e}</a>`).join('')}<a href="/project/">← Application</a></nav>${body}</body></html>`);

const cell = (v) => {
  if (v === null || v === undefined) return '<span class="text-muted">null</span>';
  if (typeof v === 'object') { const j = JSON.stringify(v); return `<span class="text-muted" title="${esc(j.slice(0, 300))}">${Array.isArray(v) ? `[${v.length}]` : '{…}'}</span>`; }
  if (typeof v === 'boolean') return v ? '✔' : '✘';
  return esc(v);
};

/** Lignes d'une entité : [{ id, label?, rec }] — `rec` est l'objet modifiable. */
async function rows(ctx, name) {
  const def = ENTITIES[name];
  if (name === 'User') {
    const list = ctx.services.remoteUsers ? await ctx.services.remoteUsers.list() : (await ctx.repo.b.all('users'));
    return list.map((u) => ({ id: u.id, rec: u }));
  }
  const projects = await ctx.repo.b.all('projects');
  if (name === 'Project') return projects.map((p) => ({ id: p.id, rec: p, project: p }));
  return projects.filter((p) => p[def.child]).map((p) => ({ id: p.id, rec: p[def.child], project: p }));
}

function columns(name, items) {
  const def = ENTITIES[name];
  if (def.cols) return def.cols;
  const first = items[0]?.rec || {};
  return Object.keys(first).filter((k) => k !== 'id' && (first[k] === null || typeof first[k] !== 'object') && String(first[k] ?? '').length < 40).slice(0, 8);
}

export async function admin(ctx) { return ctx.redirect('/admin/User'); }

export async function admin_list(ctx) {
  const name = ctx.params.entity;
  if (!ENTITIES[name]) return ctx.html('<h1>404 Not Found</h1>', 404);
  const items = await rows(ctx, name);
  const cols = columns(name, items);
  const canNew = name === 'User' || name === 'Project';
  const head = `<tr><th>${ENTITIES[name].child ? 'Projet' : 'Id'}</th>${cols.filter((c) => c !== 'id').map((c) => `<th>${esc(c)}</th>`).join('')}<th></th></tr>`;
  const body = items.map((it) => `<tr><td>${esc(it.id)}</td>${cols.filter((c) => c !== 'id').map((c) => `<td>${cell(it.rec[c])}</td>`).join('')}
    <td><a href="/admin/${name}/edit/${encodeURIComponent(it.id)}">modifier</a> · <a href="/admin/${name}/delete/${encodeURIComponent(it.id)}">supprimer</a></td></tr>`).join('');
  return page(ctx, name, `<h2>${name} <small class="text-muted">(${items.length})</small></h2>${canNew ? `<p><a class="btn btn-primary btn-sm" href="/admin/${name}/new">Ajouter</a></p>` : ''}
    <div style="overflow-x:auto"><table class="table table-sm table-hover"><thead>${head}</thead><tbody>${body}</tbody></table></div>`);
}

const field = (k, v) => {
  const id = `f_${k}`;
  if (typeof v === 'boolean') return `<div class="form-check mb-2"><input type="hidden" name="${k}" value="0"><input class="form-check-input" type="checkbox" id="${id}" name="${k}" value="1" ${v ? 'checked' : ''}><label for="${id}" class="form-check-label">${esc(k)}</label></div>`;
  if (v !== null && typeof v === 'object') {
    const j = JSON.stringify(v, null, 1);
    if (j.length > HEAVY) return `<div class="mb-2"><label>${esc(k)}</label> <span class="text-muted">données volumineuses (${(j.length / 1e3).toFixed(0)} ko) — non modifiables ici</span></div>`;
    return `<div class="mb-2"><label for="${id}">${esc(k)} <small class="text-muted">(JSON)</small></label><textarea class="form-control" rows="${Math.min(8, j.split('\n').length)}" id="${id}" name="${k}">${esc(j)}</textarea></div>`;
  }
  return `<div class="mb-2"><label for="${id}">${esc(k)}</label><input class="form-control" id="${id}" name="${k}" type="${typeof v === 'number' ? 'number' : 'text'}" step="any" value="${esc(v)}"></div>`;
};

/** Reconvertit les valeurs postées selon le type d'origine (booléen, nombre, JSON, texte). */
function applyForm(rec, form) {
  const errors = [];
  for (const [k, orig] of Object.entries(rec)) {
    if (!(k in form) || k === 'id') continue;
    const v = form[k];
    if (typeof orig === 'boolean') rec[k] = v === '1';
    else if (typeof orig === 'number') rec[k] = v === '' ? null : Number(v);
    else if (orig !== null && typeof orig === 'object') { try { rec[k] = JSON.parse(v); } catch { errors.push(`${k} : JSON invalide`); } }
    else rec[k] = v === '' && orig === null ? null : v;
  }
  return errors;
}

export async function admin_do(ctx) {
  const { entity: name, action, id } = ctx.params;
  if (!ENTITIES[name] || !['edit', 'delete'].includes(action)) return ctx.html('<h1>404 Not Found</h1>', 404);
  const items = await rows(ctx, name);
  const it = items.find((x) => String(x.id) === String(id));
  if (!it) return ctx.html('<h1>404 Not Found</h1>', 404);
  const post = ctx.request.method === 'POST';

  if (action === 'delete') {
    if (!post) return page(ctx, 'Supprimer', `<h2>Supprimer ${name} #${esc(id)} ?</h2><form method="post" action="/admin/${name}/delete/${encodeURIComponent(id)}"><button class="btn btn-danger">Supprimer</button> <a class="btn btn-secondary" href="/admin/${name}">Annuler</a></form>`);
    if (name === 'User') { ctx.services.remoteUsers ? await ctx.services.remoteUsers.remove(id) : await ctx.repo.b.delete('users', typeof it.rec.id === 'number' ? it.rec.id : id); }
    else if (name === 'Project') await ctx.repo.removeProject(id);
    else { it.project[ENTITIES[name].child] = null; await ctx.repo.b.put('projects', it.project); }
    return ctx.redirect(`/admin/${name}`);
  }

  let errors = [];
  if (post) {
    errors = applyForm(it.rec, ctx.request.request);
    if (!errors.length) {
      if (name === 'User') { ctx.services.remoteUsers ? await ctx.services.remoteUsers.update(id, it.rec) : await ctx.repo.b.put('users', it.rec); }
      else await ctx.repo.b.put('projects', it.project || it.rec);
      return ctx.redirect(`/admin/${name}`);
    }
  }
  const skip = new Set(['id', 'password', 'plainPassword', 'userId', 'confirmationToken']);
  const fields = Object.entries(it.rec).filter(([k]) => !skip.has(k)).map(([k, v]) => field(k, v)).join('');
  return page(ctx, `Modifier ${name}`, `<h2>Modifier ${name} #${esc(id)}</h2>${errors.map((e) => `<div class="alert alert-danger">${esc(e)}</div>`).join('')}
    <form method="post" action="/admin/${name}/edit/${encodeURIComponent(id)}">${fields}<button class="btn btn-primary">Enregistrer</button> <a class="btn btn-secondary" href="/admin/${name}">Retour</a></form>`);
}

export async function admin_new(ctx) {
  const name = ctx.params.entity;
  if (name !== 'User' && name !== 'Project') return ctx.html('<h1>404 Not Found</h1>', 404);
  const proto = name === 'User' ? new User() : new Project();
  const skip = new Set(['id', 'password', 'plainPassword', 'confirmationToken', 'consomation', 'pvgis', 'ninja', 'csvProd', 'finance', 'pvwatt', 'user', 'consomations', 'projects']);
  const rec = Object.fromEntries(Object.entries(proto).filter(([k]) => !skip.has(k)));
  if (ctx.request.method === 'POST') {
    const errors = applyForm(rec, ctx.request.request);
    if (!errors.length) {
      if (name === 'User') { const u = Object.assign(new User(), rec); u.password = ''; await ctx.repo.saveUser(u); }
      else { const p = Object.assign(new Project(), rec); p.setUser(ctx.user); await ctx.repo.saveProject(p); }
      return ctx.redirect(`/admin/${name}`);
    }
  }
  return page(ctx, `Ajouter ${name}`, `<h2>Ajouter ${name}</h2><form method="post" action="/admin/${name}/new">${Object.entries(rec).map(([k, v]) => field(k, v)).join('')}<button class="btn btn-primary">Créer</button> <a class="btn btn-secondary" href="/admin/${name}">Retour</a></form>`);
}
