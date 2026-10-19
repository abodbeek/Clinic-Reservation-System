# Clinic Reservation System — Backend

**Express.js · PostgreSQL · REST API · JWT**

## Proje Hakkında

Clinic Reservation System, klinikler için geliştirilmiş bir **randevu yönetim sistemi** projesidir. Bu depo, sistemin **Backend** bölümünü içerir ve **Node.js, Express.js (CommonJS) ve PostgreSQL** teknolojilerini kullanır. PostgreSQL bağlantısı `pg` kütüphanesi üzerinden sağlanır.

Uygulamada hasta kaydı ve girişi, rol tabanlı yetkilendirme, doktor yönetimi, haftalık çalışma saatleri, uygun randevu saatlerinin listelenmesi ve randevu oluşturma/iptal etme işlemleri bulunur.

> **Proje durumu:** Eğitim/staj için hazırlanmış bir **MVP (Minimum Viable Product)** sürümüdür. Gerçek hasta bilgilerini veya hassas sağlık verilerini işlemek üzere üretime hazır değildir.

## Özellikler

- **Kimlik doğrulama:** Hasta kaydı, parola hashleme, JWT ile giriş, korumalı kullanıcı profili.
- **Rol tabanlı yetkilendirme:** `PATIENT`, `DOCTOR` ve `ADMIN` rolleri; güncel rol kontrolü PostgreSQL üzerinden yapılır.
- **Doktor yönetimi:** Yönetici tarafından doktor ekleme, listeleme, detay görüntüleme, güncelleme ve **Soft Delete** (pasif duruma alma).
- **Çalışma programı:** Doktorların haftalık çalışma saatlerini tanımlama ve görüntüleme.
- **Uygunluk kontrolü:** **Europe/Istanbul** saat diliminde 30 dakikalık boş randevu aralıklarını hesaplama.
- **Randevu işlemleri:** Hastanın randevu oluşturması/iptal etmesi; hastanın, doktorun ve yöneticinin yetkili oldukları randevuları görüntülemesi; randevuyu tamamlanmış olarak işaretleme.
- **Çakışma önleme:** PostgreSQL'deki **partial UNIQUE index** ile aynı doktorun aynı 30 dakikalık aktif zaman aralığına eşzamanlı olarak iki randevu kaydedilmesinin engellenmesi.
- **Testler:** Tarih ve randevu mantığını kontrol eden temel otomatik testler.

## Kullanılan Teknolojiler

| Teknoloji | Kullanım amacı |
| --- | --- |
| Node.js | Sunucu çalışma ortamı |
| Express.js | REST API geliştirme |
| JavaScript / CommonJS | Backend kod yapısı |
| PostgreSQL | İlişkisel veritabanı |
| `pg` | Veritabanı bağlantısı ve SQL sorguları |
| `jsonwebtoken` | JWT oluşturma ve doğrulama |
| `bcryptjs` | Parola hashleme |
| `dotenv` | Ortam değişkenleri |
| `cors` | Frontend erişim ayarları |
| Postman | API isteklerini test etme |

## Proje Yapısı

```text
Clinic-Reservation-Backend-Complete/
├── src/
│   ├── Config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── role.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── doctor.routes.js
│   │   └── appointment.routes.js
│   ├── utils/
│   │   └── booking.js
│   └── server.js
├── database/
│   └── 001_schema.sql
├── tests/
│   └── booking.test.js
├── Clinic_Reservation.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Kurulum

### 1. Mevcut projeyi yedekleyin

İlk paylaşılan ZIP, bilgisayarınızda sonradan yaptığınız değişikliklerden daha eski olabilir. **Dosyaları değiştirmeden önce `src/` ve `package.json` için yedek veya Git commit oluşturun.**

Mevcut Authentication/Middleware yapısını korumak istiyorsanız yeni route ve yardımcı dosyaları tek tek birleştirebilirsiniz. Tüm paketi kullanacaksanız `src/` ve `database/` klasörlerini, mevcut dosyaları kontrol ederek ekleyin.

### 2. Bağımlılıkları yükleyin

Projenin ana klasöründe:

```powershell
npm install
```

Mevcut bir projeye gerekli bağımlılıkları elle eklemek isterseniz:

```powershell
npm install express cors dotenv pg bcryptjs jsonwebtoken
```

### 3. `.env` dosyasını hazırlayın

`.env.example` dosyasını örnek alarak **`package.json` ile aynı dizinde** `.env` oluşturun:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
DB_NAME=clinic_system
JWT_SECRET=REPLACE_WITH_RANDOM_SECRET
FRONTEND_ORIGIN=http://localhost:3000
```

- `DB_PASSWORD` değerini yerel PostgreSQL parolanızla değiştirin.
- `DB_NAME` değerini pgAdmin'de oluşturduğunuz veritabanı adıyla eşleştirin.
- Rastgele bir JWT anahtarı üretmek için:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Üretilen değeri `JWT_SECRET` alanına yazın. **`.env` dosyasını GitHub'a yüklemeyin.**

### 4. Veritabanını oluşturun / güncelleyin

1. **pgAdmin** uygulamasını açın.
2. **`clinic_system`** veritabanını seçin.
3. **Query Tool** bölümünü açın.
4. `database/001_schema.sql` dosyasının tüm SQL içeriğini çalıştırın.

SQL betiği mevcut `users` ve `doctors` tablolarını koruyacak şekilde yazılmıştır ve randevu/çalışma programı tablolarını ekler. **Mevcut tabloları silmeyin; `DROP TABLE` çalıştırmayın.**

### 5. Sunucuyu başlatın

```powershell
npm start
```

Alternatif:

```powershell
node src/server.js
```

Beklenen terminal çıktısı:

```text
PostgreSQL connected successfully
Server running on port 5000
```

Temel otomatik testler:

```powershell
npm test
```

> Bu mesajlar sunucunun ve veritabanı bağlantısının çalıştığını gösterir. Tüm API özelliklerinin doğrulandığı anlamına gelmez; aşağıdaki Postman testlerini ayrıca uygulayın.

## API Endpointleri

### Authentication

| Method | Endpoint | Yetki | İşlev |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Herkese açık | Hasta kaydı |
| POST | `/api/auth/login` | Herkese açık | JWT ile giriş |
| GET | `/api/auth/me` | Geçerli token | Kullanıcı profili |
| GET | `/api/auth/admin-test` | ADMIN | Yönetici yetkisi testi |

### Doktor Yönetimi

| Method | Endpoint | Yetki | İşlev |
| --- | --- | --- | --- |
| GET | `/api/doctors` | Herkese açık | Aktif doktorları listeleme |
| GET | `/api/doctors/:id` | Herkese açık | Doktor detayları |
| POST | `/api/doctors` | ADMIN | Doktor oluşturma |
| PATCH | `/api/doctors/:id` | ADMIN | Doktor bilgilerini güncelleme |
| DELETE | `/api/doctors/:id` | ADMIN | Doktoru pasif duruma alma |
| GET | `/api/doctors/:id/schedule` | Herkese açık | Haftalık çalışma programı |
| PUT | `/api/doctors/:id/schedule` | ADMIN veya ilgili DOCTOR | Çalışma programını güncelleme |
| GET | `/api/doctors/:id/availability?date=YYYY-MM-DD` | Herkese açık | Boş randevu saatleri |

### Randevu Yönetimi

| Method | Endpoint | Yetki | İşlev |
| --- | --- | --- | --- |
| POST | `/api/appointments` | PATIENT | Randevu oluşturma |
| GET | `/api/appointments/me` | PATIENT | Hastanın randevuları |
| GET | `/api/appointments/doctor` | DOCTOR | Doktorun randevuları |
| GET | `/api/appointments` | ADMIN | Son 500 randevu |
| PATCH | `/api/appointments/:id/cancel` | Randevu sahibi PATIENT veya ADMIN | Randevu iptali |
| PATCH | `/api/appointments/:id/complete` | İlgili DOCTOR veya ADMIN | Randevuyu tamamlama |

## Postman ile Örnek Test Akışı

**Base URL:** `http://127.0.0.1:5000`

Gerekli tüm tokenlı isteklerde **Authorization → Bearer Token** seçin. `Bearer` ifadesini token alanına ayrıca yazmayın.

### 1. Yönetici hesabıyla giriş

Daha önce **yalnızca yerel test ortamında** ADMIN rolü verilmiş hesap kullanılabilir.

```http
POST http://127.0.0.1:5000/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "ahmet@example.com",
  "password": "YOUR_TEST_PASSWORD"
}
```

Başarılı yanıttaki tokenı sonraki yönetici isteklerinde kullanın. **Tokenı veya gerçek parolaları paylaşmayın.**

### 2. Doktor oluşturma (ADMIN)

```http
POST http://127.0.0.1:5000/api/doctors
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

```json
{
  "full_name": "Dr. Ayse Demir",
  "email": "ayse@example.com",
  "password": "YourTemporaryPassword123!",
  "specialty": "Dermatology",
  "biography": "Skin specialist"
}
```

Beklenen başarılı durum: **201 Created**. Daha önce eklenmiş bir e-posta adresi kullanılırsa çakışma hatası alınabilir.

### 3. Haftalık çalışma saatlerini tanımlama (ADMIN / ilgili DOCTOR)

```http
PUT http://127.0.0.1:5000/api/doctors/1/schedule
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

```json
{
  "schedule": [
    {"day_of_week": 0, "start_time": "09:00", "end_time": "17:00"},
    {"day_of_week": 1, "start_time": "09:00", "end_time": "17:00"},
    {"day_of_week": 2, "start_time": "09:00", "end_time": "17:00"},
    {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00"},
    {"day_of_week": 4, "start_time": "09:00", "end_time": "17:00"},
    {"day_of_week": 5, "start_time": "09:00", "end_time": "17:00"},
    {"day_of_week": 6, "start_time": "09:00", "end_time": "17:00"}
  ]
}
```

`day_of_week`: **0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi**.

Bu örnek haftanın her günü 09.00–17.00 çalışma programı tanımlar; çalışılmayan günleri listeden çıkarabilirsiniz.

### 4. Uygun randevu saatlerini görüntüleme

```http
GET http://127.0.0.1:5000/api/doctors/1/availability?date=2026-10-26
```

Gerektiğinde **gelecekteki** başka bir tarih seçin. Zaman aralıkları 30 dakikalıktır.

### 5. Hasta hesabı oluşturma

```http
POST http://127.0.0.1:5000/api/auth/register
Content-Type: application/json
```

```json
{
  "full_name": "Test Patient",
  "email": "patient.demo@example.com",
  "password": "Test12345!"
}
```

Yeni hasta hesabıyla `/api/auth/login` isteği gönderin ve **PATIENT_TOKEN** alın. Yönetici tokenı ile hasta randevusu oluşturmayın.

### 6. Randevu oluşturma (PATIENT)

```http
POST http://127.0.0.1:5000/api/appointments
Authorization: Bearer PATIENT_TOKEN
Content-Type: application/json
```

```json
{
  "doctor_id": 1,
  "date": "2026-10-26",
  "time": "10:00",
  "reason": "General consultation"
}
```

- Uygun bir zaman aralığında başarılı işlem: **201 Created**.
- Aynı doktorun aynı zaman aralığına tekrar aktif randevu oluşturulması: **409 Conflict**.
- Randevu iptal edilirse aynı aralık yeniden kullanılabilir.

### 7. Doktor bilgilerini güncelleme (ADMIN)

```http
PATCH http://127.0.0.1:5000/api/doctors/1
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

```json
{
  "specialty": "General Medicine",
  "biography": "Updated biography"
}
```

### 8. Doktoru pasif duruma alma (ADMIN) — en son test edin

```http
DELETE http://127.0.0.1:5000/api/doctors/1
Authorization: Bearer ADMIN_TOKEN
```

Bu işlem doktoru fiziksel olarak silmez; **Soft Delete** uygulanır. Yeniden etkinleştirmek için:

```http
PATCH http://127.0.0.1:5000/api/doctors/1
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
```

```json
{
  "is_active": true
}
```

## Mevcut Sınırlamalar (MVP)

- Randevu süreleri sabit **30 dakika** olup başlangıç saatleri yalnızca `HH:00` ve `HH:30` olabilir. Hizmetlere göre değişken randevu süreleri henüz bulunmaz.
- Saat dilimi **Europe/Istanbul (UTC+03:00)** olarak sabittir. Çok bölgeli kullanımda klinik başına saat dilimi gerekir.
- Haftalık çalışma programının değiştirilmesi, daha önce kaydedilmiş randevuları otomatik olarak iptal etmez. Yönetici mevcut/gelecekteki randevuları kontrol etmelidir.
- Doktoru pasif duruma almak, kullanıcı hesabını veya geçmiş randevuları silmez.
- E-posta doğrulama, parola sıfırlama, otomatik bildirimler ve başarısız giriş denemelerine hız sınırı henüz eklenmemiştir.
- Bu eğitim sürümü **gerçek sağlık hizmeti veya hassas tıbbi veri saklama amacıyla üretimde kullanılmamalıdır**.

## Güvenlik Notları

- `.env`, gerçek veritabanı şifreleri, `JWT_SECRET` ve tokenları GitHub'a yüklemeyin.
- Ekran görüntülerinde veya commit geçmişinde bir sır ifşa edildiyse ilgili anahtarı/parolayı **değiştirin**. Sadece dosyanın güncel sürümden silinmesi geçmiş commitleri temizlemez.
- Yönetici hesaplarını güvenilir bir başlangıç işlemiyle oluşturun; normal kayıt sırasında kullanıcı **ADMIN** rolünü seçememelidir.
- Her korumalı istekte uygun role sahip Bearer Token kullanın.

## Frontend Entegrasyonu

Frontend geliştiricisi aşağıdaki API'lerle sayfaları oluşturmaya başlayabilir:

| Endpoint | Arayüzde kullanım |
| --- | --- |
| `GET /api/doctors` | Doktor listeleme |
| `GET /api/doctors/:id` | Doktor detay sayfası |
| `GET /api/doctors/:id/availability?date=YYYY-MM-DD` | Uygun saatlerin seçilmesi |
| `POST /api/auth/register` | Hasta kayıt formu |
| `POST /api/auth/login` | Giriş sayfası |
| `POST /api/appointments` | Randevu formu |
| `GET /api/appointments/me` | Hastanın randevuları |

Frontend ve Backend ekiplerinin **`doctor_id` / `date` / `time` alan adlarını, JSON formatlarını ve yetki kurallarını** önceden netleştirmesi entegrasyonu kolaylaştırır.

## Sonuç

Bu Backend projesi, **Express.js ve PostgreSQL** ile kullanıcı kimlik doğrulama, rol tabanlı yetkilendirme, doktor yönetimi, çalışma programları ve çakışma kontrolü bulunan bir randevu altyapısı sağlar. API'ler Postman ile doğrulanacak ve Frontend ile entegre edilecek şekilde tasarlanmıştır.

Gelecek geliştirmeler arasında otomatik bildirimler, şifre sıfırlama, daha kapsamlı testler, güvenlik iyileştirmeleri ve sunucuya dağıtım yer alabilir.
