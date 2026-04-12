# Supabase Setup

This project uses [Supabase](https://supabase.com) for authentication, database, and authorization.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) installed:
  ```bash
  brew install supabase/tap/supabase
  ```

## Local Development

### 1. Start Supabase Locally

```bash
just db-start
```

This starts:
- PostgreSQL database on port 54322
- Supabase Auth on port 54321
- Supabase Studio UI on http://127.0.0.1:54323

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

The `.env.example` is pre-configured for local Supabase:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

Get the actual keys after starting Supabase:

```bash
supabase status
```

### 3. Run Database Migrations

```bash
just db-reset
```

This applies all migrations in `supabase/migrations/` to your local database.

### 4. Verify Setup

```bash
# Check Supabase is running
just supabase-status

# Open Supabase Studio
just studio

# Test backend health
curl http://localhost:8000/health/db
```

## Database Schema

### Core Tables

#### `households`
Foyers (households) - the unit of sharing.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `name` | text | Household name |
| `created_by` | uuid | References `auth.users(id)` |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

#### `users`
App users - extends Supabase Auth.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | References `auth.users(id)` |
| `household_id` | uuid | References `households(id)`, NOT NULL |
| `display_name` | text | User's display name |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

Every user automatically gets a household at signup (household of 1).

### Row Level Security (RLS)

All tables have RLS enabled. Policies:

- **households**: Users can only see their own household
- **users**: Users can only see members of their household

The helper function `current_household_id()` returns the current user's household.

## Migrations

### Create a New Migration

```bash
just db-migration-new add_new_table
```

Edit the generated file in `supabase/migrations/`.

### Apply Migrations Locally

```bash
just db-reset
```

### Deploy to Production

```bash
just db-push
```

### Generate Migration from Changes

If you make changes via Supabase Studio:

```bash
just db-diff my_changes
```

## Production

The project is linked to a production Supabase project.

```bash
# Check linked project
supabase projects list

# Push migrations to production
supabase db push
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `just db-start` | Start local Supabase |
| `just db-stop` | Stop local Supabase |
| `just db-reset` | Reset DB with all migrations |
| `just db-push` | Push migrations to production |
| `just db-migration-new <name>` | Create new migration |
| `just studio` | Open Supabase Studio |
| `just supabase-status` | Check Supabase status |

## Troubleshooting

### Port already in use

Supabase uses ports 54321-54326. Stop other services using these ports:

```bash
# Find what's using port 54321
lsof -i :54321

# Kill the process
kill -9 <PID>
```

### Migration fails

Check the migration SQL for errors, then reset:

```bash
just db-reset
```

### Can't connect to Supabase from backend

1. Verify Supabase is running: `just supabase-status`
2. Check `.env` has correct URL and keys
3. Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` for backend operations

## Architecture Decision

We chose Supabase over self-hosted PostgreSQL because:

- **Built-in Auth**: Handles JWT, email verification, password reset
- **RLS**: Native Row Level Security support
- **Less infra**: No need to manage auth service
- **Migrations**: Simple SQL-based migrations

See `docs/conventions.md` for migration workflow details.
