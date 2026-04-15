-- Categories: predefined (household_id IS NULL) + custom per household
create table categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name         text not null,
  icon         text,
  is_default   boolean not null default false,
  created_at   timestamptz default now()
);

-- Predefined categories (shared across all households)
insert into categories (name, icon, is_default) values
  ('Loyer',        '🏠', true),
  ('Courses',      '🛒', true),
  ('Transport',    '🚗', true),
  ('Restaurants',  '🍽️', true),
  ('Santé',        '💊', true),
  ('Loisirs',      '🎬', true),
  ('Abonnements',  '📱', true),
  ('Salaire',      '💰', true),
  ('Autre',        '📦', true);

-- RLS on categories
alter table categories enable row level security;

-- Anyone can read predefined categories; household members can read their own
create policy "categories_select" on categories for select using (
  household_id is null
  or household_id = current_household_id()
);

-- Household members can insert custom categories
create policy "categories_insert" on categories for insert with check (
  household_id = current_household_id()
);

-- Household members can update their own custom categories
create policy "categories_update" on categories for update using (
  household_id = current_household_id()
);

-- Household members can delete their own custom categories
create policy "categories_delete" on categories for delete using (
  household_id = current_household_id()
);

-- Transactions
create table transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by   uuid not null references users(id),
  category_id  uuid references categories(id) on delete set null,
  amount       numeric(12,2) not null check (amount > 0),
  type         text not null check (type in ('income', 'expense')),
  date         date not null,
  note         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- RLS on transactions
alter table transactions enable row level security;

create policy "transactions_select" on transactions for select using (
  household_id = current_household_id()
);

create policy "transactions_insert" on transactions for insert with check (
  household_id = current_household_id()
);

create policy "transactions_update" on transactions for update using (
  household_id = current_household_id()
);

create policy "transactions_delete" on transactions for delete using (
  household_id = current_household_id()
);
