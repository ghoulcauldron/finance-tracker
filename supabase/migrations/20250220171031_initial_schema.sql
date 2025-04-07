-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  partner_id uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Accounts
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'credit', 'investment', 'fund', 'custom')),
  owner_id uuid references auth.users not null,
  balance decimal(12,2) not null default 0,
  is_shared boolean not null default false,
  purpose text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone not null,
  amount decimal(12,2) not null,
  type text not null check (type in ('income', 'expense', 'transfer', 'fund_transfer')),
  description text not null,
  category text not null,
  owner_id uuid references auth.users not null,
  source_account_id uuid references accounts,
  destination_account_id uuid references accounts,
  is_joint boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transaction Reconciliation
create table reconciliation_entries (
  id uuid default uuid_generate_v4() primary key,
  transaction_id uuid references transactions not null,
  statement_date date not null,
  is_verified boolean default false,
  verified_by uuid references auth.users,
  verification_date timestamp with time zone,
  notes text
);

-- Enable RLS
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table reconciliation_entries enable row level security;

-- Profiles policies
create policy "Users can view their own profile and their partner's"
  on profiles for select
  using (
    auth.uid() = id 
    or auth.uid() = partner_id 
    or id = (select partner_id from profiles where id = auth.uid())
  );

-- Accounts policies
create policy "Users can view their own accounts and shared accounts with partner"
  on accounts for select
  using (
    owner_id = auth.uid() 
    or (is_shared = true and owner_id in (
      select partner_id from profiles where id = auth.uid()
    ))
  );

-- Transactions policies
create policy "Users can view their own transactions and joint transactions"
  on transactions for select
  using (
    owner_id = auth.uid() 
    or (is_joint = true and owner_id in (
      select partner_id from profiles where id = auth.uid()
    ))
  );