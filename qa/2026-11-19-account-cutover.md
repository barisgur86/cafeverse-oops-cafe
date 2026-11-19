# 0.9.5 account lifecycle and cutover — 19 Kasım 2026

Aday: 0.9.5 /2026111905. Production hedefi değişmedi: 1 Aralık 2026 /1.0.0.

## Tamamlanan kod

- Native hesap silme ekranı: açık kalıcı silme onayı, şifre veya taze Apple authorization-code/nonce doğrulaması; iptal başarısızlıkta hesabı silmez.
- Sunucu yalnızca doğrulanmış hesabın kimliğini kullanır; istemcinin user_id, e-posta veya Apple subject iddiasını kabul etmez. Apple bağlantılı hesap şifreyle revocation adımını atlayamaz.
- Şifre/kod kaydedilmez; sağlayıcı tokenları hesaba bağlı AES-GCM ile şifrelenir. Native devam makbuzu device-only Keychain'dedir. Sunucuda yalnızca makbuz özeti bulunur.
- Kesilen/kayıp yanıt: revoke/cleanup/Auth silme kontrol noktaları ve oturum silindikten sonra da çalışabilen makbuz ile güvenli devam.
- Emanet malzeme/teklif iadeleri tek DB transaction'ında; hesap silme ile takas iptali/çift tamamlama yarışları korunur. Karşı hesabın stok/coin/kayıtları sıfırlanmaz.
- Silinen hesabın geç gelen Apple refund/reversal bildirimi hesabı yeniden yaratmaz ve başka oyuncuya coin vermez. Anonim işlem kimliği tekrar kredilendirmeyi engeller; owner/JWS kişisel verisi temizlenir.
- Cache temizliği yalnızca silinen hesabın kayıt/pano/kurtarma/istek kuyruklarını kaldırır. Diğer hesaplar ve ortak ses/dil tercihleri korunur; geç cloud yanıtının cache'i geri yazması engellenir.
- Sunucu yalnızca kendi veritabanındaki doğrulanmış, hesap kapsamlı eski yedeği atomik benimseyebilir. İstemciden ekonomik JSON import endpoint'i yok. Daha yeni/farklı çevrimdışı kayıt ezilmez, kurtarma kopyası korunup geçiş bloklanır.
- Hesap silindikten sonra takas geçmişi karşı oyuncuda “Silinmiş kafe” olarak kalır.
- PostgreSQL kilit sırası, finite timeout, FK indeksleri ve server-only RLS; gereksiz public event-trigger RPC EXECUTE izni kaldırıldı.

## Doğrulama

Başlangıç ve güncel npm test PASS. Account lifecycle suite **16 senaryo**; PGlite yerelde seri bağlantı, CI'da izole localhost PostgreSQL kullanır. Native auth/recovery/helper derlemesi PASS; canlı Apple veya Keychain yazma testi değildir. Mevcut 38 görsel SHA256 testi PASS; hiçbir görsel değiştirilmedi/üretilmedi/silinmedi.

Testler: yanlış hesap/proof reddi, şifreli token tamper/başka hesap reddi, Apple revocation hatası, DB rollback, kayıp Auth silme yanıtı sonrası oturumsuz devam, süresi dolan/eski makbuz, çift tamamlama, iptal/silme yarışı, iki oyuncu emanet iadeleri, anonim refund/reversal, doğru bakiye/stok/yedek/pano benimseme ve offline çatışmada cache koruma, diğer kullanıcı cache'inin korunması, geç cloud yanıtı yarışması.

## Uzak test ortamı

Ücretsiz mevcut Supabase project kullanıldı; yeni ücretli proje/branch/plan yok. Lifecycle DDL yalnızca **cafe_stage_062** şemasına uygulandı; public canlı yedek tablosu benimsenmedi/dondurulmadı. Public değişiklik, kullanılmayan `rls_auto_enable()` RPC yetkilerinin daraltılmasıdır; event trigger korunur. Yeni tablo ve RLS/istemci write grant kontrolleri doğrulandı. Cold-start Buffer uyumsuzluğu gerçek stage health testinde bulundu, açık import ve regresyonla düzeltildi.

Stage health HTTP200: `accountDeletion:true`, `cutover:server-backup-v1`, `appleRevocation:false`; tüm iap/trades/market/auctions/social flag'ler false. Oturumsuz `/api/account` HTTP401. Health yalnızca yapılandırma/erişilebilirlik kanıtıdır; gerçek hesap silme/Apple ödeme testi sayılmaz.

## Kalan P0 / dış gereksinimler

- Apple Sign in with Apple server client-secret yapılandırması yok: Apple revocation **BLOCKED**; Apple hesap silme kullanılabilir gösterilmez. App Store Connect upload anahtarı bu amaçla kullanılmadı.
- Gerçek Apple Sandbox/TestFlight üç paket, pending/iptal, ağ kaybı ve iade: **NOT RUN**; satın alma kapalı.
- İki gerçek cihazda takas ve bakiye senkronizasyonu; fiziksel ses/Bluetooth: **NOT RUN**; takas kapalı.
- Dedicated disposable Auth hesapları ile native şifre/Apple silme uçtan uca kabulü: **NOT RUN**. Canlı kullanıcı silinmedi.
- Canlı server-authority cutover: **UYGULANMADI**. Beta game-server URL kapalı; yalnızca hesap hizmeti izole stage'e bağlıdır. Gerçek offline çatışmalar için inceleme gerekir; bakiyeler otomatik sıfırlanmaz.
- Privacy/KVKK/support/App Store review metadata ve üretim onayları hâlâ production gate.

## Git / sürüm

Branch `fix/account-cutover-20261119`, önceki PR #1 üzerine devam eder. Commit/push/PR, CI ve gerçek imzalı arşiv/TestFlight sonucu `outputs/qa-account-2026-11-19/delivery.json` kaydında tutulur; doğrulanmadan PASS yazılmaz. Ayrıntılı kurulum ve veri yaşam döngüsü `ACCOUNT_LIFECYCLE.md`.

## Son doğrulama

- Kod commit: e91dc15257a78e345bf90c7de6578a9f910ea005; GitHub push doğrulandı. Draft PR: https://github.com/barisgur86/cafeverse-oops-cafe/pull/2 (PR #1 üzerine).
- Yerel npm test: 69 PASS özet satırı. Native CI (pull_request) PASS. İlk PostgreSQL CI, test fixture session claim'inin farklı pool bağlantısına gitmesini yakaladı; 9ef1ca8 test düzeltmesiyle claim ve RPC aynı transaction bağlantısına alındı. Son CI sonucu ayrıca kontrol edilmeli.
- Stage v7 ACTIVE, /health 200, yetkisiz /api/account 401. FK indeksleri stage ortamına uygulandı. Apple revocation false; production aktarımı ve tüm ücretli/sosyal flagler kapalı.
- Xcode Release Swift derlemesi PASS (5.5 saniye), 0.9.5/2026111905 ürün Info.plist ve Web SHA kaynakla eşleşiyor. CodeSign devam ediyor; imzalı arşiv/TestFlight yüklemesi henüz doğrulanmadı.
- Bu aday için Apple hazır maili gönderildi iddiası yok. Gerçek cihaz ve gerçek satın alma testi NOT RUN.
