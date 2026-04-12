# Kash monorepo tasks

# Run full stack with docker-compose (frontend + backend + db)
dev:
    docker-compose up

# Stop all docker-compose services
dev-stop:
    docker-compose down

# Tail logs from docker-compose
dev-logs:
    docker-compose logs -f

# Run backend locally with hot reload (requires uv and postgres running)
backend:
    cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run frontend locally with hot reload (requires npm)
frontend:
    cd frontend && npm run dev

# Run both backend and frontend in parallel (requires tmux or similar, or run in separate terminals)
both:
    @echo "Run 'just backend' and 'just frontend' in separate terminals"
    @echo "Or use 'just dev' to run everything in docker-compose"

# Run backend tests
backend-test:
    cd backend && uv run pytest

# Run all checks (frontend only - extend as needed)
check:
    cd frontend && npm run lint

# Format code
fmt:
    cd backend && uv run ruff format .
    cd frontend && npm run lint -- --fix
