# Kash

Application de gestion de finances personnelles - Budget, épargne et patrimoine.

## Structure du projet

Monorepo contenant :

```
kash/
├── frontend/          # Next.js + Tailwind + shadcn/ui
├── backend/           # FastAPI + Supabase
├── docs/              # Documentation
├── supabase/          # Migrations + config
├── docker-compose.yml # Orchestration des services
└── README.md
```

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
  ```bash
  brew install supabase/tap/supabase
  ```
- [just](https://github.com/casey/just) (command runner)
  ```bash
  brew install just
  ```

## Démarrage rapide

### 1. Démarrer Supabase (base de données + auth)

```bash
just db-start
```

Cela démarre :
- PostgreSQL sur le port 54322
- Supabase Auth sur le port 54321
- Supabase Studio sur http://127.0.0.1:54323

### 2. Configurer les variables d'environnement

```bash
# Backend
cd backend
cp .env.example .env

# Vérifier les clés Supabase
supabase status
```

### 3. Appliquer les migrations

```bash
just db-reset
```

### 4. Lancer les services

```bash
# Option 1: Tout en une commande
just dev-all

# Option 2: Séparément (dans différents terminaux)
just db-start  # Si pas déjà démarré
just backend   # Port 8000
just frontend  # Port 3000
```

## Services disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Application Next.js |
| **Backend API** | http://localhost:8000 | FastAPI |
| **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI |
| **Supabase Studio** | http://127.0.0.1:54323 | Interface admin DB |

## Commandes utiles

```bash
# Voir toutes les commandes disponibles
just -l

# Vérifier l'état de Supabase
just supabase-status

# Reset de la base de données locale
just db-reset

# Déployer les migrations en production
just db-push

# Ouvrir Supabase Studio
just studio

# Lancer les tests
just backend-test

# Vérifications avant commit
just check
```

## Documentation

- [Setup Supabase](docs/supabase.md) - Configuration complète de Supabase
- [Conventions](docs/conventions.md) - Workflow de développement

## Fonctionnalités planifiées

- [ ] Dashboard unifié budget + épargne
- [ ] Budget zéro-based par catégories
- [ ] Suivi de l'épargne par poste
- [ ] Objectifs d'épargne
- [ ] Mode foyer (partage en couple)
- [ ] Net worth tracker
- [ ] Rapports mensuels automatiques

---

*Projet personnel - Max & Maria*
