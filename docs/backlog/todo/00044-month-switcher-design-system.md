---
feature: design-system
---

# Month Switcher Design System Component

## Objectif
Extraire le sélecteur de mois dupliqué en trois endroits (budget, transactions, goals) dans un composant réutilisable du design system, et partager les helpers de date.

## Contexte
Aujourd'hui la navigation mensuelle (◀ Mois ▶, désactivée sur le mois courant) est réimplémentée inline dans :
- `frontend/app/goals/goals-client.tsx:12-50` — variante desktop avec compteur de jour (« Jour 12 · 18 restants ») et bouton « Ce mois »
- `frontend/app/budget/budget-client.tsx:13-32`
- `frontend/components/transactions/transaction-list.tsx:12-34`

Chaque site redéfinit `formatMonth`, `prevMonth`, `nextMonth`, `currentMonth`. Le layout mobile/desktop diffère mais le cœur est identique.

## Périmètre

### Helpers partagés
- Créer `frontend/lib/month.ts` avec : `currentMonth()`, `prevMonth(m)`, `nextMonth(m)`, `formatMonth(m, locale?)`, `getMonthDays(m)` (retourne `{ currentDay, totalDays, daysLeft }`)
- Supprimer les duplicats dans les trois fichiers

### Composant
- Créer `frontend/components/ui/month-switcher.tsx`
- Props :
  - `value: string` (YYYY-MM)
  - `onChange: (month: string) => void`
  - `disableFutureMonths?: boolean` (défaut `true`)
  - `showDayCounter?: boolean` (variante goals)
  - `showTodayButton?: boolean` (bouton « Ce mois »)
  - `endSlot?: React.ReactNode` (pour le bouton « Ajouter » côté goals)
  - `size?: "default" | "compact"` (compact = variante transactions inline)
- Gérer le layout responsive (flèches groupées à gauche en desktop, flèches aux extrémités en mobile) en interne

### Migration
- `goals-client.tsx` → utiliser `<MonthSwitcher showDayCounter showTodayButton endSlot={<Button>Ajouter</Button>} />`
- `budget-client.tsx` → utiliser `<MonthSwitcher />`
- `transaction-list.tsx` → utiliser `<MonthSwitcher size="compact" />`

### Design system page
- Ajouter une section « Month Switcher » dans `frontend/app/design-system/page.tsx` avec les trois variantes

## Critères de validation
- [ ] Composant `MonthSwitcher` créé et exporté
- [ ] Helpers centralisés dans `lib/month.ts`, plus aucune duplication de `formatMonth`/`prevMonth`/`nextMonth`
- [ ] Trois pages (goals, budget, transactions) utilisent le nouveau composant
- [ ] Comportement identique au précédent sur mobile et desktop (vérifier via agent-browser)
- [ ] Screenshots attachés au ticket pour les trois pages (mobile + desktop)
- [ ] Section ajoutée dans la design-system page
- [ ] `just check` passe
