import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {SignedDataVerifier,Environment,VerificationException,VerificationStatus} from '@apple/app-store-server-library';
import {EdgeSignedDataVerifier,EdgeCertificate} from '../source/server/secure/apple-edge-verifier.mjs';
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
 for(const Verifier of [SignedDataVerifier,EdgeSignedDataVerifier]){
 const verifier=new AppleVerifier([certificates[2]],'Sandbox');
 verifier.verifier=new Verifier([certificates[2]],false,Environment.SANDBOX,bundleID);
 for(const coins of [250,750,2000])assert.equal((await verifier.transaction(sign({...body,productId:'com.cafeverse.oopscafe.coins'+coins}),actor)).coins,coins);
 await assert.rejects(verifier.transaction(sign(body,'root.key'),actor),/imzası/);
 const valid=sign(body),parts=valid.split('.');parts[1]=Buffer.from(JSON.stringify({...body,productId:'com.cafeverse.oopscafe.coins2000'})).toString('base64url');await assert.rejects(verifier.transaction(parts.join('.'),actor),/imzası/);
 await assert.rejects(verifier.transaction(sign({...body,bundleId:'other'}),actor));
 await assert.rejects(verifier.transaction(sign({...body,environment:'Production'}),actor));
 const untrusted=new AppleVerifier([certificates[0]],'Sandbox');untrusted.verifier=new Verifier([certificates[0]],false,Environment.SANDBOX,bundleID);await assert.rejects(untrusted.transaction(valid,actor));
 await assert.rejects(verifier.transaction(sign({...body,signedDate:946684800000}),actor));
 }
 const edge=new AppleVerifier([certificates[2]],'Sandbox');let ocsp=0;edge.verifier.checkOCSPStatus=async()=>{ocsp++};await edge.transaction(sign(body),actor);assert.equal(ocsp,2);
 const unavailable=new AppleVerifier([certificates[2]],'Sandbox');unavailable.verifier.checkOCSPStatus=async()=>{throw new VerificationException(VerificationStatus.RETRYABLE_VERIFICATION_FAILURE)};await assert.rejects(unavailable.transaction(sign(body),actor),e=>e.status===503);
 const adapter=new EdgeCertificate(certificates[2]);assert.equal(adapter.verify(adapter.publicKey),true);assert.equal(adapter.raw.equals(certificates[2]),true);
 const marker=fs.readFileSync(path.join(dir,'leaf.ext'),'utf8');fs.writeFileSync(path.join(dir,'leaf.ext'),'basicConstraints=critical,CA:FALSE\nkeyUsage=digitalSignature');openssl(['x509','-req','-in','leaf.csr','-CA','intermediate.pem','-CAkey','intermediate.key','-CAcreateserial','-days','2','-extfile','leaf.ext','-out','leaf-no-marker.pem']);
 const original=certificates[0];certificates[0]=new crypto.X509Certificate(fs.readFileSync(path.join(dir,'leaf-no-marker.pem'))).raw;const noMarker=new AppleVerifier([certificates[2]],'Sandbox');noMarker.verifier=new EdgeSignedDataVerifier([certificates[2]],false,Environment.SANDBOX,bundleID);await assert.rejects(noMarker.transaction(sign(body),actor));certificates[0]=original;
 // Reproduce the hosted runtime gap: these native methods throw, while the
 // adapter must still validate a full fixture chain and signature.
 const descriptors=new Map(['raw','toString','verify','infoAccess','checkIssued'].map(k=>[k,Object.getOwnPropertyDescriptor(crypto.X509Certificate.prototype,k)]));
 try{for(const k of descriptors.keys())Object.defineProperty(crypto.X509Certificate.prototype,k,{configurable:true,get(){throw Object.assign(new Error('Not implemented'),{code:'ERR_NOT_IMPLEMENTED'})}});
  const limited=new AppleVerifier([certificates[2]],'Sandbox');limited.verifier=new EdgeSignedDataVerifier([certificates[2]],false,Environment.SANDBOX,bundleID);assert.equal((await limited.transaction(sign(body),actor)).coins,250);
 }finally{for(const [k,d] of descriptors)if(d)Object.defineProperty(crypto.X509Certificate.prototype,k,d);else delete crypto.X509Certificate.prototype[k]}
 console.log('PASS Apple edge adapter: matches official verifier fixture decisions; pinned chain, ES256, Apple marker, expiry and account policy retained; online OCSP called for both certificates; temporary verification outage remains pending (503).');
 console.log('PASS Apple JWS cryptography: official verifier accepts signed fixture chain, rejects wrong key, changed payload, wrong bundle/environment and untrusted root. Not an Apple Sandbox payment.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
