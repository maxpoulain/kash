---
feature: 00010-saisie-manuelle-transactions
depends_on: 00022-setup-supabase-schema-db
---

# Transactions API

## Objectif

Exposer les endpoints CRUD pour les transactions et les catégories, protégés par JWT, scoped au `household_id` de l'utilisateur.

## Périmètre

### Migration Supabase

Deux nouvelles tables :

```sql
-- Catégories (prédéfinies + custom)
categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,  -- NULL = prédéfinie
  name         text not null,
  icon         text,          -- emoji ou slug d'icône
  is_default   boolean not null default false,
  created_at   timestamptz default now()
)

-- Transactions
transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by   uuid not null references users(id),
  category_id  uuid references categories(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  type         text not null check (type in ('income', 'expense')),
  date         date not null,
  note         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
)
```

RLS : `household_id = current_household_id()` sur les deux tables.
Les catégories prédéfinies (`household_id IS NULL`) sont lisibles par tous.

Seed SQL avec catégories prédéfinies : Loyer, Courses, Transport, Restaurants, Santé, Loisirs, Abonnements, Salaire, Autre.

### Backend FastAPI

**Schémas Pydantic** (`app/schemas/`) :
- `CategoryOut`
- `TransactionCreate` — `amount`, `type`, `category_id`, `date`, `note?`
- `TransactionUpdate` — tous les champs optionnels
- `TransactionOut`
- `TransactionType(str, Enum)` — `income` | `expense`

**Routes** (`app/routers/transactions.py`) :

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/api/categories` | Prédéfinies + custom du household |
| `POST` | `/api/categories` | Crée une catégorie custom |
| `GET` | `/api/transactions` | Liste du household, filtre `?month=YYYY-MM` |
| `POST` | `/api/transactions` | Crée une transaction |
| `PUT` | `/api/transactions/{id}` | Modifie (ownership vérifié) |
| `DELETE` | `/api/transactions/{id}` | Supprime (ownership vérifié) |

Toutes les routes utilisent `Depends(get_current_user)`.

## Critères de validation

- [ ] Migration appliquée localement (`supabase db reset`) et en production (`supabase db push`)
- [ ] Catégories prédéfinies présentes après seed
- [ ] `GET /api/categories` retourne prédéfinies + custom du household
- [ ] `POST /api/transactions` crée et retourne la transaction
- [ ] `GET /api/transactions?month=2026-04` filtre correctement par mois
- [ ] `PUT` / `DELETE` retournent 403 si la transaction appartient à un autre household
- [ ] `just check` passe (lint + typecheck + tests)
- [ ] Swagger UI `/docs` reflète tous les endpoints
