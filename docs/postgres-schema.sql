-- PostgreSQL schema for Beart Art Shop production migration.
-- Apply this in Supabase, Neon, or another PostgreSQL database before switching storage from JSON fallback.

create table if not exists products (
  id text primary key,
  slug text unique not null,
  status text not null default 'draft',
  preview_token text,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  product_id text not null,
  product_slug text not null,
  product_title text not null,
  variant text,
  quantity integer not null default 1,
  currency text not null default 'IDR',
  unit_price integer not null default 0,
  total integer not null default 0,
  payment_method text not null,
  payment_provider text,
  payment_reference text,
  status text not null,
  customer jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  utm jsonb not null default '{}'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  page_url text,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_product_slug_idx on orders(product_slug);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists orders_payment_method_idx on orders(payment_method);

create table if not exists analytics_events (
  id text primary key,
  name text not null,
  product_id text,
  product_slug text,
  visitor_id text,
  session_id text,
  order_id text,
  payment_method text,
  value integer not null default 0,
  page_url text,
  path text,
  referrer text,
  first_attribution jsonb not null default '{}'::jsonb,
  last_attribution jsonb not null default '{}'::jsonb,
  city text,
  province text,
  device jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on analytics_events(name);
create index if not exists analytics_events_product_slug_idx on analytics_events(product_slug);
create index if not exists analytics_events_created_at_idx on analytics_events(created_at desc);
create index if not exists analytics_events_session_id_idx on analytics_events(session_id);
create index if not exists analytics_events_order_id_idx on analytics_events(order_id);
