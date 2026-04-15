# E2E Testing with Agent Browser

Manual E2E testing setup using [agent-browser](https://github.com/vercel-labs/agent-browser) CLI.

## Goal

Enable Claude to test features end-to-end using the agent-browser CLI tool with a seeded test user.

## Test User

After running `just e2e-seed`:
- **Email:** `test@example.com`
- **Password:** `TestPassword123!`

## Usage

Claude will use agent-browser to manually test features:

```bash
# Start the dev environment
just dev-local

# In another terminal, seed test user (one-time)
just e2e-seed

# Open agent-browser
just e2e-open

# Or use agent-browser commands directly
npx agent-browser open http://localhost:3000/login
npx agent-browser type "#email" "test@example.com"
npx agent-browser type "#password" "TestPassword123!"
npx agent-browser click "button[type=submit]"
npx agent-browser screenshot
```

## Implementation Plan

1. [x] Install agent-browser CLI
2. [x] Create test user seeding script
3. [x] Add just commands (`e2e-seed`, `e2e-open`)
4. [x] Document usage for Claude

## Verification Criteria

- [x] `just e2e-seed` creates a test user
- [x] `just e2e-open` launches agent-browser
- [x] Claude can sign in with test credentials via agent-browser

## Test Result

Successfully tested sign-in flow using agent-browser:

1. Created test user via sign-up: `test@example.com`
2. Signed out
3. Signed in with credentials
4. Verified dashboard loads with user email displayed

![Dashboard after sign-in](../../e2e/dashboard-screenshot.png)
