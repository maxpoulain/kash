---
feature: design-system
---

# Reconcile Card Primitive With Actual Usage

## Objectif
Aligner le composant `Card` du design system sur le style réellement utilisé dans l'app, puis migrer les `<div>` bruts qui réimplémentent une carte vers la primitive.

## Contexte
Il y a une dérive de style entre la primitive et le reste :
- `frontend/components/ui/card.tsx:15` — primitive officielle : `rounded-xl ring-1 ring-foreground/10`
- Reste de l'app (goals, budget, transactions, home, design-system, empty states) — `rounded-2xl border border-border bg-card` :
  - `frontend/app/goals/goal-card.tsx:43`
  - `frontend/app/goals/empty-state.tsx:20`
  - `frontend/app/budget/budget-client.tsx:177,247`
  - `frontend/app/page.tsx:113`
  - `frontend/components/transactions/transaction-list.tsx:244,291`
  - `frontend/app/design-system/page.tsx` (plusieurs occurrences)

Résultat : la primitive n'est quasi jamais utilisée, et chaque page réinvente sa carte.

## Périmètre

### Décision de design
- Choisir la variante canonique (probablement `rounded-2xl border border-border` qui est majoritaire et correspond aux maquettes)
- Documenter la décision dans `docs/design-system.md` (créer si inexistant) ou dans un commentaire en tête de `ui/card.tsx`

### Mise à jour de la primitive
- Mettre à jour `frontend/components/ui/card.tsx` pour refléter la décision
- Conserver les sous-composants (`CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`, `CardAction`)
- Ajouter une variante `dashed` (pour les empty states) si utile

### Migration des call sites
- `frontend/app/goals/goal-card.tsx` → `<Card>` avec header/content
- `frontend/app/goals/empty-state.tsx` → `<Card variant="dashed">` ou équivalent
- `frontend/app/budget/budget-client.tsx:177,247` → `<Card>`
- `frontend/components/transactions/transaction-list.tsx:244,291` → `<Card>`
- `frontend/app/page.tsx:113` → `<Card>`
- `frontend/app/design-system/page.tsx` → utiliser la primitive pour montrer le bon exemple

### Design system page
- Mettre à jour la section « Cards » de la design-system page pour documenter les variantes disponibles

## Critères de validation
- [ ] La primitive `Card` reflète le style réellement utilisé (border vs ring, radius)
- [ ] Aucun `<div className="rounded-2xl border border-border bg-card...">` brut ne subsiste hors de `ui/card.tsx`
- [ ] Toutes les pages migrées visuellement identiques à avant (vérifier via agent-browser)
- [ ] Screenshots avant/après attachés pour les pages clés (home, budget, transactions, goals)
- [ ] Section « Cards » de la design-system page mise à jour
- [ ] `just check` passe

## Implementation Plan

### Phase 1: Update Card primitive + dashed variant

**`frontend/components/ui/card.tsx`**
- `rounded-xl` → `rounded-2xl` (base, CardHeader rounded-t, CardFooter rounded-b, image corners)
- `ring-1 ring-foreground/10` → `border border-border`
- Add `variant` prop: `"default" | "dashed"`
  - default: `border border-border bg-card` (current behavior, just with border instead of ring)
  - dashed: `border border-dashed border-border bg-card`
- Keep `size` prop and all sub-components unchanged

### Phase 2: Migrate call sites

| File | Line | Current | Migration |
|------|------|---------|-----------|
| `goals/goal-card.tsx` | 43 | `<div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">` | `<Card className="gap-3 p-4">` + `<CardContent className="p-0">` or restructure with sub-components |
| `goals/empty-state.tsx` | 20 | `<div className="flex flex-col items-center ... rounded-2xl border border-dashed border-border bg-card/50 p-8 py-12">` | `<Card variant="dashed" className="items-center bg-card/50 p-8 py-12 gap-6">` |
| `transactions/transaction-list.tsx` | 231 | `<div className="overflow-hidden rounded-2xl border border-border bg-card">` | `<Card className="gap-0 py-0">` |
| `transactions/transaction-list.tsx` | 278 | `<li className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">` | `<Card className="flex-row items-center justify-between gap-0 px-4 py-3">` as `<li>` — or keep as `<li>` with Card styles via className |
| `assets/assets-client.tsx` | 108 | `<div className="flex flex-col gap-3 rounded-2xl border border-border p-3 cursor-pointer TYPE_CARD_BG">` | `<Card className="gap-3 p-3 cursor-pointer TYPE_CARD_BG bg-none">` |
| `assets/assets-client.tsx` | 247 | `<div className="relative overflow-hidden rounded-2xl border border-border p-5" gradient>` | `<Card className="relative p-5" style={gradient}>` |
| `assets/assets-client.tsx` | 255 | `<div className="rounded-2xl border border-border bg-card p-5">` | `<Card className="p-5">` |
| `assets/assets-client.tsx` | 294 | `<div className="overflow-hidden rounded-2xl border border-border bg-card">` | `<Card className="gap-0 py-0">` |
| `page.tsx` | 113 | `<div className="flex flex-col items-center gap-8 rounded-2xl bg-card p-8 ring-1 ring-border md:flex-row md:p-12">` | `<Card className="flex-row items-center gap-8 p-8 md:p-12">` |
| `design-system/page.tsx` | local Card helper + raw divs | Replace local `Card` helper with imported `<Card>`, migrate raw card divs |

### Phase 3: Design system page Cards section

- Document `variant="default"` and `variant="dashed"`
- Show the primitive in use (set the example)
- Remove local `Card` helper function

### Phase 4: Visual verification + just check

- Run `just check`
- Take before/after screenshots via agent-browser

### Out of scope
- `budget/` directory (already deleted)
- Design-system page gradient cards (line 207, 359) — these use inline gradient backgrounds and aren't standard cards
