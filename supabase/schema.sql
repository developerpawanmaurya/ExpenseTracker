-- =============================================================
-- Expense Tracker — Supabase schema
-- Paste this whole file into Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE everywhere.
-- =============================================================

-- ---------- Tables ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  currency    text not null default 'USD',
  theme       text not null default 'dark',
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#94a3b8',
  created_at  timestamptz not null default now()
);

create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  description  text not null,
  amount       numeric(12,2) not null check (amount >= 0),
  category_id  uuid references public.categories(id) on delete set null,
  date         date not null,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_expenses_user_date on public.expenses (user_id, date desc);
create index if not exists idx_categories_user on public.categories (user_id);

-- ---------- Row Level Security ----------

alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.expenses   enable row level security;

-- profiles: each row's id == auth.uid()
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories
drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_insert" on public.categories;
drop policy if exists "categories_update" on public.categories;
drop policy if exists "categories_delete" on public.categories;
create policy "categories_select" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete" on public.categories for delete using (auth.uid() = user_id);

-- expenses
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_select" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete" on public.expenses for delete using (auth.uid() = user_id);

-- ---------- New-user bootstrap ----------
-- When a user signs up, create a profile row and seed default categories.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;

  insert into public.categories (user_id, name, color) values
    (new.id, 'Food & Dining',     '#f59e0b'),
    (new.id, 'Groceries',         '#10b981'),
    (new.id, 'Transport',         '#3b82f6'),
    (new.id, 'Shopping',          '#ec4899'),
    (new.id, 'Entertainment',     '#8b5cf6'),
    (new.id, 'Health',            '#ef4444'),
    (new.id, 'Bills & Utilities', '#0ea5e9'),
    (new.id, 'Rent / Housing',    '#14b8a6'),
    (new.id, 'Travel',            '#f97316'),
    (new.id, 'Other',             '#94a3b8');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
