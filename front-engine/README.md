# NewProsumer — version « tout front » (Vercel + Supabase)

L'application d'origine (Symfony) est exécutée **telle quelle côté navigateur** : templates Twig et assets d'origine,
contrôleurs PHP portés en JS (`app/controllers/*`) et validés contre le vrai PHP (`npm test`, nécessite `composer install`
dans `test/php`). Les API externes passent par des fonctions serverless (`api/*`).

## Déploiement Vercel
1. Importer le dépôt, **Root Directory = `front-engine`** (la branche doit contenir ce dossier).
2. Variables d'environnement : `NINJA_TOKEN` (renewables.ninja), `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (défaut contact@prosumers.tn),
   `MAPBOX_TOKEN` (carte de sélection d'adresse), `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
   Mode Supabase (comptes + synchronisation) : `NP_BACKEND=supabase`, `SUPABASE_SERVICE_KEY` (secret, fonction `api/approve`),
   et appliquer `supabase/migrations/0001…0004`. Par défaut (`NP_BACKEND=local`) tout reste dans le navigateur (IndexedDB).
   Le flux d'origine est conservé : inscription -> compte désactivé -> e-mail à l'administrateur -> lien /confirm/{token}.
   ⚠ Le mode Supabase est testé contre un Supabase simulé (`test/supabaseSync.test.js`), pas encore contre l'instance réelle.
3. `vercel.json` fournit build (`node build/build.mjs --mode=clean`), sortie `dist` et réécriture SPA.

## Tests
- `npm test` : parité avec le PHP d'origine (contrôleurs, lecteur Excel, finance, aléatoire MT19937).
- `node --test test/e2e/wizard.e2e.mjs` : parcours complet dans Chromium (Playwright global) avec les 3 courbes réelles (`.samples/`).

## Secrets à révoquer
Des clés présentes dans l'historique Git de l'application d'origine (jeton renewables.ninja, clé Sejda, jeton Mapbox) sont à régénérer.

## Administration (`/admin`)
Équivalent de l'EasyAdmin d'origine : User, Project, Finance, Consomation, Pvgis, CsvProd, Ninja (liste, ajout User/Project, modification, suppression).
Réservé à `ROLE_ADMIN`. Mode local : le 1er compte créé est administrateur de ses propres données. Mode Supabase : les comptes sont
gérés via `api/admin-users.js` (rôle vérifié côté serveur) ; pour nommer un administrateur :
`update public.profiles set roles = '{ROLE_USER,ROLE_ADMIN}' where username = '...';`

## Migration des données MySQL → Supabase
```bash
mysqldump --no-tablespaces --skip-extended-insert=false <base> > dump.sql      # dump complet de l'ancienne base
node scripts/migrate-mysql.mjs --dump dump.sql --check                          # rapport : comptes, projets, colonnes non mappées
node scripts/migrate-mysql.mjs --dump dump.sql --out migration-out              # génère les fichiers
```
Puis, **après les migrations 0001-0004** : exécuter `01_users.sql` (comptes avec leur mot de passe bcrypt d'origine — les
utilisateurs se connectent avec les mêmes identifiants), puis les `02_projects_*.sql` (projets agrégés, rejouables), puis
`SRC=<ancien public/uploads> sh 03_files.sh` (fichiers .xlsx importés vers le bucket `uploads`).
Colonnes `array` Doctrine (PHP sérialisé) converties en JSON ; le mappage colonnes ↔ propriétés ne tient pas compte de la casse ni des « _ ».
⚠ Validé sur un dump synthétique produit avec le vrai `serialize()` PHP ; **lancer d'abord `--check` sur le vrai dump** et relire les
avertissements « propriétés sans colonne ».
