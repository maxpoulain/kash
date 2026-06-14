---
---

# Sankey : afficher le % du revenu par nœud

> Idée issue d'une question pendant la série T5 (`00058`). Faisable simplement : chaque nœud a déjà son `amount`,
> et `total_income` est connu côté `summary`.

## Objectif

Afficher, à côté de chaque libellé de nœud du Sankey (page Analyse), le **pourcentage qu'il représente par rapport au revenu total** du mois. Ex. « Loyer 893,12 € · 35 % », « Épargne PEA 500 € · 20 % ».

## Contexte

- Le composant `SankeyFlow` (`frontend/components/analyse/sankey-flow.tsx`) rend déjà `label + montant` en overlay HTML.
- `total_income` vient de `summary` (déjà chargé dans `analyse-client.tsx`).
- `%` d'un nœud = `node.amount / total_income`.

## Questions à trancher

- **Dénominateur** : toujours `total_income` ? (cohérent côté dépenses ET épargne — « X % de mes revenus part en loyer / en épargne »). Que faire quand `total_income = 0` (masquer le %) ?
- **Quels nœuds** : tous (revenus, dépenses, épargne, « Solde antérieur ») ou seulement sortie ? Pour les nœuds revenus, % du revenu = part de chaque source.
- **Place / lisibilité** : le label affiche déjà `nom + montant` ; ajouter le % sans surcharger les petits nœuds (cf. seuil `MIN_LABEL_H`).

## Critères de validation

- [ ] Chaque nœud affiche son % du revenu total à côté du montant
- [ ] `total_income = 0` → pas de % affiché (pas de division par zéro)
- [ ] Lisible sur desktop (le Sankey est desktop-only)

## Hors scope

- Refonte du Sankey (décomposition déjà livrée par `00064`).
