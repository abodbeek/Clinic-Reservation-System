# Şifa Klinik — Clinic Reservation System

**Staj projesi: Next.js Frontend + Express.js Backend + PostgreSQL**

Türkçe kullanıcı arayüzüne sahip klinik randevu sistemi. Hastalar doktorları görüntüleyebilir, uygun saatleri seçip randevu oluşturabilir. Yönetici randevuları ve doktorları API üzerinden yönetebilir.

> **Durum:** Eğitim amaçlı MVP. Gerçek hasta bilgileri, sağlık kayıtları veya üretim ortamı için henüz uygun değildir. Frontend/Backend uçtan uca entegrasyonu yerel PostgreSQL üzerinde son kullanıcı tarafından test edilmelidir.

## Teknolojiler

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, JavaScript/TypeScript
- **Backend:** Node.js, Express 5, JavaScript CommonJS, `pg`, JWT, bcryptjs
- **Veritabanı:** PostgreSQL 18 ile geliştirilmiştir; SQL şeması `database/001_schema.sql` dosyasındadır.
- **Testler:** Node.js test runner, Postman

## Klasör yapısı

```text
Clinic-Reservation-System/
├── src/                          # Express API
│   ├── Config/db.js
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── database/001_schema.sql       # PostgreSQL tabloları ve indeksler
├── tests/booking.test.js
├── clinic-reservation-system-frontend/
│   ├── app/                       # Next.js sayfaları
│   ├── components/
│   ├── lib/api.js                 # Merkezi API istemcisi
│   ├── lib/auth.js                # Eğitim amaçlı oturum yönetimi
│   └── public/                    # Görseller
├── .env.example                   # Örnek Backend ayarları
├── .gitignore
└── package.json
```

`node_modules`, `.next`, `.git`, `.env` ve veritabanı yedekleri GitHub'a eklenmemelidir.

## Kurulum — Backend

1. PostgreSQL'de `clinic_system` adında bir veritabanı oluşturun.
2. `database/001_schema.sql` dosyasını pgAdmin Query Tool'da **bir defa** çalıştırın. Önceden kayıtlı `users`/`doctors` tabloları silinmez. Veritabanı şemanız farklıysa önce yedek alıp uyumluluğu kontrol edin.
3. Ana dizindeki `.env.example` dosyasını `.env` olarak kopyalayın. Kendi yerel PostgreSQL bilgilerinizi girin. `JWT_SECRET` için güvenli, rastgele bir anahtar kullanın.
4. Terminalde:

```powershell
npm ci
npm test
npm run dev
```

Beklenen mesajlar:

```text
PostgreSQL connected successfully
Server running on port 5000
```

API sağlık kontrolü: `GET http://127.0.0.1:5000/api/health`

## Kurulum — Frontend

İkinci bir terminal açın:

```powershell
cd clinic-reservation-system-frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Adres: **http://localhost:3000**

`.env.local` içeriği:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000
```

Backend'de `FRONTEND_ORIGIN` ayarı `http://localhost:3000,http://127.0.0.1:3000` şeklinde ayarlanabilir. Backend ve Frontend aynı bilgisayardaysa bunlar yerel adreslerdir. Farklı bilgisayarlardan erişim için ortak test sunucusu veya güvenli bir geliştirme tüneli gerekir.

## API sözleşmesi

| Method | Endpoint | Yetki |
| --- | --- | --- |
| POST | `/api/auth/register` | Herkese açık; sadece PATIENT oluşturur |
| POST | `/api/auth/login` | Herkese açık |
| GET | `/api/auth/me` | Kullanıcı Token'ı |
| GET | `/api/doctors` | Herkese açık |
| GET | `/api/doctors/:id` | Herkese açık |
| POST | `/api/doctors` | ADMIN |
| PATCH | `/api/doctors/:id` | ADMIN |
| DELETE | `/api/doctors/:id` | ADMIN; Soft Delete |
| GET | `/api/doctors/:id/schedule` | Herkese açık |
| PUT | `/api/doctors/:id/schedule` | ADMIN veya ilgili DOCTOR |
| GET | `/api/doctors/:id/availability?date=YYYY-MM-DD` | Herkese açık |
| POST | `/api/appointments` | PATIENT |
| GET | `/api/appointments/me` | PATIENT |
| GET | `/api/appointments/doctor` | DOCTOR |
| GET | `/api/appointments` | ADMIN; son 500 kayıt |
| PATCH | `/api/appointments/:id/cancel` | İlgili PATIENT veya ADMIN |
| PATCH | `/api/appointments/:id/complete` | İlgili DOCTOR veya ADMIN |

**Register örneği:**

```json
{"full_name":"Test Student","email":"student@example.com","password":"TEST_PASSWORD_AT_LEAST_8_CHARS"}
```

**Booking örneği:** (hasta Token'ı ve doktorun önceden tanımlanmış çalışma saatleri gerekir)

```json
{"doctor_id":1,"date":"YYYY-MM-DD","time":"10:00","reason":"General visit"}
```

Başarılı `POST /api/appointments` yanıtı `201`, aynı doktor/saat için ikinci aktif randevu `409` döner.

## Frontend ekranları

- `/` → `/home_page` yönlendirmesi
- `/home_page` → Ana sayfa
- `/register`, `/login` → Gerçek Backend API çağrıları
- `/Doktorlar`, `/Doktorlar/:id` → PostgreSQL'den gelen aktif doktorlar
- `/Randevu_Al` → Doktor + tarih + API'den uygun saat + JWT'li randevu kaydı
- `/appointments` → Hastanın randevuları / iptal
- `/admin/dashboard` → Admin yetkisi doğrulanarak gerçek randevular

> Tarayıcıda `sessionStorage` kullanımı yalnızca **staj demosu** içindir. Gerçek hasta verileri için `HttpOnly; Secure` cookie tabanlı güvenli oturum, CSRF koruması, daha sıkı yetki/erişim kontrolleri, rate limiting, denetim kayıtları, HTTPS vb. gerekir.

## Testler ve kontrol listesi

Backend: `npm test`

Frontend: `cd clinic-reservation-system-frontend`, sonra `npm run lint` ve `npm run build`.

Elle test için `INTEGRATION_TESTS.md` dosyasına bakın. Bu paketin hazırlanması sırasında Backend'in 4 birim testi geçti ve Frontend kaynakları TS/JSX sözdizimi kontrolünden geçti. **Üretim build'i ve canlı PostgreSQL ile uçtan uca test burada doğrulanmadı.**

## GitHub

Proje dizininde:

```powershell
git status
git add .
git status --short
git commit -m "Integrate clinic frontend with backend API and clean repository"
git push origin main
```

Önce `.env`, `.next`, `node_modules`, `.git` ve `.backup` dosyalarının staged olmadığını kontrol edin. Başka ekip üyesi `main` üzerinde çalışıyorsa branch açıp Pull Request kullanmak daha güvenlidir.

**Güvenlik uyarısı:** İlk Git geçmişinde bir `.env` dosyası bulunmuş olabilir. İlgili PostgreSQL parolasını/JWT_SECRET değerlerini yenileyin. `.gitignore` eski commit'leri temizlemez; Git geçmişini yeniden yazma işlemi ekip koordinasyonuyla ayrıca yapılmalıdır.

## Sınırlamalar

- Randevular sabit 30 dakikadır; sadece `HH:00` / `HH:30` başlangıçları kabul edilir.
- Saat dilimi `Europe/Istanbul` olarak sabittir.
- Doktorun çalışma saatleri değiştiğinde eski randevular otomatik iptal edilmez.
- E-posta doğrulama, parola sıfırlama, bildirimler, giriş sınırı ve doktor ekranı henüz tamamlanmamıştır.
- Kullanıcılara ait gerçek hasta/sağlık verilerini bu MVP'de kullanmayın.
