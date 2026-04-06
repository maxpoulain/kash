# Setup monorepo structure

**Source:** [Linear PER-16](https://linear.app/personal-max-and-maria/issue/PER-16/setup-monorepo-structure)

**Priority:** High
**Labels:** Infra

## Description

Créer la structure de base du projet avec un monorepo contenant frontend et backend.

## Structure cible

```
kash/
├── frontend/          # Next.js
├── backend/           # FastAPI
├── .gitignore
├── README.md
└── docker-compose.yml # Dev local
```

## Critères d'acceptance

- [ ] Repo GitHub créé
- [ ] Structure de dossiers en place
- [ ] README avec instructions de setup
- [ ] docker-compose pour lancer les deux services en local
