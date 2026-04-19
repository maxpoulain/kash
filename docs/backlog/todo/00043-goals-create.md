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
  - Retourne l'objectif créé avec la progression calculée
- `PUT /api/spending-goals/{id}` — modifie le montant d'un objectif existant

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
