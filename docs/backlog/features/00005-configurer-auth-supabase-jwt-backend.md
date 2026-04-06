# Configurer auth Supabase + JWT backend

**Source:** [Linear PER-20](https://linear.app/personal-max-and-maria/issue/PER-20/configurer-auth-supabase-jwt-backend)

**Priority:** High
**Labels:** Auth, Backend, Frontend

## Description

Configurer l'authentification via Supabase Auth, utilisable côté frontend et vérifiable côté backend FastAPI.

## Fonctionnement

1. Frontend : login via Supabase Auth (magic link ou OAuth Google)
2. Frontend : récupère le JWT Supabase
3. Frontend : envoie le JWT dans le header `Authorization: Bearer <token>`
4. Backend : vérifie le JWT avec la clé publique Supabase

## Critères d'acceptance

- [ ] Supabase Auth configuré (magic link + Google OAuth)
- [ ] Frontend : bouton de login fonctionnel
- [ ] Backend : dépendances JWT installées
- [ ] Backend : middleware/dependency pour vérifier le JWT
- [ ] Route protégée `/api/me` qui retourne l'utilisateur connecté
