-- Index only FK columns lacking an existing leading-column index.
do $$
declare spec record; target regclass; attribute smallint;
begin
 for spec in select * from (values
 ('cafe_apple_transactions','user_id'),('cafe_trade_offers','sender'),('cafe_trade_offers','recipient'),
 ('cafe_secure_requests','user_id'),('cafe_market_listings','seller'),('cafe_market_listings','buyer'),
 ('cafe_auctions','seller'),('cafe_auctions','highest_bidder'),('cafe_auction_bids','bidder'),
 ('cafe_economy_history','user_id'),('cafe_market_notifications','user_id')
 ) as fields(tab,col) loop
  target:=to_regclass('cafe_stage_062.'||spec.tab);if target is null then continue;end if;
  select attnum into attribute from pg_attribute where attrelid=target and attname=spec.col and not attisdropped;
  if not exists(select 1 from pg_index where indrelid=target and indisvalid and indkey[0]=attribute) then
   execute format('create index %I on %s(%I)',spec.tab||'_'||spec.col||'_deletion_idx',target,spec.col);
  end if;
 end loop;
end $$;
