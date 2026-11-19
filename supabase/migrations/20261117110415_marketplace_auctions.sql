-- Server-only marketplace and auctions. Coins never leave the game.
begin;
create table public.cafe_market_listings (
 id uuid primary key, seller uuid not null references auth.users(id),
 item text not null check(item in ('milk','coffee','berry','ice','vanilla','cream','cocoa','star','syrup')),
 quantity integer not null check(quantity between 1 and 99),
 price bigint not null check(price between 1 and 1000000),
 status text not null default 'active' check(status in ('active','sold','cancelled','expired')),
 buyer uuid references auth.users(id),
 created_at timestamptz not null default now(),expires_at timestamptz not null,
 handled_at timestamptz,check(buyer is null or buyer<>seller)
);
create index cafe_market_active on public.cafe_market_listings(price,created_at) where status='active';
create index cafe_market_seller on public.cafe_market_listings(seller,created_at desc);
create table public.cafe_auctions (
 id uuid primary key,seller uuid not null references auth.users(id),
 item text not null check(item in ('milk','coffee','berry','ice','vanilla','cream','cocoa','star','syrup')),
 quantity integer not null check(quantity between 1 and 99),
 starting_price bigint not null check(starting_price between 1 and 1000000),
 highest_bid bigint not null default 0 check(highest_bid between 0 and 1000000000),
 highest_bidder uuid references auth.users(id),
 status text not null default 'active' check(status in ('active','sold','cancelled','expired')),
 created_at timestamptz not null default now(),ends_at timestamptz not null,
 handled_at timestamptz,check(highest_bidder is null or highest_bidder<>seller),
 check((highest_bidder is null and highest_bid=0) or (highest_bidder is not null and highest_bid>=starting_price))
);
create index cafe_auctions_due on public.cafe_auctions(ends_at) where status='active';
create index cafe_auctions_seller on public.cafe_auctions(seller,created_at desc);
create index cafe_auctions_bidder on public.cafe_auctions(highest_bidder,status);
create table public.cafe_auction_bids (
 id uuid primary key,auction_id uuid not null references public.cafe_auctions(id),
 bidder uuid not null references auth.users(id),amount bigint not null check(amount>0),
 created_at timestamptz not null default now()
);
create index cafe_bid_history on public.cafe_auction_bids(auction_id,created_at desc);
create index cafe_my_bids on public.cafe_auction_bids(bidder,created_at desc);
create table public.cafe_economy_history (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 event text not null,reference uuid not null,item text,quantity integer,
 coins_delta bigint not null default 0,commission bigint not null default 0,
 created_at timestamptz not null default now(),unique(user_id,event,reference)
);
create index cafe_history_owner on public.cafe_economy_history(user_id,created_at desc);
create table public.cafe_market_notifications (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 kind text not null,reference uuid not null,details jsonb not null default '{}',
 created_at timestamptz not null default now(),read_at timestamptz,
 unique(user_id,kind,reference)
);
create index cafe_notification_owner on public.cafe_market_notifications(user_id,created_at desc);
alter table public.cafe_market_listings enable row level security;
alter table public.cafe_auctions enable row level security;
alter table public.cafe_auction_bids enable row level security;
alter table public.cafe_economy_history enable row level security;
alter table public.cafe_market_notifications enable row level security;
revoke all on public.cafe_market_listings,public.cafe_auctions,public.cafe_auction_bids,public.cafe_economy_history,public.cafe_market_notifications from public,anon,authenticated;

-- A transactionally safe database closer is shared by API and pg_cron.
-- SECURITY INVOKER; only the server/database owner may execute it.
create function public.cafe_finalize_auction(target uuid) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.cafe_auctions%rowtype; s public.cafe_game_accounts%rowtype; b public.cafe_game_accounts%rowtype;
 fee bigint; proceeds bigint; repay bigint;
begin
 select * into a from public.cafe_auctions where id=target for update;
 if not found then raise exception 'AUCTION_NOT_FOUND'; end if;
 if a.status<>'active' or a.ends_at>clock_timestamp() then return jsonb_build_object('id',a.id,'status',a.status); end if;
 -- All account locks use the same UUID order as purchase/bid/trade code.
 perform user_id from public.cafe_game_accounts where user_id=a.seller or user_id=a.highest_bidder order by user_id for update;
 select * into strict s from public.cafe_game_accounts where user_id=a.seller;
 if a.highest_bidder is null then
  update public.cafe_game_accounts set save=jsonb_set(jsonb_set(save,array['pantry',a.item],to_jsonb(coalesce((save->'pantry'->>a.item)::bigint,0)+a.quantity)),'{version}',to_jsonb((save->>'version')::bigint+1)),revision=revision+1,updated_at=now() where user_id=a.seller;
  update public.cafe_auctions set status='expired',handled_at=now() where id=a.id;
  insert into public.cafe_market_notifications(user_id,kind,reference,details) values(a.seller,'auction_expired',a.id,jsonb_build_object('item',a.item)) on conflict do nothing;
  return jsonb_build_object('id',a.id,'status','expired');
 end if;
 select * into strict b from public.cafe_game_accounts where user_id=a.highest_bidder;
 fee:=(a.highest_bid+19)/20;proceeds:=a.highest_bid-fee;repay:=least(proceeds,s.refund_debt);
 update public.cafe_game_accounts set save=jsonb_set(jsonb_set(save,'{coins}',to_jsonb((save->>'coins')::bigint+proceeds-repay)),'{version}',to_jsonb((save->>'version')::bigint+1)),refund_debt=refund_debt-repay,revision=revision+1,updated_at=now() where user_id=a.seller;
 update public.cafe_game_accounts set save=jsonb_set(jsonb_set(save,array['pantry',a.item],to_jsonb(coalesce((save->'pantry'->>a.item)::bigint,0)+a.quantity)),'{version}',to_jsonb((save->>'version')::bigint+1)),revision=revision+1,updated_at=now() where user_id=a.highest_bidder;
 update public.cafe_auctions set status='sold',handled_at=now() where id=a.id;
 insert into public.cafe_economy_history(user_id,event,reference,item,quantity,coins_delta,commission) values(a.seller,'auction_sale',a.id,a.item,-a.quantity,proceeds,fee),(a.highest_bidder,'auction_win',a.id,a.item,a.quantity,-a.highest_bid,0) on conflict do nothing;
 insert into public.cafe_market_notifications(user_id,kind,reference,details) values(a.highest_bidder,'auction_won',a.id,jsonb_build_object('item',a.item,'amount',a.highest_bid)),(a.seller,'auction_sold',a.id,jsonb_build_object('item',a.item,'amount',proceeds)) on conflict do nothing;
 return jsonb_build_object('id',a.id,'status','sold');
end; $$;
revoke all on function public.cafe_finalize_auction(uuid) from public,anon,authenticated;
create function public.cafe_settle_expired_auctions() returns integer
language plpgsql security invoker set search_path=public,pg_temp as $$
declare ids uuid[]; target uuid; settled integer:=0;
begin
 select array_agg(id) into ids from (select id from public.cafe_auctions where status='active' and ends_at<=clock_timestamp() order by ends_at,id limit 100 for update skip locked) locked;
 if ids is null then return 0; end if;
 -- Lock the complete batch's account set globally in UUID order before updates.
 perform user_id from public.cafe_game_accounts where user_id in (select seller from public.cafe_auctions where id=any(ids) union select highest_bidder from public.cafe_auctions where id=any(ids)) order by user_id for update;
 foreach target in array ids loop perform public.cafe_finalize_auction(target);settled:=settled+1;end loop;
 return settled;
end; $$;
revoke all on function public.cafe_settle_expired_auctions() from public,anon,authenticated;
create function public.cafe_expire_market_listings() returns integer
language plpgsql security invoker set search_path=public,pg_temp as $$
declare ids uuid[]; listing public.cafe_market_listings%rowtype; n integer:=0;
begin
 select array_agg(id) into ids from (select id from public.cafe_market_listings where status='active' and expires_at<=clock_timestamp() order by expires_at,id limit 100 for update skip locked) locked;
 if ids is null then return 0; end if;
 perform user_id from public.cafe_game_accounts where user_id in (select seller from public.cafe_market_listings where id=any(ids)) order by user_id for update;
 for listing in select * from public.cafe_market_listings where id=any(ids) loop
  update public.cafe_game_accounts set save=jsonb_set(jsonb_set(save,array['pantry',listing.item],to_jsonb(coalesce((save->'pantry'->>listing.item)::bigint,0)+listing.quantity)),'{version}',to_jsonb((save->>'version')::bigint+1)),revision=revision+1,updated_at=now() where user_id=listing.seller;
  update public.cafe_market_listings set status='expired',handled_at=now() where id=listing.id;n:=n+1;
 end loop;
 return n;
end; $$;
revoke all on function public.cafe_expire_market_listings() from public,anon,authenticated;
commit;
