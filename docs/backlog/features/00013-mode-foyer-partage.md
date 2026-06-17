# Mode foyer partagé — compte commun à deux

**Source:** [Linear PER-10](https://linear.app/personal-max-and-maria/issue/PER-10/mode-foyer-partage-compte-commun-a-deux)

**Priority:** High

> **⚠️ Plan réconcilié avec `00058` (comptes multiples).** La version initiale précédait toute
> l'épopée comptes ; les sections « Personal vs shared » et « RLS » étaient périmées. Voir la
> section **« Réconciliation avec 00058 »** plus bas. Point clé : la moitié *confidentialité* de
> cette feature **existe déjà** sous forme de `T4 — visibilité privée` (différée en attendant ce
> ticket). `00013` apporte la moitié *multi-membre* (invitation + migration).

## Description

Permettre à deux personnes (foyer) de partager un même espace Kash avec budget et épargne communs.

## Fonctionnement attendu

- Invitation d'un second membre par email
- Budget et transactions visibles et modifiables par les deux
- Indicateur de qui a saisi quelle transaction
- Mises à jour en temps réel entre les deux appareils

## Critères d'acceptance

- [ ] L'invitation fonctionne par lien email
- [ ] Les deux membres voient exactement les mêmes données
- [ ] Chaque transaction indique qui l'a créée
- [ ] Si un membre modifie, l'autre voit la mise à jour sans refresh

---

## Implementation Notes

### Prerequisite

This feature depends on `00022-setup-supabase-schema-db` (core `households` and `users` tables with RLS).

### Household model

Every user starts in a household of 1 (auto-created at signup). This feature upgrades it to a household of 2 via an invite flow. There is no multi-household support — one user, one household, always.

### New table: `household_invitations`

```sql
household_invitations (
  id:            uuid primary key default gen_random_uuid(),
  household_id:  uuid not null references households(id) on delete cascade,
  invited_by:    uuid not null references users(id),
  invited_email: text not null,
  token:         text not null unique,
  status:        text not null default 'pending', -- pending / accepted / declined / expired
  expires_at:    timestamptz not null,
  created_at:    timestamptz default now()
)
```

### Join transaction (must be atomic)

When the invitee accepts, a single DB transaction must:
1. Update `users.household_id` to the inviter's household
2. **Migrate every row carrying the invitee's `household_id`** to the new household (voir la liste à jour ci-dessous)
3. Delete the invitee's now-empty household
4. Mark the invitation `status = 'accepted'`

If any step fails, the whole transaction rolls back.

**Tables à migrer (état au 2026-06, à revérifier au moment de coder)** : `accounts`, `transactions`,
`transfers`, `savings_accounts`, `savings_snapshots`, `spending_goals`, `categories` (catégories
perso du foyer), + toute table future portant `household_id`. ⚠️ Attention aux **collisions de
contraintes** lors de la fusion (ex. unicité du nom de catégorie par foyer, `account_id` par défaut
« Compte principal » : l'invité en a déjà un → deux « Compte principal » dans le foyer fusionné).

### Real-time

Supabase Realtime can be enabled on `transactions` (and optionally `accounts`) for live sync between the two members. Not required for MVP of this feature — can be added as a follow-up.

---

## Réconciliation avec `00058` (comptes multiples)

Ce fichier précède l'épopée comptes. Corrections à intégrer :

### Confidentialité = déjà modélisée, c'est T4 de `00058`
- **Pas de colonne `is_shared`.** La table `accounts` a `visibility text ('shared' | 'private')` +
  `owner_id uuid null` (null = compte du foyer). Le doc original parlait d'un `is_shared boolean` qui
  n'existe pas.
- L'enforcement passe par le **helper applicatif central `visible_account_ids(household_id, user_id)`**
  (`backend/app/core/accounts.py`), seul point que toute lecture sensible aux comptes traverse déjà
  (summary, sankey, soldes, transferts, goals…).
- **`T4 — visibilité privée` de `00058` est la moitié confidentialité de cette feature** : il bascule
  ce helper pour exclure les comptes `private` dont `owner_id ≠ user`, et ajoute le toggle « compte
  perso (privé) » à la création. T4 a été **différé exprès** car non testable avec un foyer de 1 →
  `00013` le débloque. **Les livrer ensemble.**

### Pas de RLS sur le chemin de données
- Le backend utilise la clé **`service_role`** (`core/supabase.py`) qui **bypasse toute RLS**. Les
  policies des migrations sont du code mort sur le chemin applicatif.
- Donc : la lecture des invitations (« seul l'invité voit sa pending ») et toute confidentialité se
  font **en code applicatif** (`.eq(...)` + helper), **pas** en policy RLS. Le « RLS additions » du
  plan initial est remplacé par du scoping applicatif.

### Auteur des transactions
- `created_by` existe déjà sur `transactions`, `transfers`, `savings_accounts`, etc. Le critère
  « chaque transaction indique qui l'a créée » = surtout exposer/afficher `created_by` côté API + UI.

---

## Découpage indicatif (à affiner via `/backlog plan` le moment venu)

1. **Schéma + invite flow** : table `household_invitations`, `POST /invitations` (créer + envoi email),
   `GET /invitations` (ma pending, scopé en code par email).
2. **Acceptation atomique** : `POST /invitations/{token}/accept` → migration transactionnelle
   cross-tables + bascule `household_id` + suppression de l'ancien foyer (gérer les collisions).
3. **T4 (`00058`)** : flip de `visible_account_ids` + toggle « compte perso (privé) ». Devient
   pleinement testable avec 2 membres.
4. **Auteur des txns** : exposer/afficher `created_by` (colonne déjà là).
5. **Temps réel** (post-MVP) : Supabase Realtime sur `transactions`.
