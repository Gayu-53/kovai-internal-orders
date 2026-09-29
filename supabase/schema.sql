-- ============================================================================
-- KOVAI CUSTOMIZES — PRODUCTION ORDER APP
-- Run this file in the Supabase SQL editor for a fresh project.
-- This is a separate app/database from Kovai Customizes — do not run this
-- against the same Supabase project as that app unless you want them sharing
-- a database (not recommended; keep them separate).
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

do $$ begin
  create type payment_status as enum ('PAID', 'NOT_PAID');
exception when duplicate_object then null; end $$;

do $$ begin
  create type production_status as enum ('PENDING', 'PRODUCTION', 'READY', 'DISPATCHED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type urgency_level as enum ('NORMAL', 'URGENT');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- ORDER NUMBER SEQUENCE (per year) — same pattern as Kovai Customizes,
-- but with a KF- prefix so the two systems' order numbers are never confused.
-- ----------------------------------------------------------------------------
create table if not exists order_number_counters (
  year integer primary key,
  last_value integer not null default 0
);

create or replace function next_order_number() returns text
language plpgsql as $$
declare
  cur_year integer := extract(year from now())::integer;
  next_val integer;
begin
  insert into order_number_counters (year, last_value)
  values (cur_year, 1)
  on conflict (year) do update set last_value = order_number_counters.last_value + 1
  returning last_value into next_val;

  return 'KF-' || cur_year || '-' || lpad(next_val::text, 4, '0');
end;
$$;

-- ----------------------------------------------------------------------------
-- ORDERS
-- Customer details are stored as ONE combined text block (per the single
-- customer-details-row request) rather than separate name/phone/address
-- columns. category/product are freeform text, same as Kovai Customizes.
-- ----------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,

  -- Single combined customer details block: name, WhatsApp number, phone
  -- number, delivery address, and pincode all typed together in one field.
  customer_details text not null,

  -- Line items: one order can hold several products for the same customer
  -- (e.g. a keychain AND a photo frame in one order). Each item is
  -- { category_text, product_text, quantity, size, colour, customization_data }.
  line_items jsonb not null default '[]'::jsonb,

  -- Legacy single-product columns — kept for backward compatibility with
  -- orders created before line_items existed. New orders leave these null
  -- and use line_items instead.
  category_text text,
  product_text text,
  quantity integer not null default 1,
  size text,
  colour text,
  customization_data jsonb not null default '[]'::jsonb,

  total_amount numeric(10, 2),
  payment_status payment_status not null default 'NOT_PAID',
  production_status production_status not null default 'PENDING',
  urgency urgency_level not null default 'NORMAL',

  order_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_order_number on orders (order_number);
create index if not exists idx_orders_production_status on orders (production_status);
create index if not exists idx_orders_urgency on orders (urgency);
create index if not exists idx_orders_category_text on orders (category_text);
create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_customer_details_trgm on orders using gin (customer_details gin_trgm_ops);
create index if not exists idx_orders_order_number_trgm on orders using gin (order_number gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- ORDER FILES
-- Accepts ANY file type (not just images) — resumes-style attachments,
-- PDFs, design documents, as well as photos. Files are always shown/stored
-- as downloadable documents, never forced into an image preview, since a
-- non-image file (e.g. a PDF) can't be previewed the same way.
-- ----------------------------------------------------------------------------
create table if not exists order_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  content_type text,
  file_size_bytes bigint,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_files_order_id on order_files (order_id);
create unique index if not exists uniq_order_files_primary
  on order_files (order_id)
  where is_primary;

-- ----------------------------------------------------------------------------
-- DISPATCH DETAILS
-- ----------------------------------------------------------------------------
create table if not exists dispatch_details (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  dispatch_date timestamptz,
  courier_name text,
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

drop trigger if exists trg_dispatch_updated_at on dispatch_details;
create trigger trg_dispatch_updated_at before update on dispatch_details
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- All access happens server-side via the service role key, so lock every
-- table down entirely with RLS enabled and no policies. Same approach as
-- Kovai Customizes.
-- ----------------------------------------------------------------------------
alter table orders enable row level security;
alter table order_files enable row level security;
alter table dispatch_details enable row level security;
alter table order_number_counters enable row level security;

-- ----------------------------------------------------------------------------
-- STORAGE BUCKET
-- Private bucket for order files/photos of any type.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', false)
on conflict (id) do nothing;
