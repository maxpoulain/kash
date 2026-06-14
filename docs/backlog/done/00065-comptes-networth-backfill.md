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

- [x] L'historique net worth (`GET /api/savings-accounts/history`) inclut le cash des comptes
- [x] Le point le plus récent = en-tête net worth (Σ comptes + Σ patrimoine) — vérifié live : 11 522,83 €
- [x] Un foyer sans patrimoine (que des comptes) a un historique non vide

> **Note de scope** : le composant `NetWorthSparkline` n'est monté nulle part (code mort). `00065` livre la **donnée** correcte (et enrichit le badge delta, seul consommateur actuel). Le **rendu** de la sparkline est déplacé vers `00068`.

## Hors scope

- Décomposition Sankey épargne → `00064`
- Filtre par compte sur Analyse → `00066`

---

## Implementation Plan

### Décision ouverte tranchée : **back-fill à la volée** (pas de snapshots de comptes)

Les comptes ont un **solde calculé, jamais stocké** (décision 1 de `00058`, formule dans `accounts.py`). Une table de snapshots de comptes stockerait du dérivé et imposerait un back-fill/cron — divergent du modèle. Les snapshots restent réservés au **patrimoine** (valeurs manuelles). On calcule donc le solde d'un compte à une date passée **à la volée** par un balayage des txns + transferts (volume modeste, cohérent avec l'existant).

### Cible

Augmenter `GET /api/savings-accounts/history` pour que chaque point inclue **le cash des comptes visibles** en plus du patrimoine (snapshots). Endpoint et schéma (`NetWorthHistoryPoint {date, total}`) **inchangés** → le front (sparkline + delta) en profite sans modif.

### Maths

`solde_compte(d) = initial_balance + Σ (income − expense | txns date ≤ d) + Σ (transfer-in − transfer-out | jambes courant, date ≤ d)`

`total_net_worth(d) = Σ snapshots patrimoine (forward-fill, existant) + Σ_comptes solde_compte(d)`

- **Axe des dates** = union triée de `{dates snapshots} ∪ {dates txns} ∪ {dates transferts touchant un compte visible}`.
- `Σ_comptes solde_compte(d) = Σ initial_balance (constante) + Σ event-deltas (date ≤ d)`, calculé par somme cumulée sur les events triés.
- **Transfert `courant → courant` entre deux comptes visibles** : `−montant` sur l'un, `+montant` sur l'autre → **net nul** sur le net worth (correct, c'est interne).
- **Transfert `courant → epargne`** : `−montant` côté compte ; la valeur du PEA ne bouge **pas** programmatiquement (snapshot manuel). Le net worth baisse jusqu'à ce que l'utilisateur saisisse le snapshot du PEA — **comportement attendu** par `00058` (décision 4, jambe patrimoine sans effet programmatique). Hors scope de corriger ici.

### Phase 1 — Backend

- `routers/accounts.py` : extraire un helper daté `account_networth_events(account_ids) -> tuple[float, list[tuple[date, float]]]` (base = Σ initial_balance ; events = (date, delta signé) depuis txns + jambes courant des transferts). Factoriser avec `_compute_balances` si propre.
- `routers/savings_accounts.py::get_net_worth_history` :
  - scoper les comptes via `visible_account_ids(household_id, claims["sub"])`.
  - construire l'axe union, et à chaque date ajouter `base_initial + cumul_events(≤date)` au total patrimoine forward-fillé.

### Phase 2 — Tests backend (`backend/tests/test_savings_snapshots.py` ou nouveau)

- [ ] history inclut le cash des comptes : compte avec `initial_balance` + txns → le total reflète le solde cumulé à chaque date
- [ ] forward-fill combiné : snapshots patrimoine + soldes comptes additionnés par date
- [ ] **foyer sans patrimoine (que des comptes avec txns)** → history **non vide** (critère)
- [ ] point le plus récent == net worth courant (`Σ soldes comptes + Σ derniers snapshots`)
- [ ] transfert `courant → courant` entre deux comptes visibles → effet **net nul** sur le net worth
- [ ] scope : seuls les comptes visibles entrent dans le calcul

### Phase 3 — Frontend

- Aucune modif de contrat attendue (schéma identique). Vérifier que la sparkline + le delta (`assets-client.tsx`) s'affichent correctement avec les données enrichies (point récent = en-tête). Pas de code sauf surprise.

### Vérif finale

- `just check` vert.
- Vérif visuelle page Comptes : la sparkline bouge avec l'activité des comptes courants ; point récent = en-tête net worth.

### Note de dette

L'endpoint reste sous `/api/savings-accounts/history` alors qu'il couvre désormais comptes + patrimoine — nom trompeur. Renommage non fait ici (casserait le front) ; à considérer plus tard.
