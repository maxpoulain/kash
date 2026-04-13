---
feature: 00005-configurer-auth-supabase-jwt-backend
---

# Auth — Backend JWT middleware

## Objectif

Sécuriser le backend FastAPI en vérifiant les JWT émis par Supabase, et exposer une route `/api/me` retournant le profil utilisateur.

## Périmètre

- Ajouter `python-jose[cryptography]` aux dépendances
- Créer une dépendance FastAPI `get_current_user` qui vérifie le JWT depuis le header `Authorization: Bearer`
- Récupérer la clé publique Supabase pour valider la signature
- Route `GET /api/me` : retourne les infos du JWT + lookup en base (id, email, household)
- Retourner 401 si token absent ou invalide

## Critères de validation

- [ ] `GET /api/me` avec un JWT valide retourne le profil utilisateur
- [ ] `GET /api/me` sans token retourne 401
- [ ] `GET /api/me` avec un token invalide retourne 401
- [ ] `just check` passe
