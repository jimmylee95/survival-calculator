-- 피드백 월(feedback wall) / 게시판 스키마
-- 글 작성은 로그인 유저만, 조회는 누구나.
-- 공감(paw_count)은 RPC로 atomic 증가.

create table if not exists public.feedbacks (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          references auth.users(id) on delete set null,
  nickname    text          not null default '익명',
  avatar_url  text,
  category    text          not null check (category in ('idea', 'bug', 'comment', 'like')),
  content     text          not null check (char_length(content) between 3 and 100),
  paw_count   integer       not null default 0,
  created_at  timestamptz   not null default now()
);

-- 기존 테이블이 있다면 누락된 컬럼 보강
alter table public.feedbacks add column if not exists user_id    uuid references auth.users(id) on delete set null;
alter table public.feedbacks add column if not exists avatar_url text;

create index if not exists feedbacks_created_at_idx on public.feedbacks (created_at desc);
create index if not exists feedbacks_category_idx   on public.feedbacks (category);
create index if not exists feedbacks_user_id_idx    on public.feedbacks (user_id);

alter table public.feedbacks enable row level security;

-- 모두 select 허용
drop policy if exists "feedbacks_select_all"   on public.feedbacks;
drop policy if exists "feedbacks_insert_anon"  on public.feedbacks;
drop policy if exists "feedbacks_insert_auth"  on public.feedbacks;
create policy "feedbacks_select_all"
  on public.feedbacks for select
  using (true);

-- 로그인 유저만 insert 허용. 본인 user_id로만 작성 가능.
create policy "feedbacks_insert_auth"
  on public.feedbacks for insert
  to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

-- 공감 카운트 atomic 증가 RPC (로그인 유저 한정)
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

-- 실시간 구독 (어드민 새 글 알림용). 이미 추가되어 있어도 에러 무시.
do $$
begin
  begin
    alter publication supabase_realtime add table public.feedbacks;
  exception when duplicate_object then null;
  end;
end$$;
