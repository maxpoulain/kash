-- Transfers between accounts (00058 T3). Polymorphic legs: each side is either a
-- cash-flow checking account ('courant' → accounts) or a savings/wealth account
-- ('epargne' → savings_accounts). Symmetric model (from/to), no privileged direction.
--
-- Balance effect (calculated, never stored):
--   courant leg → debits (from) / credits (to) the computed account balance
--   epargne leg → recorded for history/flow only, NO effect on the asset value
--                 (which stays manual/snapshot — avoids double-counting).
--
-- Constraint: at least one leg must be a 'courant' → forbids epargne→epargne
-- (pure net-worth reshuffle, handled by snapshots, not transfers).
create table transfers (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  from_kind     text not null check (from_kind in ('courant', 'epargne')),
  from_id       uuid not null,
  to_kind       text not null check (to_kind in ('courant', 'epargne')),
  to_id         uuid not null,
  amount        numeric(12,2) not null check (amount > 0),
  date          date not null,
  note          text,
  created_by    uuid not null references users(id),
  created_at    timestamptz default now(),
  check (from_kind = 'courant' or to_kind = 'courant')
);

create index transfers_household_idx on transfers (household_id);

-- RLS for shape consistency (bypassed by the service_role key; scope enforced in
-- application code, like every other table).
alter table transfers enable row level security;

create policy "transfers_select" on transfers for select using (
  household_id = current_household_id()
);

create policy "transfers_insert" on transfers for insert with check (
  household_id = current_household_id()
);

create policy "transfers_delete" on transfers for delete using (
  household_id = current_household_id()
);
