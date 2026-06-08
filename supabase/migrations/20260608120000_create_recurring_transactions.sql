-- Recurring transactions: templates that auto-generate real transactions on a schedule.
create table recurring_transactions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  created_by    uuid not null references users(id),
  category_id   uuid references categories(id) on delete set null,
  amount        numeric(12,2) not null check (amount > 0),
  type          text not null check (type in ('income', 'expense')),
  note          text,
  frequency     text not null check (frequency in ('weekly', 'monthly')),
  -- monthly: day of month 1-31 (clamped to month end) · weekly: day of week 0-6
  anchor_day    int not null check (anchor_day between 0 and 31),
  start_date    date not null,
  end_date      date,
  next_run_date date not null,
  active        boolean not null default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index recurring_transactions_due_idx
  on recurring_transactions (household_id, active, next_run_date);

alter table recurring_transactions enable row level security;

create policy "recurring_transactions_select" on recurring_transactions for select using (
  household_id = current_household_id()
);

create policy "recurring_transactions_insert" on recurring_transactions for insert with check (
  household_id = current_household_id()
);

create policy "recurring_transactions_update" on recurring_transactions for update using (
  household_id = current_household_id()
);

create policy "recurring_transactions_delete" on recurring_transactions for delete using (
  household_id = current_household_id()
);

-- Provenance link: which recurring rule generated a transaction (null = manual).
-- Keep generated history when a rule is deleted.
alter table transactions
  add column recurring_id uuid references recurring_transactions(id) on delete set null;
