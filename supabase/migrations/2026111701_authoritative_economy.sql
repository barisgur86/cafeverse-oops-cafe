begin;
lock table public.cafe_cloud_saves in share row exclusive mode;
-- Apply with an administrative database connection. No client write grants.
create table if not exists public.cafe_game_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 code text unique not null,
 save jsonb not null check (jsonb_typeof(save)='object' and (save->>'coins')::bigint>=0),
 revision bigint not null default 1,
 refund_debt bigint not null default 0 check(refund_debt>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.cafe_apple_transactions (
 environment text not null check(environment in ('Sandbox','Production')),
 transaction_id text not null,
 original_transaction_id text not null,
 user_id uuid not null references auth.users(id),
 product_id text not null,
 coins integer not null check(coins in (250,750,2000)),
 status text not null check(status in ('credited','refunded')),
 signed_transaction text not null,
 created_at timestamptz not null default now(),
 refunded_at timestamptz,
 last_event_signed_at bigint not null default 0,
 primary key(environment,transaction_id)
);
create table if not exists public.cafe_trade_offers (
 id uuid primary key,
 sender uuid not null references auth.users(id),
 recipient uuid not null references auth.users(id),
 give_item text not null, give_qty integer not null check(give_qty between 1 and 99),
 want_item text not null, want_qty integer not null check(want_qty between 1 and 99),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','cancelled','expired')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 handled_at timestamptz,
 check(sender<>recipient and give_item<>want_item)
);
create index if not exists cafe_trade_inbox on public.cafe_trade_offers(recipient,status);
create index if not exists cafe_trade_outbox on public.cafe_trade_offers(sender,status);
create table if not exists public.cafe_secure_requests (
 user_id uuid not null references auth.users(id), request_id uuid not null,
 fingerprint text not null, result jsonb not null,
 primary key(user_id,request_id)
);
create table if not exists public.cafe_apple_notifications (
 notification_id uuid primary key, notification_type text not null,
 environment text not null, transaction_id text not null,
 created_at timestamptz not null default now()
);
-- RLS is defense in depth: API uses its restricted server role; no bearer client
-- may import a wallet, grant coins, settle trades or call ledger functions.
alter table public.cafe_game_accounts enable row level security;
alter table public.cafe_apple_transactions enable row level security;
alter table public.cafe_trade_offers enable row level security;
alter table public.cafe_secure_requests enable row level security;
alter table public.cafe_apple_notifications enable row level security;
revoke all on public.cafe_game_accounts,public.cafe_apple_transactions,public.cafe_trade_offers,public.cafe_secure_requests,public.cafe_apple_notifications from public,anon,authenticated;
-- One-time adoption of EXISTING server-side backups. Never import a client JSON
-- wallet through HTTP. Original backup rows remain intact for rollback/audit.
insert into public.cafe_game_accounts(user_id,code,save)
 select user_id,upper(substr(md5(user_id::text),1,10)),save
 from public.cafe_cloud_saves
 where jsonb_typeof(save)='object' and (save->>'coins') ~ '^\d+$'
 on conflict(user_id) do nothing;
-- Freeze legacy backup writes for migrated accounts; old builds must update.
create or replace function public.cafe_cloud_push(expected_version bigint,next_save jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 raise exception 'Please update Cafeverse: authoritative server required' using errcode='42501';
end; $$;

commit;
