# Add Transaction Modal Redesign

## Objectif

Redesign the add transaction modal (desktop dialog + mobile bottom sheet) to exactly match the new design system mockups in `docs/Design-System-reference/mockups/`.

Skipped for now (separate tasks): Merchant/source field, Payment method selector, Jar selection (From jar / To jar).

## Périmètre

Files to modify:
- `frontend/components/transactions/transaction-form.tsx`
- `frontend/components/transactions/transaction-sheet.tsx`

Design references:
- `docs/Design-System-reference/mockups/desktop-add-modal.html`
- `docs/Design-System-reference/mockups/mobile-add-modal.html`
- `docs/Design-System-reference/components/add-txn-modal.jsx`

### Desktop (dialog, ≥768px)

- Header: PiggyMark icon (36×36 dark rounded square) + "New transaction" title + `⌘+N · Quick add` mono subtitle + ✕ close button
- 2-column layout:
  - Left column (border-right): type toggle, large amount input, date field, note textarea
  - Right column (bg-sunk): piggy preview card, category grid (4 columns, icon + label), submit/cancel buttons area
- Amount input: large display font (38px), `$` prefix, `USD` suffix, quick-add chip buttons ($5 $10 $20 $50 $100)
- Type toggle: Expense (dark bg / white text) | Income (accent bg / white text)
- Category: 4-column grid of icon+label buttons (not a dropdown), active = dark bg
- Piggy preview card: gradient card showing `+$amount` or `−$amount` with PiggyMark icon and decorative coin bars
- Footer (border-top, bg-elev): keyboard hints (`↵ to save`, `esc to cancel`) on left + Cancel + submit button on right
- Submit button: `Add expense · $amount` or `Add income · $amount`, color matches type

### Mobile (bottom sheet, <768px)

- Sheet height: 86% of screen, rounded top corners (30px), grabber bar at top
- Header: "Add transaction" display font + ✕ close button (circle)
- Type toggle: same pill style as desktop
- Amount: large centered display (64px display font) with `$` prefix, decimals in muted color, blinking cursor bar
- Piggy preview card (same as desktop, full width)
- Category: horizontal scrollable chips (icon + label, pill shape), active = pig bg + dark border, "See all →" link
- Row list for Date and Note (icon + label + value + arrow chevron, each in rounded card row)
- Submit area: Cancel button (1/3 width) + "Add expense · $amount" or "Add income · $amount" button (2/3 width), color matches type

### Shared behavior (keep as-is)

- Form validation: react-hook-form + zod (type, amount positive, category required, date YYYY-MM-DD, note max 200)
- API call: `createTransaction()` on submit
- Success: close modal + toast "Transaction enregistrée !"
- Categories loaded from `getCategories()` API, filtered by type

## Notes

- Currency: keep `€` (EUR) as currently implemented — mockup uses `$` but that's the design reference currency
- Keep French labels for form fields and validation messages
- The design tokens (`var(--ink)`, `var(--accent)`, `var(--pig)`, `var(--bg-sunk)`, etc.) are already available via the design system CSS

## Critères de validation

- [ ] Desktop modal matches the mockup: 2-column layout, piggy card, category grid, amount quick-add, footer keyboard hints
- [ ] Mobile bottom sheet matches the mockup: large amount display, piggy card, category chips, row list, submit with amount
- [ ] Type toggle colors correct: expense = dark, income = accent green
- [ ] Submit button shows the typed amount
- [ ] Category selection works (grid on desktop, chips on mobile)
- [ ] All existing form validation still passes
- [ ] `just check` passes
