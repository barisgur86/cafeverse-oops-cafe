// Live negative checks: never creates accounts or sends email. No fake server.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const call=(path,body)=>fetch(config.url+'/auth/v1/'+path,{method:body?'POST':'GET',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
let r=await call('settings');assert.equal(r.status,200);let d=await r.json();
assert.equal(d.external.apple,true);assert.equal(d.external.email,true);assert.equal(d.external.google,false);assert.equal(d.external.anonymous_users,false);
r=await call('user');assert.ok([401,403].includes(r.status));
r=await call('token?grant_type=id_token',{provider:'apple',id_token:'invalid-token-negative-check',nonce:'invalid-nonce'});assert.ok(r.status>=400&&r.status<500);
r=await call('token?grant_type=password',{email:'',password:''});assert.ok(r.status>=400&&r.status<500);
console.log('PASS live Supabase: Apple/email enabled, Google/anonymous disabled; unauthenticated user, invalid Apple token and empty login rejected. No accounts created.');
