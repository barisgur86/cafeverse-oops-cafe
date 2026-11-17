import pg from 'pg';
import crypto from 'node:crypto';
import {Buffer} from 'node:buffer';
import {AppleVerifier} from '../../../source/server/secure/apple.mjs';
import {Economy} from '../../../source/server/secure/economy.mjs';
import {handler,supabaseAuthenticator} from '../../../source/server/secure/http.mjs';
import {appleRootDER} from './apple-root.mjs';
const root=Buffer.from(appleRootDER,'base64');
if(crypto.createHash('sha256').update(root).digest('hex')!=='63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179')throw Error('Apple root mismatch');
const rawPool=new pg.Pool({connectionString:Deno.env.get('SUPABASE_DB_URL'),max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true}});
// All economy statements are scoped to the isolated stage; never fall back to
// public game tables. Table names are static, values stay parameterized.
const tables=/\b(cafe_game_accounts|cafe_apple_transactions|cafe_trade_offers|cafe_secure_requests|cafe_apple_notifications)\b/g;
const scoped=(sql:string)=>sql.replace(tables,'cafe_stage_062.$1');
const pool={query:(sql:string,args?:unknown[])=>rawPool.query(scoped(sql),args),async connect(){const c=await rawPool.connect();return {query:(sql:string,args?:unknown[])=>c.query(scoped(sql),args),release:()=>c.release()};}};
const keys=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}');
const key=keys.default||Deno.env.get('SUPABASE_ANON_KEY');
if(!key||!Deno.env.get('SUPABASE_URL')||!Deno.env.get('SUPABASE_DB_URL'))throw Error('Managed server configuration missing');
const app=handler(new Economy(pool,new AppleVerifier([root],'Sandbox')),supabaseAuthenticator(Deno.env.get('SUPABASE_URL')!,key));
Deno.serve(async(req:Request)=>{
 const url=new URL(req.url);url.pathname=url.pathname.replace(/^\/(?:functions\/v1\/)?cafe-secure-stage(?=\/|$)/,'')||'/';
 return app(new Request(url,req));
});
