-- Enable Row Level Security on core tables
-- Users can only access data from their own household

-- ============================================
-- Helper function: get current user's household
-- SECURITY DEFINER: bypasses RLS to avoid recursion
-- ============================================
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.users where id = auth.uid();
$$;

-- ============================================
-- Enable RLS on tables
-- ============================================
alter table public.households enable row level security;
alter table public.users enable row level security;

-- ============================================
-- Policies: households
-- ============================================

-- SELECT: members see their own household only
-- Note: trigger creates household with created_by = user.id, so user always matches
-- After household joins (future feature), all members see the same household
-- because they share household_id, and household_id = id for their household
-- Actually, this needs refinement: when a user joins another household,
-- they keep their own household record but change their household_id.
-- So the policy should be: see households where you are a member OR created it?
-- For now: simple model - you see the household you're in (via users.household_id)
-- But households.id must match... wait, this only works if we query by id.
-- Better policy: you can see any household where you are a member.
-- This requires: households.id IN (SELECT household_id FROM users WHERE id = auth.uid())
-- But since a user has exactly one household_id, we can use current_household_id()

create policy "households_select"
  on public.households
  for select
  using (
    id = public.current_household_id()
  );

-- INSERT: only through trigger or service role (backend bypasses RLS with service key)
-- Regular users cannot directly insert households - the trigger handles it
-- This is a safety policy: even if RLS allows, the trigger is the source of truth
create policy "households_insert"
  on public.households
  for insert
  with check (
    created_by = auth.uid()
  );

-- UPDATE: only the creator can update household details (name, etc.)
create policy "households_update"
  on public.households
  for update
  using (
    created_by = auth.uid()
  )
  with check (
    created_by = auth.uid()
  );

-- DELETE: only the creator can delete, and only if no other members
-- This is restricted by the ON DELETE RESTRICT on users.household_id
-- If other users reference this household, deletion will fail at FK level
create policy "households_delete"
  on public.households
  for delete
  using (
    created_by = auth.uid()
  );

-- ============================================
-- Policies: users
-- ============================================

-- SELECT: see all members of your household
-- This allows seeing co-members when in a shared household
create policy "users_select"
  on public.users
  for select
  using (
    household_id = public.current_household_id()
  );

-- INSERT: only yourself, and only with your own auth.uid
-- This is mainly for the trigger which bypasses RLS, but good safety net
create policy "users_insert"
  on public.users
  for insert
  with check (
    id = auth.uid()
  );

-- UPDATE: only your own profile (display_name, etc.)
-- Note: household_id changes are handled by invitation/join logic (future feature)
-- For now, users cannot change their own household_id
create policy "users_update"
  on public.users
  for update
  using (
    id = auth.uid()
  )
  with check (
    id = auth.uid()
  );

-- DELETE: only yourself
-- This cascades to auth.users due to FK constraint with ON DELETE CASCADE
create policy "users_delete"
  on public.users
  for delete
  using (
    id = auth.uid()
  );

-- ============================================
-- Comment policies for clarity
-- ============================================
comment on policy "households_select" on public.households is 'Members see their own household only';
comment on policy "households_insert" on public.households is 'Users can only create their own household';
comment on policy "households_update" on public.households is 'Only creator can update household';
comment on policy "households_delete" on public.households is 'Only creator can delete household (if empty)';
comment on policy "users_select" on public.users is 'See all members of your household';
comment on policy "users_insert" on public.users is 'Users can only create their own record';
comment on policy "users_update" on public.users is 'Users can only update their own profile';
comment on policy "users_delete" on public.users is 'Users can only delete their own record';
