---
feature: 00020-monthly-spending-goals
depends_on: 00042-goals-view
---

# Goals Create

## Objectif
Permettre à l'utilisateur de créer un objectif de dépense pour une catégorie sur un mois donné.

## Périmètre

### API
- `PUT /api/goals/{year-month}` — crée ou met à jour un objectif :
  - Body: `category_id`, `amount`
  - Upsert sur `(household_id, category_id, year_month)`
  - Validation: amount > 0
  - Retourne l'objectif créé/mis à jour avec la progression calculée

### UI
- Bouton "Ajouter un objectif" sur la page `/goals`
- Modal avec :
  - Sélecteur de catégorie (liste des catégories du foyer non encore utilisées ce mois)
  - Champ montant (€)
  - Bouton "Créer"
- À la création : fermeture modal + mise à jour de la liste avec le nouvel objectif

## Critères de validation
- [ ] PUT crée un nouvel objectif si catégorie inexistante pour ce mois
- [ ] PUT met à jour le montant si objectif existe déjà
- [ ] Validation: erreur si montant ≤ 0
- [ ] Modal fonctionne et refresh la liste après création
- [ ] Responsive desktop + mobile
- [ ] Tests écrits et passants (`just check` passe)
