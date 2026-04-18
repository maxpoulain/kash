---
feature: design-system
---

# Update Transactions Page to Use Design System Components

## Mockups

- **Desktop**: `docs/mockups/desktop-transactions.html` — Ledger with filters
- **Mobile Detail**: `docs/mockups/mobile-txn-detail.html` — Transaction detail + categorize

## Objectif
Refactor the transactions page (transaction-list.tsx and related components) to fully adopt the Kash Design System components, tokens, and patterns established in the design-system-ideas folder.

## Implementation Plan

### Phase 1: Update transaction-list.tsx
1. **Month Navigation**: Replace ghost buttons with icon buttons (square variant, size "icon")
2. **Metric Cards**: Use Card component with proper design system structure
3. **Transaction Items**: Update list items to match design system card/list patterns
4. **Empty State**: Add Piggy companion mascot with sleep mood
5. **Typography**: Ensure all labels use font-mono uppercase tracking, amounts use font-mono tabular

### Phase 2: Verify transaction-form.tsx
- Already uses design system components (Card, Button, Input, Select)
- Type toggle uses design system colors (warning for expense, accent for income)
- Verify no changes needed

### Phase 3: Verify transaction-sheet.tsx
- Already uses Sheet component with proper styling
- Verify no changes needed

## Périmètre
- Update `frontend/components/transactions/transaction-list.tsx`
- Update `frontend/components/transactions/transaction-form.tsx` (if needed)
- Update `frontend/components/transactions/transaction-sheet.tsx` (if needed)
- Apply design system tokens (colors, typography, spacing)
- Use design system components:
  - Cards (metric cards, list cards)
  - Buttons (primary ink, piggy variant for money actions)
  - Chips/badges (for category tags, amount displays)
  - Empty states (piggy companion)
  - Navigation patterns

## Specific Changes
1. **Cards**: Use proper card templates (balance hero, metric, list) with correct radius (16–24px), borders, and elevation
2. **Buttons**: Replace generic buttons with design system variants (primary ink, piggy for savings actions)
3. **Typography**: Apply font-display for headings, font-mono for data/labels
4. **Category icons**: Use consistent icon styling from design system
5. **Empty state**: Replace basic empty text with piggy companion illustration
6. **Month navigation**: Use icon buttons (square variant) from design system
7. **Amount display**: Use mono font with proper currency formatting

## Implementation Changes

### Updated `transaction-list.tsx`

1. **Month Navigation**
   - Icon buttons with `rounded-[10px]` square radius per design spec
   - `font-display` with `tracking-tight` for month heading
   - Consistent hover states with `hover:bg-muted`

2. **Metric Cards**
   - `rounded-2xl` border radius per design system
   - Labels use `font-mono text-[10px] uppercase tracking-[0.15em]`
   - Values use `font-display text-2xl` with `tracking-tight`
   - Proper semantic colors: `text-warning` for expenses, `text-success` for income

3. **Transaction List Items**
   - Category icons in `rounded-[10px]` containers with tonal backgrounds
   - Expense icons: `bg-pig/15 text-pig-deep`
   - Income icons: `bg-accent-soft text-accent`
   - Amounts use `font-mono tabular-nums tracking-tight`
   - Date labels use `font-mono uppercase tracking-[0.12em]`

4. **Empty State**
   - Dashed border container (`border-dashed border-border`)
   - Piggy mascot in muted rounded container (`bg-muted`)
   - `font-display` heading with `tracking-tight`
   - Max-width constraint for readability

5. **Loading State**
   - Added proper loading spinner in card container
   - Consistent with design system card patterns

## Screenshots

E2E testing screenshots captured with agent-browser (viewport: 390x844 mobile):

- `kash-dashboard-transactions.png` - Dashboard with month navigation and metric cards
- `kash-empty-state.png` - Empty state with Piggy companion mascot (sleep mood)
- `kash-final-dashboard.png` - Final dashboard view showing all design system changes

Screenshots saved in project root and demonstrate:
- Month navigation with icon buttons (square outline variant, rounded-[10px])
- "Avril 2026" heading using font-display
- Metric cards with rounded-2xl borders
- Empty state with Piggy mascot in muted background
- Typography using font-mono for labels with uppercase tracking

## Critères de validation
- [x] Transactions page visually matches the design system mockups
- [x] All components use design system tokens (CSS variables)
- [x] Buttons follow the 4 variants (primary, piggy, outline, ghost)
- [x] Cards use consistent 16–24px radius and single-border styling
- [x] Empty state shows piggy companion mascot
- [x] Typography uses font-display for headings, font-mono for data
- [x] Month selector uses design system icon buttons
- [x] Tests écrits et passants (`just check` passe)
