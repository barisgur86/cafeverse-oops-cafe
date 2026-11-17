-- Run in Supabase SQL Editor. Client-only backup; NOT a production coin ledger.
create table if not exists public.cafe_cloud_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check (revision > 0),
 save jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.cafe_cloud_saves enable row level security;
revoke all on public.cafe_cloud_saves from anon, authenticated;
create or replace function public.cafe_cloud_pull()
returns jsonb language sql security invoker set search_path = '' as $$
 select coalesce((select jsonb_build_object('version',revision,'save',save)
 from public.cafe_cloud_saves where user_id=(select auth.uid())),
 jsonb_build_object('version',0,'save',null));
$$;
create or replace function public.cafe_cloud_push(expected_version bigint, next_save jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); current_revision bigint; new_revision bigint;
begin
 if uid is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if next_save is null or jsonb_typeof(next_save) <> 'object' or pg_column_size(next_save)>200000 then
  raise exception 'Invalid save payload'; end if;
 if expected_version=0 then
  insert into public.cafe_cloud_saves(user_id,revision,save) values(uid,1,next_save)
  on conflict do nothing returning revision into new_revision;
 else
  update public.cafe_cloud_saves set revision=revision+1,save=next_save,updated_at=now()
  where user_id=uid and revision=expected_version returning revision into new_revision;
 end if;
 if new_revision is null then raise exception 'Cloud save conflict' using errcode='40001'; end if;
 return jsonb_build_object('version',new_revision);
end;
$$;
revoke all on function public.cafe_cloud_pull() from public,anon;
revoke all on function public.cafe_cloud_push(bigint,jsonb) from public,anon;
grant execute on function public.cafe_cloud_pull() to authenticated;
grant execute on function public.cafe_cloud_push(bigint,jsonb) to authenticated;
grant select on public.cafe_cloud_saves to authenticated;
create policy cafe_cloud_read on public.cafe_cloud_saves for select to authenticated using (user_id=(select auth.uid()));
