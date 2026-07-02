---
feature: 00020-monthly-spending-goals
---

# Lazy-création des catégories suggérées à la création d'un goal

## Objectif

Permettre de créer un spending goal sur une catégorie suggérée jamais utilisée. Aujourd'hui `POST /spending-goals` insère le `category_id` directement : si la catégorie suggérée n'a jamais été matérialisée par une transaction, l'insert échoue en violation de FK et l'utilisateur reçoit une erreur générique. Il faut d'abord créer une transaction pour pouvoir poser un goal — c'est à l'envers.

## Périmètre

- Backend : appeler `_ensure_category_exists(household_id, category_id)` dans `POST /spending-goals` (même mécanisme que `POST /transactions`)
- Exposer `_ensure_category_exists` proprement si besoin (import depuis `app/core/categories.py`)
- Tests : création d'un goal sur une catégorie suggérée non matérialisée → 201 + la catégorie existe en base
- Tests : création d'un goal sur une catégorie existante → comportement inchangé

## Critères de validation

- [ ] Créer un goal sur "Restaurants" (jamais utilisée) réussit et retourne le goal avec nom + icône
- [ ] La catégorie est créée en base avec l'UUID fixe suggéré
- [ ] Goal sur une catégorie custom existante : comportement inchangé
- [ ] Goal sur un UUID inconnu : erreur propre (pas de 500)
- [ ] Tests écrits et passants (`just check` passe)
