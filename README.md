# Cafeverse · OOPS! Café

iPhone ve iPad için SwiftUI kabuğu ve uygulamaya gömülü JavaScript oyun motoru. Bu depo güncel 0.3.4 geliştirme kaynaklarını içerir; TestFlight yayımlama durumu değildir.

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
