-- Core auth tables: households and users
-- Users always belong to exactly one household (created automatically at signup)

-- Households: the unit of sharing
-- Every user has a household (household of 1 by default)
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users: extends auth.users with app-specific data
-- No email column (lives in auth.users to avoid sync hazards)
-- household_id is NOT NULL: every user must belong to a household
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete restrict,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: auto-create household on signup
-- This ensures the NOT NULL constraint on users.household_id can be satisfied
-- The trigger runs after insert on auth.users and creates a household + users row

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_household_id uuid;
begin
  -- Create a household for the new user
  insert into households (name, created_by)
  values (
    coalesce(new.raw_user_meta_data->>'display_name', 'My Household'),
    new.id
  )
  returning id into new_household_id;

  -- Create the users record linking to auth.users and the new household
  insert into users (id, household_id, display_name)
  values (
    new.id,
    new_household_id,
    new.raw_user_meta_data->>'display_name'
  );

  return new;
end;
$$;

-- Trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
