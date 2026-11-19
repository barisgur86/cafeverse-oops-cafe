import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {SignedDataVerifier,Environment} from '@apple/app-store-server-library';
import {AppleVerifier,bundleID} from '../source/server/secure/apple.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cafe-jws-'));
const openssl=args=>execFileSync('openssl',args,{cwd:dir,stdio:'pipe'});
try{
 for(const name of ['root','intermediate','leaf'])openssl(['ecparam','-name','prime256v1','-genkey','-noout','-out',name+'.key']);
 openssl(['req','-new','-x509','-key','root.key','-subj','/CN=Fixture root','-days','2','-out','root.pem']);
 for(const name of ['intermediate','leaf']){
  openssl(['req','-new','-key',name+'.key','-subj','/CN=Fixture '+name,'-out',name+'.csr']);
  fs.writeFileSync(path.join(dir,name+'.ext'),name==='intermediate'?'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n1.2.840.113635.100.6.2.1=DER:05:00':'basicConstraints=critical,CA:FALSE\nkeyUsage=digitalSignature\n1.2.840.113635.100.6.11.1=DER:05:00');
  const parent=name==='intermediate'?'root':'intermediate';openssl(['x509','-req','-in',name+'.csr','-CA',parent+'.pem','-CAkey',parent+'.key','-CAcreateserial','-days','2','-extfile',name+'.ext','-out',name+'.pem']);
 }
 const certificates=['leaf','intermediate','root'].map(n=>new crypto.X509Certificate(fs.readFileSync(path.join(dir,n+'.pem'))).raw);
 const actor=crypto.randomUUID(),body={bundleId:bundleID,environment:'Sandbox',transactionId:'4567',originalTransactionId:'4567',productId:'com.cafeverse.oopscafe.coins250',type:'Consumable',quantity:1,appAccountToken:actor,purchaseDate:Date.now(),signedDate:Date.now()};
 function sign(value,key='leaf.key'){
  const header=Buffer.from(JSON.stringify({alg:'ES256',x5c:certificates.map(c=>c.toString('base64'))})).toString('base64url'),payload=Buffer.from(JSON.stringify(value)).toString('base64url');
  const input=header+'.'+payload;return input+'.'+crypto.sign('sha256',Buffer.from(input),{key:fs.readFileSync(path.join(dir,key)),dsaEncoding:'ieee-p1363'}).toString('base64url');
 }
 // Production construction keeps OCSP enabled. Fixtures substitute a private
 // temporary root and disable online checks ONLY for offline cryptographic tests.
 const verifier=new AppleVerifier([certificates[2]],'Sandbox');
 verifier.verifier=new SignedDataVerifier([certificates[2]],false,Environment.SANDBOX,bundleID);
 for(const coins of [250,750,2000])assert.equal((await verifier.transaction(sign({...body,productId:'com.cafeverse.oopscafe.coins'+coins}),actor)).coins,coins);
 await assert.rejects(verifier.transaction(sign(body,'root.key'),actor),/imzası/);
 const valid=sign(body),parts=valid.split('.');parts[1]=Buffer.from(JSON.stringify({...body,productId:'com.cafeverse.oopscafe.coins2000'})).toString('base64url');await assert.rejects(verifier.transaction(parts.join('.'),actor),/imzası/);
 await assert.rejects(verifier.transaction(sign({...body,bundleId:'other'}),actor));
 await assert.rejects(verifier.transaction(sign({...body,environment:'Production'}),actor));
 const untrusted=new AppleVerifier([certificates[0]],'Sandbox');untrusted.verifier=new SignedDataVerifier([certificates[0]],false,Environment.SANDBOX,bundleID);await assert.rejects(untrusted.transaction(valid,actor));
 console.log('PASS Apple JWS cryptography: official verifier accepts signed fixture chain, rejects wrong key, changed payload, wrong bundle/environment and untrusted root. Not an Apple Sandbox payment.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
