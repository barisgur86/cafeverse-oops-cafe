# Bulut kayıt — 0.5.5

14 Kasım 2026: cafe_cloud_saves tablosu, RLS ve pull/push işlevleri Cafeverse Supabase projesine kuruldu. Canlı SQL testi hesap ayrımı, kendi kaydını okuma/yazma ve eski sürümle yazmayı reddetme kontrollerini geçti; geçici test verileri ROLLBACK ile geri alındı. Doğrulama sorgusu supabase/verify_cloud_save.sql içindedir.

İstemci son eşitlenen kaydı izler. Çevrimdışı yerel değişiklikler, bulut değişmemişse yeniden açılışta korunup yüklenir. İki kayıt da değişmişse buluttaki kayıt otomatik esas alınır; seçim ekranı gösterilmez. Yerelin yerine bulut alınmadan önce yerel kurtarma kopyası cihazda saklanır. Coinler birleştirilmez. Masa siparişleri de yedeğe dahil edilir.

Gerçek iPhone ve iki fiziksel cihazla uçtan uca test henüz tamamlanmadı. 0.3.6 (2026111401) native simülatör uygulaması derlendi; oyun içindeki canlı senkronizasyon sonucu kullanıcı doğrulaması bekliyor. Bu bir hesap yedeğidir; sunucunun doğruladığı bir ödeme cüzdanı değildir.

0.5.5: JSONB alan sıralaması farkları aynı kayıt olarak karşılaştırılır; eski baseline biçimi dönüştürülür. Müşteri oturtma, ilk bulut okuması tamamlanmadan yeni masa kaydı oluşturmaz. Apple işlemine coin teslimi bulut kaydında doğrulanmadan StoreKit finish çağrılmaz; bağlantı yoksa işlem bitirilmez ve yeniden denenebilir. Bu istemci senkronizasyon güvencesi, sunucu tarafında Apple imzalı işlem doğrulaması veya güvenilir coin ledger yerine geçmez.
