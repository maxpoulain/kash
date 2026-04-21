create table savings_accounts (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by   uuid not null references users(id),
  name         text not null,
  type         text not null,
  balance      numeric(14,2) not null default 0,
  institution  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table savings_accounts enable row level security;

create policy "savings_accounts_select" on savings_accounts for select using (
  household_id = current_household_id()
);

create policy "savings_accounts_insert" on savings_accounts for insert with check (
  household_id = current_household_id()
);

create policy "savings_accounts_update" on savings_accounts for update using (
  household_id = current_household_id()
);

create policy "savings_accounts_delete" on savings_accounts for delete using (
  household_id = current_household_id()
);
