# Sucu — Detaylı Proje Planı

Bu doküman **uygulama kodlamaya başlamadan önce** tüm kararların, kapsamın, teknoloji yığınının, güvenlik stratejisinin ve sprint planının tek sayfada toplandığı referans belgedir. Her sprint başında bu belge güncellenir.

> **Durum:** Plan onaylandı, kod yazımı başlamak üzere. Son güncelleme: 2026-04-20.

---

## 0. Yönetici Özeti

**Sucu**, İstanbul genelinde mahalle bazlı su sipariş platformudur. Tek bir iOS uygulaması içinde iki rol (müşteri / su bayisi — "sucu") barınır, kullanıcı giriş ekranında rolünü seçer. Backend olarak Supabase (Postgres + Auth + Storage) kullanılır. Uygulama App Store'a yayınlanacak, repository public olacak ve hoca tarafından hem App Store üzerinden hem de kod inceleme için erişilecektir.

**Ana kısıtlar:**
- Tek kişilik ekip, dönem sonuna yetişmeli
- Public repo → secret sızıntısı olmamalı
- Güzel ve temiz bir MVP, agresif feature çokluğu değil
- Kullanıcının zamanı kısıtlı → implementasyon büyük ölçüde AI (Claude) tarafından yürütülecek

---

## 1. Kapsam (MVP — v1.0)

### 1.1 Coğrafi
- Sadece İstanbul
- İl sabit (UI'da görünmeyecek veya read-only "İstanbul" etiketi)
- 39 ilçe + tüm mahalleler seed edilecek lookup tablolarından gelir
- Kullanıcı ve bayi mahalleyi açık arama + seçim ile belirler, serbest metin değil

### 1.2 Kullanıcı rolleri
- **Customer** (müşteri) — sipariş veren
- **Vendor** (sucu / bayi) — sipariş alan
- Tek bir `auth.users` kaydı → tek bir `profiles` kaydı → tek bir rol. Kullanıcı hem müşteri hem sucu olamaz (v1'de).

### 1.3 Auth
- Email + şifre
- Apple Sign-in, Google Sign-in yok
- Email doğrulama v1'de kapalı (hızlı prototip için) — v1.1'de açılacak

### 1.4 Müşteri akışları
- Kayıt → rol seç (müşteri) → profil oluştur
- Adres ekle/düzenle/sil (mahalle seçimi + serbest adres metni)
- Kendi adresinin mahallesine hizmet veren sucuları listele
- Sucuya tıkla → mağaza + ürün listesi açılır
- Ürüne tıkla → miktar seç → "Sipariş Ver" modalı ile onay
- Sipariş oluşturulunca sucuya push notification gider
- Sipariş durumunu görüntüle (pending → preparing → delivering → delivered)
- Her durum değişikliğinde müşteriye push notification
- Teslim edilen siparişe **1-5 yıldız puan** ver (ve opsiyonel yorum)
- Geçmiş siparişler

### 1.5 Sucu akışları
- Kayıt → rol seç (sucu) → bayi profili oluştur
- Dükkan bilgileri (isim, telefon, logo)
- Çalışma saatleri (opens_at / closes_at — tek aralık)
- **Teslim ücreti** belirle (default 0, istediği tutarı girebilir)
- Hizmet verilen mahalleleri seç (çoklu)
- Ürün ekleme/düzenleme/silme (fotoğraf, marka, hacim, fiyat)
- Gelen siparişleri listele (yeni sipariş geldiğinde push notification)
- Sipariş durumunu güncelle: **accept → preparing → delivering → delivered** (veya cancel)
- Kendisine verilmiş puanları / yorumları dükkan profilinde görebilir

### 1.6 Kapsam dışı (v1'de YOK)
- Ödeme entegrasyonu — sipariş kapıda nakit/kart alınır, app sadece siparişi iletir
- Realtime sipariş takibi (sayfa açıkken canlı değişiklik) — v1'de pull-to-refresh + push notification uyarısı yeterli
- Kurye / sürücü rolü
- Sepet (çoklu ürün aynı sipariş) — v1'de tek ürün tek sipariş; **güncelleme:** v1.1'e ertelendi
- Promosyon / kupon kodu
- Çoklu dil (sadece Türkçe)
- Dark mode
- Android build (teknik olarak mümkün ama submission sadece iOS)
- Email doğrulama (v1.1)

> **Not sepet hakkında:** Senin akış tarifinde "ürüne tıkla → miktar seç → sipariş ver" var, yani tek üründen sipariş. Bu v1'i çok basitleştiriyor — sepet/çoklu ürün ekleme yok. Sipariş = 1 ürün × N adet.

---

## 2. Teknoloji Yığını

| Katman | Seçim | Neden |
|---|---|---|
| Framework | Expo SDK (en güncel stabil) | Dev build + OTA update, EAS Build iOS için Mac gereksiz |
| Dil | TypeScript | Tip güvenliği, refactor kolaylığı |
| Routing | Expo Router (file-based) | Ekran yapısı kod yapısıyla birebir |
| Server state | TanStack Query | Supabase fetch cache, retry, invalidation |
| Local state | Zustand | Küçük + minimal; context provider cehennemini engeller |
| Form | React Hook Form + Zod | Tip güvenli validation |
| UI | NativeWind (Tailwind RN) | Hızlı stil, minimum component library bağımlılığı |
| Iconlar | lucide-react-native | Modern, tutarlı, tree-shakeable |
| Tarih | date-fns + tr locale | `new Date()` manipülasyonundan kurtulmak |
| Resim seçimi | expo-image-picker | Galeri + kamera |
| Backend | Supabase (Postgres + Auth + Storage) | Auth + DB + dosya tek çatı altında |
| Supabase client | `@supabase/supabase-js` v2 | Resmi SDK |
| Push notification | **Expo Push Notifications** (free) + Supabase Edge Function trigger | Supabase'in kendi push servisi yok; Expo Push API tamamen ücretsiz, APNs sertifikası Expo tarafında |
| Build/Deploy | EAS Build + EAS Submit | Mac gereksiz, TestFlight otomatik |
| Analitik | v1'de yok | Scope dışı |
| Crash reporting | Sentry (opsiyonel, v1.1) | Free tier yeterli |

---

## 3. Güvenlik ve Secret Yönetimi (Public Repo için)

Repo public olduğu için bu bölüm kritik. Her secret kategorisi için nerede yaşayacağı aşağıdadır.

### 3.1 Public olması güvenli olanlar (repo'ya konabilir)
| Öğe | Neden güvenli |
|---|---|
| Supabase Project URL | Tasarım gereği public |
| Supabase `anon` key | JWT, tek başına hiçbir şey yapamaz. Güvenlik RLS'tir. |
| Bundle ID (`com.yasartaymaz.sucu`) | Public |
| App.json metadata | Public |

Bunları `app.config.ts` içinde `extra` field'ına koymak veya `EXPO_PUBLIC_*` env olarak tutmak ve `.env.example` ile dokümante etmek yeterli. Ama **`.env.local` kesinlikle `.gitignore`da**, development/production Supabase proje ayrımı için.

### 3.2 Kesinlikle public olmaması gerekenler
| Öğe | Nerede yaşar |
|---|---|
| Supabase `service_role` key | Sadece Supabase Edge Functions içinde env olarak; client'a hiçbir zaman dokunmaz |
| Apple Distribution Certificate (.p12) | EAS Credentials Manager |
| Apple Provisioning Profile | EAS Credentials Manager |
| App Store Connect API Key | EAS Credentials Manager |
| Expo/EAS Access Token | Lokal shell env, repoya girmez |
| Test kullanıcı şifreleri | 1Password veya kullanıcının tercih ettiği şifre yöneticisi |

### 3.3 `.gitignore` disiplini
```
.env
.env.local
.env.*.local
*.p12
*.mobileprovision
AuthKey_*.p8
.expo/
node_modules/
ios/          # managed workflow kullanıyoruz
android/
```

### 3.4 RLS (Row Level Security) — asıl güvenlik katmanı
- Her tabloda `alter table x enable row level security` **migration'ın zorunlu ilk adımı**
- Policy'ler rol bazlı:
  - Lookup tabloları (districts, neighborhoods) → anonim dahil herkese okuma
  - profiles → kendi satırı okuma/güncelleme; vendors tabloya public read
  - customer_addresses → sadece sahibi
  - vendor_service_areas → public read (müşteri filtreleyebilsin), sadece sahibi yazma
  - products → public read, sadece sahibi yazma
  - orders → sadece müşteri (owner) ve ilgili vendor
  - order_items → parent order'ın policy'sini izler
- Her policy için manuel test (curl veya Supabase SQL editor) yazılır, `docs/rls-tests.md` içine kaydedilir

### 3.5 Git geçmişi
- Şu anki repo temiz (kontrol edildi: sadece .md + .png)
- Her commit öncesi `git diff` review edilir, secret sızıntısı önlenir
- Pre-commit hook (opsiyonel, v1.1): `gitleaks` veya basit grep tarayıcı

### 3.6 Hoca için "nasıl çalıştırırım" stratejisi
Hoca projeyi klonlayıp çalıştıracak. İki seçenek:
1. **TestFlight linki** — en basit yol, kod yüklemeye gerek yok
2. **Lokal çalıştırma** — hoca kendi Supabase projesini kuramaz (unrealistic). Çözüm: README'de TestFlight linkini öne çıkar + anon key + URL'yi `app.config.ts` default'larına koy (public olmaları sakıncasız); hoca sadece `npm install && npx expo start` ile dev build açabilir ve gerçek prod DB'sine bağlanır.

Bu, **anon key'i repo'ya commit etmek demek** — ama design by public olduğu için sorun değil. RLS'in sıkı olması koşuluyla.

---

## 4. Veri Modeli

Tüm tablolarda ortak base kolonlar:
```sql
id          uuid primary key default gen_random_uuid(),
created_at  timestamptz not null default now(),
updated_at  timestamptz not null default now(),
deleted_at  timestamptz
```

`updated_at` için tek bir trigger function:
```sql
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
```
ve her tabloya `create trigger ... before update for each row execute function set_updated_at()`.

Soft delete disiplini: **Hiçbir yerde `delete from` yok.** Her silme `update x set deleted_at = now()`. Her okuma `_active` view üstünden gider; view içinde `where deleted_at is null` otomatik uygulanır.

### 4.1 Tablolar

#### `profiles`
- `id uuid` — `auth.users.id` ile eşleşir (FK)
- `role text check (role in ('customer','vendor'))`
- `full_name text`
- `phone text` — TR formatı (+905...)
- `expo_push_token text` nullable — cihaz push token'ı, login sonrası kaydedilir

#### `districts` (İstanbul ilçeleri, lookup)
- `name text unique`
- Seed: 39 ilçe

#### `neighborhoods` (İstanbul mahalleleri, lookup)
- `district_id uuid fk → districts`
- `name text`
- `unique(district_id, name)`
- Seed: ~960 mahalle

#### `vendors`
- `profile_id uuid fk → profiles unique`
- `shop_name text`
- `phone text`
- `logo_path text` — Storage'daki yol (ör. `vendor-logos/{vendor_id}.jpg`)
- `tax_no text` nullable
- `delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0)`
- `opens_at time not null default '09:00'`
- `closes_at time not null default '21:00'`

#### `vendor_service_areas`
- `vendor_id uuid fk → vendors`
- `neighborhood_id uuid fk → neighborhoods`
- `unique(vendor_id, neighborhood_id)`

#### `products`
- `vendor_id uuid fk → vendors`
- `name text`
- `brand text` nullable
- `volume_liters numeric(6,2)`
- `price numeric(10,2) check (price >= 0)`
- `image_path text` nullable — Storage yolu
- `stock_status text check (stock_status in ('in_stock','out_of_stock')) default 'in_stock'`

#### `customer_addresses`
- `customer_profile_id uuid fk → profiles`
- `label text` — "Ev", "İş" vb.
- `neighborhood_id uuid fk → neighborhoods`
- `full_address text` — sokak, bina no, daire no (serbest metin)
- `is_default boolean not null default false`
- Partial unique index: `where is_default = true and deleted_at is null`

#### `orders`
- `customer_profile_id uuid fk → profiles`
- `vendor_id uuid fk → vendors`
- `product_id uuid fk → products` — v1'de sipariş = 1 ürün × N adet (sepet yok)
- `product_name_snapshot text`
- `unit_price_snapshot numeric(10,2)`
- `qty int not null check (qty > 0)`
- `delivery_fee_snapshot numeric(10,2) not null default 0` — vendor'ın o anki ücreti
- `subtotal numeric(10,2)` — qty * unit_price_snapshot
- `total numeric(10,2)` — subtotal + delivery_fee_snapshot
- `address_snapshot jsonb` — adres o anki haliyle (müşteri adresini sonradan silse bile sipariş bütün kalır)
- `status text check (status in ('pending','accepted','preparing','delivering','delivered','canceled'))`
- `customer_note text` nullable
- `canceled_reason text` nullable

#### `order_status_history` (append-only)
- `order_id uuid fk → orders`
- `status text`
- `changed_by uuid fk → profiles`
- Bu tabloda `updated_at` ve `deleted_at` yok (immutable log); `id` ve `created_at` var

#### `reviews`
- `order_id uuid fk → orders unique` — her siparişe tek review
- `customer_profile_id uuid fk → profiles`
- `vendor_id uuid fk → vendors`
- `rating int not null check (rating between 1 and 5)`
- `comment text` nullable

### 4.2 View'lar
Her mutable tablo için `x_active` view:
```sql
create view profiles_active as select * from profiles where deleted_at is null;
-- diğerleri aynı örüntü
```
Uygulama **view'lardan** okur, tabloya doğrudan select atmaz.

### 4.3 Index planı
- Her FK üstüne otomatik index
- `orders(customer_profile_id, created_at desc)` — müşteri sipariş geçmişi için
- `orders(vendor_id, status, created_at desc)` — sucu paneli için
- `vendor_service_areas(neighborhood_id, vendor_id)` — müşteri filtresi için
- `products(vendor_id, deleted_at)` — sucu ürün listesi için
- `reviews(vendor_id)` — dükkan profilinde ortalama puan için

### 4.4 Migration yönetimi
- `supabase/migrations/` altında timestamped SQL dosyaları
- `supabase db push` ile prod'a uygulanır
- Geri alma (rollback) stratejisi: down migration yazmıyoruz (prod'a zarar yok, veri geri yüklenebilir); `deleted_at` dolsun, tablo durur

---

## 5. App Yapısı (Expo Router)

```
app/
  _layout.tsx                      # QueryClient + Auth provider + theme
  index.tsx                        # splash/redirect → login veya role-aware home
  (auth)/
    _layout.tsx                    # auth stack
    login.tsx                      # Müşteri / Sucu butonları + email-pass form
    signup.tsx                     # rol seçimi form içinde
  (customer)/
    _layout.tsx                    # bottom tabs
    index.tsx                      # ana: yakındaki sucular
    orders/
      index.tsx                    # siparişlerim (aktif + geçmiş)
      [id].tsx
    vendor/
      [id].tsx                     # sucu detay + ürünler
    cart.tsx                       # sipariş özeti / onay
    profile/
      index.tsx
      addresses.tsx
      address-edit.tsx
  (vendor)/
    _layout.tsx                    # bottom tabs
    index.tsx                      # bugünkü siparişler
    orders/
      index.tsx                    # tüm siparişler
      [id].tsx
    products/
      index.tsx
      [id].tsx                     # yeni/düzenle
    shop/
      index.tsx                    # dükkan + hizmet bölgeleri
```

### 5.1 Auth guard
Root `_layout.tsx` içinde: session yoksa `(auth)` grubuna, session var + role=customer ise `(customer)`, role=vendor ise `(vendor)` grubuna yönlendirme.

### 5.2 Tabs (ortak örüntü)
- Müşteri: **Sucular • Siparişler • Sepet • Profil**
- Sucu: **Siparişler • Ürünler • Dükkan • Profil**

---

## 6. UI/UX

### 6.1 Tasarım prensipleri
- Minimal, Türkçe, büyük dokunma alanları
- Her ekran 3 state: **loading**, **empty**, **error** — her zaman

### 6.2 Palet
- Primary: `#0EA5E9` (sky-500, su teması)
- Accent: `#0369A1` (sky-700)
- Nötr: Tailwind slate skalası
- Destructive: `#DC2626` (red-600)
- Success: `#16A34A` (green-600)

### 6.3 Bileşen kütüphanesi (kendi)
Component library kullanmıyoruz. `components/ui/` altında kendi basit set:
`Button`, `TextInput`, `Select`, `Card`, `ListItem`, `EmptyState`, `ErrorState`, `Skeleton`, `Toast`, `Modal`, `BottomSheet`.

### 6.4 Typography
Sistem fontu (SF Pro iOS'ta). Boyutlar: 12, 14, 16, 18, 22, 28.

---

## 7. Geliştirme Workflow'u

### 7.1 Local setup
- `.env.local` içinde dev Supabase projesinin URL + anon key'i
- `npm run start` → Metro + Expo dev tools
- Telefonda Expo Go değil, **custom dev client** (EAS Build ile 1 kere build alınır, sonrası OTA)

### 7.2 Commit disiplini
- Türkçe commit mesajları, mevcut stil korunur (`"auth ekrani eklendi"`)
- Her commit öncesi `.env.local` içeriği kontrol edilir

### 7.3 Branch stratejisi
- Main branch her zaman deploy edilebilir
- Deneysel bir şey için feature branch açılır, hızlıca merge edilir
- v1.0 release öncesi `v1.0.0` git tag'i

### 7.4 Kullanıcı deneyimi (sen)
Sen telefonundaki dev build'i bir kere kurduktan sonra, ben push ettiğim sürece hot reload ile app güncel kalır. Aktif test için elini uzatman yeterli.

---

## 8. Sprint Planı — "Bugün"

Tek gün hedefli sıkıştırılmış plan. Sıralama aşağıdaki gibi, her adım bir öncekine bağımlı (paralel yapabileceğim yerler yok bu tempoda):

| # | Görev | Durum |
|---|---|---|
| 1 | Expo proje init (TS template, Expo Router, NativeWind, temel lib'ler) | ⏳ |
| 2 | Supabase projesi oluşturma (prod), anon key + URL çıkar, `.env.example` | ⏳ |
| 3 | Migration yaz: base cols trigger, tüm tablolar, view'lar, RLS policy'leri | ⏳ |
| 4 | Istanbul ilçe + mahalle seed SQL'i | ⏳ |
| 5 | Supabase client setup, TanStack Query provider, auth context | ⏳ |
| 6 | Auth ekranları: login, signup (rol seçimi), logout, auth guard, push token kaydı | ⏳ |
| 7 | Müşteri: adres ekleme/düzenleme, mahalle seçici | ⏳ |
| 8 | Sucu: onboarding (dükkan, telefon, saatler, teslim ücreti, logo) | ⏳ |
| 9 | Sucu: hizmet bölgesi seçimi (çoklu mahalle) | ⏳ |
| 10 | Sucu: ürün CRUD + Storage'a fotoğraf yükleme | ⏳ |
| 11 | Müşteri: adresine hizmet veren sucuları listele | ⏳ |
| 12 | Müşteri: sucu detay + ürün listesi | ⏳ |
| 13 | Müşteri: ürün seç + miktar + sipariş ver modal'ı | ⏳ |
| 14 | Sipariş durum yönetimi (sucu tarafında güncelleme, müşteri tarafında görüntüleme) | ⏳ |
| 15 | Push notification: Expo token + Supabase Edge Function (order events) | ⏳ |
| 16 | Review (1-5 yıldız + yorum) | ⏳ |
| 17 | UI cilası + empty/loading/error state'leri | ⏳ |
| 18 | App icon + splash + app.json metadata | ⏳ |
| 19 | EAS Build iOS + TestFlight + App Store submission | ⏳ |
| 20 | README güncelleme (hoca handoff) | ⏳ |

**Gerçekçi zaman:** Kod yazımı 1 günde biter (AI hızında), submission bugün tamamlanır. App Store review 1-3 gün. Hoca bugün repo + TestFlight davet linki alır, App Store linki review biter bitmez eklenir.

---

## 9. App Store Submission Checklist

- [ ] Bundle identifier: `com.yasartaymaz.sucu` (veya tercihe göre)
- [ ] App icon 1024×1024 PNG
- [ ] Splash / launch screen
- [ ] App Store Connect'te yeni app oluşturuldu
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) — Expo otomatik üretir, gözden geçir
- [ ] Required Reason API declarations (file timestamp, user defaults, vb.)
- [ ] Data collection beyanı: email, kullanıcı adı, lokasyon (mahalle), kullanım verisi
- [ ] App kategori: Food & Drink (alt kategori: yok)
- [ ] Age rating: 4+ (hassas içerik yok)
- [ ] Screenshots (iPhone 6.7", 6.5", 5.5" — Expo Orbit veya manuel)
- [ ] App description (Türkçe + İngilizce)
- [ ] Keyword optimization: "su, sipariş, mahalle, sucu, damacana, İstanbul"
- [ ] Support URL, Privacy Policy URL (GitHub Pages veya basit bir static page)
- [ ] Review için test hesabı (hem customer hem vendor, email/password)
- [ ] Demo data: en az 1 sucu + 3 ürün + seed mahalle verisi yüklü

---

## 10. Hoca İçin Handoff

README.md güncellemeleri:
1. Proje nedir (mevcut özet korunur)
2. App Store linki — öne çıkarılır
3. Nasıl lokal çalıştırılır:
   ```
   npm install
   npx expo start
   ```
   Anon key + URL default'ta olduğu için ekstra adım yok.
4. Nasıl test hesabıyla giriş yapılır (demo email/password)
5. Mimari: ekran akışları (mevcut mermaid diagram korunur, genişletilir)
6. Klasör yapısı açıklaması
7. Veri modeli ERD (mermaid)
8. AI kullanımı (ödev için gerekli): "Proje, Claude Code ile iteratif biçimde geliştirildi; planlama, kod yazımı ve submission süreci boyunca AI asistan kullanıldı"

---

## 11. Riskler ve Bilinmeyenler

| Risk | Azaltma |
|---|---|
| App Store review red gelirse | İlk submit'i vakitli yap (deadline'dan en az 10 gün önce). Privacy manifest ve Data Collection beyanları tam doldurulur. |
| RLS policy hatası → veri sızıntısı | Her policy manuel test edilir, `docs/rls-tests.md` içinde kayıtlı. |
| Supabase free tier sınırı (500 MB DB, 1 GB storage) | MVP için bol bol yeter |
| Istanbul mahalle verisi eksik/yanlış | Birden fazla kaynaktan cross-check, v1.1'de düzeltme mekanizması |
| Hot reload'da tip hatası crash | Her push'tan önce `tsc --noEmit` çalıştır (manual) |

---

## 12. Kararlar (kapalı)

1. **Teslim tarihi:** Bugün. Geliştirme bugün bitecek, submission bugün gönderilecek. App Store review 1-3 gün sürebilir, bu süre zarfında hoca TestFlight'tan indirip kullanabilir.
2. **Ödeme:** Yok. Sipariş kapıda.
3. **Push notification:** Var. Expo Push (ücretsiz) + Supabase Edge Function (order durumu değiştiğinde tetiklenir).
4. **Min sipariş tutarı:** Yok.
5. **Sucu çalışma saatleri:** Var, tek aralık (opens_at / closes_at).
6. **Teslim ücreti:** Parametrik, default 0, sucu kendi girer.
7. **Bundle ID:** `com.yasartaymaz.sucuapp`
8. **App adı:** Sucu. Dil: Türkçe (tek dil).
9. **Sepet:** Yok — sipariş = tek ürün × N adet.
