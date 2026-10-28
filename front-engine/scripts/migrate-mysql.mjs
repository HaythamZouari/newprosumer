#!/usr/bin/env node
// Migration MySQL (dump mysqldump de l'application Symfony) -> Supabase.
//
//   node scripts/migrate-mysql.mjs --dump dump.sql [--out migration-out] [--check]
//
// --check : rapport seul (aucun fichier écrit) — à lancer d'abord sur le vrai dump pour vérifier le mappage des colonnes.
// Sortie (dossier --out) :
//   01_users.sql      comptes (auth.users + auth.identities, mot de passe bcrypt conservé) + profils
//   02_projects.sql   un fichier par tranche de projets (np_docs)  -> 02_projects_001.sql, …
//   03_files.sh       copie des fichiers .xlsx importés vers le bucket `uploads/<uid>/…` (CLI Supabase)
// À exécuter dans l'éditeur SQL / `psql`, APRÈS les migrations 0001-0004.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseDump } from './lib/mysqlDump.mjs';
import { convert } from './lib/convert.mjs';

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? null : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const dollar = (json) => { let tag = 'np'; while (json.includes(`$${tag}$`)) tag += 'x'; return `$${tag}$${json}$${tag}$`; };

export function userSql(u) {
  const hash = String(u.passwordHash || '').replace(/^\$2y\$/, '$2a$'); // bcrypt PHP ($2y$) == $2a$ pour GoTrue
  const meta = JSON.stringify({ username: u.username, full_name: u.fullName, societe: u.societe });
  return `-- ${u.username}
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
values ('00000000-0000-0000-0000-000000000000', ${q(u.uuid)}, 'authenticated', 'authenticated', ${q(u.email)}, ${q(hash)}, now(),
        '{"provider":"email","providers":["email"]}', ${dollar(meta)}::jsonb, now(), now(), '', '', '', '')
on conflict (id) do nothing;
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (${q(u.uuid)}, ${q(u.uuid)}, ${q(u.uuid)}, jsonb_build_object('sub', ${q(u.uuid)}, 'email', ${q(u.email)}), 'email', now(), now(), now())
on conflict do nothing;
update public.profiles set username = ${q(u.username)}, full_name = ${q(u.fullName)}, societe = ${q(u.societe)}, img_url = ${q(u.imgUrl)},
  roles = ${q(`{${u.roles.join(',')}}`)}, enabled = ${u.enabled}, abon1 = ${u.abon1}, abon2 = ${u.abon2}, confirmation_token = ${q(u.confirmationToken)}
where id = ${q(u.uuid)};
`;
}
export const docSql = (d) => `insert into public.np_docs (user_id, kind, id, value) values (${q(d.owner)}, 'project', ${q(d.id)}, ${dollar(JSON.stringify(d.value))}::jsonb)
on conflict (user_id, kind, id) do update set value = excluded.value, updated_at = now();\n`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const dump = arg('dump');
  if (!dump || dump === true) { console.error('usage: node scripts/migrate-mysql.mjs --dump dump.sql [--out dossier] [--check]'); process.exit(2); }
  const { users, docs, files, report } = convert(parseDump(readFileSync(dump, 'utf8')));
  console.log(`utilisateurs : ${report.counts.users} — projets : ${report.counts.projects} — fichiers importés référencés : ${files.length}`);
  if (report.missingColumns.length) console.log(`⚠ propriétés sans colonne correspondante (laissées à leur valeur par défaut) :\n  ${report.missingColumns.join('\n  ')}`);
  for (const w of report.warnings) console.log(`⚠ ${w}`);
  for (const e of report.errors) console.log(`✘ ${e}`);
  if (arg('check')) process.exit(report.errors.length ? 1 : 0);
  if (report.errors.length) { console.error('Erreurs : corrigez-les ou relancez avec --check pour le détail.'); process.exit(1); }

  const out = typeof arg('out') === 'string' ? arg('out') : 'migration-out';
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, '01_users.sql'), `-- Comptes migrés (${users.length})\nbegin;\n${users.map(userSql).join('\n')}commit;\n`);
  const CHUNK = 20; let n = 0;
  for (let i = 0; i < docs.length; i += CHUNK) writeFileSync(join(out, `02_projects_${String(++n).padStart(3, '0')}.sql`), `begin;\n${docs.slice(i, i + CHUNK).map(docSql).join('')}commit;\n`);
  const owner = new Map(docs.map((d) => [d.value.consomation?.url_ccv, d.owner]));
  writeFileSync(join(out, '03_files.sh'), `#!/bin/sh\n# Copie des fichiers importés (adapter SRC : dossier public/uploads de l'ancien serveur)\nSRC="\${SRC:-./uploads}"\n` +
    docs.flatMap((d) => [...new Set([...(String(d.value.consomation?.url_ccv || '').split('///')), d.value.csvProd?.path].filter(Boolean))]
      .map((f) => `[ -f "$SRC/${f.replace(/^uploads\//, '')}" ] && supabase storage cp "$SRC/${f.replace(/^uploads\//, '')}" "ss:///uploads/${d.owner}/${f.replace(/^uploads\//, '').split('/').pop()}" --experimental || echo "manquant: ${f}"`)).join('\n') + '\n');
  console.log(`écrit dans ${out}/ : 01_users.sql, ${n} fichier(s) 02_projects_*.sql, 03_files.sh`);
}
