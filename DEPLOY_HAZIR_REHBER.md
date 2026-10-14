# 🚀 YENİ RENDER HESABINA DEPLOY - HAZIR REHBER

## ✅ Ön Hazırlık Tamamlandı:
- ✅ Neon.tech veritabanı oluşturuldu (Frankfurt)
- ✅ 8 Prisma migration başarıyla uygulandı
- ✅ DATABASE_URL hazır
- ✅ render-new-account.yaml güncellendi

---

## 📋 ADIM 1: Yeni Render Hesabına Giriş Yapın

**URL**: https://dashboard.render.com

Yeni e-posta hesabınızla giriş yapın.

---

## 📋 ADIM 2: Blueprint ile Deploy (EN KOLAY YÖNTEM)

### 2.1: Blueprint Başlatın
1. Dashboard'da **"New +"** butonuna tıklayın
2. **"Blueprint"** seçeneğini seçin
3. **"Connect GitHub"** butonuna tıklayın
4. **`otoservis`** repo'sunu seçin
5. **Branch**: `master`
6. **"Apply"** butonuna tıklayın

### 2.2: Render otomatik olarak şunları oluşturacak:
- ✅ `otoservis-api` Web Service
- ✅ Tüm environment variables (DATABASE_URL hariç)

---

## 📋 ADIM 3: DATABASE_URL'yi Manuel Ekleyin

Blueprint deploy başladıktan sonra:

1. **otoservis-api** servisine tıklayın
2. Sol menüden **"Environment"** seçeneğine tıklayın
3. **"Add Environment Variable"** butonuna tıklayın
4. Şu bilgileri girin:

**Key**: `DATABASE_URL`  
**Value** (kopyalayın):
```
postgresql://neondb_owner:npg_dGex7A1rnvgC@ep-green-base-b9tgb3zw-pooler.c-7.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

5. **"Save Changes"** butonuna tıklayın

---

## 📋 ADIM 4: Deploy'u İzleyin

1. **"Logs"** sekmesine tıklayın
2. Build işlemini izleyin (5-10 dakika sürecek)
3. Başarılı olursa yeşil **"Live"** durumu göreceksiniz

### Beklenen Log Çıktısı:
```
==> Building...
==> npm install -g pnpm@9.15.9 prisma@6...
==> pnpm install --filter=!@otoservis/desktop
==> prisma migrate deploy (8 migrations)
==> Node.js server starting on port 10000
```

---

## 📋 ADIM 5: Yeni API URL'sini Alın

Deploy başarılı olduktan sonra:

1. Servis sayfasının üst kısmında URL göreceksiniz:
   ```
   https://otoservis-api-XXXX.onrender.com
   ```

2. Bu URL'yi **bir yere not edin** (önemli!)

---

## 📋 ADIM 6: Test Edin

Yeni API'nin çalışıp çalışmadığını test edin:

```powershell
Invoke-WebRequest -Uri "https://otoservis-api-XXXX.onrender.com/health" -UseBasicParsing
```

Veya tarayıcıda:
```
https://otoservis-api-XXXX.onrender.com
```

---

## 📋 ADIM 7: Web Uygulamasını Güncelleyin

Yeni API URL'sini aldıktan sonra bana söyleyin, ben de:
- ✅ Web uygulamasını yeni URL'ye yönlendireyim
- ✅ Vercel'de yeniden deploy yapayım
- ✅ Test edeyim

---

## 🔧 SORUN GİDERME

### Build Başarısız Olursa:
- **Logs**'ta hata detayını kontrol edin
- **Node version** hatası: `package.json`'da `engines.node` kontrol edin
- **pnpm** hatası: Build command'ı kontrol edin

### Database Bağlantı Hatası:
- `DATABASE_URL`'nin doğru kopyalandığından emin olun
- Neon dashboard'da database'in aktif olduğunu kontrol edin

### 503 Hatası:
- Servis hala başlatılıyor olabilir (2-3 dakika bekleyin)
- Logs'ta hata var mı kontrol edin

### CORS Hatası:
- `CORS_ORIGINS` environment variable'ını kontrol edin
- Web uygulamasının domain'i eklenmiş olmalı

---

## 📞 YARDIM

Sorun yaşarsanız:
1. Render dashboard'da **"Support"** → **"Create Ticket"**
2. Veya bana ulaşın, yardımcı olayım!

---

## ✅ KONTROL LİSTESİ

- [ ] Yeni Render hesabına giriş yapıldı
- [ ] Blueprint ile deploy başlatıldı
- [ ] DATABASE_URL manuel eklendi
- [ ] Deploy başarılı (yeşil "Live" durumu)
- [ ] Yeni API URL'si alındı: `_____________________________`
- [ ] API test edildi (çalışıyor)
- [ ] Web uygulaması güncellendi (ben yapacağım)

---

**HAZIRSINIZ! Başlayalım!** 🚀
