-- Budget zéro-based: enveloppe mensuelle + allocations par catégorie
-- budgets: 1 ligne par foyer par mois (le revenu total à allouer)
-- budget_allocations: N lignes par budget (montant alloué par catégorie)
-- Pas de contrainte DB sur total alloué <= revenu (enforced côté API + warning UI)

create table budgets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month        text not null check (month ~ '^\d{4}-\d{2}$'),
  income       numeric(12,2) not null check (income >= 0),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (household_id, month)
);

create table budget_allocations (
  id          uuid primary key default gen_random_uuid(),
  budget_id   uuid not null references budgets(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  amount      numeric(12,2) not null check (amount >= 0),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (budget_id, category_id)
);

-- RLS

alter table budgets enable row level security;
alter table budget_allocations enable row level security;

create policy "budgets_select" on budgets for select using (
  household_id = current_household_id()
);

create policy "budgets_insert" on budgets for insert with check (
  household_id = current_household_id()
);

create policy "budgets_update" on budgets for update using (
  household_id = current_household_id()
);

create policy "budgets_delete" on budgets for delete using (
  household_id = current_household_id()
);

create policy "budget_allocations_select" on budget_allocations for select using (
  budget_id in (
    select id from budgets where household_id = current_household_id()
  )
);

create policy "budget_allocations_insert" on budget_allocations for insert with check (
  budget_id in (
    select id from budgets where household_id = current_household_id()
  )
);

create policy "budget_allocations_update" on budget_allocations for update using (
  budget_id in (
    select id from budgets where household_id = current_household_id()
  )
);

create policy "budget_allocations_delete" on budget_allocations for delete using (
  budget_id in (
    select id from budgets where household_id = current_household_id()
  )
);
