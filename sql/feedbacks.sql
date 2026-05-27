-- ════════════════════════════════════════════════════════════
-- 모두의 계산기 — 이용후기(피드백) 테이블 + RLS + Realtime
-- Supabase SQL Editor 에 붙여넣고 실행하세요. 재실행 안전(idempotent).
-- ════════════════════════════════════════════════════════════

-- 1. 테이블
create table if not exists public.feedbacks (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          references auth.users(id) on delete set null,
  nickname    text          not null default '익명의 누렁이',
  avatar_url  text,
  category    text          not null check (category in ('idea', 'bug', 'comment', 'like')),
  content     text          not null check (char_length(content) between 3 and 100),
  paw_count   integer       not null default 0,
  created_at  timestamptz   not null default now()
);

-- 기존 테이블에 누락 컬럼 보강
alter table public.feedbacks add column if not exists user_id    uuid references auth.users(id) on delete set null;
alter table public.feedbacks add column if not exists avatar_url text;

-- 2. 인덱스
create index if not exists feedbacks_created_at_idx on public.feedbacks (created_at desc);
create index if not exists feedbacks_category_idx   on public.feedbacks (category);
create index if not exists feedbacks_user_id_idx    on public.feedbacks (user_id);

-- 3. RLS
alter table public.feedbacks enable row level security;

drop policy if exists "feedbacks_select_all"   on public.feedbacks;
drop policy if exists "feedbacks_insert_anon"  on public.feedbacks;
drop policy if exists "feedbacks_insert_auth"  on public.feedbacks;
drop policy if exists "feedbacks_delete_own"   on public.feedbacks;

-- SELECT: 누구나 (anon + authenticated)
create policy "feedbacks_select_all"
  on public.feedbacks for select
  using (true);

-- INSERT: 로그인 유저만, 본인 user_id 로만
create policy "feedbacks_insert_auth"
  on public.feedbacks for insert
  to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

-- DELETE: 본인 글만
create policy "feedbacks_delete_own"
  on public.feedbacks for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4. 공감 카운트 atomic 증가 RPC (로그인 유저 전용)
create or replace function public.increment_feedback_paw(p_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  update public.feedbacks
     set paw_count = paw_count + 1
   where id = p_id
  returning paw_count into new_count;
  return new_count;
end;
$$;

revoke execute on function public.increment_feedback_paw(uuid) from anon;
grant  execute on function public.increment_feedback_paw(uuid) to authenticated;

-- 5. Realtime 활성화 (어드민 새 글 알림 / 클라이언트 구독용)
do $$
begin
  begin
    alter publication supabase_realtime add table public.feedbacks;
  exception when duplicate_object then null;
  end;
end$$;
