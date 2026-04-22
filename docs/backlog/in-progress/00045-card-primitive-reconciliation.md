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
