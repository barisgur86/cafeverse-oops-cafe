import assert from 'node:assert/strict';import {handler} from '../source/server/secure/http.mjs';
let mutations=0;const economy={features:{iap:false,trades:false,market:false,auctions:false,social:false},credit(){mutations++;},offer(){mutations++;},trades(){mutations++;},market(){mutations++;},createAuction(){mutations++;}};
const app=handler(economy,async()=> '11111111-1111-4111-8111-111111111111');
for(const [path,method] of [['/api/ios-store-credit','POST'],['/api/trades','POST'],['/api/trades','GET'],['/api/market','GET'],['/api/auctions','POST']]){const result=await app(new Request('https://cafe.invalid'+path,{method,headers:{'content-type':'application/json'},...(method==='POST'?{body:'{}'}:{})}));assert.equal(result.status,503);}
for(const [body,expected] of [['{bad',400],['x'.repeat(65001),413]]){const r=await app(new Request('https://cafe.invalid/api/stock',{method:'POST',headers:{'content-type':'application/json'},body}));assert.equal(r.status,expected);}
assert.equal(mutations,0);console.log('PASS release gates: unverified IAP, trades, marketplace and auctions fail closed before any mutation.');
