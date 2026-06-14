---
---

# Sankey enrichi — destinations d'épargne (T5a de 00058)

> Premier sous-ticket du découpage de **T5** (épopée `00058-comptes-multiples`).
> Aucune décision ouverte : les règles sont déjà tranchées (décisions 8 & 10 du feature).

## Objectif

Le Sankey ment aujourd'hui sur l'épargne : le « reste » est un nœud abstrait. Le décomposer
par **destination patrimoine** à partir des transferts `compte → patrimoine` du mois, et ajouter
une source synthétique **« Solde antérieur »** quand les contributions dépassent le net.

## Périmètre

- **Décomposition du nœud épargne** : chaque transfert `compte → patrimoine` du mois devient un
  flux d'épargne nommé (« Épargne PEA » +500, « Livret » +200). Le reste = « Resté liquide ».
- **Transferts `compte → compte` invisibles** (internes — ni revenu ni dépense, déjà exclus en T3).
- **Drawdown** : quand `Σ contributions patrimoine > net`, ajouter une source income synthétique
  **« Solde antérieur »** pour équilibrer le diagramme (`sankey.ts` doit accepter un nœud income synthétique).
- Périmètre **combiné** sur tous les comptes *visibles* (helper `visible_account_ids`).

## Critères de validation

- [ ] Un transfert commun → PEA apparaît comme nœud d'épargne nommé « Épargne PEA » dans le Sankey
- [ ] Les transferts commun → perso (`compte → compte`) n'apparaissent **pas** (internes)
- [ ] Quand contributions > net, une source « Solde antérieur » équilibre le diagramme
- [ ] Les totaux income/expense/net du summary restent **inchangés** (régression T3)

## Hors scope (autres sous-tickets de T5)

- Back-fill historique net worth / sparkline → `00065`
- Filtre par compte sur la page Analyse → `00066`
