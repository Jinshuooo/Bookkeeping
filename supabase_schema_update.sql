-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing; -- idempotent insert
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on rerun
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create ledgers table
create table if not exists public.ledgers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users not null
);

-- Enable RLS for ledgers
alter table public.ledgers enable row level security;


-- 3. Create ledger_members table
create table if not exists public.ledger_members (
  id uuid default uuid_generate_v4() primary key,
  ledger_id uuid references public.ledgers on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(ledger_id, user_id)
);

-- Enable RLS for ledger_members
alter table public.ledger_members enable row level security;


-- 4. Ledgers Policies
drop policy if exists "Users can view ledgers they belong to" on public.ledgers;
create policy "Users can view ledgers they belong to"
  on public.ledgers for select
  using (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.ledgers.id
      and user_id = auth.uid()
    )
  );

drop policy if exists "Users can create ledgers" on public.ledgers;
create policy "Users can create ledgers"
  on public.ledgers for insert
  with check ( auth.uid() = created_by );

drop policy if exists "Users can update ledgers they admin" on public.ledgers;
create policy "Users can update ledgers they admin"
  on public.ledgers for update
  using (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.ledgers.id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );


-- 5. Ledger Members Policies
drop policy if exists "Members can view other members" on public.ledger_members;
create policy "Members can view other members"
  on public.ledger_members for select
  using (
    exists (
      select 1 from public.ledger_members as my_membership
      where my_membership.ledger_id = public.ledger_members.ledger_id
      and my_membership.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can add members" on public.ledger_members;
create policy "Owners can add members"
  on public.ledger_members for insert
  with check (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.ledger_members.ledger_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
    OR
    -- Allow self-insert if it's the first member (creation of ledger case)
    (
       not exists (select 1 from public.ledger_members where ledger_id = public.ledger_members.ledger_id)
    )
  );


-- 6. Modify Transactions Table
-- Add ledger_id column
alter table public.transactions add column if not exists ledger_id uuid references public.ledgers on delete cascade;

-- (Critical) For existing transactions, we need a migration strategy.
-- We will create a default ledger for each user who has transactions but no ledgers, 
-- and assign their orphaned transactions to it.
-- This block is complex, so we'll do it in a DO block.

DO $$
DECLARE
  r RECORD;
  new_ledger_id UUID;
BEGIN
  -- Iterate users who have transactions but no ledger_id
  FOR r IN SELECT DISTINCT user_id FROM public.transactions WHERE ledger_id IS NULL LOOP
      -- Create a new default ledger for this user
      INSERT INTO public.ledgers (name, created_by)
      VALUES ('默认账本', r.user_id)
      RETURNING id INTO new_ledger_id;

      -- Add user as owner to this ledger
      INSERT INTO public.ledger_members (ledger_id, user_id, role)
      VALUES (new_ledger_id, r.user_id, 'owner');

      -- Update transactions
      UPDATE public.transactions
      SET ledger_id = new_ledger_id
      WHERE user_id = r.user_id AND ledger_id IS NULL;
  END LOOP;
END $$;

-- Update Transactions RLS
drop policy if exists "Users can view their own transactions" on public.transactions;
drop policy if exists "Users can insert their own transactions" on public.transactions;
drop policy if exists "Users can update their own transactions" on public.transactions;
drop policy if exists "Users can delete their own transactions" on public.transactions;

drop policy if exists "Users can view transactions from their ledgers" on public.transactions;
create policy "Users can view transactions from their ledgers"
  on public.transactions for select
  using (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.transactions.ledger_id
      and user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert transactions into their ledgers" on public.transactions;
create policy "Users can insert transactions into their ledgers"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.transactions.ledger_id
      and user_id = auth.uid()
    )
  );

drop policy if exists "Users can update transactions in their ledgers" on public.transactions;
create policy "Users can update transactions in their ledgers"
  on public.transactions for update
  using (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.transactions.ledger_id
      and user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete transactions in their ledgers" on public.transactions;
create policy "Users can delete transactions in their ledgers"
  on public.transactions for delete
  using (
    exists (
      select 1 from public.ledger_members
      where ledger_id = public.transactions.ledger_id
      and user_id = auth.uid()
    )
  );
