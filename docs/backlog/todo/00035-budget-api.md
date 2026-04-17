---
feature: 00009-budget-zero-based-par-categories
depends_on: 00034-budget-schema-db
---

# Budget API

## Objectif
Exposer les endpoints FastAPI pour créer/lire/modifier le budget mensuel et consulter le résumé alloué vs dépensé par catégorie.

## Périmètre

- `GET /api/budgets/{month}` — récupère le budget du mois (ou 404 si non créé)
- `PUT /api/budgets/{month}` — upsert : crée ou met à jour revenu + allocations du mois
- `GET /api/budgets/{month}/summary` — retourne par catégorie : `allocated`, `spent`, `remaining`
- `POST /api/budgets/{month}/copy-from/{source_month}` — copie les allocations d'un mois précédent
- Validation : avertissement (non bloquant) si total alloué > revenu — retourner un champ `over_budget: true` dans la réponse

## Décisions
- Upsert atomique sur budget + allocations (pas deux appels séparés)
- `summary` joint transactions du mois pour calculer `spent`

## Critères de validation
- [ ] GET 404 si budget inexistant pour ce mois
- [ ] PUT crée puis met à jour idempotent
- [ ] Summary retourne les bonnes valeurs alloué/dépensé
- [ ] Copy-from copie bien les allocations sans dupliquer le revenu
- [ ] Tests écrits et passants (`just check` passe)
