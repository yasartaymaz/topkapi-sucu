# Proje Adı

**Sucu --- Mahalle Bazlı Su Sipariş Platformu**

## Problem Tanımı

Günümüzde birçok mahallede su siparişi hâlâ telefonla veya mesaj yoluyla
verilmektedir. Bu durum çeşitli problemlere yol açmaktadır:

-   Müşteriler mahallelerinde hizmet veren su bayilerini kolayca
    bulamamaktadır.
-   Sipariş süreci çoğu zaman telefon üzerinden yürütüldüğü için sipariş
    geçmişi takip edilememektedir.
-   Sipariş durumunun hangi aşamada olduğu (hazırlanıyor, dağıtımda vb.)
    kullanıcı tarafından görülememektedir.
-   Su bayileri siparişleri çoğu zaman manuel olarak takip etmek zorunda
    kalmaktadır.

Bu nedenle hem müşteriler hem de su bayileri için sipariş sürecini
dijitalleştiren basit bir platforma ihtiyaç vardır.

## Hedef Kullanıcı Kitlesi

Proje iki farklı kullanıcı grubuna yöneliktir.

### 1. Müşteriler

-   Mahallesindeki su bayilerinden hızlı şekilde sipariş vermek isteyen
    kullanıcılar
-   Telefonla sipariş vermek yerine dijital olarak sipariş oluşturmak
    isteyen kişiler
-   Sipariş geçmişini görmek ve sipariş durumunu takip etmek isteyen
    kullanıcılar

### 2. Su Bayileri (Sucu)

-   Mahalle bazlı hizmet veren yerel su satıcıları
-   Siparişlerini dijital ortamda yönetmek isteyen küçük işletmeler
-   Hangi siparişlerin hazırlanması veya dağıtımda olduğunu görmek
    isteyen işletmeler

## Değer Önerisi

Sucu uygulaması, müşteriler ile mahalle bazlı hizmet veren su bayilerini
tek bir platformda buluşturur.

Uygulama sayesinde:

-   Kullanıcılar kendi mahallelerinde hizmet veren su bayilerini
    görebilir.
-   Su bayilerinin sunduğu ürünler listelenebilir.
-   Kullanıcılar hızlı şekilde sipariş oluşturabilir.
-   Siparişin hangi aşamada olduğu uygulama üzerinden takip edilebilir.
-   Kullanıcılar geçmiş siparişlerini görüntüleyebilir.

Bu sayede hem müşteri tarafında sipariş süreci kolaylaşır hem de su
bayileri siparişlerini daha düzenli şekilde yönetebilir.

## Minimum Viable Product (MVP) Özellikleri

İlk versiyonda uygulamanın aşağıdaki temel özellikleri bulunacaktır.

### Kullanıcı özellikleri

-   kullanıcı kaydı ve giriş
-   adres ekleme
-   mahallede hizmet veren su bayilerini listeleme
-   ürünleri görüntüleme
-   sipariş oluşturma
-   sipariş durumunu takip etme
-   sipariş geçmişini görüntüleme

### Su bayisi özellikleri

-   su bayisi kaydı
-   hizmet verilen mahalleleri tanımlama
-   satılan su ürünlerini ekleme
-   gelen siparişleri görüntüleme
-   sipariş durumunu güncelleme

## Kullanıcı Yolculuğu (User Journey)

Uygulama iki farklı kullanıcı türüne hizmet etmektedir: **su bayileri
(sucu)** ve **müşteriler**.

### Su Bayisi (Vendor) Kullanıcı Yolculuğu

1.  Su bayisi uygulamaya kayıt olur.
2.  Dükkan adı ve iletişim bilgilerini girer.
3.  Hizmet verdiği şehir, ilçe ve mahalleleri seçer.
4.  Satışını yaptığı su ürünlerini sisteme ekler (marka, hacim, fiyat
    vb.).
5.  Müşterilerden gelen siparişleri uygulama üzerinden görüntüler.
6.  Sipariş durumunu güncelleyebilir (hazırlanıyor, dağıtımda, teslim
    edildi vb.).
7.  Tamamlanan siparişleri sipariş geçmişi üzerinden görüntüleyebilir.

### Müşteri (Customer) Kullanıcı Yolculuğu

1.  Kullanıcı uygulamaya kayıt olur.
2.  Adres ve mahalle bilgisini ekler.
3.  Sistem kullanıcının mahallesinde hizmet veren su bayilerini
    listeler.
4.  Kullanıcı bir su bayisini seçer ve ürünleri görüntüler.
5.  Kullanıcı sipariş oluşturur.
6.  Sipariş durumu uygulama üzerinden takip edilir.
7.  Kullanıcı daha sonra sipariş geçmişini görüntüleyebilir.

## Sistem Akış Diyagramı

```mermaid
flowchart TD

A[Vendor kayıt olur] --> B[Dükkan bilgilerini girer]
B --> C[Hizmet verdiği mahalleleri seçer]
C --> D[Su ürünlerini ekler]

E[Müşteri kayıt olur] --> F[Adres ve mahalle girer]

F --> G[Mahalledeki sucular listelenir]

D --> G

G --> H[Müşteri sucuyu seçer]
H --> I[Ürünleri görüntüler]
I --> J[Sipariş oluşturur]

J --> K[Sipariş sucunun paneline düşer]

K --> L[Sipariş durumu güncellenir]
L --> M[Hazırlanıyor]
M --> N[Dağıtımda]
N --> O[Teslim edildi]

O --> P[Sipariş geçmişine eklenir]

## Kullanılacak Yapay Zekâ Araçları

Projenin geliştirme sürecinde çeşitli yapay zekâ araçları
kullanılacaktır:

-   **ChatGPT / Claude:** proje konsepti, kullanıcı yolculuğu ve teknik
    tasarım üretimi
-   **AI tabanlı UI araçları (ör. v0, Midjourney vb.):** uygulama
    ekranlarının tasarlanması
-   **AI kod üretim araçları:** prototip uygulama geliştirme sürecinde
    destek

Bu araçlar fikir geliştirme, tasarım ve prototipleme aşamalarında üretim
ortağı olarak kullanılacaktır.
