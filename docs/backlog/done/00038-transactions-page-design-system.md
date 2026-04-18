---
feature: design-system
---

# Update Transactions Page to Use Design System Components

## Objectif
Refactor the transactions page (transaction-list.tsx and related components) to fully adopt the Kash Design System components, tokens, and patterns established in the design-system-ideas folder.

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

## Critères de validation
- [ ] Transactions page visually matches the design system mockups
- [ ] All components use design system tokens (CSS variables)
- [ ] Buttons follow the 4 variants (primary, piggy, outline, ghost)
- [ ] Cards use consistent 16–24px radius and single-border styling
- [ ] Empty state shows piggy companion mascot
- [ ] Typography uses font-display for headings, font-mono for data
- [ ] Month selector uses design system icon buttons
- [ ] Tests écrits et passants (`just check` passe)
