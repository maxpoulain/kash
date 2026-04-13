---
feature: 00005-configurer-auth-supabase-jwt-backend
depends_on: 00025-auth-frontend-signup-login
---

# Auth — Frontend JWT header interceptor

## Objectif

Injecter automatiquement le JWT Supabase dans toutes les requêtes vers le backend FastAPI.

## Périmètre

- Créer un client HTTP (`lib/api.ts`) qui wrap `fetch`
- Récupérer le token Supabase depuis la session courante
- Ajouter `Authorization: Bearer <token>` sur chaque requête
- Refresh automatique du token si expiré
- Tous les appels API du frontend passent par ce client

## Critères de validation

- [ ] `GET /api/me` appelé depuis le frontend retourne le profil utilisateur
- [ ] Le header `Authorization` est présent sur chaque requête
- [ ] Un token expiré est refreshé automatiquement
