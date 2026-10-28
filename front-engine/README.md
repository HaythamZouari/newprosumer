# front-engine — portage JavaScript du moteur de calcul

Étape 1 de la migration vers une architecture front (Vercel) + backend managé
(Supabase). Ce dossier est **isolé** : il ne modifie pas le code PHP/Symfony existant.

Objectif de cette étape : porter en JavaScript la logique de calcul **pure**
(sans dépendance réseau ni base de données) et **prouver** qu'elle donne les
mêmes résultats que les services PHP d'origine.

## Fuseau horaire (point critique)

Tout le calcul dépend du fuseau **Africa/Tunis** (UTC+1, sans heure d'été) —
déduit des jours fériés tunisiens et des postes tarifaires STEG codés en dur.
Le décalage est figé dans `src/tz.js` pour que les résultats soient indépendants
du fuseau de la machine qui exécute le code.

## Modules portés

| Module JS | Service PHP d'origine | Rôle |
|-----------|-----------------------|------|
| `src/tz.js` | (fuseau implicite) | Composantes de date sur Africa/Tunis |
| `src/postHoraire.js` | `PostHoraire` | Ventilation par mois × poste tarifaire |
| `src/horaireAnnuel.js` | `Horaireannuel` | Ventilation annuelle par poste tarifaire |
| `src/dateSorting.js` | `Datesorting::SorteDate` | Réalignement production ↔ consommation |
| `src/excelReader.js` | `ExcelReader::createDataFromSpreadsheet` | Parsing des 3 formes de courbe (SheetJS) |
| `src/financeService.js` | `FinanceService` | Modèle financier 30 ans (gains, annuités, LLCR, cashflows) |
| `src/projectData.js` | `ProjectListner::onProjectEvent` | Croisement conso/production (autoconso, cédée, importée, multi-sites) |

## Les 3 formes de courbe de charge (confirmées sur fichiers réels)

Distinguées par le nombre de feuilles du classeur ; toutes au pas 10 min,
sous-échantillonnées au relevé ~xx:10 de chaque heure (fidèle au PHP).

| Type | Feuilles | Date | Heure | Puissance |
|------|----------|------|-------|-----------|
| 1 | 1 | col 0 = date-série Excel (chaque ligne) | col 1 = fraction de jour | col 3 |
| 2 | 2 (données en 2ᵉ) | col 0 = `JJ/MM/AAAA` (au chgt de jour) | col 1 = `HH:MM` | col 2 |
| 3 | >2 (1 couverture + 1/jour) | titre de feuille (`jeudi 1 mars 2018`) | col 0 = fraction de jour | col 1 |

## Tests de parité

`test/php/run.php` et `test/php/finance.php` exécutent les services PHP
d'origine de façon isolée (ce dernier via des stubs d'entités pour piloter
`FinanceService` sans Symfony/Doctrine) ; les tests comparent leurs sorties au JS.

Le portage de `FinanceService` reproduit **à l'identique** les bugs du PHP
(signalés « BUG PHP » dans le code), afin que l'application portée donne les
mêmes chiffres. Leur correction éventuelle sera une décision ultérieure.

```bash
cd front-engine
node --test        # nécessite php en ligne de commande
```

## État : moteur de calcul entièrement porté ✅

Toute la logique de calcul pure est en JS et validée en parité contre le PHP
d'origine (24/24 tests). Particularité : le `else` sans accolades de
`ProjectListner` (lignes 121-126) fait que le calcul du site 0 revient à
`auto = min(conso, prod)` ; c'est reproduit et explicité dans le port.

## Reste à faire (intégration, hors moteur)

- Résolution de `cedePH`/`injectPH` : déjà produite par `projectData.js`
  (`cedeePH`/`injectPH`), à brancher sur `gainEnergieCedee`.
- Fonctions proxy Vercel pour PVGIS / renewables.ninja (CORS + token secret).
- Backend Supabase (Auth + Postgres + Storage) et migration des données.
- Front (UI, graphiques, PDF) assemblant le tout.
