# Kash

## Rules

- Never add `Co-Authored-By` to commit messages
- Keep `CLAUDE.md` and `docs/` in sync
- Each commit is a release candidate - keep main deployable
- **All UI features MUST be tested with agent-browser before completing**

## Operational CLI Defaults

- Assume `gh` and `aws` CLIs are available by default
- Use `gh` first for PR/CI checks, logs, and merges
- Use `aws` first for infra/runtime checks
- Do not ask if these CLIs can be used; run them directly
- If auth fails, run `gh auth status` or `aws sts get-caller-identity`

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

## Backlog Workflow

Backlog lives in `docs/backlog/` with four folders:

```
features/     → Macro ideas and epics (will be broken into todo items)
todo/         → Items to do (XXXXX-name.md)
in-progress/  → Currently being worked on
done/         → Completed
```

The 5-digit number is a **stable ID**, not priority.

### Starting work

1. Create file in `todo/`: `XXXXX-name.md`
2. Commit to main: `chore: add <XXXXX-name> 📋`
3. Push main immediately: `git push origin main`
4. Verify `origin/main` includes that commit
5. Move item from `todo/` to `in-progress/`
6. Commit to main: `chore: start <XXXXX-name> 🚀`
7. Push main immediately: `git push origin main`
8. Verify `origin/main` includes that commit
9. Create feature branch: `git checkout -b <XXXXX-name>`

### Branch strategy

- **Always use a branch** for every task (features, fixes, chores)
- Branch name = task ID + name: `XXXXX-name`
- Direct push to main only for: backlog state changes (`chore: add`, `chore: start`, `chore: complete`)

### Completing work

1. Move item from `in-progress/` to `done/`
2. Commit on branch
3. All work goes through PR — no exceptions:
    - `git fetch origin && git rebase origin/main`
    - `gh pr create --title '<type>: <description> <emoji>'`
    - Merge with `gh pr merge --rebase`

PR titles follow the same conventional commits format as commit messages:
```
<type>: <description> <emoji>
```
Example: `feat: init backend FastAPI with uv ✨`

For PR-required changes, always rebase and verify before merge:
1. `git fetch origin`
2. `git rebase origin/main`
3. Re-run checks/preview verification on rebased head
4. Merge with `gh pr merge --rebase`

### Adding backlog items

Each increment must be:
- **Shippable** - can be deployed independently
- **Valuable** - delivers user or business value
- **Testable** - has clear verification criteria
- **Simple** - small enough to complete in one branch
- **Validating** - has explicit assumptions to confirm

Use next available 5-digit ID: `XXXXX-name.md`


## Development Workflow

### Plan Before Code

The increment file in `docs/backlog/in-progress/` is the planning document. Before coding:

1. **If no plan exists** - Research and add an "Implementation Plan" section with phases and test lists
2. **If plan exists** - Review the test list for the current phase
3. **Resolve uncertainties** - Web search, read existing code, ask questions
4. **Only then** - Start writing code

Never jump into implementation without a plan in the increment file.

### Just Targets

```bash
just check      # Run all checks (lint + typecheck + test)
just lint       # Run linters
just fmt        # Format code
just typecheck  # Run type checkers
just dev        # Start dev environment (docker-compose)
just dev-logs   # Tail dev logs

```

Run `just -l` to see all available commands.

Keep `justfile` targets thin (one-liners). Complex logic goes in scripts.

### Fail Fast Principle

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



## Claude Code Skills

This repository includes shared skills in `.claude/skills/`:

| Skill | Description |
|-------|-------------|
| `/backlog plan <feature-id>` | Decompose a feature into tasks (interactive) |
| `/backlog` | Create, start, and complete backlog items |
| `/commit` | Generate conventional commits with emoji |
| `/check` | Run pre-commit checks |
| `/pr-merge` | Merge PRs with rebase workflow |
| `/just` | Context-aware just target suggestions |

## Key Paths

- `docs/conventions.md` - full workflow documentation
- `docs/backlog/` - incremental delivery roadmap