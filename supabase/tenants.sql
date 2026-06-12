-- ============================================================
-- LendPaper White Labeling — Tenant schema (LEN-306)
-- Run once: python3 ~/lendpaper-engine/run_sql.py supabase/tenants.sql (LEN-311)
-- ============================================================

-- 1. Tenants table
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,            -- 'brightwell'
  company_name  text not null,                   -- 'Brightwell'
  logo_url      text,                            -- public URL in tenant-assets bucket
  primary_color text default '#1A3C2E',          -- hex; falls back to LendPaper default
  contact_name  text,                            -- 'Evan Paez'
  contact_email text,
  contact_phone text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 2. Link users to a tenant (nullable: null = default LendPaper branding)
--    NOTE: adjust table name if your profile table differs ('profiles' assumed).
alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id);

create index if not exists idx_profiles_tenant on public.profiles(tenant_id);

-- 3. RLS — authenticated users can read only their own tenant row
alter table public.tenants enable row level security;

drop policy if exists "read own tenant" on public.tenants;
create policy "read own tenant" on public.tenants
  for select
  to authenticated
  using (
    id = (select tenant_id from public.profiles where id = auth.uid())
  );

-- Tenant members can update their OWN tenant row (self-serve profile page)
drop policy if exists "update own tenant" on public.tenants;
create policy "update own tenant" on public.tenants
  for update
  to authenticated
  using (
    id = (select tenant_id from public.profiles where id = auth.uid())
  )
  with check (
    id = (select tenant_id from public.profiles where id = auth.uid())
  );

-- Inserts/deletes happen via service role / dashboard only.

-- 4. Storage bucket for logos (public read)
insert into storage.buckets (id, name, public)
  values ('tenant-assets', 'tenant-assets', true)
  on conflict (id) do nothing;

-- Tenant members can upload/replace files under their own tenant's folder
-- (path convention: tenant-assets/<tenant_id>/logo.png)
drop policy if exists "tenant logo upload" on storage.objects;
create policy "tenant logo upload" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] =
        (select tenant_id::text from public.profiles where id = auth.uid())
  );

drop policy if exists "tenant logo update" on storage.objects;
create policy "tenant logo update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1] =
        (select tenant_id::text from public.profiles where id = auth.uid())
  );

-- ============================================================
-- 5. Seed: Brightwell (LEN-307)
--    FILL IN email/phone/logo before flipping Evan's tenant_id.
-- ============================================================
insert into public.tenants (slug, company_name, contact_name, contact_email, contact_phone, primary_color, logo_url)
values (
  'brightwell',
  'Brightwell Funding',             -- confirmed: brightwellfunding.com
  'Evan Paez',
  null,                             -- Evan fills via profile page (or set here)
  null,                             -- Evan fills via profile page (or set here)
  '#0A2150',                        -- Brightwell wordmark navy (pulled from logo); editable via profile page
  null                              -- set via profile page logo upload
)
on conflict (slug) do nothing;

-- 6. Attach Evan's account (run AFTER he has signed up via invite flow):
-- update public.profiles
--   set tenant_id = (select id from public.tenants where slug = 'brightwell')
--   where id = (select id from auth.users where email = 'EVANS_EMAIL');

-- ============================================================
-- 7. PAID FEATURE — Shareable quote links (LEN-310)
-- ============================================================

-- Feature flags per tenant (paid gating)
alter table public.tenants
  add column if not exists features jsonb not null default '{}'::jsonb;

-- Enable for Brightwell (paid tenant):
update public.tenants
  set features = features || '{"share_links": true}'::jsonb
  where slug = 'brightwell';

-- Quotes: branding is SNAPSHOTTED into the row at creation, so the
-- public viewer never needs read access to the tenants table.
create table if not exists public.quotes (
  id          text primary key,                  -- short unguessable slug
  tenant_id   uuid references public.tenants(id),
  created_by  uuid not null references auth.users(id),
  payload     jsonb not null,                    -- quote data + brand snapshot
  expires_at  timestamptz not null default (now() + interval '30 days'),
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.quote_views (
  id        bigint generated always as identity primary key,
  quote_id  text not null references public.quotes(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  ua        text
);

create index if not exists idx_quote_views_quote on public.quote_views(quote_id);

alter table public.quotes enable row level security;
alter table public.quote_views enable row level security;

-- Anyone with the link can read a live quote (slug = capability)
drop policy if exists "public read live quotes" on public.quotes;
create policy "public read live quotes" on public.quotes
  for select to anon, authenticated
  using (not revoked and expires_at > now());

-- Only authenticated users whose tenant has share_links can create
drop policy if exists "tenant create quotes" on public.quotes;
create policy "tenant create quotes" on public.quotes
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and tenant_id = (select tenant_id from public.profiles where id = auth.uid())
    and exists (
      select 1 from public.tenants t
      where t.id = tenant_id
        and (t.features ->> 'share_links')::boolean is true
    )
  );

-- Creator can revoke / see their own quotes
drop policy if exists "owner manage quotes" on public.quotes;
create policy "owner manage quotes" on public.quotes
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Anyone can log a view; only the quote creator can read view stats
drop policy if exists "public log views" on public.quote_views;
create policy "public log views" on public.quote_views
  for insert to anon, authenticated
  with check (true);

drop policy if exists "owner read views" on public.quote_views;
create policy "owner read views" on public.quote_views
  for select to authenticated
  using (
    quote_id in (select id from public.quotes where created_by = auth.uid())
  );


-- ============================================================
-- 8. Admin tenant preview (LEN-330)
--    lp-panel's White Label tab lists every tenant; the base policy
--    only exposes the user's OWN tenant row. Same is_admin predicate
--    as the adoption_setup.sql admin policies.
-- ============================================================
drop policy if exists "admin read tenants" on public.tenants;
create policy "admin read tenants" on public.tenants
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
