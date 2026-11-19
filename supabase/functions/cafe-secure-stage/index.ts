import pg from 'pg';
import crypto from 'node:crypto';
import {Buffer} from 'node:buffer';
import {AppleVerifier} from '../../../source/server/secure/apple.mjs';
import {MarketEconomy} from '../../../source/server/secure/marketplace.mjs';
import {handler,supabaseAuthenticator} from '../../../source/server/secure/http.mjs';
import {AccountProvider,DeletionVault} from '../../../source/server/secure/account-provider.mjs';
import {AccountLifecycle} from '../../../source/server/secure/account-lifecycle.mjs';
import {appleRootDER} from './apple-root.mjs';
const root=Buffer.from(appleRootDER,'base64');
if(crypto.createHash('sha256').update(root).digest('hex')!=='63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179')throw Error('Apple root mismatch');
const rawPool=new pg.Pool({connectionString:Deno.env.get('SUPABASE_DB_URL'),max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true}});
// All economy statements are scoped to the isolated stage; never fall back to
// public game tables. Table names are static, values stay parameterized.
const tables=/\b(cafe_coin_gifts|cafe_account_deletions|cafe_account_cutovers|cafe_cloud_saves|cafe_game_accounts|cafe_apple_transactions|cafe_trade_offers|cafe_secure_requests|cafe_apple_notifications|cafe_market_listings|cafe_auctions|cafe_auction_bids|cafe_economy_history|cafe_market_notifications|cafe_finalize_auction|cafe_settle_expired_auctions|cafe_expire_market_listings)\b/g;
const scoped=(sql:string)=>sql.replace(tables,'cafe_stage_062.$1');
const pool={query:(sql:string,args?:unknown[])=>rawPool.query(scoped(sql),args),async connect(){const c=await rawPool.connect();return {query:(sql:string,args?:unknown[])=>c.query(scoped(sql),args),readLegacyBackup:async(id:string)=>(await c.query('select revision,save from public.cafe_cloud_saves where user_id=$1 for share',[id])).rows[0],release:()=>c.release()};}};
const keys=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}');
const key=keys.default||Deno.env.get('SUPABASE_ANON_KEY');
if(!key||!Deno.env.get('SUPABASE_URL')||!Deno.env.get('SUPABASE_DB_URL'))throw Error('Managed server configuration missing');
const economy=new MarketEconomy(pool,new AppleVerifier([root],'Sandbox'),{lifecycle:true,legacyImport:true,features:{coinGifts:true}});
const admin=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
// Stage derivation uses an existing managed server-only secret. Production
// requires a separately managed stable deletion key and reviewed rotation.
const deletionKey=Deno.env.get('CAFE_DELETION_KEY')||(admin?Buffer.from(crypto.hkdfSync('sha256',Buffer.from(admin),Buffer.from(Deno.env.get('SUPABASE_URL')!),Buffer.from('cafeverse-stage-deletion-v1'),32)).toString('hex'):null);
const lifecycle=admin&&deletionKey?new AccountLifecycle(economy,new AccountProvider({url:Deno.env.get('SUPABASE_URL')!,key,adminKey:admin,appleSecret:Deno.env.get('APPLE_AUTH_CLIENT_SECRET')}),new DeletionVault(deletionKey)):undefined;
const app=handler(economy,supabaseAuthenticator(Deno.env.get('SUPABASE_URL')!,key),{lifecycle});
Deno.serve(async(req:Request)=>{
 const url=new URL(req.url);url.pathname=url.pathname.replace(/^\/(?:functions\/v1\/)?cafe-secure-stage(?=\/|$)/,'')||'/';
 return app(new Request(url,req));
});
