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

## Tests de parité

`test/php/run.php` exécute les services PHP d'origine de façon isolée ;
`test/parity.test.js` compare leurs sorties à celles du JS.

```bash
cd front-engine
node --test        # nécessite php en ligne de commande
```

## Reste à porter (étapes suivantes)

- `FinanceService` (modèle financier sur 30 ans) — pur, portable.
- Logique de `ProjectListner` (croisement conso/production : autoconso, cédée,
  importée) — le bloc le plus dense.
- `ExcelReader` → SheetJS (parsing des fichiers importés), à valider sur de
  vrais fichiers Excel.
