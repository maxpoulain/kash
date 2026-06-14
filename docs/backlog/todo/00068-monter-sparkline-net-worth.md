---
---

# Monter la sparkline net worth dans l'UI

> Suivi de `00065` : la donnée d'historique net worth (cash comptes + patrimoine) existe et est correcte,
> mais le composant `NetWorthSparkline` (`frontend/components/assets/net-worth-sparkline.tsx`) **n'est monté nulle part** — code mort.

## Objectif

Afficher la courbe d'évolution du net worth dans la page Comptes, en branchant le composant `NetWorthSparkline` existant sur l'historique déjà fourni par `GET /api/savings-accounts/history` (qui inclut désormais le cash des comptes, cf. `00065`).

## Contexte

- L'historique est déjà chargé dans `assets-client.tsx` (`getNetWorthHistory` → state `history`), mais seul le **badge delta** (↑/↓ montant/période) le consomme. La sparkline n'est pas rendue.
- Le composant `NetWorthSparkline` est prêt (props `points: NetWorthHistoryPoint[]`).

## Périmètre

- Rendre `<NetWorthSparkline points={history} />` dans le hero net worth (page Comptes).
- Décider du **placement** (hero patrimoine ? en-tête global au-dessus des onglets ?) et du style sur le fond dégradé.
- Gérer le responsive (la sparkline a une taille par défaut 320×60).

## Critères de validation

- [ ] La courbe d'évolution du net worth est visible sur la page Comptes
- [ ] Elle reflète l'historique combiné (comptes + patrimoine) — son dernier point = en-tête net worth
- [ ] Rendu correct mobile + desktop

## Hors scope

- Le calcul de l'historique (fait en `00065`).
- Renommer l'endpoint `/savings-accounts/history` (dette notée dans `00065`).
