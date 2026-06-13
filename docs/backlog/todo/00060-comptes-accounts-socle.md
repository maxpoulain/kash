# T1 — `accounts` socle (données)

**Épopée :** `00058-comptes-multiples` · **Tâche :** T1 / 5 · **Priority:** High

Première brique de [comptes multiples](../features/00058-comptes-multiples.md). **Invisible pour l'utilisateur** : aucune nouvelle UI. Son seul rôle est d'isoler la migration de données risquée (rattachement de toutes les txns + bascule NOT NULL) avant d'ajouter API et UI en T2.

## Scope

- **Migration schéma** : table `accounts` avec `visibility` (default `shared`), `owner_id` nullable, `initial_balance`, `archived_at`, `type`. RLS de forme (cohérence, même si bypassée par le `service_role`).
- **`transactions.account_id`** ajouté **nullable**.
- **Migration de données** : pour chaque `household`, créer un compte `"Compte principal"` (`visibility='shared'`, `owner_id=null`) et rattacher **toutes** ses txns existantes via `account_id`. Marche identiquement pour solo ou foyer à 2.
- **Bascule `account_id` → NOT NULL** une fois la migration faite (pas de dette).
- **Helper `visible_account_ids(user)`** en **no-op** : retourne les comptes du foyer (tous `shared` → équivaut au scope foyer actuel). Point d'extension unique pour la visibilité privée (T4).
- **POST `/transactions`** : `account_id` par défaut = compte principal du foyer si omis. Pas de sélecteur UI (c'est T2).

## Hors scope (→ T2+)

- CRUD `/accounts`, solde calculé exposé, onglet « Comptes », sélecteur dans la modale → **T2**
- Transferts → **T3** · Visibilité privée (bascule du helper) → **T4**

## Critères de validation

- [ ] Migration : chaque foyer a exactement 1 compte « Compte principal », toutes ses txns y sont rattachées
- [ ] `account_id` est NOT NULL après migration
- [ ] Un POST `/transactions` sans `account_id` rattache la txn au compte principal du foyer
- [ ] Le foyer B ne voit pas le compte du foyer A
- [ ] Comportement de lecture (`GET /transactions`, `summary`) **identique** à avant (helper no-op)
- [ ] Tests écrits dans le même ticket (endpoint POST + migration)

## Plan d'implémentation

1. **Migration `accounts`** — `supabase/migrations/<ts>_create_accounts.sql` : table + index `household_id` + policies de forme.
2. **Migration `transactions.account_id` (nullable)** + back-fill — créer le « Compte principal » par foyer (`insert … select` sur `households`), `update transactions set account_id = …`.
3. **Bascule NOT NULL** — dans la même migration, après le back-fill (`alter table … set not null`).
4. **Helper** `visible_account_ids(user_id)` dans `core/` (ou `routers/transactions.py`) : `select id from accounts where household_id = current(user)`. No-op aujourd'hui.
5. **POST `/transactions`** — défaut `account_id` = compte principal si absent ; persister `account_id`.
6. **Schéma** `TransactionOut` (+ `account_id`) et tests.

## Assomptions à confirmer

- Le « Compte principal » créé par migration a `initial_balance = 0` : son solde calculé = Σ txns historiques (≠ solde bancaire réel tant que tout l'historique n'est pas saisi). L'utilisateur réconciliera via `initial_balance` en T2. **Acceptable pour T1.**
- `type` du compte principal = `checking`.

## Dépendances

Aucune en amont. Débloque **T2** (CRUD + onglet) et, plus loin, `00059` (import, qui a besoin d'un compte cible).
