import crypto from 'node:crypto';
import {problem} from './apple.mjs';
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// A confirmed deletion has a random, short-lived completion receipt. This lets
// the client recover a lost response AFTER Auth has invalidated its session.
// Receipts cannot start a deletion, choose a user, or read any player data.
export class AccountLifecycle {
 constructor(economy,provider,vault,{clock=Date.now}={}){this.economy=economy;this.pool=economy.pool;this.provider=provider;this.vault=vault;this.clock=clock;}
 async info(token){const u=await this.provider.current(token);return {deletionAvailable:!!this.provider.adminKey&&(!this.provider.needsApple(u)||!!this.provider.appleSecret),appleRequired:this.provider.needsApple(u)};}
 async start(token,b){
  if(b.confirmation!=='DELETE'||!idPattern.test(b.request_id||''))throw problem('Hesap silme onayı gerekli.');
  const u=await this.provider.current(token);if(!idPattern.test(u.id||''))throw problem('Oturum gerekli.',401);
  if(!this.provider.adminKey)throw problem('Hesap silme sunucusu hazır değil; hesabın korundu.',503);
  const old=(await this.pool.query('select * from cafe_account_deletions where user_id=$1',[u.id])).rows[0];
  let sealed;
  if(!old){const secret=await this.provider.confirm(u,b);sealed=this.vault.seal(secret,u.id);}
  const receipt=crypto.randomBytes(32).toString('hex'),expires=new Date(this.clock()+86400000);
  await this.economy.transaction(async c=>{
   await this.economy.lock(c,'delete:'+u.id);
   // Lock the account before installing the gate. A previously running stock,
   // offer or service transaction finishes first; subsequent ones fail closed.
   await c.query('select user_id from cafe_game_accounts where user_id=$1 for update',[u.id]);
   const current=(await c.query('select * from cafe_account_deletions where user_id=$1 for update',[u.id])).rows[0];
   if(current?.status==='deleted')throw problem('Hesap zaten silinmiş.',410);
   if(current)await c.query('update cafe_account_deletions set receipt_hash=$2,expires_at=$3 where user_id=$1',[u.id,digest(receipt),expires]);
   else await c.query('insert into cafe_account_deletions(user_id,receipt_hash,expires_at,secret) values($1,$2,$3,$4)',[u.id,digest(receipt),expires,sealed]);
  });
  return {receipt,status:old?.status||'pending'};
 }
 async finish(receipt){
  if(!/^[a-f0-9]{64}$/.test(receipt||''))throw problem('Silme makbuzu geçersiz.',401);
  const hash=digest(receipt),c=await this.pool.connect();let locked=false,lockKey;
  try{
   const found=(await c.query('select user_id from cafe_account_deletions where receipt_hash=$1',[hash])).rows[0];
   if(!found)throw problem('Silme makbuzu geçersiz.',401);
   lockKey='delete:'+found.user_id;
   locked=(await c.query('select pg_try_advisory_lock(hashtextextended($1,0)) as locked',[lockKey])).rows[0].locked;
   if(!locked)throw problem('Silme işlemi sürüyor; yeniden kontrol et.',409);
   const job=(await c.query('select * from cafe_account_deletions where receipt_hash=$1',[hash])).rows[0];
   if(!job)throw problem('Silme makbuzu geçersiz.',401);
   if(job.status==='deleted')return {deleted:true};
   if(new Date(job.expires_at).getTime()<this.clock())throw problem('Yeniden giriş yaparak hesap silmeyi doğrula.',410);
   const secret=this.vault.open(job.secret,job.user_id);
   if(job.status==='pending'){
    if(secret.appleToken)await this.provider.revokeApple(secret.appleToken);
    await c.query("update cafe_account_deletions set status='revoked',updated_at=now() where user_id=$1",[job.user_id]);job.status='revoked';
   }
   if(job.status==='revoked'){
    await this.cleanup(c,job.user_id);
    job.status='cleaned';
   }
   await this.provider.signOut(secret.accessToken);
   await this.provider.deleteUser(job.user_id);
   await c.query("update cafe_account_deletions set status='deleted',secret=null,updated_at=now() where user_id=$1",[job.user_id]);
   return {deleted:true};
  }finally{if(locked)await c.query('select pg_advisory_unlock(hashtextextended($1,0))',[lockKey]);c.release();}
 }
 async cleanup(c,id){
  await c.query('begin');
  try{
   await c.query("set local lock_timeout='5s'");await c.query("set local statement_timeout='10s'");
   const trades=(await c.query("select * from cafe_trade_offers where status='pending' and (sender=$1 or recipient=$1) order by id for update",[id])).rows;
   const market=!!(await c.query("select to_regclass('cafe_auctions') as name")).rows[0].name;
   const auctions=market?(await c.query("select * from cafe_auctions where status='active' and (seller=$1 or highest_bidder=$1) order by id for update",[id])).rows:[];
   if(market)await c.query("select id from cafe_market_listings where seller=$1 and status='active' order by id for update",[id]);
   const ids=[...new Set([id,...trades.map(t=>t.sender),...auctions.flatMap(a=>[a.seller,a.highest_bidder])].filter(Boolean))].sort(),accounts={};
   for(const uid of ids){const a=(await c.query('select * from cafe_game_accounts where user_id=$1 for update',[uid])).rows[0];if(a)accounts[uid]=a;}
   const changed=new Set();
   const stock=(uid,item,n)=>{if(uid===id)return;const a=accounts[uid];if(!a)throw problem('Karşı oyuncunun malzemeleri güvenle iade edilemedi.',409);a.save.pantry[item]=(a.save.pantry[item]||0)+n;changed.add(uid);};
   for(const t of trades){stock(t.sender,t.give_item,t.give_qty);await c.query("update cafe_trade_offers set status='cancelled',handled_at=now() where id=$1",[t.id]);}
   for(const a of auctions){stock(a.seller,a.item,a.quantity);if(a.highest_bidder&&a.highest_bidder!==id){const buyer=accounts[a.highest_bidder];if(!buyer)throw problem('Teklif bakiyesi güvenle iade edilemedi.',409);const repay=Math.min(Number(buyer.refund_debt),Number(a.highest_bid));buyer.save.coins+=Number(a.highest_bid)-repay;buyer.refund_debt=Number(buyer.refund_debt)-repay;changed.add(a.highest_bidder);}await c.query("update cafe_auctions set status='cancelled',handled_at=now() where id=$1",[a.id]);}
   if(market)await c.query("update cafe_market_listings set status='cancelled',handled_at=now() where seller=$1 and status='active'",[id]);
   for(const uid of changed)await this.economy.save(c,accounts[uid]);
   // Scrub only this player's personal/cache data. Transaction IDs remain as
   // anonymous replay tombstones; the Auth FK migration removes their owner.
   await c.query('delete from cafe_secure_requests where user_id=$1',[id]);
   if(market){await c.query('delete from cafe_market_notifications where user_id=$1',[id]);await c.query('delete from cafe_economy_history where user_id=$1',[id]);}
   await c.query("update cafe_apple_transactions set signed_transaction='' where user_id=$1",[id]);
   await c.query("update cafe_account_deletions set status='cleaned',updated_at=now() where user_id=$1",[id]);
   await c.query('commit');
  }catch(e){await c.query('rollback');throw e;}
 }
}
