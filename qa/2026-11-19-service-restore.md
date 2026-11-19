# 19 Kasım — mevcut assetlerle P0 masa/paket servis onarımı

Sürüm: **0.9.3 (2026111902)**. Dal: `fix/restore-service-assets-20261119`.
Önce origin/main fetch + ff-only merge yapıldı (Already up to date). Geçmişte 0.5.3 görsel servis ekranları, 0.5.4 otomatik oturma ve 0.6.1 çoklu masa değişiklikleri incelendi; eski sürüme dönülmedi.

## Kök nedenler ve düzeltme

- Masa/paket biletleri giriş animasyonu başlarken hemen hazırlanabilir görünüyordu. Artık karşılanmadan rezervasyon yapılmıyor; `arriving` bitmeden sipariş/hazırlama/teslim açılmıyor. Backend de hazırlığı bağımsız olarak zaman/kimlik kontrolüyle reddediyor. Eski hazırlanmış biletler yeniden ücret alınmadan korunuyor.
- Canlı kafe, mevcut `openTicketService` ekranına gitmiyordu. Hazır sipariş artık mevcut servis ekranını açıyor; teslim callback'i orijinal Melo yürüyüş/tepsi animasyonu ve doğrulanmış tek batch işlemini çalıştırıyor. Başarıda mevcut masa-servis tamamlandı görseli gösteriliyor.
- Çağrı turunun geçmiş mesajı ve ilerlemesi içeride kalıyordu. İçerideki notice artık güncel sipariş aşamasından hesaplanıyor. Kapıda bekleyen, masada oturan ve paket müşterileri aynı CafeService view projeksiyonundan ayrı sayılıyor. Kapıdan içeri geçerken çağrı gösterimi temizleniyor.
- Teslim sunucuda tamamlandıktan sonra yerel pano yazımı başarısız olursa UI tekrar teslim bekler görünebiliyordu. Kalıcı teslim sonucu, görüntü önbelleği yazımından önce başarılı işaretleniyor; ikinci ödül verilmiyor.
- Masalar önce dörde tamamlanır; kalanlar tek müşteri başına ayrı paket slotuna gider. Tamamlanan paket temizlenir, sıradaki yeni paket otomatik oluşabilir. Bu yeni sipariş önceki teslimin tekrarı değildir.

## Korunan assetler ve bağlantılar

38 dosyanın SHA256 manifesti: `tests/service-assets.json`. Hiçbir asset silinmedi, değiştirilmedi, üretilmedi.

| Asset | Kullanım |
|---|---|
| source/public/assets/cafe-isometric-candy.png | canlı kafe arka planı |
| source/public/assets/sim-table.png | mevcut masa yerleşimi |
| source/public/assets/cafe-customers-candy.png | aynı biletin müşteri sprite'ları ve giriş/çıkış animasyonu |
| source/public/assets/characters.png | Melo/karakter animasyonu |
| source/public/assets/table-service-ready.png | masa teslim onayı |
| source/public/assets/table-service-done.png | tamamlanan masa servisi |
| source/public/assets/takeaway-service.png | paket hazır/teslim ekranı |

Yeni görsel, servis tasarımı veya görsel üstü ek kontrol üretilmedi. Önceki ekranın mevcut kontrolleri kullanıldı.

## Zorunlu regresyon matrisi

| Senaryo | Sonuç / kanıt |
|---|---|
| Boş masaya servis | PASS — service-orders / boş sipariş, bakiye-stok-XP değişmiyor |
| Müşteri gelmeden sipariş/hazırlık | PASS — welcome/arrival state ve server arrival gate |
| Doğru masaya oturma | PASS — simulation / müşteri kimliği ve masa hedefi |
| Masa görselleri doğru | PASS — 38 hash, referans testi ve gerçek yerel tarayıcı |
| Ürün doğru masaya | PASS — batch müşteri/ürün sırası ve masa kimliği |
| Yanlış masa reddi | PASS — service-orders + PostgreSQL entegrasyonu |
| Çift dokunma tek ödül | PASS — sending guard + transaction/replay testleri |
| Ayrılan müşteride masa boş | PASS — departure timer, sprite kaldırma ve occupancy |
| Üç masa bağımsız | PASS — üç masa + paket karışık sırada teslim; ayrıca dört masa testi |
| Paket bağımsız | PASS — boş masalara rağmen ayrı paket teslimi |
| Paket görseli doğru | PASS — eski takeaway-service.png, gerçek tarayıcı ve modal testi |
| Paket ödülü doğru | PASS — tarayıcıda 692→727 (+35), unit backend |
| Masa/paket eşzamanlı | PASS — üç masa ve paket sözleşme testi |
| Yeniden yükleme | PASS — bakiye 727 / XP175 / sonraki paket korunuyor |
| Görsel kaybı yok | PASS — 38 SHA256 ve dosya bağlantısı |

## Test sınırları

- `npm test`: PASS; logda **44 PASS satırı**, bunlar grup/özet satırlarıdır, bağımsız cihaz testi sayısı değildir. Servis sözleşmesinde **18 senaryo** var.
- Gerçek yerel tarayıcı: boş masa → karşılama → oturma → 4 ürün → mevcut masa hazır görseli → teslim → mevcut başarı görseli → masa boş. Ödül 462→702 (+240: 140 servis + mevcut hedef/seviye bonusları). Paket: boş masa varken Vanilla Latte, mevcut paket görseli, 692→727 (+35), kapanış ve yeniden yükleme PASS. Sentetik localhost kaydı; canlı kullanıcıya coin verilmedi.
- İmzalı Xcode Release arşivi PASS. Paket 0.9.3/2026111902; Web/index.html SHA256 kaynakla aynı: fecf4f8d3ff12fa82c7ecc161eca82df4ec569e0c5aee6e48fe48fac6e1cc8d0.
- Asset diff boş; git diff --check PASS.
- Son otomatik koşu FAIL: 0.
- Fiziksel iPhone/iPad ve iki gerçek cihaz servis testi: NOT RUN / BLOCKED; tarayıcı testi fiziksel cihaz testi sayılmadı.

## Teslim

Commit: `fix: restore table and takeaway service using existing assets`.
Tam SHA: dış teslim kaydında (`outputs/qa-service-2026-11-19/delivery.json`).
GitHub push/PR kimlik doğrulamasına bağlı; doğrulanmadan başarılı raporlanmaz.
0.9.2 Apple'a yüklenmiştir. 0.9.3 upload durumu RELEASE_STATUS.md ve dış teslim kaydında izlenir.

Kapsam dışı production P0'lar: canlı sunucu otoritesi/cloud cutover, gerçek Apple ödeme/iade, hesap silme/Apple revocation, gizlilik/review bilgileri. Ekonomik flag'ler kapalı; canlı DB/veri silme veya reset yapılmadı. Yeni migration gerekmedi; JSON sipariş alanları geriye uyumlu eklendi.

### Verified distribution update

0.9.3 (2026111902) upload succeeded at 04:03:37 UTC, 19 November. Apple ready-to-test mail reached barisgur@gmail.com at 04:05:21 UTC. Code commit 524de5809406fc3e703e1ad30e51bee03f8efbcb pushed via GitHub Desktop; remote SHA matches. PR creation: BLOCKED, integration HTTP 403 (Resource not accessible by integration). No production submission.
