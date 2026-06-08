---
feature: 00016-transactions-recurrentes
---

# Recurring Transactions — UI (toggle in add-transaction modal)

Frontend slice of epic [00016](../features/00016-transactions-recurrentes.md). Backend (API + lazy generation) shipped in [00051](../done/00051-recurring-transactions-api.md).

## Objectif

Permettre de créer une transaction récurrente **depuis la modale d'ajout de transaction existante**, via un segment **« Ponctuel · Hebdo · Mensuel »** (Répéter). Pas de page dédiée.

## Décisions UX (validées)

- L'utilisateur pense « transaction normale + répétition » → le point d'entrée est le **flux d'ajout normal**, pas une page séparée.
- Segment **« Répéter »** dans `transaction-form.tsx` : `Ponctuel · Hebdo · Mensuel` (un seul contrôle, pas de toggle ni de reveal) :
  - `Ponctuel` (défaut) → comportement actuel (`createTransaction`)
  - `Hebdo`/`Mensuel` → récurrente ; le champ date existant sert de **date de début**, et autorise alors les dates futures
  - submit → `createRecurringTransaction` (API 00051)
- **Pas de date de fin** dans la modale : la quasi-totalité des récurrences sont sans fin connue ; on « termine » en pausant/supprimant la règle (ticket futur). Le backend garde le support `end_date`, réactivable plus tard.
- `anchor_day` non exposé : déduit de `start_date` côté serveur.
- **Gestion/édition des règles = ticket futur** (lecture, pause, suppression). Le client API (`getRecurringTransactions`, `update`, `delete`) est déjà en place et testé pour ce futur ticket.
- La page `/recurring` autonome (1ère version) a été **retirée** au profit de cette approche.

## Réalisé

- `transaction-form.tsx` : segment « Répéter » (Ponctuel/Hebdo/Mensuel), submit branché, calendrier autorisant le futur en mode récurrent, label de bouton adapté.
- `lib/api.ts` + `types/api.ts` : `Frequency`, `RecurringTransaction*`, et les 4 fonctions client.
- i18n : clés récurrentes ajoutées sous `transactions.form` (FR + EN).
- Tests : 8 tests client (`__tests__/api.test.ts`) couvrant les 4 fonctions.

## Critères de validation

- [x] La modale d'ajout a un segment « Répéter » (Ponctuel/Hebdo/Mensuel)
- [x] Cochée → la transaction est créée comme règle récurrente (`createRecurringTransaction`)
- [x] Décochée → comportement inchangé (`createTransaction`)
- [x] i18n FR + EN, aucune clé brute
- [x] `just check` vert (28 tests front, 57 back)
- [x] Pas de page/route/nav dédiée résiduelle
