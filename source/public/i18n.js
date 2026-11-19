/* TR/EN presentation only. Saved recipe IDs, inventories and accounts stay unchanged. */
(() => {
 const en={
 'Satın almalar doğrulama testleri tamamlanana kadar kapalı.':'Purchases are disabled until verification testing is complete.',

 'Bu özellik test onayından sonra açılacak.':'This feature will be enabled after testing.',

'ürün kapasitesi':'product capacity',
'Kafe eşitlendi. Siparişi yeniden seç.':'Your cafe was synced. Select the order again.',
"Hazırlık rafı":"Preparation Shelf","Espresso makinesi III":"Espresso Machine III","Blender III":"Blender III","İkinci servis rafı":"Second Service Shelf","Usta hazırlık düzeni":"Master Preparation Workflow","Yerleştirildi ✓":"Installed ✓","Geliştirme sayfaları":"Upgrade pages","Yeni dört kişilik masa":"New four-seat table","ürün hazırlama kapasitesi":"prepared product capacity","Hazırlık süresine":"Preparation time","Önce gerekli geliştirmeyi satın al.":"Buy the required upgrade first.",
'Coinler hesabındaki kafeye eklenir.':'Coins are added to the cafe on your account.','Satın alma buluta kaydedilemedi. Bağlantını kontrol edip yeniden dene.':'Could not save the purchase to your account. Check your connection and try again.',
'Müşteriler oturtulamadı; kayıt yeniden denenecek.':'Could not seat guests; saving will be retried.',
"Haftalık koleksiyon":"Weekly collection","Her pazartesi yeni set":"A new set every Monday","Yeni set:":"Next set:","Koleksiyonunu tamamla":"Complete your collection","Koleksiyon açık":"Collection available","Yakında":"Coming soon","Sende var ✓":"Owned ✓","parça":"pieces","Nadir":"Rare","Epik":"Epic","Efsanevi":"Legendary","Bulut bahçesi önlüğü":"Cloud Garden Apron","Bulut gece lambası":"Cloud Night Lamp","Ay ışığı önlüğü":"Moonlight Apron","Ay saati":"Moon Clock","Gül sarayı önlüğü":"Rose Palace Apron","Gül çeşmesi":"Rose Fountain","Altın festival önlüğü":"Golden Festival Apron","Altın tatlı standı":"Golden Dessert Stand","Yeni koleksiyon parçan hesabına eklendi!":"Your new collection piece has been added!","Bu cihazda satın alma kapalı. App Store ve Ekran Süresi satın alma izinlerini kontrol et.":"Purchases are disabled on this device. Check App Store and Screen Time purchase permissions.","Satın almaları kontrol et":"Check purchases","Bekleyen Apple işlemlerini kontrol eder. Yeni satın alma başlatmaz.":"Checks pending Apple transactions. Does not start a new purchase.","Apple işlemleri kontrol edildi.":"Apple transactions checked.",
 'Cafeverse canlı kafe simülasyonu':'Cafeverse live café simulation','Cafeverse çizimleriyle hareketli kafe':'Live café with Cafeverse artwork','kişi':'guests','Dil seç':'Choose your language','Dil / Language':'Language / Dil','Dili değiştir':'Change language','Türkçe':'Türkçe','English':'English','Kapat':'Close','Devam et':'Continue','Ayarlar':'Settings','Ses açık':'Sound on','Ses kapalı':'Sound off',
 'Kafem':'My café','Tarifler':'Recipes','Gardırop':'Wardrobe','Dekorasyon ve petler':'Decor and pets','Dekor ve petler':'Decor and pets','Dekorasyon':'Decoration','Dekor':'Decor','Oyuncular':'Players','Takas':'Trade','Kapıya çık':'Go outside','Dünyalar':'Worlds','Koleksiyon':'Collection','Kafeyi büyüt':'Expand café','Menü':'Menu','Görevler':'Quests','Geliştir':'Upgrade','Karakter':'Character','Coin mağazası':'Coin shop','Hesap / çıkış':'Account / sign out','Kafeye geç':'Enter café','Kafeme dön':'Return to café','Kafeye dön':'Return to café','Kafe menüsünü aç':'Open café menu','Oyun menüsünü aç':'Open game menu','Kafe araçları':'Café tools',
 'OOPS! CAFÉ · CANLI KAFE':'OOPS! CAFÉ · LIVE CAFÉ','BİRLİKTE MASA SERVİSİ':'SERVE THE WHOLE TABLE','PAKET SERVİS':'TAKEAWAY','Paket siparişi':'Takeaway order','Paket':'Takeaway','Masa':'Table','Giriş':'Entrance','Seviye':'Level','misafir bekliyor':'guests waiting','misafir':'guests','masa':'tables','koltuk':'seats','kişilik':'seats','hazır':'ready','Melo çalışıyor…':'Melo is working…','Makine çalışıyor':'Blender is running','Melo yolda':'Melo is on the way','Kafen yaşıyor':'Your café is alive','Masaya servis et':'Serve the table','Paketi teslim et':'Hand over takeaway','Siparişi hazırla':'Prepare the order','Misafirleri masaya al':'Welcome the guests','Paket siparişi al':'Take a takeaway order','Misafirlerini karşılamaya hazırsın.':'Ready to welcome your guests.','Misafirler yerleşiyor…':'Guests are taking their seats…','Misafirler yerleşiyor':'Guests are taking their seats','Misafirler yerlerine yürüyor.':'Guests are walking to their seats.','Siparişin tamamı hazır.':'The whole order is ready.','Siparişini hazırlayıp birlikte teslim et.':'Prepare and serve the order together.','Kapıdaki misafirlerini karşıla.':'Welcome your guests at the entrance.','Yeni misafir çağırabilirsin.':'You can call new guests.','Sipariş bekleniyor':'Waiting for an order','kapıda':'waiting at entrance','masada':'seated','Misafirleri karşıla':'Welcome guests','Paket müşterisi tezgâha geliyor.':'The takeaway guest is approaching the counter.','Paket müşterisi geliyor…':'Takeaway guest is arriving…','Paket müşterisi geliyor':'Takeaway guest is arriving','Müşteri çağır':'Call guests','Servise hazır':'Ready to serve','Afiyet olsun!':'Enjoy!','Harika servis!':'Wonderful service!','Geliştirmeyi kapat':'Close upgrades','Kafeni büyüt':'Grow your café','Kafene yeni kapasite ekler.':'Adds more room to your café.','Hazırlamayı hızlandırır.':'Speeds up preparation.','Yerleştir':'Place it','Yeni eşyan kafenin içine yerleşti!':'Your new item is now in your café!',
 'Bir masaya dokun, misafirlerini karşıla.':'Tap a table to welcome your guests.','Misafirlerini karşıla.':'Welcome your guests.','Siparişleri aynı tepside birlikte teslim et.':'Serve the whole order together on one tray.','Kapıdan yeni müşteri çağır.':'Call new guests from the doorway.','Önce bekleyen siparişleri servis et.':'Serve the waiting orders first.','Misafirlerin masadan ayrılıyor.':'Your guests are leaving the table.','Melo bütün ürünleri tepsiye alıyor.':'Melo is collecting the whole order.','Misafirler mutlu! Birlikte servis edildi.':'Happy guests! The whole order was served.','Misafirlerin teşekkür edip kapıya yürüyor.':'Your guests thank you and walk to the door.','Yeni geliştirmeler açıldı.':'New upgrades unlocked.','Hazırlık tamamlanamadı; yeniden dene.':'Preparation failed. Please try again.','Servis tamamlanamadı; yeniden dene.':'Serving failed. Please try again.','Satın alma tamamlanamadı.':'Purchase could not be completed.','Üç kez seslen; kafenin önüne yeni misafirler gelsin.':'Call three times to attract new guests.','Gel gel! Taptaze kahve var!':'Come come! Fresh coffee is ready!','Gel gel!':'Come come!',
 'Çilekli Çikolata':'Strawberry Chocolate','Renkli Buzlu Süt':'Rainbow Iced Milk','Yıldızlı Vanilya':'Star Vanilla','Gece Kahvesi':'Night Coffee','Pembe Bulut':'Pink Cloud','Gökkuşağı Frappé':'Rainbow Frappé','Meteor Espresso':'Meteor Espresso','siparişinin tamamı hazır!':'order is ready!','paket tezgâhı':'takeaway counter','Türkçe dilini seç':'Choose Turkish','İngilizce dilini seç':'Choose English','Çilekli Frappé':'Strawberry Frappé','Bulut Frappé':'Cloud Frappé','Galaksi Mocha':'Galaxy Mocha','Gökkuşağı Latte':'Rainbow Latte','Yıldız Çikolata':'Star Chocolate','Pembe Mocha':'Pink Mocha','Vanilyalı Latte':'Vanilla Latte','Çilekli Süt':'Strawberry Milk','Buzlu Espresso':'Iced Espresso','Kakaolu Milkshake':'Chocolate Milkshake','Kremalı Mocha':'Creamy Mocha','Yıldızlı Süt':'Star Milk','Ananaslı Smoothie':'Pineapple Smoothie','Vişneli Jöle':'Cherry Jelly','Mutsuz Cupcake':'Sad Cupcake','Ananaslı Frappé':'Pineapple Frappé','Vişneli Süt':'Cherry Milk','Yıldızlı Cupcake':'Star Cupcake',
 'Süt':'Milk','Kahve':'Coffee','Çilek':'Strawberry','Buz':'Ice','Vanilya':'Vanilla','Krema':'Cream','Kakao':'Cocoa','Yıldız tozu':'Stardust','Renkli şurup':'Rainbow syrup','Meyveli':'Fruity','Sütlü':'Milky','Kahveli':'Coffee','Çikolatalı':'Chocolate','Sihirli':'Magical',
 'İkinci masa':'Second table','Üçüncü masa':'Third table','Dördüncü masa':'Fourth table','Espresso makinesi II':'Espresso machine II','Geniş servis tezgâhı':'Wide serving counter','Kafe genişletme':'Café expansion','Blender II':'Blender II','Alındı ✓':'Owned ✓','Satın al':'Buy','Kafede ✓':'In your café ✓','Depo':'Pantry','Tarif':'Recipe','Malzemeler':'Ingredients','Malzemeleri seç':'Choose ingredients','Karıştır!':'Blend!','Servis Et!':'Serve!','Servis et':'Serve','Sipariş Hazır!':'Order ready!','Sipariş hazır!':'Order ready!','Karıştırılıyor…':'Blending…','Tepsiye ekle':'Add to tray','Sıradaki misafir':'Next guest','Ödülünü al':'Claim reward','Devam Et':'Continue',
 'Saksı bitkisi':'Potted plant','Bahar çiçekleri':'Spring flowers','Uykucu kedi':'Sleepy cat','Masal mantarı':'Fairy mushroom','Pirana':'Piranha','Canlı ananas':'Living pineapple','Mutsuz cupcake':'Sad cupcake','Vişneli jöle':'Cherry jelly','Mavi civciv':'Blue chick','Şef şapkası':'Chef hat','Pembe önlük':'Pink apron','Fiyonk':'Bow','Gözlük':'Glasses','Yok':'None','Tak':'Wear','Çıkar':'Remove','Giyiliyor':'Wearing','Giy':'Wear','Sahipsin':'Owned',
 'Giriş yap':'Sign in','Hesap oluştur':'Create account','Kullanıcı adı':'Username','E-posta':'Email','Şifre':'Password','Yeni şifre':'New password','Şifremi unuttum':'Forgot password','Şifreyi yenile':'Reset password','Girişe dön':'Back to sign in','İşlem tamamlanamadı.':'Could not complete the request.','Hesabın kontrol ediliyor…':'Checking your account…','Şifren yenilendi. Yeni şifrenle giriş yap.':'Password updated. Sign in with your new password.',
 'Kafe girişi':'Café entrance','Pembe Cafeverse kafesinin açık kapısı':'The open door of the pink Cafeverse café','El sallayan Melo':'Melo waving','Kafe Açık':'Café open','Kafe açık':'Café open','Kafeye gir':'Enter café','Gel gel! Taptaze kahve ve tatlı var!':'Come come! Fresh coffee and treats!','Çağrı tamamlandı':'Call complete','Kafe önünde kollarını sallayarak müşteri çağıran iki renkli hava üflemeli balon':'Two colorful inflatable greeters waving outside the café','Sesli çağrı bu cihazda kullanılamıyor.':'Voice calling is unavailable on this device.','Tekrar seslen':'Call again','Kafene dön':'Enter your café','Müşteriler geliyor!':'Guests are coming!','Birazdan tekrar çağırabilirsin.':'You can call again shortly.',
 'Hesabım':'My account','Çıkış yap':'Sign out','Kayıtlı':'Saved','Kaydet':'Save','İptal':'Cancel','Tamam':'OK','Hazırlanıyor…':'Preparing…','Bağlanıyor…':'Connecting…','Yükleniyor…':'Loading…','Ölçü':'Measure','ölçü':'measure','jeton':'coins','müşteri':'guests','ürün':'items','sipariş':'order','Biraz daha altın için siparişleri tamamla.':'Complete orders to earn more coins.',
 "Tümü":"All",
 "Coin mağazasını aç":"Open coin shop",
 "Coin mağazasını kapat":"Close coin shop",
 "Hızlı oyun menüsü":"Quick game menu",
 "Kafe":"Café",
 "Liste sayfaları":"List pages",
 "Önceki sayfa":"Previous page",
 "Sonraki sayfa":"Next page",
 "Tarifi hazırlamaya başla":"Prepare this recipe",
 "Depo sonrası maliyet:":"Cost after pantry stock:",
 "Sipariş geliri:":"Order earnings:",
 "TARİF KOLEKSİYONU":"RECIPE COLLECTION",
 "Bir fincan dolusu keşif":"Discover a world in every cup",
 "Keşfedildi ✓":"Discovered ✓",
 "Karıştırarak keşfet":"Discover by blending",
 "KÜÇÜK DOKUNUŞLAR":"LITTLE TOUCHES",
 "Kafene renk ve yeni dostlar kat.":"Add color and new friends to your café.",
 "Yeşil dost":"Green friend",
 "Kafenin yeni görünümü hazır!":"Your café has a fresh new look!",
 "YENİ BİR DÜNYAYA AÇIL":"EXPLORE A NEW WORLD",
 "Bir sonraki durak neresi?":"Where shall we go next?",
 "Masal Ormanı":"Fairy Forest",
 "Uzay Kafesi":"Space Café",
 "Şeker Diyarı":"Candy Land",
 "Buradasın ✓":"You are here ✓",
 "Ziyaret et":"Visit",
 "Yeşilin en tatlı tonu.":"The sweetest shade of green.",
 "Yıldızların altında bir kahve.":"A coffee under the stars.",
 "Her köşe başka bir şeker.":"A sweet surprise around every corner.",
 "Yeni manzaranın tadını çıkar!":"Enjoy your new view!",
 "Hesabın":"Your account",
 "Kafen":"Your café",
 "Karakterini düzenle":"Edit character",
 "Çıkış / hesap değiştir":"Sign out / switch account",
 "Hesabımı sil":"Delete my account",
 "Üç fincan, üç gülümseme 💗":"Three cups, three smiles 💗",
 "Koleksiyonun":"Your collection",
 "tarif keşfedildi":"recipes discovered",
 "Ödül: 50 altın":"Reward: 50 coins",
 "50 altın ödülü alındı ✓":"50-coin reward claimed ✓",
 "Gerçek çilek parçaları, buzlu pembe karışım ve yumuşacık krema.":"Real strawberry pieces, a pink icy blend and soft whipped cream.",
 "Kahve içermez. Süt, vanilya ve kremadan oluşan açık renkli, köpüklü bir içecek.":"Caffeine-free. A light, frothy blend of milk, vanilla and cream.",
 "Kahve ve kakaonun yıldız tozuyla birleştiği mor, benekli mocha.":"A purple speckled mocha with coffee, cocoa and stardust.",
 "Renkli şurup ve süt katmanları. Kahve içermez; her katmanı ayrı renk.":"Colorful syrup and milk layers. Caffeine-free, with a different color in every layer.",
 "Yoğun kakao, süt ve vanilya. Çikolata rengi üzerinde altın yıldızlar.":"Rich cocoa, milk and vanilla topped with golden stars.",
 "Çilek, kahve ve kakaonun pembe-kahverengi katmanlı karışımı.":"A pink and brown layered blend of strawberry, coffee and cocoa.",
 "Sıcak süt, espresso ve yoğun vanilya.":"Warm milk, espresso and rich vanilla.",
 "Çilek ve vanilyalı süt; kahve içermez.":"Strawberry and vanilla milk, caffeine-free.",
 "Bol buz üzerinde yoğun espresso.":"Rich espresso over plenty of ice.",
 "Sütlü kakao, buz ve yumuşak krema.":"Milky cocoa, ice and soft cream.",
 "Espresso ve kakao üzerinde çift krema.":"Espresso and cocoa topped with double cream.",
 "CAFÉVERSE · COIN MAĞAZASI":"CAFÉVERSE · COIN SHOP",
 "Biraz daha sihir 🪙":"A little more magic 🪙",
 "Satın alma Apple onay ekranında tamamlanır. Coinler bu cihazdaki oyun kaydına eklenir.":"Complete your purchase on Apple's confirmation screen. Coins are added to this device's game save.",
 "Bakiyen:":"Your balance:",
 "App Store paketleri yükleniyor…":"Loading App Store packs…",
 "Tekrar dene":"Try again",
 "Apple onayı bekleniyor":"Waiting for Apple approval",
 "İşlem sürüyor…":"Processing…",
 "Coinler kıyafet, dekor, pet ve kafe geliştirmelerinde kullanılır. XP satın alınmaz.":"Use coins for outfits, decor, pets and café upgrades. XP cannot be purchased.",
 "Coin paketleri App Store tarafından henüz sunulmuyor. Ürün tanımları ve Apple satış sözleşmesi tamamlanınca burada görünecek.":"Coin packs are not available from the App Store yet. They will appear once product setup and Apple's sales agreement are complete.",
 "Coin satın alma iPhone ve iPad uygulamasında kullanılabilir.":"Coin purchases are available in the iPhone and iPad app.",
 "Satın alma iptal edildi.":"Purchase cancelled.",
 "Satın alma sonucu doğrulanamadı.":"The purchase could not be verified.",
 "Apple test satın alımı tamamlandı; gerçek ücret alınmadı.":"Apple test purchase completed. No real payment was charged.",
 "Apple satın alımı tamamlandı.":"Apple purchase completed.",
 "Oyuna dön":"Return to game",
 "Teslim bekleyen satın almalar yeniden açılışta kontrol edilir.":"Pending purchases are checked the next time you open the game.",
 "coin eklendi":"coins added"
 };
 Object.assign(en,{'Paket servis':'Takeaway service','Teslim Et!':'Hand over!','Dört kişilik masaya servis':'Table service','Teslim ediliyor…':'Delivering…','Coin bakiyesi':'Coin balance','yolda':'arriving','ayrılıyor':'leaving','ürün teslim edildi':'items delivered'});
 const ordered=Object.keys(en).sort((a,b)=>b.length-a.length);
 let language=['tr','en'].includes(globalThis.CafeLanguage)?globalThis.CafeLanguage:localStorage.getItem('cafeverse.language');
 const valid=['tr','en'].includes(language);if(!valid)language=(globalThis.navigator?.languages?.[0]||globalThis.navigator?.language||'en').toLowerCase().startsWith('tr')?'tr':'en';
 function translate(text,lang=language){if(lang!=='en'||!text)return text;const leading=text.match(/^\s*/)[0],trailing=text.match(/\s*$/)[0],s=text.trim();if(en[s])return leading+en[s]+trailing;
 const patterns=[[/^(\d+) misafir girişten Masa (\d+) yönüne yürüyor\.$/,(_,n,t)=>`${n} guests are walking from the entrance to Table ${t}.`],[/^(\d+) misafir girişten paket tezgâhına geliyor\.$/,(_,n)=>`${n} guests are approaching the takeaway counter.`],[/^Melo (.+) için makineye yürüyor\.$/,(_,r)=>`Melo is walking to the machine for ${translate(r,'en')}.`],[/^(.+) hazırlanıyor; malzemeler depodan kullanılıyor\.$/,(_,r)=>`${translate(r,'en')} is being prepared using pantry ingredients.`],[/^Melo hazır ürünü tepsiye bırakıyor\.$/,()=> 'Melo is putting the finished drink on the tray.'],[/^Siparişin tamamı hazır; masaya birlikte servis edebilirsin\.$/,()=> 'The whole order is ready to serve together.'],[/^Melo dolu tepsiyi (.+) yönüne götürüyor\.$/,(_,t)=>`Melo is carrying the tray to ${translate(t,'en')}.`],[/^(\d+) yeni misafir kapıya geldi!$/,(_,n)=>`${n} new guests arrived at the door!`]];
 for(const [rx,fn] of patterns)if(rx.test(s))return leading+s.replace(rx,fn)+trailing;
 // Longest source phrases first; do not re-translate already-produced English.
 const escaped=ordered.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));return text.replace(new RegExp(escaped.join('|'),'g'),(m,offset)=>{const letter=c=>!!c&&/\p{L}/u.test(c);if(letter(m[0])&&letter(text[offset-1])||letter(m.at(-1))&&letter(text[offset+m.length]))return m;return en[m]}).replace(/\b1 guests\b/g,'1 guest').replace(/\b1 tables\b/g,'1 table').replace(/\b1 seats\b/g,'1 seat');
 }
 const sources=new WeakMap();let observer;
 function textNode(node){if(node.parentElement?.closest('script,style,textarea,input,[data-no-i18n]'))return;const old=sources.get(node),source=old&&node.data===old.output?old.source:node.data,output=translate(source);sources.set(node,{source,output});if(node.data!==output)node.data=output;}
 function apply(root=document.body){if(!root)return;observer?.disconnect();const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())textNode(n);for(const el of root.querySelectorAll('[aria-label],[title],[placeholder],[alt]'))for(const key of ['aria-label','title','placeholder','alt']){const v=el.getAttribute(key);if(v===null)continue;const bucket=sources.get(el)||{},old=bucket[key],source=old&&v===old.output?old.source:v,output=translate(source);bucket[key]={source,output};sources.set(el,bucket);if(v!==output)el.setAttribute(key,output);}observer?.observe(document.body,{subtree:true,childList:true,characterData:true});}
 function set(lang){if(!['tr','en'].includes(lang))return false;language=lang;localStorage.setItem('cafeverse.language',lang);document.documentElement.lang=lang;globalThis.webkit?.messageHandlers?.cafeLanguage?.postMessage(lang);globalThis.speechSynthesis?.cancel();apply();globalThis.dispatchEvent(new Event('cafeverse-language'));return true;}
 function choose(required=false){if(document.querySelector('#language-picker'))return;const d=document.createElement('dialog');d.id='language-picker';d.className='language-picker';d.innerHTML='<h2 data-no-i18n>Türkçe / English</h2><p data-no-i18n>Dilini seç · Choose your language</p><button data-language="tr" data-no-i18n>Türkçe</button><button data-language="en" data-no-i18n>English</button>'+(required?'':'<button data-language-close>×</button>');d.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>{set(b.dataset.language);d.close();d.remove()});d.querySelector('[data-language-close]')?.addEventListener('click',()=>{d.close();d.remove()});d.addEventListener('cancel',e=>{if(required)e.preventDefault();else d.remove()});document.body.append(d);d.showModal();}
 globalThis.CafeI18n={translate,set,choose,apply,get language(){return language},get locale(){return language==='en'?'en-US':'tr-TR'}};
 if(typeof document==='undefined'||!document.body)return;
 const style=document.createElement('style');style.textContent='.language-picker{width:min(400px,92vw);box-sizing:border-box;border:3px solid #fff1c1;border-radius:25px;padding:24px;background:linear-gradient(#fff0fb,#f3bbe5);color:#632251;text-align:center}.language-picker::backdrop{background:#54214cbb;backdrop-filter:blur(7px)}.language-picker h2{font-size:25px}.language-picker p{font-size:16px}.language-picker button{display:block;width:100%;min-height:52px;margin-top:12px;border:2px solid #fff0c5;border-radius:18px;background:linear-gradient(#ff9cde,#ed279f);color:white;font-size:20px;font-weight:800}.language-picker [data-language-close]{background:#9d5fa9;min-height:44px}';document.head.append(style);
 const menu=document.querySelector('#app-menu');if(menu){const b=document.createElement('button');b.className='secondary';b.textContent='🌐 Dil / Language';b.onclick=()=>choose();menu.append(b);}
 observer=new MutationObserver(()=>apply());document.documentElement.lang=language;apply();
})();
