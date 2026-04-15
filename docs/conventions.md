# Conventions

## Development Workflow

### Principles

- **Trunk-based development** with short-lived feature branches
- **Each commit is a release candidate** - main must always be deployable
- **Backlog on git** - work items tracked in `docs/backlog/`
- **Feedback-driven** - Use fast, trustworthy feedback to guide changes

### Backlog Structure

```
docs/backlog/
├── features/     # Macro ideas and epics (will be broken into todo items)
├── todo/         # Items to do (XXXXX-name.md)
├── in-progress/  # Currently being worked on
└── done/         # Completed increments
```

Files are named with 5-digit stable ID: `00001-homepage-mvp.md`

The number is a **stable identifier**, not priority. Prioritization happens when picking the next item to work on, not through renaming files.

### Starting Work on an Increment

```bash
# 1. Move item to in-progress
git mv docs/backlog/todo/00001-homepage-mvp.md docs/backlog/in-progress/

# 2. Commit to main (this is the real backlog state)
git commit -m "chore: start homepage-mvp 🚀"

# 3. Push main immediately so others see it in-progress
git push origin main

# 4. Verify origin/main has the start commit
git fetch origin
git log --oneline origin/main -n 1

# 5. Create feature branch
git checkout -b homepage-mvp
```

### Completing an Increment

```bash
# 1. On feature branch, move item to done
git mv docs/backlog/in-progress/00001-homepage-mvp.md docs/backlog/done/

# 2. Commit
git commit -m "chore: complete homepage-mvp ✅"

# 3. Switch to main and fast-forward merge
git checkout main
git merge --ff-only homepage-mvp

# 4. Delete feature branch
git branch -d homepage-mvp
```

### Merge Strategy: PR vs Direct Push

We use a hybrid approach based on risk and complexity:

| Approach | When to Use | Merge Mode |
|----------|-------------|------------|
| **Direct push** | Documentation, chores (backlog moves, ADRs), single-file fixes with passing tests | Fast-forward (`git merge --ff-only`) |
| **PR required** | Infra changes (Terraform, CI config), new features, complex refactors | **Always rebase** (`gh pr merge --rebase`) |

For **PR required** changes, always rebase and verify before merge:

```bash
git fetch origin
git rebase origin/main
just check
# verify preview on rebased head
gh pr merge --rebase
```

**Rationale:**
- PRs provide CI validation before merge for risky changes
- Direct push reduces friction for trivial, safe changes
- Rebase merge keeps a linear history for PRs
- CI on main still catches issues with direct pushes

### Implementation Workflow

#### Plan Before Code

The increment file in `docs/backlog/in-progress/` is the planning document. Before coding:

1. **If no plan exists** - Research and add an "Implementation Plan" section with phases and test lists
2. **If plan exists** - Review the test list for the current phase
3. **Resolve uncertainties** - Web search, read existing code, ask questions
4. **Only then** - Start writing code

Never jump into implementation without a plan in the increment file.

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

## Commit Messages

Conventional commits with emoji at the end:

```
<type>: <description> <emoji>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Emojis:
- feat: ✨
- fix: 🐛
- docs: 📝
- style: 💄
- refactor: ♻️
- perf: ⚡
- test: ✅
- build: 📦
- ci: 🔧
- chore: 🧹

**Rule:** Never add `Co-Authored-By:` to commit messages.

## Just Targets

```bash
just check      # Run all checks (lint + typecheck)
just lint       # Run linters
just fmt        # Format code
just typecheck  # Run type checkers
just dev        # Start dev environment
```

Run `just -l` to see all available commands.

## Database Migrations

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

Keep `justfile` targets thin (one-liners). Complex logic goes in scripts.

## Fail Fast Principle

**CI must use just targets** - never duplicate check logic in `.github/workflows/`.

The order matters for fast feedback:
1. **Syntax** (fastest)
2. **Static analysis**
3. **Unit tests**
4. **Integration tests**

Always run `just check` before committing.


## E2E Testing with Agent Browser

All features involving UI changes MUST be tested end-to-end using agent-browser before the PR is ready for review.

### Test User

A test user is available for E2E testing:
- **Email:** `test@example.com`
- **Password:** `TestPassword123!`

Set up with: `just e2e-seed` (creates the user if not exists)

### Required Testing Steps

For every UI feature:

1. **Start the dev environment:** `just dev-local`
2. **Implement the feature**
3. **Test with agent-browser:**
   ```bash
   just e2e-open              # Opens browser to app
   # Or run specific commands:
   npx agent-browser open http://localhost:3000/path
   npx agent-browser type "#input" "value"
   npx agent-browser click "button"
   npx agent-browser screenshot /tmp/test.png
   ```
4. **Attach screenshot proof** to the PR showing the feature working
5. **Include in PR description:** "Tested with agent-browser - [see screenshot]"

### PR Checklist for UI Features

Every PR with UI changes must include:
- [ ] Screenshot(s) from agent-browser showing the feature works
- [ ] Navigation flow tested (if applicable)
- [ ] Error states tested (if applicable)
- [ ] Mobile viewport tested for responsive changes

### Example Test Session

```bash
# Sign in as test user
npx agent-browser open http://localhost:3000/login
npx agent-browser fill "#email" "test@example.com"
npx agent-browser fill "#password" "TestPassword123!"
npx agent-browser click "button[type=submit]"
npx agent-browser wait 1000
npx agent-browser screenshot /tmp/test-login.png
```


## Adding Backlog Items

Each increment must be:
- **Shippable** - can be deployed independently
- **Valuable** - delivers user or business value
- **Testable** - has clear verification criteria
- **Simple** - small enough to complete in one branch
- **Validating** - has explicit assumptions to confirm

Use next available 5-digit ID: `XXXXX-name.md`

## Operational CLI Defaults

- Assume `gh` and `aws` CLIs are available by default
- Use `gh` first for PR/CI checks, logs, and merges
- Use `aws` first for infra/runtime checks (ECS, logs)
- Do not ask if these CLIs can be used; run them directly
- If auth fails, run `gh auth status` or `aws sts get-caller-identity`, then report next login step