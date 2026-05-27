-- 피드백 월(feedback wall) 스키마
-- 익명 작성/조회 가능. 공감(paw_count)은 RPC로 atomic 증가.

create table if not exists public.feedbacks (
  id          uuid          primary key default gen_random_uuid(),
  nickname    text          not null default '익명',
  category    text          not null check (category in ('idea', 'bug', 'comment', 'like')),
  content     text          not null check (char_length(content) between 3 and 100),
  paw_count   integer       not null default 0,
  created_at  timestamptz   not null default now()
);

create index if not exists feedbacks_created_at_idx on public.feedbacks (created_at desc);
create index if not exists feedbacks_category_idx   on public.feedbacks (category);

alter table public.feedbacks enable row level security;

-- 모두 select 허용
drop policy if exists "feedbacks_select_all" on public.feedbacks;
create policy "feedbacks_select_all"
  on public.feedbacks for select
  using (true);

-- 익명 포함 모두 insert 허용
drop policy if exists "feedbacks_insert_anon" on public.feedbacks;
create policy "feedbacks_insert_anon"
  on public.feedbacks for insert
  with check (true);

-- 공감 카운트 atomic 증가 RPC (UPDATE는 직접 허용 안 함)
create or replace function public.increment_feedback_paw(p_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.feedbacks
     set paw_count = paw_count + 1
   where id = p_id
  returning paw_count into new_count;
  return new_count;
end;
$$;

grant execute on function public.increment_feedback_paw(uuid) to anon, authenticated;
