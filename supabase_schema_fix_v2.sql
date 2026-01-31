-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Helper Functions (Prevent Recursion)
-- ==========================================

-- Function to check membership safely (bypasses RLS)
create or replace function public.is_ledger_member(_ledger_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.ledger_members
    where ledger_id = _ledger_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Function to check role safely (bypasses RLS)
create or replace function public.get_my_role(_ledger_id uuid)
returns text as $$
declare
  _role text;
begin
  select role into _role
  from public.ledger_members
  where ledger_id = _ledger_id
  and user_id = auth.uid();
  return _role;
end;
$$ language plpgsql security definer;

-- ==========================================
-- 2. Tables & Schema
-- ==========================================

-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

-- Ledgers
create table if not exists public.ledgers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users not null
);
alter table public.ledgers enable row level security;

-- Ledger Members
create table if not exists public.ledger_members (
  id uuid default uuid_generate_v4() primary key,
  ledger_id uuid references public.ledgers on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ledger_id, user_id)
);
alter table public.ledger_members enable row level security;

-- Add ledger_id to transactions if not exists
alter table public.transactions add column if not exists ledger_id uuid references public.ledgers on delete cascade;

-- ==========================================
-- 3. Data Migration (Robust)
-- ==========================================

-- Temporarily disable RLS on transactions to ensure we can see/update old rows
alter table public.transactions disable row level security;

DO $$
DECLARE
  r RECORD;
  new_ledger_id UUID;
BEGIN
  -- Iterate users who have transactions but no ledger_id
  -- We use DISTINCT user_id to find users with orphaned transactions
  FOR r IN SELECT DISTINCT user_id FROM public.transactions WHERE ledger_id IS NULL LOOP
      
      -- Check if they already have a "default" ledger to reuse? 
      -- Ideally yes, but for simplicity let's create one if they have ORPHANED transactions.
      -- Or check if they have ANY ledger created by them?
      
      -- Strategy: Create '默认账本' for them.
      INSERT INTO public.ledgers (name, created_by)
      VALUES ('默认账本', r.user_id)
      RETURNING id INTO new_ledger_id;

      -- Add user as owner
      INSERT INTO public.ledger_members (ledger_id, user_id, role)
      VALUES (new_ledger_id, r.user_id, 'owner');

      -- Update their orphaned transactions
      UPDATE public.transactions
      SET ledger_id = new_ledger_id
      WHERE user_id = r.user_id AND ledger_id IS NULL;
      
  END LOOP;
END $$;

-- Re-enable RLS
alter table public.transactions enable row level security;


-- ==========================================
-- 4. RLS Policies (Updated)
-- ==========================================

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using ( auth.uid() = id );

-- Ledgers
drop policy if exists "Users can view ledgers they belong to" on public.ledgers;
create policy "Users can view ledgers they belong to" on public.ledgers for select
  using ( public.is_ledger_member(id) );

drop policy if exists "Users can create ledgers" on public.ledgers;
create policy "Users can create ledgers" on public.ledgers for insert with check ( auth.uid() = created_by );

drop policy if exists "Users can update ledgers they admin" on public.ledgers;
create policy "Users can update ledgers they admin" on public.ledgers for update
  using ( public.get_my_role(id) in ('owner', 'admin') );

-- Ledger Members
drop policy if exists "Members can view other members" on public.ledger_members;
create policy "Members can view other members" on public.ledger_members for select
  using (
    user_id = auth.uid() -- View self
    OR
    public.is_ledger_member(ledger_id) -- View others in same ledger (uses secure function to avoid recursion)
  );

drop policy if exists "Owners can add members" on public.ledger_members;
create policy "Owners can add members" on public.ledger_members for insert
  with check (
    -- If ledger exists, must be owner/admin
    public.get_my_role(ledger_id) in ('owner', 'admin')
    OR
    -- If it's the first member (new ledger), allow.
    not exists (select 1 from public.ledger_members where ledger_id = public.ledger_members.ledger_id)
  );

-- Transactions
drop policy if exists "Users can view their own transactions" on public.transactions;
drop policy if exists "Users can insert their own transactions" on public.transactions;
drop policy if exists "Users can update their own transactions" on public.transactions;
drop policy if exists "Users can delete their own transactions" on public.transactions;

drop policy if exists "Users can view transactions from their ledgers" on public.transactions;
create policy "Users can view transactions from their ledgers" on public.transactions for select
  using ( public.is_ledger_member(ledger_id) );

drop policy if exists "Users can insert transactions into their ledgers" on public.transactions;
create policy "Users can insert transactions into their ledgers" on public.transactions for insert
  with check ( public.is_ledger_member(ledger_id) );

drop policy if exists "Users can update transactions in their ledgers" on public.transactions;
create policy "Users can update transactions in their ledgers" on public.transactions for update
  using ( public.is_ledger_member(ledger_id) );

drop policy if exists "Users can delete transactions in their ledgers" on public.transactions;
create policy "Users can delete transactions in their ledgers" on public.transactions for delete
  using ( public.is_ledger_member(ledger_id) );


-- ==========================================
-- 5. Triggers
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
