-- LendPaper — Quote Log: `estimates` table
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Backs the cross-tool Quote Log (markdowns/CALCULATORS.md → "Quote Log").
--
-- Storage note: ~500 bytes/record; 100k estimates ≈ 50MB (free tier, years).
-- `params` is intentionally schemaless JSONB so each calculator owns its own
-- input shape — adding a new calculator needs NO migration.

create table if not exists public.estimates (
  id              uuid primary key default gen_random_uuid(),
  doc_id          text not null unique,                 -- e.g. LP-20260608-94L5MN
  user_id         uuid not null references auth.users (id) on delete cascade,
  calculator_type text not null,                        -- 'payment_breakdown', 'dscr', ...
  created_at      timestamptz not null default now(),
  params          jsonb not null default '{}'::jsonb,   -- all inputs to restore state
  pdf_generated   boolean not null default false,
  prepared_by     text,                                 -- optional ("Prepared by" field)
  prepared_for    text                                  -- optional (merchant/company)
);

-- Quote Log queries newest-first, scoped to the signed-in user.
create index if not exists estimates_user_created_idx
  on public.estimates (user_id, created_at desc);
create index if not exists estimates_calculator_type_idx
  on public.estimates (calculator_type);

-- ── Row Level Security: every user sees only their own estimates ──────────────
alter table public.estimates enable row level security;

drop policy if exists "estimates_select_own" on public.estimates;
create policy "estimates_select_own" on public.estimates
  for select using (auth.uid() = user_id);

drop policy if exists "estimates_insert_own" on public.estimates;
create policy "estimates_insert_own" on public.estimates
  for insert with check (auth.uid() = user_id);

drop policy if exists "estimates_update_own" on public.estimates;
create policy "estimates_update_own" on public.estimates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "estimates_delete_own" on public.estimates;
create policy "estimates_delete_own" on public.estimates
  for delete using (auth.uid() = user_id);
