---
---

# Supprimer la feature Budget

## Objectif
Retirer complètement la page Budget et tout le code associé (routes backend, types, fonctions API, tests).

## Périmètre
- Frontend : supprimer `app/budget/`, retirer l'entrée nav dans `sidebar.tsx` et `bottom-nav.tsx`, supprimer les fonctions budget de `lib/api.ts`, les types budget de `types/api.ts`, et les tests budget de `__tests__/api.test.ts`
- Backend : supprimer `routers/budgets.py`, le désenregistrer dans `main.py`
- Ne pas toucher : `spending_goals` (indépendant), `over_budget` dans `goal-card.tsx` (statut métier, pas lié à la page)

## Critères de validation
- [ ] La page `/budget` renvoie 404
- [ ] L'entrée "Budget" n'apparaît plus dans la nav desktop et mobile
- [ ] `just check` passe
