# Panduan CARA 1 — Buat Token Baru dari Akun yang Punya "Kang Nova"

Tujuan: token lama dibuat dari akun Facebook yang SALAH (akun kerjaan,
ID 10228085512043537), jadi app tidak melihat Page "Kang Nova". Panduan ini
membuat token baru dari akun INFLUENCER (ID 61595223617336) yang benar-benar
memiliki Page "Kang Nova".

---

## Inti masalah (baca 30 detik)

Kamu punya DUA akun Facebook, dua-duanya bernama "Nova Suharyanto":

| Akun | ID | Isinya |
|---|---|---|
| KERJAAN | 10228085512043537 | 5 Page kerjaan (UNIS, FEMAX, dll). Token lama dibuat dari sini — SALAH |
| INFLUENCER | 61595223617336 | Page "Kang Nova". Token baru HARUS dari sini |

Semua langkah di bawah wajib dikerjakan dalam keadaan login akun INFLUENCER.

Cara cek kamu lagi login akun mana:
1. Buka facebook.com → klik foto profil → lihat URL di address bar.
2. Kalau URL memuat `id=61595223617336` → akun INFLUENCER (benar).
3. Kalau memuat angka lain → salah login. Logout dulu, login yang benar.

---

## LANGKAH 1 — Buka developers.facebook.com

1. Di browser yang sama, buka `developers.facebook.com`.
2. Kalau diminta login, pastikan login pakai akun INFLUENCER.

## LANGKAH 2 — Cek app lama muncul atau tidak

1. Klik "My Apps" (Aplikasi Saya).
2. Apakah ada app yang kamu bikin kemarin?

- Kalau MUNCUL → langsung ke LANGKAH 4 (lewati LANGKAH 3).
- Kalau TIDAK muncul → wajar, soalnya app-nya milik akun kerjaan. Lanjut LANGKAH 3.

## LANGKAH 3 — Bikin app BARU dari akun influencer (paling simpel)

1. Klik "Create app" (Buat aplikasi).
2. Use case → "Other" → Next.
3. Tipe → "Business" → Next.
4. Isi nama app (bebas, misal "Kang Nova Autopilot") + email kontak → Create app.
5. Di dashboard app, "Add product" → pilih "Instagram" → "Set up".
6. Di produk Instagram, pilih "API setup with Facebook Login".
7. Buka "App settings" → "Basic". Catat:
   - App ID (angka panjang)
   - App Secret (klik "Show")
   Simpan ke file `ID-Aplikasi -admin.txt` (ganti App ID + Secret yang lama).

## LANGKAH 4 — Generate token dari akun influencer

1. Buka `developers.facebook.com/tools/explorer`.
2. Dropdown "Meta App" (kanan atas) → pilih app yang baru kamu bikin.
3. Dropdown "User or Page" → pastikan "User Token" (BUKAN "Page Token").
4. "Add a permission" → tambahkan SATU per SATU (5 permission):
   - instagram_basic
   - instagram_content_publish
   - instagram_manage_insights
   - pages_show_list
   - pages_read_engagement
5. Klik "Generate Access Token" → login FB (akun influencer) → izinkan semua.
6. Copy token yang muncul (yang pendek, umur 1-2 jam).

## LANGKAH 5 — Tukar jadi token panjang (60 hari)

1. Buka tab baru, paste URL ini (ganti tanda <...>):

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<TOKEN_PENDEK>
```

   - `<APP_ID>` = App ID baru (Langkah 3 poin 7)
   - `<APP_SECRET>` = App Secret baru
   - `<TOKEN_PENDEK>` = token dari Langkah 4 poin 6

2. Enter. Muncul JSON berisi "access_token" baru + "expires_in" ≈ 5184000
   (kurang-lebih 60 hari).
3. Copy access_token yang BARU itu.

## LANGKAH 6 — Simpan & verifikasi

1. Update file `ID-Aplikasi -admin.txt` dengan token PANJANG yang baru.
2. Kirim token panjang itu ke asisten (atau bilang "udah disimpan").
3. Asisten tes `/me/accounts` → pastikan "Kang Nova" muncul → baru lanjut
   Bagian F (connect akun di app).

---

## Jalan pintas (lebih gampang)

Daripada ngerjain Langkah 5-6 sendiri, setelah Langkah 4 selesai kamu cukup
KIRIM token PENDEK-nya ke asisten. Asisten yang akan: tukar ke long-lived,
verifikasi dari akun yang benar, simpan ke file, dan tes sampai "Kang Nova"
muncul di daftar.

## Alternatif LANGKAH 3 (kalau mau pakai app lama)

Daripada bikin app baru, kamu bisa menambahkan akun influencer sebagai
developer app lama:
1. Login akun KERJAAN → developers.facebook.com → app lama → "App Roles".
2. Tambahkan akun influencer (cari pakai nama/email/ID) sebagai Developer.
3. Login akun INFLUENCER → terima undangannya (cek notifikasi FB/email).
4. Setelah diterima, app lama muncul di "My Apps" akun influencer.

Cara ini lebih ribet (bolak-balik login dua akun), jadi bikin app baru lebih
disarankan.
