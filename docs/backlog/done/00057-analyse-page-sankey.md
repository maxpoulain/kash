---
---

# Page Analyse — Sankey + Sections

## Objectif

Créer une **section "Analyse" dédiée** (à la manière de YNAB Reports / Finary Cashflow) pour creuser les revenus et les dépenses du foyer. La pièce maîtresse est un **diagramme de Sankey** du flux d'argent, complété par des sections détaillées par catégorie. Dépend de `00056` (endpoint `GET /summary`).

> Note : la page d'accueil unifiée (vue d'ensemble / KPI cards) est volontairement **hors périmètre** ici. On se concentre exclusivement sur la section Analyse.

## Périmètre

- Frontend : nouvelle route `/analyse`
- Entrée de navigation :
  - **Sidebar desktop** : nouvel item "Analyse" (place disponible)
  - **Bottom-nav mobile** : le slot du sélecteur de langue est remplacé par un **menu burger / "Plus"** qui ouvre une feuille (bottom sheet) avec les destinations secondaires
  - La feuille "Plus" contient au minimum : lien **Analyse** + **sélecteur de langue** (réimplanté ici), avec de la place pour les futures pages (réglages, profil…)
- **Sankey** (haut de page) : revenus par catégorie → pool central → dépenses par catégorie + épargne (solde), pour le mois sélectionné
- **Sections sous le Sankey** :
  - Répartition des **dépenses** par catégorie (donut ou barres, % + montant)
  - Répartition des **revenus** par catégorie
  - **Taux d'épargne** du mois mis en avant
- Sélecteur de mois réutilisant le pattern existant de `transaction-list`
- État vide propre quand le mois n'a pas de données
- Données issues exclusivement de `GET /summary` (aucune agrégation côté client)

## Critères de validation

- [ ] La page Analyse est accessible depuis la sidebar (desktop) et, sur mobile, via le menu burger "Plus" du bottom-nav
- [ ] Le bottom-nav mobile expose un menu burger "Plus" à la place du sélecteur de langue
- [ ] La feuille "Plus" donne accès à Analyse et au changement de langue
- [ ] Le Sankey affiche le flux revenus → dépenses → épargne pour le mois sélectionné
- [ ] Changer de mois met à jour le Sankey **et** les sections
- [ ] Les répartitions par catégorie sont cohérentes avec la réponse de `GET /summary`
- [ ] Le taux d'épargne affiché correspond au calcul backend
- [ ] Affichage correct et lisible sur desktop et mobile
- [ ] État vide géré (mois sans transaction)

## Hypothèses à valider

- Sur mobile, faire d'Analyse une destination secondaire (derrière le menu "Plus") plutôt que primaire est acceptable — à confirmer à l'usage vs la découvrabilité visée par YNAB/Finary
- Le drill-down catégorie → transactions est reporté à un incrément ultérieur (V2)

## Implementation Plan

### Décisions design (issues du design system + arbitrages)

- **Pas de lib de charting** : le codebase hand-roll ses charts en SVG (cf. `net-worth-sparkline`). On fait pareil pour le Sankey, le donut et les barres → zéro nouvelle dépendance.
- **Hybride** : Sankey custom en hero (notre différenciateur vs YNAB), puis sections **donut + liste catégories à barres** reprises des mockups `desktop-insights` / `mobile-stats`.
- **Revenus ET dépenses** : les deux dimensions, cohérent avec le Sankey de flux et l'endpoint `/summary`.
- **Tokens** : revenus/épargne = `--accent` (moss green), dépenses = palette catégories (`--pig`, `--gold`, `--warn`, `--pig-deep`, `--accent`, `--ink-2`), neutres `--ink-3`/`--line`/`--bg-sunk`.

### Fichiers

1. `types/api.ts` — `CategoryAmount`, `Summary`
2. `lib/api.ts` — `getSummary(month?)`
3. `lib/sankey.ts` — fonction **pure** `computeSankeyLayout(...)` (nœuds + liens proportionnels) → testable
4. `components/analyse/sankey-flow.tsx` — SVG hero (revenus → pool → dépenses + épargne)
5. `components/analyse/category-breakdown.tsx` — carte donut + légende à barres (revenus / dépenses)
6. `app/[locale]/analyse/page.tsx` + `analyse-client.tsx` — auth redirect + MonthSwitcher + fetch + KPI + Sankey + 2 breakdowns + empty state
7. `components/nav/sidebar.tsx` — item "Analyse"
8. `components/nav/bottom-nav.tsx` — menu burger "Plus" (Sheet) remplaçant le LanguageSwitcher, contenant Analyse + langue
9. `messages/fr.json` + `messages/en.json` — `nav.analyse`, `nav.more`, section `analyse`

### Test list

- [ ] `lib/sankey.ts` : largeurs de liens proportionnelles aux montants, somme cohérente, cas épargne négative (déficit)
- [ ] `lib/api.ts` : `getSummary` appelle `/api/summary?month=…`, parse la réponse, throw si non-ok
- [ ] `just check` vert (lint + typecheck + tests front & back)
