---
---

# Endpoint d'Agrégation Financière

## Objectif

Exposer un endpoint d'agrégation qui alimente la future page **Analyse** : flux d'argent (pour le Sankey), répartition par catégorie, et totaux revenus / dépenses / solde / taux d'épargne. Aujourd'hui le backend ne fait que du CRUD transaction par transaction, aucune agrégation n'existe.

## Périmètre

- Backend : `GET /summary?month=YYYY-MM` scopé au foyer (même auth/scoping que les autres endpoints), renvoyant :
  - `total_income`, `total_expense`, `net` (solde), `savings_rate` (= (revenus − dépenses) / revenus, `null` si revenus = 0)
  - `income_by_category` : `[{ category_id, name, icon, amount }]`
  - `expense_by_category` : `[{ category_id, name, icon, amount }]`
- Les montants sont calculés sur les transactions du foyer pour le mois demandé (matérialiser les récurrentes comme le fait déjà `GET /transactions`)
- Forme des données pensée pour que le frontend construise le Sankey (revenus par catégorie → pool → dépenses par catégorie + épargne) sans logique métier côté client
- Aucune nouvelle table ni migration : agrégation à la lecture
- Tests (dans le même ticket) : sommes correctes, mois vide, calcul du taux d'épargne, scoping foyer, auth requise

## Critères de validation

- [ ] `GET /summary?month=2026-06` renvoie des totaux revenus/dépenses/solde/taux d'épargne corrects
- [ ] La somme de `expense_by_category` égale `total_expense` (idem revenus)
- [ ] Un mois sans transaction renvoie des zéros et `savings_rate: null`, pas d'erreur
- [ ] Le foyer A ne voit jamais les montants du foyer B
- [ ] Les transactions récurrentes du mois sont incluses, comme dans `GET /transactions`
- [ ] Tests unitaires couvrant agrégation, mois vide, taux d'épargne et auth

## Hypothèses à valider

- L'agrégation à la lecture est assez rapide au volume actuel (pas de vue matérialisée nécessaire pour l'instant)
- Le mois est l'unité de période suffisante pour la V1 (pas de range custom)

## Implementation Plan

### Décisions

- `GET /api/summary?month=YYYY-MM` — `month` optionnel, défaut = mois courant (UTC)
- Réutilise le pattern existant : `_get_household_id`, `materialize_due_for_household`, bornes de mois identiques à `list_transactions`
- Agrégation **en Python** (pas de SQL custom) : on lit les transactions du mois + les catégories du foyer, on construit une map `category_id → (name, icon)`, puis on somme par type
- `category_id` nul → bucket "Sans catégorie" (`category_id: null`, `name: null`, `icon: null`)
- `savings_rate = (income − expense) / income` si `income > 0`, sinon `null`

### Fichiers

1. `app/schemas/summary.py` — `CategoryAmount` (`category_id`, `name`, `icon`, `amount`) + `SummaryOut` (`month`, `total_income`, `total_expense`, `net`, `savings_rate`, `income_by_category`, `expense_by_category`)
2. `app/routers/summary.py` — router `prefix="/api"`, `GET /summary`, validation du mois (422), agrégation
3. `app/main.py` — `include_router(summary.router)`
4. `tests/test_summary.py` — tests (cf. liste)

### Test list

- [ ] `GET /api/summary` sans token → 401
- [ ] `?month=bad` → 422
- [ ] Agrégation : totaux revenus/dépenses/net corrects sur un jeu de transactions mock
- [ ] `savings_rate` correct (income > 0) et `null` quand income = 0
- [ ] Somme de `expense_by_category` == `total_expense` (idem revenus)
- [ ] Mois sans transaction → tous les totaux à 0, `savings_rate: null`, listes vides
- [ ] Transaction sans catégorie → bucket "Sans catégorie"
