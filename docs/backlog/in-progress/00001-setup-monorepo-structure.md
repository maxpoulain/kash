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

- [ ] Structure de dossiers en place
- [ ] README avec instructions de setup
- [ ] docker-compose pour lancer les deux services en local

## Implementation Plan

### Phase 1: Structure de dossiers
- Créer `frontend/` (placeholder pour Next.js)
- Créer `backend/` (placeholder pour FastAPI)
- Créer `.gitignore` racine si absent

### Phase 2: Docker Compose
- Créer `docker-compose.yml` avec:
  - Service frontend (Node.js) sur port 3000
  - Service backend (Python/FastAPI) sur port 8000
  - Network partagé entre les services

### Phase 3: Documentation
- Mettre à jour `README.md` avec:
  - Description du projet
  - Prérequis (Docker, Docker Compose)
  - Instructions de démarrage rapide
  - Structure du monorepo

### Test de validation
- [ ] `docker-compose config` valide le YAML
- [ ] Les dossiers `frontend/` et `backend/` existent
- [ ] Le README contient les instructions de setup
