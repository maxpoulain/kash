---
---

# French Translation

## Objective
Make the entire website bilingual (English default, French supported) using `next-intl` with locale-based routing (`/en/...`, `/fr/...`) and an in-app language toggle.

## Context
The codebase currently has French text hardcoded directly into components ("Objectifs", "Chargement…", "Ajouter", etc.) alongside English text on landing and auth pages. There is no i18n system — strings are scattered and inconsistent. This increment introduces a proper translation layer and extracts all UI strings into dictionaries.

## Scope
All user-facing text across the entire website:
- Landing page (`/`)
- Auth pages (`/login`, `/signup`)
- App pages (`/dashboard`, `/goals`, `/assets`)
- Navigation (sidebar, bottom nav)
- Modals and sheets (transaction form, goal creation, account sheet)
- Empty states, toasts, error messages
- Metadata (page titles, descriptions)
- Date/currency formatting (currently hardcoded to `fr-FR`)

Out of scope:
- API category names (data, not UI)
- `design-system` page (internal dev tool)

## Implementation Plan

### Phase 1: Infrastructure

1. **Install `next-intl`**
2. **Create `frontend/i18n/routing.ts`** — define `locales: ["en", "fr"]`, `defaultLocale: "en"`
3. **Create `frontend/middleware.ts`** — `createMiddleware(routing)` to handle locale detection, redirect, and cookie
4. **Create `frontend/i18n/request.ts`** — async message loader based on locale param
5. **Update `frontend/next.config.ts`** — add `async rewrites` or use next-intl plugin if needed for static export compatibility
6. **Restructure routes:**
   - Move all pages from `app/*` to `app/[locale]/*`
   - Keep API routes (`app/auth/signout/route.ts`) at root
   - `app/layout.tsx` becomes thin root layout (html/body only)
   - `app/[locale]/layout.tsx` wraps children with `NextIntlClientProvider` and sets `html lang`
   - `app/[locale]/page.tsx` becomes landing page
7. **Create `frontend/messages/en.json`** and **`fr.json`** with initial structure

### Phase 2: Extract strings — App pages

8. **`frontend/app/[locale]/dashboard/dashboard-client.tsx`** — extract title, "ce mois", "non catégorisées", aria-labels
9. **`frontend/components/transactions/transaction-list.tsx`** — extract all UI strings (filters, column headers, empty states, loading, date labels)
10. **`frontend/components/transactions/transaction-sheet.tsx`** — extract sheet title, toast message
11. **`frontend/components/transactions/transaction-form.tsx`** — extract all labels, placeholders, button text, error messages, validation messages, toggle labels. **Switch `date-fns` locale from hardcoded `fr` to dynamic locale.**
12. **`frontend/app/[locale]/goals/goals-client.tsx`** — extract title, "sur", "budgeté", loading text, aria-labels
13. **`frontend/app/[locale]/goals/goal-card.tsx`** — extract any card labels
14. **`frontend/app/[locale]/goals/empty-state.tsx`** — extract empty state copy
15. **`frontend/app/[locale]/goals/create-goal-modal.tsx`** — extract all form labels, validation messages, button text, toast messages
16. **`frontend/app/[locale]/assets/assets-client.tsx`** — extract "Net worth"/"Patrimoine", "Ajouter un compte", "Répartition", "Comptes", empty states, post count labels
17. **`frontend/components/assets/account-form.tsx`** and **`account-sheet.tsx`** — extract labels, button text, validation

### Phase 3: Extract strings — Auth, landing, nav, layout

18. **`frontend/app/[locale]/page.tsx`** — extract all landing page marketing copy, CTAs, footer
19. **`frontend/app/[locale]/(auth)/login/page.tsx`** — extract form labels, placeholders, button text, error messages, links
20. **`frontend/app/[locale]/(auth)/signup/page.tsx`** — extract form labels, placeholders, button text, error messages, links
21. **`frontend/components/nav/sidebar.tsx`** — extract "Main", "Add transaction", nav labels
22. **`frontend/components/nav/bottom-nav.tsx`** — extract aria-labels
23. **`frontend/app/[locale]/layout.tsx`** — translate metadata (title, description)
24. **`frontend/components/layout/app-layout.tsx`** — check for any strings

### Phase 4: Language switcher & formatting

25. **Create `frontend/components/language-switcher.tsx`** — dropdown or button group to switch between EN/FR. Uses `useRouter` + `usePathname` from `next-intl/navigation` to switch locale while preserving path.
26. **Add switcher to app layout** — place in sidebar (desktop) or settings area
27. **Date formatting** — replace hardcoded `fr-FR` in `toLocaleString`/`toLocaleDateString` calls with active locale. Replace hardcoded `fr` in `date-fns` format/parse calls with dynamic import.
28. **Currency formatting** — `formatCurrency` and `fmt`/`fmtFull` helpers should use active locale instead of hardcoded `"fr-FR"`.

### Phase 5: Testing & validation

29. Run `just check` — lint, typecheck, tests must pass
30. Manual verification:
    - `/` redirects to `/en`
    - `/fr` loads French copy
    - `/en/dashboard` shows English, `/fr/dashboard` shows French
    - Language switcher works and preserves current path
    - All pages have correct `html lang` attribute
    - Date formatting respects locale (e.g., "30 avr. 2026" vs "Apr 30, 2026")
    - Currency formatting respects locale
    - No hardcoded strings remain (grep for common French/English phrases)

## Translation key naming convention

Use dot-namespaced keys organized by page/feature:

```json
{
  "nav": {
    "dashboard": "Transactions",
    "goals": "Objectifs",
    "assets": "Patrimoine",
    "addTransaction": "Add transaction"
  },
  "dashboard": {
    "title": "Transactions",
    "thisMonth": "{count} this month",
    "uncategorized": "{count} uncategorized",
    "add": "Add",
    "filters": {
      "all": "All",
      "expense": "Expenses",
      "income": "Income"
    },
    "empty": "No transactions this month",
    "loading": "Loading…"
  },
  ...
}
```

Shared/common strings go under `common.*` (e.g., `common.cancel`, `common.save`, `common.loading`).

## Critères de validation
- [ ] `next-intl` installed and configured with `en` (default) and `fr` locales
- [ ] All routes prefixed with `/{locale}/` and middleware redirects `/` → `/en`
- [ ] `messages/en.json` and `messages/fr.json` contain all extracted strings
- [ ] No hardcoded UI strings remain in any component (verified by grep)
- [ ] Language switcher component works and preserves pathname across locale changes
- [ ] `html lang` attribute matches active locale
- [ ] Date formatting uses active locale (`en-US` or `fr-FR`)
- [ ] Currency formatting uses active locale
- [ ] Metadata (page titles, descriptions) is translated
- [ ] `just check` passes (lint + typecheck + tests)
