---
name: backlog
description: Backlog workflow management - new, start, done commands for incremental delivery
---

# Backlog Workflow

Manage incremental delivery items following project conventions.

## Structure

```
docs/backlog/
├── features/     → Macro ideas and epics (source of truth for intent)
├── todo/         → Technical tasks ready to be worked on (XXXXX-name.md)
├── in-progress/  → Currently being worked on
└── done/         → Completed
```

**Features** are high-level descriptions of user or business value. They are never moved — they stay in `features/` forever as reference.

**Tasks** (todo/in-progress/done) are the technical increments that implement a feature. Each task references its parent feature via a `feature:` frontmatter field.

---

## Commands

### `/backlog plan <feature-id>`

Decompose a feature into one or more tasks interactively — **do not create anything until the user says OK**.

1. **Read** `docs/backlog/features/{feature-id}-*.md`
2. **Analyze** the description, stack, acceptance criteria
3. **Propose** a breakdown as a table:
   - Each row: proposed task name, scope summary, depends on
   - Each task must be: Shippable, Valuable, Testable, Simple, Validating
   - Raise any questions or ambiguities before proposing
4. **Wait for user approval** — adjust based on feedback
5. Once user says OK:
   - Find next available ID (scan all four folders)
   - Create each task file in `docs/backlog/todo/` with frontmatter:
     ```markdown
     ---
     feature: {feature-id}-{feature-name}
     depends_on: {task-id} (if applicable)
     ---
     ```
   - Commit all at once: `git commit -m "chore: add tasks for {feature-name} 📋"`
   - Push to main

**Errors**:
- Feature not found → "Error: No feature matching '{id}' in docs/backlog/features/"

---

### `/backlog new <name> [description] [--feature <id>]`

Create a single task in `docs/backlog/todo/` (use when not decomposing a full feature):

1. **Find next ID**: Scan `todo/`, `in-progress/`, `done/`, and `features/` for highest 5-digit ID, increment by 1
2. **Create file**: `docs/backlog/todo/{ID}-{name}.md` with template:
   ```markdown
   ---
   feature: {feature-id} (if --feature provided)
   ---

   # {Name}

   ## Objectif
   {description or "TODO: what we're trying to achieve"}

   ## Périmètre
   TODO: what is in scope

   ## Critères de validation
   - [ ] TODO: what must be true to consider this complete?
   ```
3. **Commit to main**:
   - Must be on `main` branch with clean working directory
   - `git add . && git commit -m "chore: add {name} 📋"`
   - `git push origin main`

**Errors**:
- Not on main → "Error: Must be on main. Current: {branch}. Run: git checkout main"
- Uncommitted changes → "Error: Uncommitted changes. Commit or stash first."
- Duplicate name → "Error: Item '{name}' exists in todo/ ({ID}-{name}.md)"

---

### `/backlog start <id-or-name> [--with-branch]`

Move item from `todo/` to `in-progress/`:

1. **Resolve item**: Match `id-or-name` against items in `todo/` (partial OK if unique)
2. **Validate state**:
    - Must be on `main` branch (error if on feature branch: "Error: Already on '{branch}'. Checkout main first.")
    - Clean working directory
3. **Move**: `git mv todo/{file} in-progress/{file}`
4. **Commit**: `git commit -m "chore: start {name} 🚀"`
5. **Push**: `git push origin main`
6. **Branch (optional)**:
    - Without `--with-branch`: Stay on main (direct push workflow)
    - With `--with-branch`: `git checkout -b {name}`

**Errors**:
- Not found → "Error: No match for '{term}' in todo/. Try: /backlog status"
- Multiple matches → "Error: Multiple matches: {list}. Use full ID."
- Branch exists → "Error: Branch '{name}' exists. Delete or choose different name."

---

### `/backlog done [id-or-name]`

Complete an in-progress item:

**If on main branch** (direct push workflow):
1. `id-or-name` required (error if missing)
2. Resolve item in `in-progress/`
3. `git mv in-progress/{file} done/{file}`
4. `git commit -m "chore: complete {name} ✅"`
5. `git push origin main`

**If on feature branch**:
1. Auto-detect from branch name if `id-or-name` not provided
2. Verify clean working state
3. `git mv in-progress/{file} done/{file}`
4. `git commit -m "chore: complete {name} ✅"`
5. Prompt: "Ready for PR: gh pr create --title '<type>: <description> <emoji>' ..."
   - PR title must follow conventional commits: `<type>: <description> <emoji>` (same format as commit messages)
   - Derive type and emoji from the nature of the work (feat ✨, fix 🐛, refactor ♻️, etc.)

**Errors**:
- On main without id → "Error: On main branch, id-or-name required."
- No match → "Error: No item matching '{term}' in in-progress/."
- Uncommitted changes → "Warning: Uncommitted changes. Commit first."

---

### `/backlog status`

Show backlog state:
- List items in `todo/` (grouped by feature if applicable)
- List items in `in-progress/` (mark current branch with `*>`)
- List last 5 items in `done/`

---

## Principles

1. **Every state change commits to main** - team visibility
2. **Direct push default** - stay on main, no branch needed
3. **Branches only for preview env** - use `--with-branch` for infra/arch changes needing validation
4. **Ship criteria is a statement** - what must be true, not a checklist of constraints
5. **Plan before creating** - `/backlog plan` is interactive, always wait for OK before writing files
