# Database Conventions

## Migrations

We use Supabase CLI for migrations. No Alembic.

### Creating Migrations

```bash
# Create a new migration file
just db-migration-new add_user_preferences

# Edit: supabase/migrations/<timestamp>_add_user_preferences.sql
```

### Local Development

```bash
# Reset local database (applies all migrations from scratch)
just db-reset

# Generate migration from Studio changes
just db-diff schema_changes
```

### Production Deployment

```bash
# Push pending migrations to production
just db-push
```

### Migration Guidelines

1. **One change per migration** - Keep migrations focused and small
2. **Never modify existing migrations** - Create new ones to fix issues
3. **Test locally first** - Always run `just db-reset` before pushing
4. **Include rollback logic** - Use `IF EXISTS`/`IF NOT EXISTS` for safety
5. **RLS policies in same migration** - Create tables and their RLS policies together

## Table Naming

- Use plural nouns: `transactions`, `categories`, `budgets`
- Snake_case for column names: `created_at`, `household_id`
- Standard columns for all tables:
  - `id uuid primary key default gen_random_uuid()`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
