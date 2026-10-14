# Yeni Render Hesabı Kurulum Rehberi

## Adım 1: Yeni Render Hesabı Oluşturun
1. Yeni bir e-posta adresi kullanın (Gmail, Outlook vb.)
2. https://render.com adresine gidin
3. "Get Started" → "Sign Up" ile hesap oluşturun
4. GitHub hesabınızı bağlayın

## Adım 2: Blueprint (render-new-account.yaml) ile Deploy

### Yöntem A: Blueprint Kullanarak (Önerilen)
1. Render Dashboard'da **"New +"** → **"Blueprint"**
2. **"Connect GitHub"** → Bu repo'yu seçin
3. Render otomatik olarak `render-new-account.yaml` dosyasını algılayacak
4. **"Apply"** butonuna tıklayın
5. Servisler otomatik oluşturulacak:
   - `otoservis-api` (Web Service)
   - `otoservis-db` (PostgreSQL Database)

### Yöntem B: Manuel Olarak
1. **PostgreSQL Database Oluşturun:**
   - "New +" → "PostgreSQL"
   - Name: `otoservis-db`
   - Region: `Frankfurt`
   - Plan: `Free`
   - "Create Database" butonuna tıklayın
   - **Connection String**'i kopyalayın (Internal Database URL)

2. **Web Service Oluşturun:**
   - "New +" → "Web Service"
   - "Connect a repository" → Bu repo'yu seçin
   - Settings:
     - **Name**: `otoservis-api`
     - **Region**: `Frankfurt`
     - **Branch**: `master`
     - **Runtime**: `Node`
     - **Build Command**: (render-new-account.yaml'den kopyalayın)
     - **Start Command**: (render-new-account.yaml'den kopyalayın)
   
3. **Environment Variables Ekleyin:**
   - `DATABASE_URL`: (PostgreSQL'den kopyaladığınız connection string)
   - `JWT_SECRET`: `otoservis-jwt-secret-2026-cloud`
   - `JWT_REFRESH_SECRET`: `otoservis-refresh-secret-2026-cloud`
   - `API_PORT`: `10000`
   - `API_HOST`: `0.0.0.0`
   - `NODE_ENV`: `production`
   - `CORS_ORIGINS`: `https://otoservisapp.com,https://www.otoservisapp.com,https://portal.otoservisapp.com,https://otoservis-web-six.vercel.app,https://dist-theta-one-72.vercel.app,https://kupligroup.com,http://localhost:5173,http://localhost:5175`
   - `ADMIN_EMAILS`: `acaybak@gmail.com`

## Adım 3: Deploy'u Bekleyin
- Build işlemi 5-10 dakika sürebilir
- Logs'tan ilerlemeyi takip edebilirsiniz
- Başarılı olursa: `https://otoservis-api-[random].onrender.com` URL'si alırsınız

## Adım 4: Yeni API URL'sini Web Uygulamasına Ekleyin
Deploy başarılı olduktan sonra:
1. Yeni API URL'nizi not edin (örn: `https://otoservis-api-abc123.onrender.com`)
2. Bu URL'yi web uygulamanızda güncelleyin:
   - `apps/web/src/services/api.ts` dosyasında `VITE_API_URL` güncellemesi
   - Vercel'de yeniden deploy

## Adım 5: Eski Hesaptaki Servisleri Durdurun (Opsiyonel)
Eski Render hesabınızda (acaybak):
- `otoservis-api` servisini "Suspend" edin veya silin
- Böylece diğer servisler (kuplu-api, pchediyesepeti-api) için daha fazla saat kalır

## Kontrol Listesi
- [ ] Yeni Render hesabı oluşturuldu
- [ ] GitHub repo bağlandı
- [ ] PostgreSQL database oluşturuldu
- [ ] Web service deploy edildi
- [ ] Environment variables eklendi
- [ ] Deploy başarılı (yeşil "Live" durumu)
- [ ] Yeni API URL'si alındı
- [ ] Web uygulaması yeni URL ile güncellendi
- [ ] Test edildi (API çalışıyor mu?)

## Sorun Giderme
- **Build başarısız olursa**: Logs'ta hata detayını kontrol edin
- **Database bağlantı hatası**: `DATABASE_URL`'nin doğru olduğundan emin olun
- **CORS hatası**: `CORS_ORIGINS`'da yeni domain'i ekleyin
- **503 hatası**: Servis hala başlatılıyor olabilir, 2-3 dakika bekleyin

## Yeni API URL'si: _________________________________
(Buraya deploy sonrası aldığınız URL'yi yazın)
