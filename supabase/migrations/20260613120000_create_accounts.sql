-- Accounts: first-class cash-flow containers. Every transaction belongs to one.
-- Part of 00058-comptes-multiples (T1 socle). Balance is CALCULATED, never stored:
--   initial_balance + Σ income − Σ expense ± transfers.
-- Visibility/owner_id are seeded now (default 'shared') but only enforced in T4,
-- in application code (the backend uses the service_role key, which bypasses RLS).
create table accounts (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  owner_id        uuid references users(id) on delete set null,  -- null = household account
  name            text not null,
  type            text not null default 'checking' check (type in ('checking', 'savings', 'cash')),
  visibility      text not null default 'shared' check (visibility in ('shared', 'private')),
  initial_balance numeric(14,2) not null default 0,
  archived_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index accounts_household_idx on accounts (household_id);

alter table accounts enable row level security;

create policy "accounts_select" on accounts for select using (
  household_id = current_household_id()
);

create policy "accounts_insert" on accounts for insert with check (
  household_id = current_household_id()
);

create policy "accounts_update" on accounts for update using (
  household_id = current_household_id()
);

create policy "accounts_delete" on accounts for delete using (
  household_id = current_household_id()
);

-- Link transactions to an account. Nullable during backfill, NOT NULL at the end.
-- on delete restrict: an account with transactions cannot be hard-deleted (archive in T2).
alter table transactions
  add column account_id uuid references accounts(id) on delete restrict;

-- Backfill: one "Compte principal" per household (solo or shared, identical), then
-- attach all of that household's existing transactions to it.
insert into accounts (household_id, name, type, visibility)
select id, 'Compte principal', 'checking', 'shared' from households;

update transactions t
set account_id = a.id
from accounts a
where a.household_id = t.household_id;

-- No dette: every transaction now has an account.
alter table transactions
  alter column account_id set not null;

-- Households created AFTER this migration (via the signup trigger) must also get a
-- "Compte principal", else their first transaction violates account_id NOT NULL.
-- Mirrors handle_new_user from 20260412212115, with the account insert appended.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into households (name, created_by)
  values (
    coalesce(new.raw_user_meta_data->>'display_name', 'My Household'),
    new.id
  )
  returning id into new_household_id;

  insert into users (id, household_id, display_name)
  values (
    new.id,
    new_household_id,
    new.raw_user_meta_data->>'display_name'
  );

  insert into accounts (household_id, name, type, visibility)
  values (new_household_id, 'Compte principal', 'checking', 'shared');

  return new;
end;
$$;
