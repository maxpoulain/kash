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

---

## Implementation Plan

### Phase 1: Supabase Project Setup

**Goal:** Create and configure the Supabase project locally and in cloud.

**Research & Decisions:**
- Use **Supabase CLI** for local development and migrations
- Local development with `supabase start` (Docker-based)
- Production project created via Supabase dashboard or CLI

**Steps:**
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Initialize Supabase in repo: `supabase init`
3. Configure `supabase/config.toml` for local development
4. Create production project (via dashboard or `supabase projects create`)
5. Set up environment variables in backend for Supabase connection

**Test Checklist:**
- [ ] `supabase start` runs successfully
- [ ] Can connect to local Supabase from backend
- [ ] Can connect to production Supabase from backend

### Phase 2: Database Schema Design

**Goal:** Create SQL migrations for all tables with proper relationships.

**Schema Design:**

```sql
-- Core tables
households (
  id: uuid primary key default gen_random_uuid(),
  name: text not null,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)

users (
  id: uuid primary key references auth.users(id) on delete cascade,
  email: text not null unique,
  household_id: uuid references households(id) on delete set null,
  display_name: text,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)

accounts (
  id: uuid primary key default gen_random_uuid(),
  household_id: uuid references households(id) on delete cascade,
  name: text not null,
  type: text not null check (type in ('checking', 'savings', 'credit', 'investment', 'other')),
  balance: numeric(12,2) default 0,
  currency: text default 'EUR',
  is_active: boolean default true,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)

-- Budget tables
categories (
  id: uuid primary key default gen_random_uuid(),
  household_id: uuid references households(id) on delete cascade,
  name: text not null,
  type: text not null check (type in ('income', 'expense', 'savings')),
  color: text,
  icon: text,
  is_active: boolean default true,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)

monthly_budgets (
  id: uuid primary key default gen_random_uuid(),
  household_id: uuid references households(id) on delete cascade,
  category_id: uuid references categories(id) on delete cascade,
  year: integer not null,
  month: integer not null check (month between 1 and 12),
  allocated_amount: numeric(12,2) not null default 0,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now(),
  unique(household_id, category_id, year, month)
)

transactions (
  id: uuid primary key default gen_random_uuid(),
  household_id: uuid references households(id) on delete cascade,
  account_id: uuid references accounts(id) on delete cascade,
  category_id: uuid references categories(id) on delete set null,
  amount: numeric(12,2) not null,
  currency: text default 'EUR',
  description: text,
  transaction_date: date not null,
  transaction_type: text not null check (transaction_type in ('income', 'expense', 'transfer')),
  transfer_to_account_id: uuid references accounts(id) on delete set null,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)

-- Goals tables
goals (
  id: uuid primary key default gen_random_uuid(),
  household_id: uuid references households(id) on delete cascade,
  name: text not null,
  target_amount: numeric(12,2) not null,
  current_amount: numeric(12,2) default 0,
  deadline: date,
  color: text,
  icon: text,
  is_active: boolean default true,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)
```

**Steps:**
1. Create migration: `supabase migration new create_core_tables`
2. Add SQL for households, users, accounts
3. Create migration: `supabase migration new create_budget_tables`
4. Add SQL for categories, monthly_budgets, transactions
5. Create migration: `supabase migration new create_goals_tables`
6. Add SQL for goals
7. Run migrations locally: `supabase db reset`

**Test Checklist:**
- [ ] All migrations run successfully
- [ ] Tables exist with correct columns and types
- [ ] Foreign key constraints are in place
- [ ] Check constraints work as expected
- [ ] Unique constraints are correct

### Phase 3: Row Level Security (RLS)

**Goal:** Users can only see data from their own household.

**RLS Strategy:**
Each table has RLS policies based on `household_id`. Users access data through their `household_id` relationship.

```sql
-- Example policy pattern for all tables
CREATE POLICY "Users can view their household data" ON table_name
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their household data" ON table_name
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their household data" ON table_name
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their household data" ON table_name
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );
```

**Steps:**
1. Enable RLS on all tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. Create helper function to get current user's household_id
3. Apply policies to each table
4. Create migration for RLS policies
5. Test with different user contexts

**Test Checklist:**
- [ ] User A cannot see User B's household data
- [ ] User A can see their own household data
- [ ] SELECT, INSERT, UPDATE, DELETE all respect RLS
- [ ] RLS policies work in local and production environments

### Phase 4: Backend Integration

**Goal:** Connect FastAPI backend to Supabase.

**Dependencies:**
Add to `backend/pyproject.toml`:
- `supabase>=2.0` (Supabase Python client)
- `python-jose[cryptography]>=3.3` (JWT validation)

**Configuration:**
Create settings for:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- `SUPABASE_ANON_KEY` (for client-side operations)

**Steps:**
1. Add Supabase dependency to backend
2. Create `app/core/supabase.py` client configuration
3. Create `app/core/auth.py` for JWT validation middleware
4. Add Supabase connection health check to `/health` endpoint
5. Update `.env.example` with Supabase variables

**Test Checklist:**
- [ ] Backend can connect to Supabase
- [ ] `/health` endpoint includes Supabase connection status
- [ ] JWT validation works for protected routes
- [ ] Service role key can bypass RLS when needed

### Phase 5: Migration Management

**Goal:** Establish workflow for managing database migrations.

**Migration Workflow:**
1. Local development: `supabase db reset` to apply all migrations
2. Production deployment: `supabase db push` to apply pending migrations

**Steps:**
1. Document migration workflow in `docs/conventions.md`
2. Add just targets:
   - `just db-reset` - Reset local database
   - `just db-push` - Push migrations to production
   - `just db-diff` - Generate diff migration
3. Test migration flow from scratch
4. Set up CI check to validate migrations

**Test Checklist:**
- [ ] Migrations can be applied from scratch
- [ ] Migrations are idempotent
- [ ] Production migration process is documented
- [ ] CI validates migrations

### Phase 6: Verification & Documentation

**Goal:** Verify everything works end-to-end and document the setup.

**Steps:**
1. Write end-to-end test: create user → create household → add account → add transaction
2. Verify RLS prevents cross-household access
3. Document Supabase setup in `docs/supabase.md`
4. Update main README with setup instructions

**Test Checklist:**
- [ ] Full user journey test passes
- [ ] RLS security verified
- [ ] Documentation is complete
- [ ] New developer can set up from docs

---

## Migration Strategy: Supabase vs Alembic

**Decision:** Use Supabase migrations only. Do not add Alembic.

### Why not Alembic?

| Factor | Supabase | Alembic |
|--------|----------|---------|
| **RLS policies** | Native support | Raw SQL only, awkward |
| **Deploy workflow** | `supabase db push` | Separate process needed |
| **Local dev** | `supabase start` handles everything | Needs manual Postgres setup |
| **Tool chain** | One tool (Supabase CLI) | Two tools (Supabase + Alembic) |
| **Team onboarding** | Simple | More complex |

### When would Alembic make sense?

- Complex data migrations requiring Python logic
- Multi-database setups (not just Supabase)
- Existing Alembic workflows we can't change

### Supabase migration workflow

```bash
# Create migration
supabase migration new add_user_preferences

# Edit SQL in: supabase/migrations/20240112120000_add_user_preferences.sql

# Test locally (applies all migrations to fresh DB)
supabase db reset

# Deploy to production
supabase db push

# Generate migration from current state diff
supabase db diff -f changes
```

Migrations are timestamped SQL files in `supabase/migrations/` — fully version controlled.

---

## Open Questions

1. **Multi-tenancy:** Should we use Supabase Auth for users or custom auth?
   - Recommendation: Use Supabase Auth (built-in, handles JWT, email verification)

2. **Real-time:** Do we need real-time subscriptions for any features?
   - Recommendation: Not for MVP, can be added later

3. **Storage:** Do we need file uploads (receipts, etc.)?
   - Recommendation: Not for MVP, can be added later

4. **Backups:** What is the backup strategy for production?
   - Supabase provides daily backups on Pro plan

---

## Current Phase

**Phase:** 1 - Supabase Project Setup

**Status:** Ready to start
