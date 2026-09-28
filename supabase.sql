-- Run this entire script in Supabase SQL Editor.
-- Orders are inserted by the server using the secret key.
-- RLS is enabled so the browser cannot freely read customer orders.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_address text not null,
  product text not null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 100),
  total numeric(12,2) not null default 0 check (total >= 0),
  status text not null default 'ახალი'
    check (status in ('ახალი','დამუშავება','გაგზავნილი','დასრულებული','გაუქმებული'))
);

alter table public.orders enable row level security;

-- No public/anonymous select policy is created intentionally.
-- The server uses the Supabase secret key and performs the admin check.

create index if not exists orders_created_at_idx
on public.orders(created_at desc);

-- Optional: keep the API's exposed schema limited to what you need.
-- The backend accesses this table using the secret key.
