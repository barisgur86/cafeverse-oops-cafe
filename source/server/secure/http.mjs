import {problem} from './apple.mjs';
export function supabaseAuthenticator(url,key,fetcher=fetch){
 const base=new URL(url);if(base.protocol!=='https:')throw Error('HTTPS Supabase URL required');
 return async header=>{
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(header||''))throw problem('Oturum gerekli.',401);
  const r=await fetcher(new URL('/auth/v1/user',base),{headers:{apikey:key,Authorization:header},signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw problem('Oturum doğrulanamadı.',401);const user=await r.json();
  if(!/^[0-9a-f-]{36}$/i.test(user.id||''))throw problem('Oturum doğrulanamadı.',401);return user.id.toLowerCase();
 };
}
export function handler(economy,authenticate){
 const rates=new Map();
 return async req=>{
  try{
   const url=new URL(req.url),path=url.pathname;
   if(req.method!=='GET'&&req.method!=='POST')throw problem('Yöntem desteklenmiyor.',405);
   let b;if(req.method==='POST'){
    if(!(req.headers.get('content-type')||'').startsWith('application/json'))throw problem('JSON gerekli.',415);
    const text=await req.text();if(text.length>65000)throw problem('İstek fazla büyük.',413);
    try{b=JSON.parse(text);}catch{throw problem('Geçersiz JSON.');}if(!b||Array.isArray(b)||typeof b!=='object')throw problem('Geçersiz istek.');
   }
   if(path==='/health'&&req.method==='GET'){await economy.pool.query('select last_event_signed_at from cafe_apple_transactions limit 0');return Response.json({ready:true,schema:'authoritative-economy-v1',environment:economy.apple.environment,features:economy.features});}
   if(path==='/apple/notifications'&&req.method==='POST')return Response.json(await economy.notification(b.signedPayload));
   const id=await authenticate(req.headers.get('authorization'));
   const minute=Math.floor(Date.now()/60000),entry=rates.get(id);if(entry?.minute===minute){if(++entry.count>180)throw problem('Çok fazla istek. Biraz bekle.',429);}else{rates.set(id,{minute,count:1});if(rates.size>10000)for(const [k,v] of rates)if(v.minute<minute)rates.delete(k);}
   const required=path==='/api/ios-store-credit'?'iap':path.startsWith('/api/trades')?'trades':(path.startsWith('/api/market')||['/api/wallet','/api/transactions','/api/notifications'].includes(path))?'market':path.startsWith('/api/auctions')?'auctions':null;
   if(required&&economy.features[required]!==true)throw problem('Bu özellik test onayından sonra açılacak.',503);
   let value;
   if(path==='/api/me'&&req.method==='GET')value=await economy.me(id);
   else if(path==='/api/ios-store-credit'&&req.method==='POST')value=await economy.credit(id,b.transaction?.signedTransaction);
   else if(path==='/api/board'&&req.method==='POST')value=await economy.board(id,b);
   else if(path==='/api/coin-shop'&&req.method==='GET')value=await economy.history(id);
   else if(path==='/api/cafes'&&req.method==='GET')value=await economy.find(id,(url.searchParams.get('code')||'').trim().toUpperCase());
   else if(path==='/api/market')value=req.method==='GET'?await economy.market(id,url.searchParams):await economy.createListing(id,b);
   else if(/^\/api\/market\/[a-f0-9-]{36}\/(buy|cancel)$/.test(path)&&req.method==='POST'){const [,,,listing,action]=path.split('/');value=action==='buy'?await economy.buy(id,listing,b):await economy.cancelListing(id,listing,b);}
   else if(path==='/api/auctions')value=req.method==='GET'?await economy.auctions(id,url.searchParams):await economy.createAuction(id,b);
   else if(/^\/api\/auctions\/[a-f0-9-]{36}$/.test(path)&&req.method==='GET')value=await economy.auction(id,path.split('/')[3]);
   else if(/^\/api\/auctions\/[a-f0-9-]{36}\/(bid|cancel)$/.test(path)&&req.method==='POST'){const [,,,auction,action]=path.split('/');value=action==='bid'?await economy.bid(id,auction,b):await economy.cancelAuction(id,auction,b);}
   else if(path==='/api/wallet'&&req.method==='GET')value=await economy.wallet(id);
   else if(path==='/api/transactions'&&req.method==='GET')value=await economy.marketHistory(id);
   else if(path==='/api/notifications')value=await economy.notifications(id,b);
   else if(path==='/api/trades')value=req.method==='GET'?await economy.trades(id):await economy.offer(id,b);
   else if(/^\/api\/trades\/[a-f0-9-]{36}\/(accept|reject|cancel)$/.test(path)&&req.method==='POST'){const [,,,trade,action]=path.split('/');value=await economy.settle(id,trade,action,b.request_id);}
   else if(req.method==='POST')value=await economy.game(id,path,b);
   else throw problem('İşlem bulunamadı.',404);
   if(value.status==='expired')return Response.json({...value,error:'Teklifin süresi doldu; ayrılan malzemeler iade edildi.'},{status:410});
   return Response.json(value,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }catch(e){return Response.json({error:e.status?e.message:'Sunucu işlemi tamamlayamadı. Yeniden dene.'},{status:e.status||503,headers:{'Cache-Control':'no-store'}});}
 };
}
