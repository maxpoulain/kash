# Testing Conventions

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

## Fail Fast Principle

**CI must use just targets** - never duplicate check logic in `.github/workflows/`.

The order matters for fast feedback:
1. **Syntax** (fastest)
2. **Static analysis**
3. **Unit tests**
4. **Integration tests**

Always run `just check` before committing.
