# Frontend Conventions

## TypeScript & Strong Typing

### Principles

- **TypeScript exclusively** - No JavaScript except for config files
- **Strict mode always** - `strict: true` in `tsconfig.json`
- **No `any`** - Use `unknown` for truly unknown values, narrow with type guards
- **Explicit return types** on public APIs and complex functions
- **No implicit inference** - When types aren't obvious, annotate them

### Rules

```typescript
// ❌ Avoid
const data: any = fetchData();
function process(item) { ... }

// ✅ Prefer
const data: ElectionResult = fetchData();
function process(item: Candidate): ProcessedCandidate { ... }
```

### Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```
