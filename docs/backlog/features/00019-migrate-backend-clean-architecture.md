# Migrate Backend to Clean Architecture

**Priority:** Medium
**Labels:** Refactor, Backend, Architecture

## Description

Refactor the FastAPI backend from the current layered (MVC-style) architecture to Clean Architecture. This improves testability, separation of concerns, and makes the codebase more maintainable as features grow.

## Current Architecture (Layered)

```
app/
├── core/           # Infra (supabase client, config)
├── models/         # DB models (SQLAlchemy)
├── routers/        # HTTP handlers (FastAPI)
├── schemas/        # Pydantic models
├── services/       # Business logic
└── main.py         # App entry
```

**Problems:**
- Business logic mixed with framework code
- Database models leak into API layer
- Hard to test without database/HTTP
- Dependencies flow in all directions

## Target Architecture (Clean)

```
app/
├── domain/              # Inner circle - pure business logic
│   ├── entities/        # Business objects (no framework deps)
│   ├── value_objects/   # Immutable values (Money, Email, etc.)
│   └── repositories.py  # Abstract interfaces (protocols)
│
├── use_cases/           # Application layer - orchestration
│   └── health/          # Example: health check use cases
│       ├── __init__.py
│       ├── check_health.py
│       └── ports.py     # DTOs for this use case
│
├── adapters/            # Interface adapters
│   ├── api/             # FastAPI routers
│   │   ├── routers/
│   │   └── schemas/
│   ├── persistence/     # Repository implementations
│   │   └── supabase/
│   └── external/        # External service clients
│
├── infrastructure/      # Frameworks/drivers (outer circle)
│   ├── config.py
│   ├── supabase_client.py
│   └── dependencies.py  # DI wiring
│
└── main.py              # Composition root
```

## Key Principles

1. **Dependency Rule**: Inner layers don't know about outer layers
   - Domain has zero external dependencies
   - Use cases only import domain
   - Adapters import use cases + domain
   - Infrastructure imports everything

2. **Domain is Pure**: No framework imports, no I/O, no exceptions from libraries

3. **Use Cases Orchestrate**: They coordinate domain entities and repositories, but don't know HTTP/DB details

4. **Ports & Adapters**: Abstract interfaces (ports) defined in inner layers, implemented in outer layers (adapters)

5. **Dependency Injection**: Wired at composition root (`main.py`)

## Migration Steps

1. Create new directory structure
2. Move `app/config.py` → `app/infrastructure/config.py`
3. Move `app/core/supabase.py` → `app/infrastructure/supabase_client.py`
4. Create domain entities (start with User, Household)
5. Create repository protocols in domain
6. Create use cases (start with health check as example)
7. Move `app/routers/` → `app/adapters/api/routers/`
8. Move `app/schemas/` → `app/adapters/api/schemas/`
9. Move `app/models/` → `app/adapters/persistence/sqlalchemy/`
10. Create repository implementations in `app/adapters/persistence/`
11. Update `main.py` as composition root with DI wiring
12. Update tests to follow clean architecture

## Acceptance Criteria

- [ ] `app/domain/` has no external dependencies (only stdlib)
- [ ] `app/use_cases/` only imports from `app/domain/`
- [ ] `app/adapters/` imports from inner layers only
- [ ] `app/infrastructure/` wires everything together
- [ ] All existing tests pass
- [ ] New tests don't require database/HTTP for use case tests
- [ ] Documentation updated with architecture decision record (ADR)

## Resources

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [FastAPI + Clean Architecture Example](https://github.com/jhjcpishva/fastapi-clean-architecture-example)

## Notes

- This is a refactoring - no new features
- Do incrementally: one module at a time
- Keep tests passing throughout
- Consider this a prerequisite for complex features (transactions, budgets)
