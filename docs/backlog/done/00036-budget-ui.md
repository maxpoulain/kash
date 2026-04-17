---
feature: 00009-budget-zero-based-par-categories
depends_on: 00035-budget-api
---

# Budget UI

## Objectif
Page `/budget` permettant de saisir le revenu mensuel, allouer chaque euro par catégorie, et visualiser le solde restant à allouer en temps réel.

## Périmètre

- Page `/budget` avec sélecteur de mois
- Saisie du revenu mensuel du foyer
- Liste des catégories avec champ d'allocation (montant en €)
- Solde restant à allouer = revenu − total alloué, mis à jour en live
- Warning visuel (rouge + montant surplus) si total alloué > revenu — pas de blocage
- Si premier mois : budget vide ; sinon proposition de copier le mois précédent
- Barre de progression par catégorie (alloué vs dépensé)
- Sauvegarde automatique ou bouton "Enregistrer"

## Décisions
- Épargne = catégorie normale, pas de traitement visuel spécial
- Dépassement = warning non bloquant avec montant en rouge

## Critères de validation
- [ ] Solde restant se met à jour à chaque frappe (pas besoin de sauvegarder)
- [ ] Warning rouge visible dès que total alloué > revenu
- [ ] Copie du mois précédent proposée si allocations existent
- [ ] Fonctionne sur mobile (PWA)
- [ ] Tests écrits et passants (`just check` passe)

## Implementation Plan

### Phase 1 — Types & API
- Add `BudgetOut`, `BudgetSummary`, `CategorySummary`, `BudgetUpsert`, `Allocation` to `frontend/types/api.ts`
- Add `getBudgetSummary`, `saveBudget`, `copyBudgetFrom` to `frontend/lib/api.ts`

### Phase 2 — Page & Client Component
- `frontend/app/budget/page.tsx` — server component with auth guard (pattern: dashboard)
- `frontend/app/budget/budget-client.tsx` — client component with:
  - Month navigation (reuse `currentMonth`, `prevMonth`, `nextMonth`)
  - Load summary via `getBudgetSummary`
  - If no budget: show "Copier le mois précédent" button + empty form
  - Income input (controlled, live)
  - Category rows: allocated input + spent display + remaining bar
  - Remaining balance = income − total allocated (live, red if over)
  - Debounced auto-save (500ms) with optimistic UI
  - Toast on save

### Phase 3 — Navigation
- Add "Budget" link to navigation (if nav component exists)

### Phase 4 — Tests
- Unit tests for budget calculation logic
- Component tests or E2E for key interactions
