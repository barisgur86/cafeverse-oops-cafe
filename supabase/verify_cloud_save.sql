begin;
do $$
declare ids uuid[];
begin
 ids:=array[gen_random_uuid(),gen_random_uuid()];
 insert into auth.users(id,aud,role) values(ids[1],'authenticated','authenticated'),(ids[2],'authenticated','authenticated');
 perform set_config('cafe_test.user_a',ids[1]::text,true);
 perform set_config('cafe_test.user_b',ids[2]::text,true);
end $$;
set local role authenticated;
do $$
declare before jsonb; result jsonb; nonce text := gen_random_uuid()::text;
begin
 perform set_config('request.jwt.claim.sub',current_setting('cafe_test.user_a'),true);
 before:=public.cafe_cloud_pull();
 result:=public.cafe_cloud_push((before->>'version')::bigint,jsonb_build_object('test_probe',nonce));
 if public.cafe_cloud_pull()->'save'->>'test_probe' is distinct from nonce then raise exception 'Own save read failed'; end if;
 begin
  perform public.cafe_cloud_push((before->>'version')::bigint,jsonb_build_object('test_probe','stale'));
  raise exception 'Stale revision was accepted';
 exception when serialization_failure then null; end;
 perform set_config('request.jwt.claim.sub',current_setting('cafe_test.user_b'),true);
 if public.cafe_cloud_pull()->'save'->>'test_probe'=nonce then raise exception 'Cross-account read detected'; end if;
 if exists(select 1 from public.cafe_cloud_saves where user_id=current_setting('cafe_test.user_a')::uuid) then raise exception 'RLS isolation failed'; end if;
end $$;
reset role;
select 'PASS: own save read/write; stale revision rejected; second account isolated; all test writes rolled back' as verification;
rollback;
