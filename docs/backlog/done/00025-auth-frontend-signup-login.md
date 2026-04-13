---
feature: 00005-configurer-auth-supabase-jwt-backend
---

# Auth — Frontend signup + login

## Objectif

Permettre à un utilisateur de créer un compte et de se connecter via email/password avec Supabase Auth.

## Périmètre

- Page `/login` : formulaire email + password
- Page `/signup` : formulaire email + password + confirmation
- Gestion des erreurs (email déjà utilisé, mot de passe incorrect, etc.)
- Redirect vers `/dashboard` après connexion réussie
- Redirect vers `/login` si accès à une route protégée sans être connecté
- Bouton de déconnexion

## Critères de validation

- [ ] Un nouvel utilisateur peut créer un compte
- [ ] Un utilisateur existant peut se connecter
- [ ] Les erreurs Supabase sont affichées à l'utilisateur
- [ ] Redirect post-login vers `/dashboard`
- [ ] Les routes protégées redirigent vers `/login` si non connecté
