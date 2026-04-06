---
feature: 00003-init-backend-fastapi
---

# Backend — Structure de dossiers + FastAPI + route /health

## Objectif

Créer la structure de base du backend FastAPI avec une route `/health` fonctionnelle, gérée avec `uv`.

## Périmètre

- Initialiser le projet avec `uv init` → `pyproject.toml` + `uv.lock`
- Dépendances via `uv add` : FastAPI, Pydantic v2, SQLAlchemy 2.0 async, Uvicorn
- Créer `backend/` avec la structure cible définie dans la feature
- Implémenter la route GET `/health` → `{ "status": "ok" }`
- `.env.example` en place
- Pas de `requirements.txt`

## Critères de validation

- [ ] `uv run uvicorn app.main:app` démarre sans erreur
- [ ] `GET /health` retourne 200 `{ "status": "ok" }`
- [ ] Tous les dossiers (`routers/`, `models/`, `schemas/`, `services/`) existent avec `__init__.py`
- [ ] `uv sync` installe toutes les dépendances proprement depuis `uv.lock`
