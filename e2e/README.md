# E2E Testing for Kash

Manual E2E testing using [agent-browser](https://github.com/vercel-labs/agent-browser) CLI.

## Setup

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your Supabase service key from `supabase status`

# Seed the test user
npm run seed
```

## Test User

After seeding, you have a test account:
- **Email:** `test@example.com`
- **Password:** `TestPassword123!`

## Using agent-browser

The `agent-browser` CLI lets you control a browser interactively:

```bash
# Open the app
npx agent-browser open http://localhost:3000/login

# Common commands
npx agent-browser type "#email" "test@example.com"
npx agent-browser type "#password" "TestPassword123!"
npx agent-browser click "button[type=submit]"
npx agent-browser wait 1000
npx agent-browser screenshot
```

## Testing Workflow

When implementing a new feature, Claude will:

1. Start the dev environment: `just dev-local`
2. Use agent-browser to navigate and test the feature
3. Verify the feature works end-to-end
4. Document any issues found

## Just Commands

```bash
# Seed the test user
just e2e-seed

# Open agent-browser CLI (after this, use agent-browser commands)
just e2e-open
```
