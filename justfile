# Kash monorepo tasks

# Detect docker compose command (v2 plugin or v1 standalone)
docker_compose := if `which docker-compose 2>/dev/null | wc -l | tr -d ' '` == "1" { "docker-compose" } else { "docker compose" }


# =============================================================================
# Docker Workflow (full containerization)
# =============================================================================

# Run everything in Docker: Supabase + frontend + backend
dev-all:
    #!/usr/bin/env bash
    set -e
    echo "Starting Supabase..."
    supabase status &>/dev/null || supabase start
    echo "Building docker images (if needed)..."
    {{docker_compose}} up --build

# Run full stack in Docker (requires supabase start first)
dev:
    {{docker_compose}} up

# Stop docker-compose services (keeps Supabase running)
dev-stop:
    {{docker_compose}} down

# Rebuild docker images (run after adding dependencies)
dev-build:
    {{docker_compose}} build

# Rebuild and restart everything from scratch
dev-rebuild:
    {{docker_compose}} down -v
    {{docker_compose}} up --build

# Tail logs from docker-compose
dev-logs:
    {{docker_compose}} logs -f


# =============================================================================
# Local Workflow (direct process execution, no Docker for app services)
# =============================================================================

# Start all services locally: Supabase + backend + frontend in background (no Docker)
dev-local:
    #!/usr/bin/env bash
    set -e
    echo "Starting Supabase..."
    supabase status &>/dev/null || supabase start
    echo ""
    echo "Starting backend and frontend in background..."
    echo "Press Ctrl+C to stop all services"
    echo ""
    cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ../frontend && npm run dev &
    FRONTEND_PID=$!
    echo "Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
    wait $BACKEND_PID $FRONTEND_PID

# Run backend locally with hot reload (requires uv and supabase running)
backend:
    cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run frontend locally with hot reload (requires npm and supabase running)
frontend:
    cd frontend && npm run dev


# =============================================================================
# Database (Supabase)
# =============================================================================

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


# =============================================================================
# Quality & Testing
# =============================================================================

# Run all checks (lint + typecheck + test)
check:
    cd frontend && npm run lint && npm run typecheck && npm run test
    cd backend && uv run ruff check . && uv run pyright && uv run pytest

# Format code
fmt:
    cd backend && uv run ruff format .
    cd frontend && npm run lint -- --fix

# Run backend tests
backend-test:
    cd backend && uv run pytest

# Seed test user for E2E testing
e2e-seed:
    cd e2e && npm install && node scripts/seed-test-user.js

# Open agent-browser for manual testing (app must be running)
e2e-open:
    cd e2e && npx agent-browser open http://localhost:3000
