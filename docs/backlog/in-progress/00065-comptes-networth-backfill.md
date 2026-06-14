---
---

# Net worth — back-fill historique des comptes (T5b de 00058)

> Deuxième sous-ticket du découpage de **T5** (épopée `00058-comptes-multiples`).
> ⚠️ **Décision ouverte à trancher avant de coder** : stratégie de back-fill (à la volée vs snapshots de comptes).

## Objectif

Aujourd'hui la sparkline net worth n'inclut que le patrimoine (snapshots) : le cash des comptes
courants est absent de l'historique. Back-filler les soldes de comptes à des dates passées
(calculés depuis les txns) pour que la sparkline reflète le net worth combiné dans le temps.

## Décision ouverte

- **Stratégie de calcul** : recomputer le solde de chaque compte à une date passée à la volée
  (depuis les txns + transferts) vs. matérialiser des snapshots de comptes.
  → Trancher coût/complexité avant implémentation.

## Périmètre

- Calcul du solde d'un compte **à une date passée** = `initial_balance + Σ (income − expense ± transferts) jusqu'à la date`.
- Intégrer ces soldes dans la série historique net worth (combinée avec les snapshots patrimoine).
- Scopé par utilisateur via `visible_account_ids`.

## Critères de validation

- [ ] La sparkline net worth inclut l'historique des soldes de comptes
- [ ] Le point le plus récent de la sparkline = en-tête net worth (Σ comptes + Σ patrimoine)
- [ ] Un foyer sans patrimoine (que des comptes) a une sparkline non vide

## Hors scope

- Décomposition Sankey épargne → `00064`
- Filtre par compte sur Analyse → `00066`
