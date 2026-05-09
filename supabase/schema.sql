-- Run this in your Supabase project SQL editor (Dashboard → SQL Editor → New query)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Transactions
create table if not exists public.transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('expense','income')),
  amount      numeric(12,2) not null check (amount > 0),
  category    text not null,
  note        text not null default '',
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  mail_id     text unique
);

alter table public.transactions enable row level security;

create policy "Users manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Settings (one row per user)
create table if not exists public.settings (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  currency  text not null default 'USD',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Users manage own settings"
  on public.settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Budgets (one row per user × category)
create table if not exists public.budgets (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  category   text not null,
  amount     numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.budgets enable row level security;

create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goals
create table if not exists public.goals (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  target     numeric(12,2) not null check (target > 0),
  saved      numeric(12,2) not null default 0 check (saved >= 0),
  deadline   date,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Users manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists budgets_user_idx on public.budgets (user_id);
create index if not exists goals_user_idx on public.goals (user_id, created_at);
