-- LEN-351 demo-env feedback loop (6/12). Anon-insertable feedback from the
-- staging site (reggierouter.github.io); read back by Claude via run_sql.py:
--   run_sql.py -c "select * from staging_feedback where resolved_at is null order by created_at;"
create table if not exists public.staging_feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  build text,
  page text,
  kind text not null check (kind in ('update-review','element','general')),
  tool text,
  ticket text,
  verdict text check (verdict is null or verdict in ('approve','decline')),
  selector text,
  snippet text,
  note text,
  ua text,
  resolved_at timestamptz
);
alter table public.staging_feedback enable row level security;
drop policy if exists anon_insert_staging_feedback on public.staging_feedback;
create policy anon_insert_staging_feedback on public.staging_feedback
  for insert to anon, authenticated with check (true);
-- no select/update/delete policies: clients can write feedback, never read it.
