---
feature: 00019-migrate-backend-clean-architecture
---

# Migrate Backend to Clean Architecture

## Objectif

Refactor the FastAPI backend from layered (MVC-style) architecture to Clean Architecture.

## Périmètre

- Create new directory structure following Clean Architecture layers
- Move existing code into proper layers without changing behavior
- Domain layer: pure business logic with zero external dependencies
- Use cases layer: orchestration, depends only on domain
- Adapters layer: API routers, persistence implementations
- Infrastructure layer: config, DI wiring, framework setup
- Update main.py as composition root
- Update tests to follow clean architecture patterns

## Critères de validation

- [ ] `app/domain/` has no external dependencies (stdlib only)
- [ ] `app/use_cases/` only imports from `app/domain/`
- [ ] All repository interfaces defined as protocols in domain
- [ ] FastAPI routers in `app/adapters/api/` import use cases only
- [ ] All existing tests pass
- [ ] New architecture documented in code comments
