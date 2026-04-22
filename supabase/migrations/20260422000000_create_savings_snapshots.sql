create table savings_snapshots (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references savings_accounts(id) on delete cascade,
  date         date not null,
  balance      numeric(14,2) not null,
  constraint savings_snapshots_account_date_unique unique (account_id, date)
);

create index savings_snapshots_account_date_idx on savings_snapshots (account_id, date);

alter table savings_snapshots enable row level security;

create policy "savings_snapshots_select" on savings_snapshots for select using (
  account_id in (
    select id from savings_accounts where household_id = current_household_id()
  )
);

create policy "savings_snapshots_insert" on savings_snapshots for insert with check (
  account_id in (
    select id from savings_accounts where household_id = current_household_id()
  )
);

create policy "savings_snapshots_update" on savings_snapshots for update using (
  account_id in (
    select id from savings_accounts where household_id = current_household_id()
  )
);
