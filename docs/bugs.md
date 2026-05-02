# Bug Notları

## Açık
1 kayittan sonra otomatik acilmiyor app, kapatip acmam gerekiyor appi
2 cikistan sonra otomatik giris ekranina atmiyor, kapatip acmam gerekiyor appi
3 Kayıt sonrası boş beyaz ekran açılıyor (AuthGuard profile yüklenirken takılıyor)
4 Çıkış butonu yok — alt menü yapılacak (anasayfa, siparişlerim, hesap)



## Çözüldü
- **Kayıt: RLS hatası (profiles insert)** — Supabase email confirmation kapatılınca düzeldi. Confirmation açıkken signUp sonrası session oluşmuyordu, auth.uid() null döndüğü için RLS blokluyordu.
