---
feature: 00020-monthly-spending-goals
depends_on: 00042-goals-view
---

# Goals Create

## Objectif
Permettre à l'utilisateur de créer un objectif de dépense pour une catégorie sur un mois donné.

## Périmètre

### API
- `POST /api/spending-goals` — crée un objectif :
  - Body: `month` (format `YYYY-MM`), `category_id`, `amount`
  - Validation: amount > 0, unique constraint sur `(household_id, category_id, month)`
  - Retourne le `GoalOut` créé avec la progression calculée (spent sera 0 à la création)
- `PUT /api/spending-goals/{id}` — modifie le montant d'un objectif existant
  - Body: `amount`
  - Retourne le `GoalOut` mis à jour avec progression recalculée

> **Clarification sémantique** : POST = créer, PUT = mettre à jour un objectif existant (par ID).
> Les critères "PUT crée si inexistant" étaient incorrects — la création passe toujours par POST.

### Schema
- `GoalOut` doit exposer un champ `id: UUID` pour que le frontend puisse appeler `PUT /{id}`

### UI
- Bouton "Ajouter un objectif" sur la page `/goals` (mobile + desktop, déjà rendus en placeholder)
- Modal avec :
  - Sélecteur de catégorie (catégories du foyer filtrées côté client : exclure celles déjà utilisées ce mois via `data.goals[*].category_id`)
  - Champ montant (€)
  - Bouton "Créer"
- À la création : fermeture modal + re-fetch de la liste

## Implementation Plan

### Phase 1 — Backend

**Objectif** : ajouter POST et PUT, exposer `id` dans `GoalOut`.

**Changements** :
1. `schemas/spending_goals.py` :
   - Ajouter `id: UUID` à `GoalOut`
   - Ajouter `GoalCreate(BaseModel)` : `month: str`, `category_id: UUID`, `amount: float`
   - Ajouter `GoalUpdate(BaseModel)` : `amount: float`
2. `routers/spending_goals.py` :
   - Extraire `_build_goal_out(goal_row, spent_amount)` pour éviter la duplication entre GET, POST et PUT
   - Ajouter `POST /api/spending-goals` → valider month, insérer, calculer spent (0 à la création), retourner `GoalOut`
   - Ajouter `PUT /api/spending-goals/{id}` → vérifier ownership, mettre à jour amount, recalculer spent, retourner `GoalOut`

**Tests écrits** (21 tests au total, tous passants) :
- [x] `POST` sans token → 401
- [x] `POST` avec `amount <= 0` → 422
- [x] `POST` avec `amount < 0` → 422
- [x] `POST` avec `month` invalide → 422
- [x] `POST` valide → 201, retourne `GoalOut` avec `id`, `spent_amount=0`, `progress_percent=0`
- [x] `POST` doublon (même household + category + month) → 409
- [x] `PUT` sans token → 401
- [x] `PUT` goal inexistant → 404
- [x] `PUT` avec `amount <= 0` → 422
- [x] `PUT` valide → 200, retourne `GoalOut` mis à jour avec spent recalculé
- [x] `GET` existant retourne toujours `id` dans chaque goal

### Phase 2 — Frontend

**Objectif** : modal de création fonctionnel, boutons câblés.

**Changements** :
1. `types/api.ts` :
   - Ajouter `id: string` à `SpendingGoal`
   - Ajouter `CreateGoalPayload` : `{ month: string; category_id: string; amount: number }`
2. `lib/api.ts` :
   - Ajouter `createGoal(payload: CreateGoalPayload): Promise<SpendingGoal>`
3. `app/goals/create-goal-modal.tsx` (nouveau composant) :
   - Charger les catégories via `getCategories()`
   - Filtrer les catégories déjà utilisées ce mois (via `usedCategoryIds` passé en prop)
   - Champ montant contrôlé, validation client (> 0)
   - Appel `createGoal`, puis `onSuccess()` pour fermer et re-fetch
4. `app/goals/goals-client.tsx` :
   - Gérer l'état `modalOpen`
   - Passer `usedCategoryIds` et `onSuccess={load}` au modal
   - Câbler les deux boutons "Ajouter" existants

**Tests à écrire** :
- [ ] E2E : clic "Ajouter" ouvre le modal
- [ ] E2E : sélection catégorie + montant + Créer → nouvelle carte apparaît dans la liste
- [ ] E2E : catégories déjà utilisées ce mois sont absentes du sélecteur
- [ ] Screenshot desktop + mobile attachés au backlog

**Implémentation Phase 2** :
1. `types/api.ts` : `id: string` ajouté à `SpendingGoal`, `CreateGoalPayload` ajouté
2. `lib/api.ts` : `createGoal(payload)` ajouté
3. `app/goals/create-goal-modal.tsx` : créé — Sheet/Dialog dual-mode, formulaire avec sélecteur catégorie (filtre `usedCategoryIds`), montant, validation zod, submit `createGoal`
4. `app/goals/goals-client.tsx` : `modalOpen` state, `usedCategoryIds` dérivé des goals, boutons "Ajouter" câblés, `onGoalCreated={load}` pour refresh
5. `app/goals/empty-state.tsx` : prop `onAddGoal` ajoutée pour câbler le bouton CTA

## Critères de validation
- [x] POST crée un nouvel objectif → 201 avec GoalOut complet (incluant `id`)
- [x] PUT met à jour le montant d'un objectif existant → 200 avec GoalOut recalculé
- [x] Validation: erreur si montant ≤ 0 (backend + client)
- [x] POST doublon retourne 409
- [x] Modal fonctionne et refresh la liste après création
- [x] Catégories déjà utilisées ce mois exclues du sélecteur
- [x] Responsive desktop + mobile
- [ ] Tests écrits et passants (`just check` passe) — backend OK (33/33), frontend E2E restant
- [ ] E2E tests + screenshots
