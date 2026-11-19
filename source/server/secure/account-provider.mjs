import crypto from 'node:crypto';
import {Buffer} from 'node:buffer';
import {problem,bundleID} from './apple.mjs';

export class DeletionVault {
 constructor(key){if(!/^[a-f0-9]{64}$/i.test(key||''))throw Error('Account deletion encryption key required');this.key=Buffer.from(key,'hex');}
 seal(value,aad){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',this.key,iv);cipher.setAAD(Buffer.from(aad));const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');}
 open(value,aad){const data=Buffer.from(value,'base64'),cipher=crypto.createDecipheriv('aes-256-gcm',this.key,data.subarray(0,12));cipher.setAAD(Buffer.from(aad));cipher.setAuthTag(data.subarray(12,28));return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString());}
}

export class AccountProvider {
 constructor({url,key,adminKey,appleSecret,fetcher=fetch}){this.base=new URL(url);if(this.base.protocol!=='https:')throw Error('HTTPS auth URL required');this.key=key;this.adminKey=adminKey;this.appleSecret=appleSecret;this.fetch=fetcher;}
 async auth(path,{method='GET',body,token,admin=false}={}){
  const r=await this.fetch(new URL('/auth/v1/'+path,this.base),{method,headers:{apikey:admin?this.adminKey:this.key,Authorization:'Bearer '+(token||(admin?this.adminKey:this.key)),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  if(!r.ok){if(admin&&method==='DELETE'&&r.status===404)return {};throw problem('Hesap doğrulaması tamamlanamadı. Yeniden dene.',r.status===401||r.status===403?401:503);}
  return r.status===204?{}:r.json();
 }
 current(token){if(!token)throw problem('Oturum gerekli.',401);return this.auth('user',{token});}
 needsApple(user){return user.identities?.some(i=>i.provider==='apple')===true||user.app_metadata?.provider==='apple'||user.app_metadata?.providers?.includes('apple')===true;}
 async confirm(user,body){
  if(this.needsApple(user)){
   if(!this.appleSecret)throw problem('Apple hesap silme bağlantısı henüz hazır değil. Hesabın korunuyor.',503);
   if(typeof body.authorization_code!=='string'||body.authorization_code.length>4096||!body.authorization_code||typeof body.nonce!=='string'||body.nonce.length>256||!body.nonce)throw problem('Apple ile yeniden doğrula.',401);
   const r=await this.fetch('https://appleid.apple.com/auth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:bundleID,client_secret:this.appleSecret,code:body.authorization_code,grant_type:'authorization_code'}),signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw problem('Apple doğrulaması tamamlanamadı; hesap silinmedi.',401);
   const data=await r.json();if(!data.id_token||!data.refresh_token)throw problem('Apple doğrulaması eksik; hesap silinmedi.',401);
   // Supabase validates Apple's signature/audience/nonce, including the token
   // issued for THIS authorization code, rather than a client-supplied subject.
   const verified=await this.auth('token?grant_type=id_token',{method:'POST',body:{provider:'apple',id_token:data.id_token,nonce:body.nonce}});
   if(verified.user?.id!==user.id||!verified.access_token)throw problem('Başka hesabın Apple girişi kullanılamaz.',403);
   return {appleToken:data.refresh_token,accessToken:verified.access_token};
  }
  if(!user.email||typeof body.password!=='string'||!body.password||body.password.length>1024)throw problem('Hesabının şifresini doğrula.',401);
  const verified=await this.auth('token?grant_type=password',{method:'POST',body:{email:user.email,password:body.password}});
  if(verified.user?.id!==user.id||!verified.access_token)throw problem('Başka hesap silinemez.',403);
  return {accessToken:verified.access_token};
 }
 async revokeApple(token){const r=await this.fetch('https://appleid.apple.com/auth/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:bundleID,client_secret:this.appleSecret,token,token_type_hint:'refresh_token'}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw problem('Apple yetkisi kaldırılamadı; silme güvenle yeniden denenecek.',503);}
 async signOut(token){try{await this.auth('logout?scope=global',{method:'POST',token});}catch(e){if(e.status!==401)throw e;}}
 async deleteUser(id){await this.auth('admin/users/'+id,{method:'DELETE',admin:true,body:{should_soft_delete:false}});}
}
