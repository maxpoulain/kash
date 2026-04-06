# Init backend FastAPI

**Source:** [Linear PER-18](https://linear.app/personal-max-and-maria/issue/PER-18/init-backend-fastapi)

**Priority:** High
**Labels:** Backend

## Description

Initialiser le backend FastAPI avec la structure de base.

## Stack

- Python 3.11+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.0 (async)
- Uvicorn

## Structure cible

```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── routers/
│   │   └── __init__.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── tests/
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Critères d'acceptance

- [ ] FastAPI installé et route `/health` fonctionnelle
- [ ] Structure de dossiers en place
- [ ] Docker fonctionnel (`docker build` + `docker run`)
- [ ] Tests basiques avec pytest configurés
