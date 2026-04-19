---
feature: 00020-monthly-spending-goals
---

# Goals View

## Objectif
Permettre de visualiser les objectifs de dépenses mensuels avec leur progression (lecture seule).

## Périmètre

### Database
- Table `spending_goals`: `household_id`, `category_id`, `year_month` (YYYY-MM), `amount`
- Contrainte unique sur `(household_id, category_id, year_month)`
- RLS: foyer ne peut lire/écrire que ses propres objectifs

### API
- `GET /api/goals/{year-month}` — retourne la liste des objectifs du mois avec :
  - `category_id`, `category_name`
  - `goal_amount` (montant objectif)
  - `spent_amount` (somme des transactions expense de la catégorie sur le mois)
  - `progress_percent` (spent / goal * 100)
  - `remaining` (goal - spent)

### UI
- Page `/goals` avec sélecteur de mois
- Liste des objectifs sous forme de cards ou lignes :
  - Nom de la catégorie
  - Barre de progression (visuelle)
  - Montant dépensé / objectif (ex: "450€ / 500€")
  - Pourcentage et montant restant
- Message/info si aucun objectif défini pour le mois

## Critères de validation
- [ ] Migration DB appliquée avec RLS
- [ ] GET retourne les bonnes valeurs spent calculées depuis les transactions
- [ ] Page affiche correctement les progressions
- [ ] Gestion du cas "aucun objectif" (état vide)
- [ ] Responsive desktop + mobile
- [ ] Tests écrits et passants (`just check` passe)
