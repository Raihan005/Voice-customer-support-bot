-- ============================================================
-- ShopVault Database Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with app-specific fields
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'User'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it already exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. PRODUCTS TABLE
create table if not exists public.products (
  id serial primary key,
  name text not null,
  price numeric(10, 2) not null,
  category text not null,
  emoji text not null default '📦',
  rating numeric(2, 1) not null default 0,
  reviews integer not null default 0,
  description text not null default '',
  colors text[] not null default '{}',
  features text[] not null default '{}',
  in_stock boolean not null default true,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

-- Anyone (including anonymous / logged-in) can read products
create policy "Products are publicly readable"
  on public.products for select
  using (true);


-- 3. ORDERS TABLE
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  total numeric(10, 2) not null,
  shipping jsonb not null default '{}',
  status text not null default 'Processing',
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);


-- 4. ORDER ITEMS TABLE
create table if not exists public.order_items (
  id serial primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id integer references public.products(id) on delete set null,
  product_name text not null,
  product_emoji text not null default '📦',
  quantity integer not null default 1,
  selected_color text,
  price_at_purchase numeric(10, 2) not null
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Users can create order items for their own orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );


-- 5. SUPPORT TICKETS TABLE
create table if not exists public.support_tickets (
  id serial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  category text not null default 'general',
  message text not null,
  status text not null default 'Open',
  created_at timestamptz default now()
);

alter table public.support_tickets enable row level security;

create policy "Users can view their own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

create policy "Users can create their own tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);
