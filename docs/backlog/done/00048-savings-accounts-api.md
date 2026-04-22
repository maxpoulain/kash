---
feature: 00011-suivi-epargne-par-poste
depends_on: 00047
---

# Savings accounts API

## Objectif
Remplacer les mock data de la page Patrimoine par de vraies données persistées en base via un backend FastAPI + Supabase.

## Périmètre
- Migration Supabase : table `savings_accounts` (id, user_id, name, type, balance, institution, created_at, updated_at)
- API FastAPI : GET /savings-accounts, POST /savings-accounts, PUT /savings-accounts/{id}, DELETE /savings-accounts/{id}
- Frontend : remplacer `INITIAL_ACCOUNTS` et les handlers locaux par des appels API (via `lib/api.ts`)

## Critères de validation
- [ ] Un compte créé via la modale est persisté et visible après rechargement
- [ ] La modification du solde et de l'intitulé est persistée
- [ ] La suppression retire le compte définitivement
- [ ] Seuls les comptes de l'utilisateur connecté sont visibles
- [ ] `just check` passe
