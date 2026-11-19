# Caféverse master fix — 19 Kasım 2026

Aday: **0.9.4 (2026111904)**. Production hedefi: **1 Aralık 2026 / 1.0.0**. Production gönderimi YOK. Bu rapor tüm master kapsamının tamamlandığı anlamına gelmez.

## Kök nedenler ve düzeltmeler

- Canlı sahne `fullTables:true` kullandığı için iki kişilik grup boş masa olsa bile paket sırasına gidiyordu. Mevcut dört koltuklu masada 1–4 kişilik gruplar kabul edilir; kayıtlı siparişe sonradan kişi eklenmez.
- Yürüyen müşteri grupları masa grubunun içinde çizildiğinden başka masa görselinin arkasına düşüyordu. Giriş/ayrılış karakterleri dünya katmanında, oturanlar mevcut masa katmanında çizilir. Kimlikler `orderID:slot` olarak korunur. Ayrılış fazı sahne imzasına eklendi.
- Sunucu yalnızca `seated` siparişleri dolu sayıyordu. `arriving` rezervasyonları da aynı masa/paket noktasını kilitler; başarısız ikinci kayıt cüzdan/stok/admission değiştirmez.
- Paket şef rotasında masa için kullanılan genel yaklaşma ofseti vardı. Paket için sabit tezgâh teslim noktası ayrıldı; paket müşteri noktası ve null masa kimliği korunur.
- Sayaçlar kapı/oturma yanında geçişteki ve ayrılan grupları da gerçek sipariş durumundan gösterir. Statik kafe çizimi dekor olarak işaretlendi; müşteri sayısına dahil edilmez.
- Teslim ekranındaki eksik TR/EN alt metinleri tamamlandı.
- Ses sistemi mevcut WebAudio gain/AVAudioPlayer yolunu kullanır. Gerçek slider `oninput` ve mute düğmeleri için 0/10/50/100 regresyonu eklendi.
- Üç coin paketinin imzalı fixture ile doğru miktarı vermesi ve aynı işlemin tekrarında ikinci kez vermemesi genişletildi. Bu Apple Sandbox satın alımı değildir.

## Koruma

38 mevcut asset SHA256 kontrolü PASS; hiçbir görsel değişmedi, silinmedi veya üretilmedi. Masa yerleşimi/dekor/karakter sprite dosyaları aynı. Coin, envanter ve eski kayıtlar sıfırlanmadı. Yeni şema gerekmiyor; mevcut sipariş JSON alanları kullanılıyor. Canlı kullanıcı verisine test yazılmadı. IAP, takas, market, açık artırma ve sosyal flag'ler kapalı.

## Testler

| Alan | Durum / kanıt |
| --- | --- |
| Başlangıç npm test | PASS |
| Son npm test | PASS; 49 PASS çıktı satırı, bağımsız test sayısı değildir |
| Servis sözleşmesi | PASS, 19 senaryo; arrival rezervasyonu/rollback dahil |
| İki müşteri görünürlüğü | PASS, gerçek simülasyon kodunda kimlik, yürüyüş, oturma ve ayrılış; sentetik DOM |
| Üç masa + paket | PASS, karışık sırada teslim, yanlış masa ve çift ödül reddi |
| Asset koruma | PASS, 38 SHA256 |
| Yerel gerçek tarayıcı | PASS: 375×667 İngilizce dört müşteri, hazırlık, masa teslimi, ayrılış, küçük grubun boş masaya oturması, paket+masa birlikte ve yeniden yükleme |
| Tarayıcı bakiye örneği | 500→462 hazırlık→702 masa teslimi (servis+mevcut bonuslar); paket 702→690→725 (+35); sentetik localhost |
| Karşılama taşması | PASS: küçük iPhone boyutunda başlık/sayaç/pasif başarı/enter kontrolü viewport içinde, scroll overflow yok |
| Ses | PASS: gerçek JS slider handler, gain math, ayrı music/effects, mute, kalıcı tercih; native Swift gain test PASS |
| Native giriş kurtarma | PASS: session, callback queue, kısa şifre, iptal ve ilgisiz URL; gerçek Apple oturumu değildir |
| İmza/ekonomi/takas | PASS: Apple fixture imzası, üç paket, replay, iptal/pending istemci, kurtarma, iade borcu; DB rollback, stok, yetki ve kabul/iptal yarışları |
| Komut satırı Release | BLOCKED: sandbox SwiftUI macro/plugin; kod derleme hatası olarak gizlenmedi |
| Xcode UI Release | Son arşiv doğrulaması dış teslim kaydında |
| Simulator | CLI BLOCKED; Xcode UI ile iPhone 17e üzerinde derlendi ve Running durumu gözlendi; normal durduruldu. Simulator ekranı CUA uygulama erişiminde yok, oyun/giriş kabul testi NOT RUN |
| Headless browser | BLOCKED: Chrome yardımcı süreç başlatılamadı; CUA gerçek tarayıcı ile kısmi alternatif QA yapıldı |
| Fiziksel iPhone/iPad/Bluetooth/hardware volume | BLOCKED / NOT RUN |
| Gerçek Apple Sandbox alımı / iki gerçek cihaz takası | BLOCKED / NOT RUN; özellikler kapalı |

## Backend ve hesap incelemesi

Supabase Cafeverse ACTIVE_HEALTHY. İzole `cafe-secure-stage/health` HTTP200: schema authoritative-economy-v1, Sandbox; tüm ekonomik/sosyal flag'ler false. Canlı istemciyi bu staging ekonomisine geçirmek mevcut bakiye geçişini gerektirir; otomatik cutover yapılmadı.

Security advisor: staging ekonomik tablolarında RLS açık ve istemci policy yok (beklenen sunucu erişimi); public cloud push yalnızca auth.uid() sahibini ve CAS revision'ı yazar. Bu bir yedekleme sistemi, güvenilir coin ledger değildir. `rls_auto_enable` event-trigger fonksiyonundaki varsayılan EXECUTE izinleri ve leaked-password protection ayarı ayrıca incelenmeli; bu koşuda uzak erişim veya kullanıcı verisi değiştirilmedi. Son doküman referansları: https://supabase.com/changelog.md ve https://supabase.com/docs/guides/auth/managing-user-data.md .

## Açık işler

P0: server-authority/cloud cutover ve korumalı eski bakiye migration stratejisi; gerçek Apple Sandbox üç paket, pending/iptal/ağ/iade doğrulaması; Apple banka/vergi/ürün satış hazır oluşu; iki hesap/iki gerçek cihaz takası; native hesap silme + Apple revocation ve veri saklama politikası. Açık P0 varken production kapalı.

P1: fiziksel ses/Bluetooth/sessiz anahtarı, gerçek cihaz giriş/kayıt/hesap değiştirme ve çok cihaz çakışması kabul testleri; Supabase erişim advisor hardening ve ücretsiz plandaki parola koruma olanağı; tamamlanmamış sosyal/progression işleri.

P2: cihaz/lokalizasyon kombinasyonlarının kalan geniş görsel matrisi. Sadece yukarıdaki gerçekten çalıştırılan kontroller PASS kabul edilir.

## Git ve dağıtım

Branch: `fix/master-stability-20261119`. İstenen commit mesajı: `fix: stabilize cafe service, customer seating, audio and economy`.
Commit/push/PR ve son TestFlight durumu: `outputs/qa-master-2026-11-19/delivery.json`. Önceki 0.9.3 hazır; yeni build doğrulanmadan mail/dağıtım başarılı sayılmaz.

## Son doğrulama ve teslim

- Kod commit: `96950aaa3188c0b016360852b8b96f7df6b5018e`. Remote branch SHA aynı, push PASS.
- Taslak PR: https://github.com/barisgur86/cafeverse-oops-cafe/pull/1 ; dört GitHub kontrolü PASS. Main'e merge yok.
- 0.9.4 /2026111904 signed Release arşivi PASS. Web SHA256: `6efd2c0891e07d4dae8960cc2e7b15c26012f25ab71a01660abe7073ccc9fe8e`.
- Apple upload PASS: 19 Kasım **10:02:40 İstanbul**; Apple hazır maili **10:04:29 İstanbul**, barisgur@gmail.com. Önceki 2026111903 paketi son metin/rota düzeltmesi için iptal edildi ve yüklenmedi.
- Gerçek yerel tarayıcıda 0/10/50/100 müzik slider gösterimi, mute ve reload sonrası tercih PASS; hoparlör/Bluetooth çıktısı test edilmedi.
- Türkçe ekran 375×667,430×932,820×1180: üst/alt panel, masa seçiciler ve işlem düğmeleri viewport içinde PASS. İngilizce karşılama/ses/paket ekranı küçük boyutta kontrol edildi. Bu, tüm ekranların bütün dil/cihaz kombinasyonları için PASS değildir.
- Son paket: 725→710 hazırlık→795 teslim (+35 servis,+50 mevcut hedef bonusu). Masa 1'in hazır olmayan ayrı siparişi ve tek müşterisi korundu.
- `npm run preflight` üretim gate'i BLOCKED: CAFE_GAME_SERVER_URL ayarlanmamış. Staging health geçmesi bunu veya migration/cutover'ı tamamlamaz.

### Değişen dosyalar

- `RELEASE_STATUS.md`
- `iOS/Cafeverse.xcodeproj/project.pbxproj`
- `offline-runtime.js`
- `package-lock.json`
- `package.json`
- `qa/2026-11-19-master-fix.md`
- `qa/release-schedule.json`
- `source/public/i18n.js`
- `source/public/iso-cafe.js`
- `source/public/service-state.js`
- `tests/apple-signature.mjs`
- `tests/audio.mjs`
- `tests/i18n.mjs`
- `tests/seating.mjs`
- `tests/secure-economy.mjs`
- `tests/service-orders.mjs`
- `tests/simulation.mjs`
