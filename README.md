# Cafeverse · OOPS! Café

iPhone ve iPad için SwiftUI kabuğu ve uygulamaya gömülü JavaScript oyun motoru. Bu depo 0.5.1 (2026111701) kaynaklarını içerir. Bu paket 17 Kasım 2026 tarihinde TestFlight iç test için Apple’a başarıyla yüklendi; test kullanılabilirliği Apple’ın işleme ve grup dağıtımı durumuna bağlıdır.

## Geliştirme

Node.js 24 ile `npm test` çalıştırın. Bağımlılık kurulumu gerekmez. `npm run build`, `iOS/App/Web` paketini ve test kataloğunu kaynaklardan üretir. Ardından Mac üzerinde `iOS/Cafeverse.xcodeproj` dosyasını Xcode ile açın. İmzalama yerel Apple Developer hesabıyla yapılır.

## Kaynaklar

- `source/public`: oyun ekranları, stiller ve görseller
- `source/server`: tarif, ilerleme ve ürün katalogları
- `offline-runtime.js`: cihazdaki hesap bazlı oyun kaydı ve ekonomi
- `iOS/App/CafeverseApp.swift`: gerçek Apple/e-posta girişi ve StoreKit 2 köprüsü
- `tests`: oyun, tarif ve satın alma teslimi kontrolleri

## Güncel kapsam ve açık işler

18 tarif; dört sandalyeli masalar; paket ve birlikte teslim edilen masa siparişleri; gardırop, dekor, ilerleme ve StoreKit 2 entegrasyonu. Gerçek satın alma uçtan uca doğrulanmadı; Apple ürün metadatası, Paid Apps Agreement, banka/vergi adımları ve cihaz testi tamamlanmalı. Apple girişi gerçek cihazda yeniden doğrulanmalı; genel e-posta kayıtları için SMTP kurulumu açık. Oyun ilerlemesi ve coin bakiyesi cihazda tutulur, bulut cüzdanı değildir.

## GitHub üzerinde çalışma

Değişiklikleri ayrı dalda hazırlayın, `npm test` sonucunu kontrol edin ve pull request açın. iOS derleme/imzalama/dağıtım Mac ve Xcode gerektirir. Sertifikalar, özel anahtarlar ve sunucu sırları depoya eklenmez. Info.plist içindeki Supabase anahtarı yalnızca herkese açık istemci anahtarıdır.

0.3.6: Kullanıcının masa hazır, masa teslim ve paket servis görselleri; canlı bakiye ve gerçek sipariş bilgileri.

0.3.6: Canlı bulut kayıt şeması, hesap ayrımı kontrolü, çevrimdışı kayıtları koruma, çakışmada açık seçim ve yerel kurtarma kopyası. Fiziksel cihaz testi ayrıca tamamlanmalıdır. Ayrıntılar: CLOUD_SETUP.md.

0.3.7: Giriş ve hesap oluşturma hata mesajları, yinelenen Apple/e-posta kayıt yönlendirmesi ve native giriş ekranı düzeltildi. Native derleme ile hatalı giriş kontrolü geçti; başarılı hesap erişimi ve genel e-posta gönderimi henüz doğrulanmadı. Ayrıntılar: AUTH_SETUP.md.

0.5.1: Cafeverse çizimleriyle canlı kafe simülasyonu, Türkçe/İngilizce dil seçimi, dil uyumlu müşteri çağırma sesi, gardırop ve dekorasyonda sayfa başına dört ürün ve haftalık koleksiyon altyapısı. iPhone kart düzeni ve sayfa geçişi kontrol edildi; otomatik oyun testleri geçti. Başarılı gerçek Apple/e-posta girişi ve fiziksel cihazda ses testi bu sürüm için ayrıca doğrulanmalıdır.

0.5.2 (2026111702): Mevcut 0.5.1 özelliklerinin yeni sürüm numarasıyla paketlenmesi. TestFlight yükleme durumu ayrıca doğrulanır.

0.5.3 (2026111703), hazırlık: Satın alınan dekorlar birlikte sahnede görünür; haftalık önlükler gardırop ve canlı Melo üzerinde aynı görünümü kullanır. Mağazada işlem kontrol düğmesi ve satın alma kısıtı açıklaması eklendi; eşzamanlı Apple işlem bildirimleri tek teslim akışında birleştirildi. Gerçek Apple ödemesi ve fiziksel cihaz testi ayrıca gereklidir. TestFlight durumu ayrıca doğrulanır.
