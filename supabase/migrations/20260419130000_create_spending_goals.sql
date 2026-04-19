-- Spending goals: monthly spending limits per category
-- Each household can set one goal per category per month

create table spending_goals (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by   uuid not null references users(id),
  category_id  uuid not null references categories(id) on delete cascade,
  month        date not null,  -- first day of month (e.g., 2025-04-01)
  amount       numeric(12,2) not null check (amount > 0),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (household_id, category_id, month)
);

-- RLS on spending_goals
alter table spending_goals enable row level security;

create policy "spending_goals_select" on spending_goals for select using (
  household_id = current_household_id()
);

create policy "spending_goals_insert" on spending_goals for insert with check (
  household_id = current_household_id()
);

create policy "spending_goals_update" on spending_goals for update using (
  household_id = current_household_id()
);

create policy "spending_goals_delete" on spending_goals for delete using (
  household_id = current_household_id()
);
