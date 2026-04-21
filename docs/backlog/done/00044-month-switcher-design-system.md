---
feature: design-system
---

# Month Switcher Design System Component

## Objectif
Extraire le sélecteur de mois dupliqué dans un composant réutilisable du design system (utilisé sur goals et transactions), et partager les helpers de date.

> **Note** : la page `/budget` est exclue du périmètre — elle est en voie de suppression, donc pas de migration ni de polish visuel dessus.

## Contexte
Aujourd'hui la navigation mensuelle (◀ Mois ▶, désactivée sur le mois courant) est réimplémentée inline dans :
- `frontend/app/goals/goals-client.tsx:12-50` — variante desktop avec compteur de jour (« Jour 12 · 18 restants ») et bouton « Ce mois »
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
- `transaction-list.tsx` → utiliser `<MonthSwitcher size="compact" />`
- ~~`budget-client.tsx`~~ — exclu (page en voie de suppression)

### Design system page
- Ajouter une section « Month Switcher » dans `frontend/app/design-system/page.tsx` avec les deux variantes (compact + enriched)

## Critères de validation
- [ ] Composant `MonthSwitcher` créé et exporté
- [ ] Helpers centralisés dans `lib/month.ts`, plus aucune duplication de `formatMonth`/`prevMonth`/`nextMonth` dans goals et transactions
- [ ] Pages goals et transactions utilisent le nouveau composant
- [ ] Comportement identique au précédent sur mobile et desktop (vérifier via agent-browser)
- [ ] Screenshots attachés au ticket pour les deux pages (mobile + desktop)
- [ ] Section ajoutée dans la design-system page
- [ ] `just check` passe

## Implementation Plan

### Décisions clés

1. **Budget exclu du périmètre** — page en voie de suppression, pas de migration ni de refresh visuel.
2. **Layout responsive interne au composant** : en `size="default"`, arrows aux extrémités sur mobile, arrows groupées à gauche sur desktop (le seul consommateur est goals avec day counter + today + endSlot, donc pas de cas « arrows aux extrémités sur desktop » en pratique — mais on garde le fallback pour rester générique).
3. **`size="compact"` reste minimal** : `variant="ghost"`, pas de conteneur, largeur fixe de label `min-w-[100px]` — pour rester inline dans un header existant (transactions).
4. Helpers restent **vanille Date** (pas `date-fns`) pour minimiser le diff et rester cohérents avec l'existant.

### Phase 1 — Helpers partagés (`frontend/lib/month.ts`)

Exports :
- `type Month = string` (format `YYYY-MM`)
- `currentMonth(): Month`
- `prevMonth(m: Month): Month`
- `nextMonth(m: Month): Month`
- `formatMonth(m: Month, locale?: string): string` — défaut `"fr-FR"`, retourne « avril 2026 »
- `getMonthDays(m: Month): { currentDay: number; totalDays: number; daysLeft: number }`
- `isCurrentMonth(m: Month): boolean` (utilitaire déjà inliné dans 3 sites)

Tests (`frontend/lib/month.test.ts` via vitest) :
- `prevMonth("2026-01")` → `"2025-12"` (passage d'année)
- `nextMonth("2025-12")` → `"2026-01"`
- `formatMonth("2026-04")` → `"avril 2026"`
- `getMonthDays` pour mois courant → `currentDay` = jour réel, `daysLeft` = reste
- `getMonthDays` pour mois passé → `currentDay === totalDays`, `daysLeft === 0`
- `getMonthDays` pour février 2024 (bissextile) → `totalDays === 29`
- `isCurrentMonth(currentMonth())` → `true`

### Phase 2 — Composant `MonthSwitcher` (`frontend/components/ui/month-switcher.tsx`)

Signature :
```ts
interface MonthSwitcherProps {
  value: string;                    // YYYY-MM
  onChange: (month: string) => void;
  disableFutureMonths?: boolean;    // défaut true
  showDayCounter?: boolean;         // défaut false (goals)
  showTodayButton?: boolean;        // défaut false (goals)
  endSlot?: React.ReactNode;        // goals → <Button>Ajouter</Button>
  size?: "default" | "compact";     // défaut "default"
  className?: string;
}
```

Rendu :
- **`size="compact"`** : flex row, `variant="ghost" size="icon"`, pas de conteneur, label `min-w-[100px] text-center text-sm font-medium capitalize`. Ignore `showDayCounter`/`showTodayButton`/`endSlot`.
- **`size="default"`** :
  - Conteneur `rounded-2xl bg-card p-2 ring-1 ring-border/50 lg:p-3`
  - **Mobile** : prev (gauche) · label centré (+ day counter si activé) · next (droite). `endSlot` et `showTodayButton` cachés en mobile (comportement actuel de goals).
  - **Desktop** : arrows groupées à gauche (`variant="outline"` rond) · label + day counter · (ml-auto) `showTodayButton` + `endSlot`.
  - Boutons arrows toujours `rounded-full h-9 w-9 border-border bg-background`.

### Phase 3 — Migration des sites consommateurs

1. **`goals-client.tsx`** : supprimer helpers + header du mois selector, remplacer par `<MonthSwitcher value={month} onChange={setMonth} showDayCounter showTodayButton endSlot={<Button size="sm" className="gap-1.5 rounded-full"><Plus className="h-4 w-4" />Ajouter</Button>} />`. Garder le `<Button size="icon">` mobile d'ajout dans le header (existe en dehors du selector).
2. **`transaction-list.tsx`** : supprimer helpers `formatMonth`/`currentMonth`/`prevMonth`/`nextMonth` (garder `formatDateLabel`, `formatDateShort`, `groupByDate` qui sont spécifiques), remplacer le bloc de nav inline par `<MonthSwitcher value={month} onChange={setMonth} size="compact" />`.
3. ~~`budget-client.tsx`~~ — exclu (page en voie de suppression).

### Phase 4 — Design system page

Ajouter `SectionMonthSwitcher` dans `frontend/app/design-system/page.tsx` avec deux `Card` :
- « Compact · inline » (transactions)
- « Default · enriched » (goals avec day counter + today + endSlot)

Ajouter l'appel dans `<main>` entre deux sections pertinentes (après `SectionInputs` ou près des nav controls).

### Phase 5 — Vérification

1. `just check` (lint + typecheck + vitest)
2. Agent-browser :
   - `/goals` mobile (375px) + desktop (1280px) — arrows, day counter, today button, add button, états passé/courant
   - `/transactions` mobile + desktop — nav compact, filtres toujours fonctionnels
   - `/design-system` — nouvelle section
3. Capture d'écran des 4 vues principales (2 pages × 2 viewports) + design system, attacher au ticket

### Risques

- Le bouton « Ajouter » mobile de goals est **hors** du selector (dans le header) — ne pas le confondre avec `endSlot` (desktop-only dans goals).
- `transactions` a `min-w-[100px]` sur le label pour éviter le « dance » de largeur quand on change de mois ; le préserver en `size="compact"`.
