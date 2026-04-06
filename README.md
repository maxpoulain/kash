# Kash

Application de gestion de finances personnelles - Budget, épargne et patrimoine.

## Structure du projet

Monorepo contenant :

```
kash/
├── frontend/          # Next.js + Tailwind + shadcn/ui
├── backend/           # FastAPI + PostgreSQL
├── docker-compose.yml # Orchestration des services
└── README.md
```

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Démarrage rapide

```bash
# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

Les services sont accessibles sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **API Docs** : http://localhost:8000/docs

## Développement

### Commandes utiles

```bash
# Vérifier la configuration docker-compose
docker-compose config

# Rebuild les images
docker-compose up -d --build

# Accéder au shell d'un service
docker-compose exec frontend sh
docker-compose exec backend sh
```

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
