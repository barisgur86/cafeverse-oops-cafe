begin;
-- Existing and imported balances have no certified earning provenance. They
-- remain spendable in-game but start with zero transferable allowance.
alter table public.cafe_game_accounts add column giftable_coins bigint not null default 0 check(giftable_coins>=0 and giftable_coins<=9007199254740991);
create table public.cafe_coin_gifts (
 id uuid primary key,
 sender uuid references auth.users(id) on delete set null,
 recipient uuid references auth.users(id) on delete set null,
 amount bigint not null check(amount between 1 and 1000000),
 credited_amount bigint not null check(credited_amount>=0),
 debt_repaid bigint not null check(debt_repaid>=0),
 created_at timestamptz not null default now(),
 check(sender is null or recipient is null or sender<>recipient),
 check(credited_amount+debt_repaid=amount)
);
create index cafe_coin_gifts_sender_created on public.cafe_coin_gifts(sender,created_at desc);
create index cafe_coin_gifts_recipient_created on public.cafe_coin_gifts(recipient,created_at desc);
alter table public.cafe_coin_gifts enable row level security;
revoke all on public.cafe_coin_gifts from public,anon,authenticated;
commit;
