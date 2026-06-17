---
related: 00058-comptes-multiples
---

# Éditer / supprimer une transaction (et transferts)

## Objectif

Permettre de **modifier** ou **supprimer** une entrée de la liste depuis l'UI, de
façon **unifiée** pour les **transactions** (dépense/revenu) **et les transferts**.
Aujourd'hui on ne peut que créer ; aucune action d'édition/suppression n'existe
côté liste.

> Contexte : on a volontairement retiré la suppression de transfert ajoutée en
> T3 (00062) pour la traiter ici de façon cohérente avec les transactions.

## Périmètre

**Frontend (le gros du travail)**
- Sur chaque ligne de la liste (transaction **et** transfert) : action éditer +
  supprimer (clic sur la ligne ou menu/actions).
- **Édition transaction** : montant, type, catégorie, compte, date, note
  (réutilise la modale d'ajout en mode édition).
- **Suppression** : confirmation (composant `Button` DS, façon popover/dialog) →
  recalcul des soldes.
- **Transfert** : suppression (et édition optionnelle). Mêmes affordances que les
  transactions.

**Backend (vérifier l'existant)**
- `PUT/DELETE /api/transactions/{id}` existent déjà (00010).
- `DELETE /api/transfers/{id}` existe déjà (00062). Édition transfert =
  `PATCH`/`PUT` à ajouter si on veut l'édition.

## Critères de validation

- [x] Éditer une transaction met à jour montant/catégorie/compte/date/note dans la liste
- [x] Supprimer une transaction la retire et recalcule le solde du compte concerné
- [x] Supprimer un transfert le retire et recalcule les soldes des comptes courants
- [x] Confirmation avant toute suppression (popover + Button DS, étape inline)
- [x] Affordances cohérentes entre transactions et transferts (menu ⋮ partagé)
- [x] Foyer B ne peut éditer/supprimer ni les transactions ni les transferts du foyer A
      (403 backend, testé sur transaction et transfert)
- [x] Tests écrits et passants (`just check` passe : 105 backend, 56 frontend)

## Décisions

- **Édition transfert : complète** → ajouter `PATCH /api/transfers/{id}` backend +
  réutiliser la modale en mode édition.
- **Affordance : menu d'actions (⋮) par ligne** avec Éditer / Supprimer (explicite,
  pas de clic accidentel), cohérent transactions et transferts.

## Implementation Plan

### État de l'existant
- `PUT /transactions/{id}` ✅ (mais `TransactionUpdate` sans `account_id`)
- `DELETE /transactions/{id}` ✅ (mais `deleteTransaction` absent de `lib/api.ts`)
- `DELETE /transfers/{id}` ✅
- Pas de `PATCH /transfers/{id}`, pas de primitive `dropdown-menu`/`alert-dialog`
  → on réutilise `Popover` + `Button` (déjà en place).

### Phase 1 — Backend
- `TransactionUpdate` : ajouter `account_id: UUID | None` ; le router valide que le
  compte appartient au foyer (cohérent avec `create`).
- `TransferUpdate` schema + `PATCH /api/transfers/{id}` : check foyer (403),
  validation des legs (404), règle « ≥1 courant » (422). Champs éditables :
  from/to (kind+id), amount, date, note.
- Tests : `test_transactions.py` (édition account, 403 cross-foyer),
  `test_transfers_api.py` (PATCH ok, 403, leg manquant, règle courant).

### Phase 2 — Frontend API + types
- `lib/api.ts` : `updateTransaction(id, payload)` (PUT), `deleteTransaction(id)`
  (DELETE), `updateTransfer(id, payload)` (PATCH).
- `types/api.ts` : `TransactionUpdate`, `TransferUpdate`.

### Phase 3 — Frontend UI
- Menu d'actions (⋮) par ligne (Popover) sur transaction **et** transfert, desktop
  + mobile.
- Mode édition dans `TransactionForm` / `TransferForm` : props `mode`/`initial`,
  préremplissage, appelle update au lieu de create.
- Confirmation de suppression (Popover + Button DS) → recharge la liste.
- i18n FR/EN pour les nouveaux libellés (Éditer, Supprimer, Confirmer…).
