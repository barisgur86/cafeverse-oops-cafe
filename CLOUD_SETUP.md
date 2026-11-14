# Bulut kayıt (beta) – kurulum ve güvenlik

Bu sürüm Supabase üzerinde hesap bazlı bulut yedeği için istemci entegrasyonu ve veritabanı şeması ekler. `supabase/cloud_save.sql` dosyasını Supabase SQL Editor'da çalıştırmadan bulut kayıt çalışmaz. Native iOS derlemesi ve iki cihaz testi henüz yapılmamıştır.

**ÖNEMLİ:** Bu bir beta yedekleme akışıdır; oyun ekonomisi sunucu otoritesine taşınmadığı için coin ve StoreKit teslimini üretimde güvenilir bir cüzdan olarak kullanmayın. Gerçek coin satışından önce sunucuda doğrulanmış satın alma, tek seferlik teslim ve sunucu tarafında ekonomi işlemleri gerekir.

İlk girişte mevcut bulut kaydı varsa cihazın yerel kaydının yerine alınır; bulut kaydı yoksa yerel oyun durumu ilk değişiklikte yüklenir. Çakışan sürümler sessizce üzerine yazılmaz. İnternet yoksa yerel kayıt korunur. Aynı anda iki cihazda oynamak henüz otomatik birleştirilmez; çakışma kullanıcı müdahalesi gerektirir.
