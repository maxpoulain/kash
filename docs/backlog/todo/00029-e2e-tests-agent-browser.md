# E2E Tests with Agent Browser

End-to-end testing using [Vercel's Agent Browser](https://github.com/vercel-labs/agent-browser) for automated browser-based testing.

## Goal

Set up automated end-to-end tests that can verify key user flows by simulating real browser interactions.

## Test Scope

### Phase 1: Authentication
- [ ] Sign-in flow test
  - Navigate to login page
  - Enter credentials
  - Verify successful login
  - Verify redirect to dashboard

### Phase 2: Core Flows (Future)
- [ ] Sign-up flow
- [ ] Transaction creation
- [ ] Budget viewing
- [ ] Navigation between pages

## Implementation Plan

1. Install and configure agent-browser
2. Create test directory structure
3. Write sign-in test
4. Add just command to run tests
5. Integrate with CI pipeline

## Verification Criteria

- Tests run locally with `just e2e-test`
- Tests can be run against local dev environment
- Sign-in test passes with valid credentials
