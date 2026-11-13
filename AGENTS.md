# Cafeverse geliştirme kuralları

- Asıl oyun kaynakları source/public ve source/server altındadır. Üretilen iOS/App/Web dosyalarını elle değiştirmeyin; npm run build kullanın.
- Swift kodu iOS/App/CafeverseApp.swift içinde; Xcode proje referanslarını koruyun.
- Var olan tarif indekslerini ve kayıt uyumluluğunu koruyun. Yeni tarifler kataloğun sonuna eklenir.
- Masa dört kişiliktir; masa siparişleri birlikte teslim edilir. Kapıda seslenme coin değil müşteri kazandırır.
- Apple ve oyuncunun oluşturduğu hesapla gerçek giriş korunmalı; sahte giriş veya ücretsiz coin satın alma eklemeyin.
- Satın almada doğrulanmış StoreKit işlemini kalıcı, tek seferlik teslimden önce bitirmeyin.
- Değişikliklerden sonra npm test çalıştırın. Gerçek cihaz/ödeme testi yapılmadıysa yapıldı demeyin.
- .signing, özel anahtar, sertifika, servis rolü anahtarı veya kullanıcı kayıtlarını commit etmeyin.
