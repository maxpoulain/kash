# Setup Supabase + schéma DB

**Source:** [Linear PER-19](https://linear.app/personal-max-and-maria/issue/PER-19/setup-supabase-schema-db)

**Priority:** High
**Labels:** Infra, Database

## Description

Configurer le projet Supabase et créer les tables core pour l'authentification et les households.

## Approach

**Incremental table creation:** Instead of creating all tables upfront, we create tables only when needed for a feature. This ensures the schema evolves with the actual requirements.

## Tables for this increment

### Core (needed for auth)

- `households` — foyers (unité de partage)
- `users` — utilisateurs (liés à un household, extends `auth.users`)

## Future tables (with their features)

- `accounts` → with Accounts feature
- `categories` → with Budget feature
- `monthly_budgets` → with Budget feature
- `transactions` → with Transactions feature
- `goals` → with Goals feature
- `household_invitations` → with Mode Foyer Partagé feature (`00013`)

## Household joining model

Every user gets a household automatically at signup (household of 1). Joining someone else's household works via invitation:

1. Maria invites Max by email → creates a `household_invitations` record with a unique token
2. Max receives a link, clicks it, and accepts
3. A single DB transaction:
   - Updates `users.household_id` to Maria's household for Max
   - Migrates all of Max's owned data (accounts, etc.) to Maria's household
   - Deletes Max's now-empty household
4. Max is now a member of Maria's household

**This is a prerequisite for `00013-mode-foyer-partage`.** The `household_invitations` table and the join transaction logic will be implemented in that feature.

## Critères d'acceptance

- [ ] Projet Supabase créé
- [ ] Core tables créées (`households`, `users`)
- [ ] Row Level Security configuré sur les core tables
- [ ] Migrations gérées avec Supabase CLI

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
6. Update docker-compose.yml to use Supabase instead of local Postgres
7. Update justfile with Supabase commands

**Test Checklist:**
- [x] `supabase start` runs successfully
- [x] Can connect to local Supabase from backend
- [x] Can connect to production Supabase from backend

**Progress:**
- [x] Supabase CLI installed
- [x] Local project initialized (`supabase init`)
- [x] Local Supabase running (ports 54321-54324)
- [x] Backend env variables configured
- [x] Supabase login completed
- [x] Production project created (bszdijhvmdtrjohthqne)
- [x] Local project linked to production
- [x] docker-compose.yml updated (removed local Postgres, added Supabase env)
- [x] justfile updated with Supabase commands

### Phase 2: Core Auth Tables

**Goal:** Create SQL migrations for authentication and household setup only.

**Rationale:** Following an incremental approach, we only create tables needed for the current feature. Additional tables (accounts, categories, transactions, goals) will be created with their respective features.

**Design Decisions:**

- **Household is mandatory.** Created automatically at signup (household of 1). A user always belongs to exactly one household. There is no "no household" state in the app.
- **Personal vs shared at the account level, not the household level.** When a second member joins, the household becomes a household of 2. Accounts carry an `is_shared` flag — personal accounts are only visible to their creator, shared accounts are visible to all household members.
- **No `email` on `users`.** Email lives in `auth.users` — duplicating it creates a sync hazard. Fetch it via join when needed.
- **`created_by` on `households`.** Tracks who owns the household (needed for future invite/delete flows).

**Schema Design:**

```sql
-- Core auth tables
households (
  id:         uuid primary key default gen_random_uuid(),
  name:       text not null,
  created_by: uuid references auth.users(id) on delete set null,
  created_at: timestamptz default now(),
  updated_at: timestamptz default now()
)

users (
  id:           uuid primary key references auth.users(id) on delete cascade,
  household_id: uuid not null references households(id) on delete restrict,
  display_name: text,
  created_at:   timestamptz default now(),
  updated_at:   timestamptz default now()
)
```

**Note on `accounts` (created with the Accounts feature):**
When `accounts` is created, it will include:
- `created_by uuid not null references users(id)` — who owns the account
- `is_shared boolean not null default true` — shared with all household members or personal only

**Signup flow (enforces the NOT NULL constraint):**
1. Supabase Auth creates the `auth.users` record
2. A database trigger (or backend call) immediately creates a `household` + a `users` row
3. The user lands in the app already inside a household

**Steps:**
1. Create migration: `supabase migration new create_core_tables`
2. Add SQL for `households` and `users` tables
3. Add trigger or document backend responsibility for auto-creating household on signup
4. Run migrations locally: `supabase db reset`

**Test Checklist:**
- [x] Migration runs successfully
- [x] Tables exist with correct columns and types
- [x] Foreign key constraints are in place
- [x] `users.id` references `auth.users(id)` correctly
- [x] `users.household_id` is NOT NULL — no user can exist without a household
- [x] Signup creates a household automatically

### Phase 3: Row Level Security (RLS)

**Goal:** Users can only see data from their own household. Within a household, personal accounts are only visible to their creator.

**RLS Strategy:**

```sql
-- Helper function (avoids repeated subqueries)
CREATE OR REPLACE FUNCTION current_household_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT household_id FROM users WHERE id = auth.uid()
$$;

-- Households: members see their own household only
CREATE POLICY "households_select" ON households FOR SELECT USING (
  id = current_household_id()
);

-- Users: see all members of your household
CREATE POLICY "users_select" ON users FOR SELECT USING (
  household_id = current_household_id()
);

-- Accounts (future, defined here for reference):
-- See account if it's shared in your household, OR you created it
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (
  household_id = current_household_id()
  AND (is_shared = true OR created_by = auth.uid())
);
```

**Steps:**
1. Enable RLS on `households` and `users`
2. Create `current_household_id()` helper function
3. Create SELECT, INSERT, UPDATE, DELETE policies on both tables
4. Test with two users in the same household and two users in different households

**Test Checklist:**
- [ ] User A cannot see User B's household
- [ ] User A and User B (same household) can see each other in `users`
- [ ] User A cannot see User B (different household) in `users`
- [ ] SELECT, INSERT, UPDATE, DELETE all respect RLS
- [ ] `current_household_id()` helper works correctly

**Note:** `accounts` RLS (including `is_shared` logic) will be defined in the Accounts feature migration.

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

**Phase:** 2 - Core Auth Tables

**Status:** ✅ Complete — Ready for Phase 3
