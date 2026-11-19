import crypto from 'node:crypto';
import {gameEngine,catalog} from './engine.mjs';
import {problem} from './apple.mjs';
import {adoptBackup} from './cutover.mjs';
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export class Economy {
 constructor(pool,apple,{clock=Date.now,features={},lifecycle=false,legacyImport=false}={}){this.pool=pool;this.apple=apple;this.clock=clock;this.lifecycleEnabled=lifecycle;this.legacyImport=legacyImport;this.features={iap:false,trades:false,market:false,auctions:false,social:false,coinGifts:false,...features};}
 async assertActive(c,id){if(this.lifecycleEnabled&&(await c.query('select 1 from cafe_account_deletions where user_id=$1',[id])).rows.length)throw problem('Hesap silme işlemi sürüyor. Yeni oyun işlemi yapılamaz.',423);}
 async transaction(fn){const c=await this.pool.connect();try{await c.query('begin');await c.query("set local lock_timeout='5s'");const r=await fn(c);await c.query('commit');return r;}catch(e){await c.query('rollback');throw e;}finally{c.release();}}
 async lock(c,key){await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[key]);}
 async account(c,id){
  if(!uuid(id))throw problem('Hesap doğrulanamadı.',401);
  if(this.legacyImport){const a=await adoptBackup(c,id);await this.assertActive(c,id);return a;}
  const initial=gameEngine(id).exportSave(),code=crypto.createHash('sha256').update(id).digest('hex').slice(0,10).toUpperCase();
  await c.query('insert into cafe_game_accounts(user_id,code,save) values($1,$2,$3) on conflict(user_id) do nothing',[id,code,initial]);
  const a=(await c.query('select * from cafe_game_accounts where user_id=$1 for update',[id])).rows[0];await this.assertActive(c,id);return a;
 }
 async save(c,a){if(this.features.coinGifts){a.giftable_coins=Math.min(Number(a.giftable_coins||0),a.save.coins);await c.query('update cafe_game_accounts set giftable_coins=$2 where user_id=$1',[a.user_id,a.giftable_coins]);}a.revision=Number(a.revision)+1;a.save.version=(a.save.version||0)+1;await c.query('update cafe_game_accounts set save=$2,revision=$3,refund_debt=$4,updated_at=now() where user_id=$1',[a.user_id,a.save,a.revision,a.refund_debt]);}
 state(a){const e=gameEngine(a.user_id,a.save,this.clock),d=e.handle('/api/me');return {...d.state,code:a.code,refundDebt:Number(a.refund_debt),giftableCoins:Number(a.giftable_coins||0)};}
 response(a,extra={}){return {state:this.state(a),save:a.save,revision:Number(a.revision),features:this.features,...extra};}
 async request(c,id,rid,path,body,fn){
  if(!uuid(rid))throw problem('Geçersiz işlem kimliği.');
  await this.lock(c,'request:'+id+':'+rid);
  const fingerprint=crypto.createHash('sha256').update(canonical([path,body])).digest('hex');
  const old=(await c.query('select * from cafe_secure_requests where user_id=$1 and request_id=$2',[id,rid])).rows[0];
  if(old){if(old.fingerprint!==fingerprint)throw problem('İşlem kimliği başka bir işlem için kullanılmış.',409);return {...old.result,duplicate:true};}
  const result=await fn();await c.query('insert into cafe_secure_requests(user_id,request_id,fingerprint,result) values($1,$2,$3,$4)',[id,rid,fingerprint,result]);return result;
 }
 async me(id){return this.transaction(async c=>{const a=await this.account(c,id),d=gameEngine(id,a.save,this.clock).handle('/api/me');const cutover=this.legacyImport?(await c.query('select source_revision,source_version,checksum from cafe_account_cutovers where user_id=$1',[id])).rows[0]:undefined;return this.response(a,{preparations:d.preparations,preparation:d.preparation,...(cutover?{cutover}: {})});});}
 async game(id,path,body){
  const allowed=['/api/service-orders/open','/api/service-orders/leave','/api/profile','/api/stock','/api/outfit','/api/decor','/api/upgrades','/api/npc-trade','/api/preparations','/api/service-batches/serve','/api/calls/start'];
  if(!allowed.includes(path)&&!/^\/api\/(preparations\/[a-f0-9-]{36}\/serve|calls\/[a-f0-9-]{36}\/tap)$/.test(path))throw problem('Desteklenmeyen oyun işlemi.',404);
  return this.transaction(async c=>{
   const extra=await this.request(c,id,body.request_id,path,body,async()=>{
    const a=await this.account(c,id),engine=gameEngine(id,a.save,this.clock),before=a.save.coins,d=engine.handle(path,body);
    if(d.status!==200)throw problem(d.error,d.status);
    a.save=engine.exportSave();
    // Future earned coins first repay consumed/refunded purchase debt.
    const earned=Math.max(0,a.save.coins-before),repay=Math.min(earned,Number(a.refund_debt));a.save.coins-=repay;a.refund_debt=Number(a.refund_debt)-repay;
    if(this.features.coinGifts)a.giftable_coins=Number(a.giftable_coins||0)+earned-repay;
    await this.save(c,a);const {status,state,...extra}=d;return extra;
   });return this.response(await this.account(c,id),extra);
  });
 }
 async credit(id,jws){
  const t=await this.apple.transaction(jws,id);
  return this.transaction(async c=>{
   await this.lock(c,'apple:'+t.environment+':'+t.transactionId);
   const a=await this.account(c,id),old=(await c.query('select * from cafe_apple_transactions where environment=$1 and transaction_id=$2',[t.environment,t.transactionId])).rows[0];
   if(old){if(old.user_id!==id||old.product_id!==t.productId||old.original_transaction_id!==t.originalTransactionId)throw problem('Apple işlemi başka hesaba veya ürüne ait.',409);if(old.status==='refunded')throw problem('Bu satın alma iade edilmiş.',409);return this.response(a,{purchase:{coins:old.coins,id:t.transactionId,duplicate:true}});}
   const legacy=a.save.storePurchases?.[t.environment+':'+t.transactionId];
   if(legacy&&(legacy.productID!==t.productId||legacy.coins!==t.coins))throw problem('Eski satın alma kaydı inceleme gerektiriyor.',409);
   const grant=legacy?0:t.coins,repay=Math.min(grant,Number(a.refund_debt));a.refund_debt=Number(a.refund_debt)-repay;a.save.coins+=grant-repay;
   a.save.storePurchases??={};a.save.storePurchases[t.environment+':'+t.transactionId]={id:t.transactionId,productID:t.productId,coins:t.coins,environment:t.environment};
   await c.query("insert into cafe_apple_transactions(environment,transaction_id,original_transaction_id,user_id,product_id,coins,status,signed_transaction) values($1,$2,$3,$4,$5,$6,'credited',$7)",[t.environment,t.transactionId,t.originalTransactionId,id,t.productId,t.coins,jws]);
   await this.save(c,a);return this.response(a,{purchase:{id:t.transactionId,coins:t.coins}});
  });
 }
 async board(id,b){
  if(!b.board||!Array.isArray(b.board.tickets)||b.board.tickets.length>12||JSON.stringify(b.board).length>20000||!Number.isSafeInteger(b.expectedRevision))throw problem('Sipariş panosu geçersiz.');
  return this.transaction(async c=>{
   const a=await this.account(c,id);if(Number(a.revision)!==b.expectedRevision)throw problem('Kafe başka cihazda değişti. Yenile.',409);
   // Only presentation metadata is accepted. Never copy client wallet/inventory.
   a.save._serviceBoard=b.board;await this.save(c,a);return this.response(a);
  });
 }
 async history(id){return this.transaction(async c=>{const a=await this.account(c,id),rows=(await c.query('select environment,transaction_id,original_transaction_id,product_id,coins,status,created_at,refunded_at from cafe_apple_transactions where user_id=$1 order by created_at desc limit 100',[id])).rows;return this.response(a,{history:rows});});}
 async notification(jws){
  const decoded=await this.apple.notification(jws);if(decoded.ignored)return {received:true,ignored:true};
  const {notification:n,transaction:t,jws:signed}=decoded,id=t.appAccountToken.toLowerCase();
  return this.transaction(async c=>{
   await this.lock(c,'apple:'+t.environment+':'+t.transactionId);
   if((await c.query('select 1 from cafe_apple_notifications where notification_id=$1',[n.notificationUUID])).rows.length)return {received:true,duplicate:true};
   const old=(await c.query('select * from cafe_apple_transactions where environment=$1 and transaction_id=$2',[t.environment,t.transactionId])).rows[0];
   if(old&&((old.user_id!==null&&old.user_id!==id)||old.product_id!==t.productId||old.original_transaction_id!==t.originalTransactionId))throw problem('Apple bildirim işlemi uyuşmuyor.',409);
   if(old&&Number(old.last_event_signed_at)>=n.signedDate)return {received:true,stale:true};
   const deleting=this.lifecycleEnabled&&(await c.query('select 1 from cafe_account_deletions where user_id=$1',[id])).rows.length>0;
   if(old?.user_id===null||deleting){
    // A deleted account must never be recreated by a late Apple notification.
    // Keep only anonymous transaction identity/status for refund and replay.
    const status=n.notificationType==='REFUND_REVERSED'?'credited':'refunded';
    if(old)await c.query("update cafe_apple_transactions set status=$3,refunded_at=case when $3='refunded' then now() else null end,last_event_signed_at=$4 where environment=$1 and transaction_id=$2",[t.environment,t.transactionId,status,n.signedDate]);
    else await c.query('insert into cafe_apple_transactions(environment,transaction_id,original_transaction_id,user_id,product_id,coins,status,signed_transaction,last_event_signed_at) values($1,$2,$3,null,$4,$5,$6,$7,$8)',[t.environment,t.transactionId,t.originalTransactionId,t.productId,t.coins,status,'',n.signedDate]);
    await c.query('insert into cafe_apple_notifications(notification_id,notification_type,environment,transaction_id) values($1,$2,$3,$4)',[n.notificationUUID,n.notificationType,t.environment,t.transactionId]);return {received:true,anonymous:true};
   }
   const a=await this.account(c,id);
   if(n.notificationType==='REFUND_REVERSED'){
    if(old?.status==='refunded'){
     const repay=Math.min(t.coins,Number(a.refund_debt));a.refund_debt=Number(a.refund_debt)-repay;a.save.coins+=t.coins-repay;
     await c.query("update cafe_apple_transactions set status='credited',refunded_at=null where environment=$1 and transaction_id=$2",[t.environment,t.transactionId]);await this.save(c,a);
    }
   }else if(!old){
    // A refund may arrive before the first client delivery. Tombstone prevents later credit.
    await c.query("insert into cafe_apple_transactions(environment,transaction_id,original_transaction_id,user_id,product_id,coins,status,signed_transaction,refunded_at) values($1,$2,$3,$4,$5,$6,'refunded',$7,now())",[t.environment,t.transactionId,t.originalTransactionId,id,t.productId,t.coins,signed]);
   }else if(old.status==='credited'){
    const debit=Math.min(a.save.coins,t.coins);a.save.coins-=debit;a.refund_debt=Number(a.refund_debt)+t.coins-debit;
    delete a.save.storePurchases?.[t.environment+':'+t.transactionId];
    await c.query("update cafe_apple_transactions set status='refunded',refunded_at=now() where environment=$1 and transaction_id=$2",[t.environment,t.transactionId]);await this.save(c,a);
   }
   await c.query('update cafe_apple_transactions set last_event_signed_at=$3 where environment=$1 and transaction_id=$2',[t.environment,t.transactionId,n.signedDate]);
   await c.query('insert into cafe_apple_notifications(notification_id,notification_type,environment,transaction_id) values($1,$2,$3,$4)',[n.notificationUUID,n.notificationType,t.environment,t.transactionId]);return {received:true};
  });
 }
 async sendCoins(id,b){
  const code=String(b.code||'').trim().toUpperCase(),amount=b.amount;
  if(!/^[A-F0-9]{10}$/.test(code)||!Number.isSafeInteger(amount)||amount<1||amount>1000000)throw problem('Kafe kodunu ve 1–1.000.000 arasında tam coin miktarını yaz.');
  return this.transaction(async c=>{
   const result=await this.request(c,id,b.request_id,'coin-gift',{code,amount},async()=>{
    const target=(await c.query('select user_id from cafe_game_accounts where code=$1',[code])).rows[0];
    if(!target)throw problem('Kafe bulunamadı.',404);
    if(target.user_id===id)throw problem('Kendine coin gönderemezsin.');
    const accounts={};for(const actor of [id,target.user_id].sort())accounts[actor]=await this.account(c,actor);
    const sender=accounts[id],recipient=accounts[target.user_id];
    if(Number(sender.giftable_coins||0)<amount||sender.save.coins<amount)throw problem('Gönderebileceğin kazanılmış coin yeterli değil.',409);
    const repaid=Math.min(amount,Number(recipient.refund_debt)),credited=amount-repaid;
    if(!Number.isSafeInteger(recipient.save.coins+credited))throw problem('Alıcının coin bakiyesi sınırına ulaşıldı.',409);
    sender.save.coins-=amount;sender.giftable_coins=Number(sender.giftable_coins)-amount;
    recipient.save.coins+=credited;recipient.giftable_coins=Number(recipient.giftable_coins||0)+credited;recipient.refund_debt=Number(recipient.refund_debt)-repaid;
    await this.save(c,sender);await this.save(c,recipient);
    await c.query('insert into cafe_coin_gifts(id,sender,recipient,amount,credited_amount,debt_repaid) values($1,$2,$3,$4,$5,$6)',[b.request_id,id,target.user_id,amount,credited,repaid]);
    return {gift:{id:b.request_id,code,amount,credited,debtRepaid:repaid}};
   });return this.response(await this.account(c,id),result);
  });
 }
 async coinGifts(id){
  // Previously escrowed ingredient offers can still expire and return stock.
  await this.expire(id);
  return this.transaction(async c=>{const a=await this.account(c,id);const gifts=(await c.query("select g.id,g.amount,g.credited_amount,g.debt_repaid,g.created_at,case when g.sender=$1 then 'outgoing' else 'incoming' end as direction,coalesce(case when g.sender=$1 then r.code else s.code end,'—') as code from cafe_coin_gifts g left join cafe_game_accounts s on s.user_id=g.sender left join cafe_game_accounts r on r.user_id=g.recipient where g.sender=$1 or g.recipient=$1 order by g.created_at desc,g.id limit 30",[id])).rows;return this.response(a,{gifts});});
 }
 async find(id,code){if(!/^[A-F0-9]{10}$/.test(code))throw problem('10 karakterli kafe kodunu yaz.');const r=await this.pool.query('select code,save->>\'name\' as name from cafe_game_accounts where code=$1 and user_id<>$2',[code,id]);if(!r.rows[0])throw problem('Kafe bulunamadı.',404);return {cafe:r.rows[0]};}
 async offer(id,b){
  if(!catalog.ITEMS.includes(b.give_item)||!catalog.ITEMS.includes(b.want_item)||b.give_item===b.want_item||![b.give_qty,b.want_qty].every(q=>Number.isInteger(q)&&q>=1&&q<=99))throw problem('Farklı iki malzeme ve 1–99 miktar seç.');
  await this.expire(id);
  return this.transaction(async c=>{
   await this.request(c,id,b.request_id,'trade-create',b,async()=>{
    const target=(await c.query('select user_id from cafe_game_accounts where code=$1 and user_id<>$2',[String(b.code).toUpperCase(),id])).rows[0];if(!target)throw problem('Kafe bulunamadı.',404);
    const accounts={};for(const uid of [id,target.user_id].sort())accounts[uid]=await this.account(c,uid);const a=accounts[id];
    if(Number((await c.query("select count(*) from cafe_trade_offers where sender=$1 and status='pending'",[id])).rows[0].count)>=20)throw problem('Çok fazla bekleyen teklif var.',429);
    if((a.save.pantry[b.give_item]||0)<b.give_qty)throw problem('Depoda yeterli malzeme yok.',409);
    a.save.pantry[b.give_item]-=b.give_qty; // Escrow immediately; cannot spend offered stock twice.
    await c.query('insert into cafe_trade_offers(id,sender,recipient,give_item,give_qty,want_item,want_qty,expires_at) values($1,$2,$3,$4,$5,$6,$7,$8)',[b.request_id,id,target.user_id,b.give_item,b.give_qty,b.want_item,b.want_qty,new Date(this.clock()+86400000)]);await this.save(c,a);return {tradeID:b.request_id};
   });return this.response(await this.account(c,id),{trades:await this.list(c,id)});
  });
 }
 async settle(id,tradeID,action,rid,{system=false}={}){
  if(!uuid(tradeID)||!['accept','reject','cancel','expire'].includes(action)||(!system&&action==='expire'))throw problem('Geçersiz takas işlemi.');
  return this.transaction(async c=>{
   const execute=async()=>{
    const t=(await c.query('select * from cafe_trade_offers where id=$1 for update',[tradeID])).rows[0];if(!t)throw problem('Teklif bulunamadı.',404);
    if(!system&&(action==='cancel'?t.sender:t.recipient)!==id)throw problem('Bu teklifte işlem yetkin yok.',403);
    const requested={accept:'accepted',reject:'rejected',cancel:'cancelled',expire:'expired'}[action];
    if(t.status!=='pending'){if(t.status===requested)return {tradeID,status:t.status,duplicate:true};throw problem('Bu teklif zaten işlendi: '+t.status,409);}
    const expired=new Date(t.expires_at).getTime()<=this.clock();if(system&&!expired)return {tradeID,status:'pending'};
    const accounts={};for(const uid of [t.sender,t.recipient].sort())accounts[uid]=await this.account(c,uid);
    const s=accounts[t.sender],r=accounts[t.recipient];let status=expired?'expired':requested;
    if(status==='accepted'){
     if((r.save.pantry[t.want_item]||0)<t.want_qty)throw problem('Alıcının deposunda yeterli malzeme yok.',409);
     r.save.pantry[t.want_item]-=t.want_qty;s.save.pantry[t.want_item]=(s.save.pantry[t.want_item]||0)+t.want_qty;r.save.pantry[t.give_item]=(r.save.pantry[t.give_item]||0)+t.give_qty;
     await this.save(c,r);
    }else s.save.pantry[t.give_item]=(s.save.pantry[t.give_item]||0)+t.give_qty;
    await this.save(c,s);
    await c.query('update cafe_trade_offers set status=$2,handled_at=now() where id=$1',[tradeID,status]);if(this.auditTrade)await this.auditTrade(c,t,status);return {tradeID,status};
   };
   const result=system?await execute():await this.request(c,id,rid,'trade-'+action,{tradeID},execute);
   if(system)return result;return this.response(await this.account(c,id),{...result,trades:await this.list(c,id)});
  });
 }
 async expire(id){const rows=(await this.pool.query("select id from cafe_trade_offers where status='pending' and expires_at<=$2 and (sender=$1 or recipient=$1) order by id limit 50",[id,new Date(this.clock())])).rows;for(const r of rows)await this.settle(id,r.id,'expire',null,{system:true});}
 async list(c,id){return (await c.query("select t.id,t.give_item,t.give_qty,t.want_item,t.want_qty,t.status,extract(epoch from t.created_at)::bigint as created,extract(epoch from t.expires_at)::bigint as expires,coalesce(s.code,'—') as sender_code,coalesce(r.code,'—') as recipient_code,coalesce(s.save->>'name','Silinmiş kafe') as sender_name,coalesce(r.save->>'name','Silinmiş kafe') as recipient_name,case when t.sender=$1 then 'outgoing' else 'incoming' end as direction from cafe_trade_offers t left join cafe_game_accounts s on s.user_id=t.sender left join cafe_game_accounts r on r.user_id=t.recipient where t.sender=$1 or t.recipient=$1 order by t.created_at desc,t.id limit 100",[id])).rows;}
 async trades(id){await this.expire(id);return this.transaction(async c=>this.response(await this.account(c,id),{trades:await this.list(c,id)}));}
}
