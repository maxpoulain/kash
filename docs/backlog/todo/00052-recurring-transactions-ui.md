---
feature: 00016-transactions-recurrentes
---

# Recurring Transactions — UI

Frontend slice of epic [00016](../features/00016-transactions-recurrentes.md). Backend (API + lazy generation) shipped in [00051](../done/00051-recurring-transactions-api.md).

## Objectif

Une page **Récurrent** où l'utilisateur peut **créer, lister, modifier et supprimer** ses règles de transactions récurrentes (loyer, abonnements, salaire). Les occurrences se génèrent ensuite automatiquement (déjà fait côté backend, lazy sur `GET /transactions`).

## Décisions UX

- Nouvelle route `/recurring` (page protégée, comme les autres).
- **Entrée nav** : ajoutée à la sidebar desktop **et** au bottom-nav mobile (icône `Repeat`). Le bottom-nav passe de 2+FAB+1 à **2+FAB+2** → plus symétrique.
- Pattern **liste + sheet (mobile) / dialog (desktop)** calqué sur la feature **assets** (`assets-client.tsx`, `account-sheet.tsx`, `account-form.tsx`).
- Formulaire : montant, type (dépense/revenu), catégorie, fréquence (hebdo/mensuel), date de début, fin optionnelle, note. Sur édition : toggle `active` (pause) + suppression.
- `anchor_day` non exposé directement : déduit de `start_date` côté API (déjà géré). On expose juste `start_date` + `frequency`.

## Implementation Plan

### Phase 1 — Types + client API
- [ ] `types/api.ts` : `Frequency`, `RecurringTransaction`, `RecurringTransactionCreate`, `RecurringTransactionUpdate`
- [ ] `lib/api.ts` : `getRecurringTransactions`, `createRecurringTransaction`, `updateRecurringTransaction` (PATCH), `deleteRecurringTransaction`

### Phase 2 — Page + liste
- [ ] `app/[locale]/recurring/page.tsx` (auth guard → `/login`)
- [ ] `app/[locale]/recurring/recurring-client.tsx` : liste responsive (cards mobile / table desktop), résumé (total mensualisé), empty state, bouton add

### Phase 3 — Formulaire create/edit
- [ ] `components/recurring/recurring-sheet.tsx` (sheet mobile / dialog desktop)
- [ ] `components/recurring/recurring-form.tsx` (react-hook-form ; charge les catégories via `getCategories`)

### Phase 4 — Nav + i18n
- [ ] `components/nav/sidebar.tsx` + `components/nav/bottom-nav.tsx` : entrée `Récurrent` (icône `Repeat`)
- [ ] `messages/en.json` + `messages/fr.json` : `nav.recurring` + namespace `recurring.*`

### Phase 5 — Tests
- [ ] `__tests__/api.test.ts` : couvre les 4 fonctions client (URL, méthode, payload, erreurs)
- [ ] `just check` passe (lint + typecheck + tests front & back)

## Critères de validation

- [ ] `/recurring` liste les règles du household, accessible depuis la nav (desktop + mobile)
- [ ] Créer une règle (montant, type, catégorie, fréquence, date de début) la fait apparaître dans la liste
- [ ] Modifier / mettre en pause (`active`) / supprimer une règle fonctionne
- [ ] Mensualisation affichée (somme normalisée des règles actives)
- [ ] i18n FR + EN complètes, aucune clé brute
- [ ] `just check` vert
