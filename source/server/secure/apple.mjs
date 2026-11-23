import {EdgeSignedDataVerifier} from './apple-edge-verifier.mjs';
import {VerificationStatus,Environment} from '@apple/app-store-server-library';
export const bundleID='com.cafeverse.oopscafe';
export const appAppleID=6833898140;
export const products=Object.freeze({'com.cafeverse.oopscafe.coins250':250,'com.cafeverse.oopscafe.coins750':750,'com.cafeverse.oopscafe.coins2000':2000});
export function problem(message,status=400){return Object.assign(new Error(message),{status});}
// Log only bounded verifier codes; never receipts, account IDs or signed payloads.
export function verificationDiagnostic(error){
 const chain=[];for(let e=error;e&&chain.length<4;e=e.cause){chain.push({name:typeof e.name==='string'?e.name.replace(/[^a-zA-Z0-9_]/g,'').slice(0,40):'Error',status:Number.isInteger(e.status)?e.status:null,frames:String(e.stack||'').split('\n').slice(1,5).map(line=>line.match(/^\s+at ([A-Za-z0-9_.<>]+)/)?.[1]||'').filter(Boolean),code:typeof e.code==='string'?e.code.replace(/[^A-Z0-9_]/g,'').slice(0,40):null});}
 return chain;
}
function verificationFailure(error,kind){console.error('cafe_apple_verification',JSON.stringify({kind,chain:verificationDiagnostic(error)}));}
export class AppleVerifier {
 constructor(roots,environment){
  if(!roots.length||!['Sandbox','Production'].includes(environment))throw Error('Apple roots/environment required');
  this.environment=environment;
  this.verifier=new EdgeSignedDataVerifier(roots,true,environment==='Sandbox'?Environment.SANDBOX:Environment.PRODUCTION,bundleID,appAppleID);
 }
 async transaction(jws,userID,{allowRevoked=false}={}){
  if(typeof jws!=='string'||jws.length>50000)throw problem('Apple işlem verisi eksik.');
  let t;try{t=await this.verifier.verifyAndDecodeTransaction(jws);}catch(error){verificationFailure(error,'transaction');if(error.status===VerificationStatus.RETRYABLE_VERIFICATION_FAILURE)throw problem('Apple doğrulama servisine ulaşılamadı. Satın alma bekliyor; yeniden dene.',503);throw problem('Apple imzası doğrulanamadı.',422);}
  return this.validate(t,userID,allowRevoked);
 }
 validate(t,userID,allowRevoked=false){
  if(t.bundleId!==bundleID||t.environment!==this.environment||!products[t.productId]||t.type!=='Consumable'||t.quantity!==1||!/^\d{1,32}$/.test(t.transactionId||'')||!/^\d{1,32}$/.test(t.originalTransactionId||'')||!t.appAccountToken||t.appAccountToken.toLowerCase()!==userID.toLowerCase()||(!allowRevoked&&t.revocationDate)||!Number.isFinite(t.purchaseDate)||t.purchaseDate>Date.now()+300000)throw problem('Apple işlemi bu hesap veya ürün için geçersiz.',422);
  return {...t,coins:products[t.productId]};
 }
 async notification(jws){
  let n;try{n=await this.verifier.verifyAndDecodeNotification(jws);}catch(error){verificationFailure(error,'notification');throw problem('Apple bildirim imzası doğrulanamadı.',422);}
  if(!/^[a-f0-9-]{36}$/i.test(n.notificationUUID||'')||!Number.isSafeInteger(n.signedDate)||n.signedDate>Date.now()+300000||n.data?.bundleId!==bundleID||n.data.environment!==this.environment)throw problem('Desteklenmeyen Apple bildirimi.',422);
  if(!['REFUND','REVOKE','REFUND_REVERSED'].includes(n.notificationType))return {ignored:true};
  if(!n.data.signedTransactionInfo)throw problem('Apple işlem verisi eksik.',422);
  // Decode the nested transaction only after both Apple signatures validate.
  let t;try{t=await this.verifier.verifyAndDecodeTransaction(n.data.signedTransactionInfo);}catch(error){verificationFailure(error,'notification_transaction');throw problem('Apple işlem imzası doğrulanamadı.',422);}
  return {notification:n,transaction:this.validate(t,t.appAccountToken||'',true),jws:n.data.signedTransactionInfo};
 }
}
