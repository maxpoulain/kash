# Kash monorepo tasks

# Detect docker compose command (v2 plugin or v1 standalone)
docker_compose := if `which docker-compose 2>/dev/null | wc -l | tr -d ' '` == "1" { "docker-compose" } else { "docker compose" }

# Run everything: Supabase + frontend + backend
dev-all:
    #!/usr/bin/env bash
    set -e
    echo "Starting Supabase..."
    supabase status &>/dev/null || supabase start
    echo "Starting docker compose (frontend + backend)..."
    {{docker_compose}} up

# Rebuild docker images (run after adding dependencies)
dev-build:
    {{docker_compose}} build

# Rebuild and restart everything from scratch
dev-rebuild:
    {{docker_compose}} down -v
    {{docker_compose}} up --build

# Run full stack (requires supabase start first)
dev:
    {{docker_compose}} up

# Stop docker-compose services (keeps Supabase running)
dev-stop:
    {{docker_compose}} down

# Tail logs from docker-compose
dev-logs:
    {{docker_compose}} logs -f

# Start Supabase local development (database + auth + storage)
db-start:
    supabase start

# Stop Supabase local development
db-stop:
    supabase stop

# Stop everything (docker-compose + Supabase)
stop-all: dev-stop db-stop

# Reset local database (apply all migrations)
db-reset:
    supabase db reset

# Push migrations to production
db-push:
    supabase db push

# Create a new migration file
db-migration-new name:
    supabase migration new {{name}}

# Generate migration from current schema diff (useful after making changes in Studio)
db-diff name="changes":
    supabase db diff -f {{name}}

# Check Supabase status
supabase-status:
    supabase status

# Open Supabase Studio UI
studio:
    open http://127.0.0.1:54323

# Run backend locally with hot reload (requires uv and supabase running)
backend:
    cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run frontend locally with hot reload (requires npm and supabase running)
frontend:
    cd frontend && npm run dev

# Run both backend and frontend in parallel (requires tmux or similar, or run in separate terminals)
both:
    @echo "Run 'just backend' and 'just frontend' in separate terminals"
    @echo "Or use 'just dev' to run everything in docker-compose"

# Run backend tests
backend-test:
    cd backend && uv run pytest

# Run all checks (lint + typecheck + test)
check:
    cd frontend && npm run lint
    cd backend && uv run ruff check . && uv run pyright

# Format code
fmt:
    cd backend && uv run ruff format .
    cd frontend && npm run lint -- --fix
