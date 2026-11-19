begin;
-- Server-only checkpoints. No credentials, bearer tokens or receipt plaintext.
create table public.cafe_account_cutovers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 source_revision bigint not null check(source_revision>=0),
 source_version bigint not null check(source_version>=0),
 checksum text not null check(checksum ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
create table public.cafe_account_deletions (
 user_id uuid primary key,
 receipt_hash text not null unique check(receipt_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','revoked','cleaned','deleted')),
 secret text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((status='deleted' and secret is null) or (status<>'deleted' and secret is not null))
);
alter table public.cafe_account_cutovers enable row level security;
alter table public.cafe_account_deletions enable row level security;
revoke all on public.cafe_account_cutovers,public.cafe_account_deletions from public,anon,authenticated;
-- Anonymous transaction IDs survive account removal solely to reject replay.
-- Personal caches/history use CASCADE. Active escrow is settled by the server
-- BEFORE calling Auth admin deletion, in one transaction with counterpart saves.
do $$
declare spec record; target regclass;
begin
 for spec in select * from (values
 ('cafe_apple_transactions','user_id','SET NULL'),
 ('cafe_trade_offers','sender','SET NULL'),('cafe_trade_offers','recipient','SET NULL'),
 ('cafe_secure_requests','user_id','CASCADE'),
 ('cafe_market_listings','seller','SET NULL'),('cafe_market_listings','buyer','SET NULL'),
 ('cafe_auctions','seller','SET NULL'),('cafe_auctions','highest_bidder','SET NULL'),
 ('cafe_auction_bids','bidder','SET NULL'),
 ('cafe_economy_history','user_id','CASCADE'),('cafe_market_notifications','user_id','CASCADE')
 ) as fields(tab,col,rule) loop
  target:=to_regclass('public.'||spec.tab);
  if target is null then continue; end if;
  if spec.rule='SET NULL' then execute format('alter table %s alter column %I drop not null',target,spec.col); end if;
  execute format('alter table %s drop constraint if exists %I',target,spec.tab||'_'||spec.col||'_fkey');
  execute format('alter table %s add constraint %I foreign key (%I) references auth.users(id) on delete %s',target,spec.tab||'_'||spec.col||'_fkey',spec.col,spec.rule);
 end loop;
 -- Preserve historical bid amounts after the bidder identity is anonymized.
 if to_regclass('public.cafe_auctions') is not null then
  for spec in select conname from pg_constraint where conrelid='public.cafe_auctions'::regclass and contype='c'
   and pg_get_constraintdef(oid) like '%highest_bidder%' and pg_get_constraintdef(oid) like '%starting_price%' loop
   execute format('alter table public.cafe_auctions drop constraint %I',spec.conname);
  end loop;
  alter table public.cafe_auctions add constraint cafe_auction_bid_identity check(status<>'active' or ((highest_bidder is null and highest_bid=0) or (highest_bidder is not null and highest_bid>=starting_price)));
 end if;
 -- Event triggers need no public RPC permission; revocation leaves the trigger.
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke all on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end $$;

create or replace function public.cafe_account_is_active()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not exists(select 1 from public.cafe_account_deletions where user_id=(select auth.uid()));
$$;
revoke all on function public.cafe_account_is_active() from public,anon;
grant execute on function public.cafe_account_is_active() to authenticated;
-- Existing backup readers remain scoped to their own non-deleting account.
drop policy if exists cafe_cloud_read on public.cafe_cloud_saves;
create policy cafe_cloud_read on public.cafe_cloud_saves for select to authenticated
 using(user_id=(select auth.uid()) and public.cafe_account_is_active());
create or replace function public.cafe_cloud_push(expected_version bigint,next_save jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); new_revision bigint;
begin
 if uid is null then raise exception 'Authentication required' using errcode='28000'; end if;
 perform pg_advisory_xact_lock(hashtextextended('cutover:'||uid::text,0));
 if exists(select 1 from public.cafe_account_deletions where user_id=uid) then raise exception 'Account deletion in progress' using errcode='42501'; end if;
 if exists(select 1 from public.cafe_account_cutovers where user_id=uid) then raise exception 'Please update Cafeverse: authoritative server required' using errcode='42501'; end if;
 if next_save is null or jsonb_typeof(next_save)<>'object' or pg_column_size(next_save)>200000 then raise exception 'Invalid save payload'; end if;
 if expected_version=0 then
  insert into public.cafe_cloud_saves(user_id,revision,save) values(uid,1,next_save) on conflict do nothing returning revision into new_revision;
 else
  update public.cafe_cloud_saves set revision=revision+1,save=next_save,updated_at=now() where user_id=uid and revision=expected_version returning revision into new_revision;
 end if;
 if new_revision is null then raise exception 'Cloud save conflict' using errcode='40001'; end if;
 return jsonb_build_object('version',new_revision);
end $$;
revoke all on function public.cafe_cloud_push(bigint,jsonb) from public,anon;
grant execute on function public.cafe_cloud_push(bigint,jsonb) to authenticated;
commit;
