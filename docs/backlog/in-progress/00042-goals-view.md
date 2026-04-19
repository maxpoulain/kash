---
feature: 00020-monthly-spending-goals
---

# Goals View

## Objectif
Permettre de visualiser les objectifs de dépenses mensuels avec leur progression (lecture seule).

## Périmètre

### Database
- Table `spending_goals`:
  - `id` uuid primary key
  - `household_id` uuid not null → households(id) on delete cascade
  - `created_by` uuid not null → users(id)  -- qui a créé l'objectif
  - `category_id` uuid not null → categories(id) on delete cascade
  - `month` date not null  -- premier jour du mois (ex: 2025-04-01)
  - `amount` numeric(12,2) not null check (amount > 0)
  - `created_at` / `updated_at` timestamptz
- Contrainte unique sur `(household_id, category_id, month)`
- RLS: foyer ne peut lire/écrire que ses propres objectifs

### API
- `GET /api/spending-goals?month=2025-04` — retourne la liste des objectifs du mois avec :
  - `category_id`, `category_name`
  - `goal_amount` (montant objectif)
  - `spent_amount` (somme des transactions expense de la catégorie sur le mois)
  - `progress_percent` (spent / goal * 100)
  - `remaining` (goal - spent)
- Query param `month` requis, format `YYYY-MM`

### UI

**Maquettes :** Voir fichiers dans `docs/mockups/`
- `expenses_goals_mobile.png`
- `expenses_goals_mobile_2.png`
- `expenses_goals_desktop.png`

**Page `/goals`** :
- En-tête avec titre "Objectifs" et montant total des objectifs du mois
- Sélecteur de mois (navigation mois précédent/suivant)
- Bouton "+" pour ajouter un objectif (ouvre modal — voir 00043)

**État vide :** Message "Aucun objectif défini pour ce mois" avec CTA pour créer

**Responsive :** 
- Mobile : cartes empilées verticalement (comme maquette)
- Desktop : grille 2 colonnes ou liste selon préférence

## Implementation Plan

### Phase 1: Database Migration
**Files to create:**
- `supabase/migrations/20260419130000_create_spending_goals.sql` — Create table with RLS

**Test checklist:**
- [ ] Migration applies cleanly
- [ ] RLS policies work (users can only see their household's goals)
- [ ] Unique constraint prevents duplicate goals per (household, category, month)

### Phase 2: Backend API
**Files to create:**
- `backend/app/schemas/spending_goals.py` — Pydantic schemas
- `backend/app/routers/spending_goals.py` — GET /api/spending-goals endpoint

**Files to modify:**
- `backend/app/main.py` — Register new router

**Endpoint spec:**
```
GET /api/spending-goals?month=2025-04
Response: {
  "month": "2025-04",
  "total_goal": 1250.00,
  "total_spent": 946.00,
  "goals": [
    {
      "category_id": "uuid",
      "category_name": "Groceries",
      "category_icon": "🛒",
      "category_color": "#E8F5E9",
      "goal_amount": 500.00,
      "spent_amount": 312.00,
      "progress_percent": 62.0,
      "remaining": 188.00,
      "status": "on_track" | "under_pace" | "over_budget"
    }
  ]
}
```

**Test checklist:**
- [ ] Returns correct spent amounts from transactions
- [ ] Calculates progress_percent and remaining correctly
- [ ] Returns empty array when no goals exist
- [ ] 422 error for invalid month format
- [ ] RLS enforced (can't see other households' goals)

### Phase 3: Frontend Page
**Files to create:**
- `frontend/app/goals/page.tsx` — Server component (auth check)
- `frontend/app/goals/goals-client.tsx` — Client component with state
- `frontend/app/goals/goal-card.tsx` — Individual goal card
- `frontend/app/goals/empty-state.tsx` — Empty state with piggy
- `frontend/app/goals/month-selector.tsx` — Month navigation

**Components needed from existing UI:**
- Progress bar (check `frontend/components/ui/`)
- Card, Button components

**Test checklist (manual via browser):**
- [ ] Month navigation works (prev/next)
- [ ] Goals display with correct progress bars
- [ ] Empty state shows when no goals
- [ ] Mobile layout (stacked cards)
- [ ] Desktop layout (2-column grid)

### Phase 4: Tests & Verification
**Files to create:**
- `backend/tests/test_spending_goals.py` — API tests

**Verification:**
- Use agent-browser to manually verify UI (per project convention)
- Attach screenshots to backlog item

**Test checklist:**
- [ ] Backend unit tests pass
- [ ] `just check` passes completely
- [ ] Agent-browser verification complete with screenshots

## Critères de validation
- [ ] Migration DB appliquée avec RLS
- [ ] GET retourne les bonnes valeurs spent calculées depuis les transactions
- [ ] Page affiche correctement les progressions
- [ ] Gestion du cas "aucun objectif" (état vide)
- [ ] Responsive desktop + mobile
- [ ] Tests écrits et passants (`just check` passe)
