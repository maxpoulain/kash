---
feature: 00003-init-backend-fastapi
depends_on: 00019-backend-structure-fastapi
---

# Backend — Dockerfile

## Objectif

Containeriser le backend FastAPI avec `uv` pour un build reproductible et rapide.

## Périmètre

- Utiliser l'image officielle `ghcr.io/astral-sh/uv` comme base (ou copier le binaire uv)
- Copier `pyproject.toml` + `uv.lock` et faire `uv sync --frozen --no-dev` pour installer uniquement les deps de prod
- Multi-stage si pertinent pour garder l'image finale légère
- Exposer le port 8000

## Critères de validation

- [ ] `docker build -t kash-backend .` réussit sans erreur
- [ ] `docker run -p 8000:8000 kash-backend` démarre le serveur
- [ ] `GET /health` répond 200 depuis le container
- [ ] L'image n'inclut pas les dépendances de dev
