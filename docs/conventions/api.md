# API Conventions

## Endpoint Naming

### Convention (Effective Now)

Use **kebab-case** for all new API endpoints:

```
/api/spending-goals
/api/monthly-reports
/api/net-worth
```

### Legacy

Existing endpoints use lowercase without separators (`/budgets`, `/transactions`). Keep them as-is for backwards compatibility. New endpoints follow kebab-case.

### Rationale

- More readable: `spending-goals` vs `spendinggoals`
- Consistent with URL best practices
- Aligns with REST API standards

## REST Patterns

- Use nouns for resources, not verbs: `/transactions` not `/get-transactions`
- Use HTTP methods for actions: GET, POST, PUT, DELETE
- Query params for filtering: `/spending-goals?month=2025-04`
- Path params for identifiers: `/transactions/{id}`
