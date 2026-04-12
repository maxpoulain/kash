# Setup Supabase + schéma DB

**Source:** [Linear PER-19](https://linear.app/personal-max-and-maria/issue/PER-19/setup-supabase-schema-db)

**Priority:** High
**Labels:** Infra, Database

## Description

Configurer le projet Supabase et créer le schéma de base de données.

## Tables à créer

### Core

- `households` — foyers (unité de partage)
- `users` — utilisateurs (liés à un household)
- `accounts` — comptes bancaires / épargne

### Budget

- `categories` — catégories de budget
- `monthly_budgets` — allocations mensuelles par catégorie
- `transactions` — transactions

### Goals

- `goals` — objectifs d'épargne

## Critères d'acceptance

- [ ] Projet Supabase créé
- [ ] Tables créées avec le schéma
- [ ] Row Level Security configuré (users voient leur household uniquement)
- [ ] Migrations gérées (optionnel mais recommandé)
