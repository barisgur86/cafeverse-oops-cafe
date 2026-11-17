import fs from 'node:fs';
import http from 'node:http';
import pg from 'pg';
import {AppleVerifier} from './apple.mjs';
import {Economy} from './economy.mjs';
import {handler,supabaseAuthenticator} from './http.mjs';
for(const key of ['DATABASE_URL','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','APPLE_ROOT_CERTIFICATES','APPLE_ENVIRONMENT'])if(!process.env[key])throw Error(key+' required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:10});
const apple=new AppleVerifier(process.env.APPLE_ROOT_CERTIFICATES.split(',').map(p=>fs.readFileSync(p)),process.env.APPLE_ENVIRONMENT);
const app=handler(new Economy(pool,apple),supabaseAuthenticator(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY));
const server=http.createServer(async(req,res)=>{
 try{
  let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>65000){res.writeHead(413);res.end();return;}chunks.push(c);}
  const request=new Request('https://cafeverse.invalid'+req.url,{method:req.method,headers:req.headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})});
  const result=await app(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(503);res.end();}
});server.requestTimeout=15000;server.headersTimeout=10000;server.listen(Number(process.env.PORT||8080),'0.0.0.0');
