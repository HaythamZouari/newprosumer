# Backend Supabase — schéma NewProsumer

Migrations SQL dérivées des entités Doctrine (`src/Entity/*`). Elles couvrent les
trois besoins : **Auth** (comptes + confirmation email), **base Postgres** et
**Storage** (fichiers importés).

## Fichiers

| Migration | Contenu |
|-----------|---------|
| `migrations/0001_schema.sql` | Tables (profiles, projects, consomation, pvgis, pvwatt, ninja, csv_prod, finance) |
| `migrations/0002_rls.sql` | Row Level Security : chaque utilisateur n'accède qu'à ses données |
| `migrations/0003_storage.sql` | Bucket privé `uploads` + politiques d'accès par propriétaire |

## Correspondance entités → tables

- `User` → **auth.users** (Supabase Auth : email, mot de passe bcrypt,
  confirmation par email, reset) **+** table `profiles` pour le métier
  (`username`, `full_name`, `societe`, `img_url`, `roles`, `enabled`, `abon1`,
  `abon2`). Les champs `password`/`confirmationToken` ne sont pas dupliqués :
  Supabase Auth s'en charge.
- `Project` → `projects` (+ les résultats horaires produits par `projectData.js`).
- `Consomation`, `Finance`, `Pvgis`, `Pvwatt`, `Ninja`, `CsvProd` → tables 1:1
  reliées à `projects` par `project_id unique` (suppression en cascade).
- Colonnes Doctrine `type="array"` → `jsonb`. `float` → `double precision`.
  Identifiants auto-incrément → `uuid`.

## Appliquer

Avec la CLI Supabase (recommandé) :

```bash
supabase db push           # applique les migrations du dossier migrations/
```

Ou coller le contenu des trois fichiers, dans l'ordre, dans l'éditeur SQL du
tableau de bord Supabase.

## Sécurité — à retenir

- Les politiques RLS (0002) sont la **barrière réelle** : le front est
  contournable, donc toute lecture/écriture passe par ces règles côté serveur.
- Les fichiers du bucket `uploads` sont rangés sous `"<uid>/<projet>/<fichier>"` ;
  la politique isole chaque propriétaire sur le 1er segment du chemin.

## Migration des données existantes (MySQL → Postgres)

Étape ultérieure, nécessite un **dump de la base de production** :
1. exporter users/projects et entités liées depuis MySQL ;
2. créer les comptes dans Supabase Auth en **important les hash bcrypt**
   (évite la réinitialisation des mots de passe) ;
3. insérer projets + entités liées en mappant les colonnes `array` sérialisées
   PHP vers du JSON ;
4. téléverser les fichiers `public/uploads/` existants dans le bucket `uploads`.
