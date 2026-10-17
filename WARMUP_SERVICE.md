# OtoServis API Warmup Servisi

Bu dosya, Render ücretsiz plandaki API'nin uykuya geçmesini engellemek için harici cron servisleri tarafından çağrılır.

## Harici Warmup Kurulumu

### Seçenek 1: cron-job.org (Önerilen - Ücretsiz)

1. **https://cron-job.org** adresine gidin
2. Ücretsiz hesap oluşturun
3. "New Cronjob" butonuna tıklayın
4. Ayarlar:
   - **Title**: OtoServis API Warmup
   - **URL**: `https://otoservis-api-lsuv.onrender.com/api/v1/health`
   - **Schedule**: Her 10 dakikada bir (*/10 * * * *)
   - **Method**: GET
5. Kaydet

### Seçenek 2: UptimeRobot (Ücretsiz)

1. **https://uptimerobot.com** adresine gidin
2. Ücretsiz hesap oluşturun
3. "Add New Monitor" butonuna tıklayın
4. Ayarlar:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: OtoServis API
   - **URL**: `https://otoservis-api-lsuv.onrender.com/api/v1/health`
   - **Interval**: 5 minutes (ücretsiz planda minimum)
5. Kaydet

### Seçenek 3: EasyCron (Ücretsiz)

1. **https://www.easycron.com** adresine gidin
2. Ücretsiz hesap oluşturun
3. "Create Cron Job" butonuna tıklayın
4. Ayarlar:
   - **URL**: `https://otoservis-api-lsuv.onrender.com/api/v1/health`
   - **Execute every**: 10 minutes
5. Kaydet

## Neden Gerekli?

Render ücretsiz plan:
- 15 dakika hareketsizlikte API'yi uyutur
- İlk istek 30-60 saniye sürer (cold start)
- Harici warmup ile API her zaman uyanık kalır
- Kullanıcılar her zaman hızlı erişim sağlar

## Test

Warmup çalışıyor mu kontrol edin:

```bash
curl https://otoservis-api-lsuv.onrender.com/api/v1/health
```

Yanıt süresi < 500ms olmalı.

## Maliyet

- cron-job.org: **Ücretsiz**
- UptimeRobot: **Ücretsiz**
- EasyCron: **Ücretsiz**

**Toplam maliyet: $0/ay**
