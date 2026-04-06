---
feature: 00003-init-backend-fastapi
depends_on: 00019-backend-structure-fastapi
---

# Backend — Tests pytest

## Objectif

Configurer pytest comme dépendance de dev `uv` avec un test de smoke sur `/health`.

## Périmètre

- Ajouter `pytest` et `httpx` en dev deps : `uv add --dev pytest httpx`
- Créer `backend/tests/test_health.py`
- Configurer pytest dans `pyproject.toml` (`[tool.pytest.ini_options]`)
- Lancer les tests via `uv run pytest`

## Critères de validation

- [ ] `uv run pytest` passe sans erreur depuis `backend/`
- [ ] Test vérifie que `GET /health` retourne 200 et `{ "status": "ok" }`
- [ ] `just check` inclut `uv run pytest`
