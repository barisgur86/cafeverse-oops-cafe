import {SignedDataVerifier,Environment} from '@apple/app-store-server-library';
export const bundleID='com.cafeverse.oopscafe';
export const appAppleID=6833898140;
export const products=Object.freeze({'com.cafeverse.oopscafe.coins250':250,'com.cafeverse.oopscafe.coins750':750,'com.cafeverse.oopscafe.coins2000':2000});
export function problem(message,status=400){return Object.assign(new Error(message),{status});}
export class AppleVerifier {
 constructor(roots,environment){
  if(!roots.length||!['Sandbox','Production'].includes(environment))throw Error('Apple roots/environment required');
  this.environment=environment;
  this.verifier=new SignedDataVerifier(roots,true,environment==='Sandbox'?Environment.SANDBOX:Environment.PRODUCTION,bundleID,appAppleID);
 }
 async transaction(jws,userID,{allowRevoked=false}={}){
  if(typeof jws!=='string'||jws.length>50000)throw problem('Apple işlem verisi eksik.');
  let t;try{t=await this.verifier.verifyAndDecodeTransaction(jws);}catch{throw problem('Apple imzası doğrulanamadı.',422);}
  return this.validate(t,userID,allowRevoked);
 }
 validate(t,userID,allowRevoked=false){
  if(t.bundleId!==bundleID||t.environment!==this.environment||!products[t.productId]||t.type!=='Consumable'||t.quantity!==1||!/^\d{1,32}$/.test(t.transactionId||'')||!/^\d{1,32}$/.test(t.originalTransactionId||'')||!t.appAccountToken||t.appAccountToken.toLowerCase()!==userID.toLowerCase()||(!allowRevoked&&t.revocationDate)||!Number.isFinite(t.purchaseDate)||t.purchaseDate>Date.now()+300000)throw problem('Apple işlemi bu hesap veya ürün için geçersiz.',422);
  return {...t,coins:products[t.productId]};
 }
 async notification(jws){
  let n;try{n=await this.verifier.verifyAndDecodeNotification(jws);}catch{throw problem('Apple bildirim imzası doğrulanamadı.',422);}
  if(!/^[a-f0-9-]{36}$/i.test(n.notificationUUID||'')||!Number.isSafeInteger(n.signedDate)||n.signedDate>Date.now()+300000||n.data?.bundleId!==bundleID||n.data.environment!==this.environment)throw problem('Desteklenmeyen Apple bildirimi.',422);
  if(!['REFUND','REVOKE','REFUND_REVERSED'].includes(n.notificationType))return {ignored:true};
  if(!n.data.signedTransactionInfo)throw problem('Apple işlem verisi eksik.',422);
  // Decode the nested transaction only after both Apple signatures validate.
  let t;try{t=await this.verifier.verifyAndDecodeTransaction(n.data.signedTransactionInfo);}catch{throw problem('Apple işlem imzası doğrulanamadı.',422);}
  return {notification:n,transaction:this.validate(t,t.appAccountToken||'',true),jws:n.data.signedTransactionInfo};
 }
}
