# Mode foyer partagé — compte commun à deux

**Source:** [Linear PER-10](https://linear.app/personal-max-and-maria/issue/PER-10/mode-foyer-partage-compte-commun-a-deux)

**Priority:** High

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
2. Migrate all data owned by the invitee (accounts, and any future tables with `household_id`) to the new household
3. Delete the invitee's now-empty household
4. Mark the invitation `status = 'accepted'`

If any step fails, the whole transaction rolls back.

### RLS additions

- `household_invitations`: only the invited user (by email match) can read their own pending invite
- No changes needed to `households` or `users` RLS — they already scope by `household_id`

### Personal vs shared accounts

Accounts have `is_shared boolean not null default true`. After joining:
- Accounts Max marked as personal (`is_shared = false`) remain visible only to Max
- Shared accounts are visible to both

### Real-time

Supabase Realtime can be enabled on `transactions` (and optionally `accounts`) for live sync between the two members. Not required for MVP of this feature — can be added as a follow-up.
