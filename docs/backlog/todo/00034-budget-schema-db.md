---
feature: 00009-budget-zero-based-par-categories
depends_on:
---

# Budget Schema DB

## Objectif
Créer les tables `budgets` et `budget_allocations` dans Supabase pour stocker le revenu mensuel du foyer et les allocations par catégorie.

## Périmètre

- Table `budgets` : `household_id`, `month` (YYYY-MM), `income` (numeric), unique constraint sur `(household_id, month)`
- Table `budget_allocations` : `budget_id`, `category_id`, `allocated_amount`, unique sur `(budget_id, category_id)`
- RLS sur les deux tables (lecture/écriture limitée au foyer)
- Pas de contrainte DB sur total alloué ≤ revenu (enforced côté API + warning UI)

## Décisions
- L'épargne est une catégorie expense comme les autres — pas de type spécial
- Pas de contrainte stricte DB sur le dépassement du revenu

## Critères de validation
- [ ] Migration appliquée sans erreur sur Supabase local et prod
- [ ] RLS : un foyer ne peut pas lire/écrire les budgets d'un autre foyer
- [ ] Contrainte unique `(household_id, month)` sur `budgets`
- [ ] Tests écrits et passants (`just check` passe)
