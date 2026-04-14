---
feature: 00006-setup-cicd-deploiement
---

# CI GitHub Actions

## Objectif

Mettre en place un workflow GitHub Actions qui vérifie chaque PR avant merge.

## Périmètre

- Workflow `ci.yml` déclenché sur `pull_request` vers `main`
- Étapes : lint + typecheck frontend, ruff + pyright backend, pytest backend
- Utilise `just check` comme point d'entrée unique

## Critères de validation

- [ ] Le workflow s'exécute sur chaque PR
- [ ] Une PR avec lint/typecheck/test en erreur est bloquée
- [ ] `just check` est utilisé dans le workflow (pas de duplication de logique)
