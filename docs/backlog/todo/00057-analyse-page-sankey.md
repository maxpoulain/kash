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
- Choix d'une lib de charting gérant le Sankey (ex. `@nivo/sankey` ou `visx`) acceptable en taille de bundle — `recharts` (déjà éventuellement présent) n'a pas de Sankey robuste
- Le drill-down catégorie → transactions est reporté à un incrément ultérieur (V2)
