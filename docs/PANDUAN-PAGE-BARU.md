# Panduan — Bikin Page Facebook "Kang Nova" dari Nol (di Profil yang BENAR)

Tujuan: membuat satu Page Facebook influencer baru yang TIDAK mengulang masalah
sebelumnya (Page dibuat di profil tambahan, jadi token tidak bisa melihatnya).

---

## Aturan paling penting (baca 30 detik)

Token API kamu terikat ke PROFIL UTAMA (ID 10228085512043537). Jadi Page baru
wajib dibuat saat kamu login sebagai profil UTAMA — bukan profil tambahan
(profil "Kreator digital" yang dulu punya Kang Nova). Kalau salah profil,
masalahnya balik lagi: token tidak akan melihat Page itu.

Cara kenali profil UTAMA:
- Profil utama = yang punya Page "Teknologi Gurah Mesin FEMAX" (page kerjaan).
- URL profil utamanya = facebook.com/profile.php?id=10228085512043537.

---

## LANGKAH 0 — Pastikan kamu di profil UTAMA

1. Buka facebook.com.
2. Klik foto profil kamu (pojok kanan atas) → "Lihat semua profil".
3. Pilih profil yang UTAMA (yang punya page FEMAX, bukan yang "Kreator digital").
4. Cek URL di address bar → harus memuat id=10228085512043537.
   - Kalau URL-nya id=61595223617336 atau lain → kamu masih di profil tambahan.
     Ganti lagi.

## LANGKAH 1 — FEMAX TIDAK dihapus (sudah ditangani kode)

Page "Teknologi Gurah Mesin FEMAX" MASIH dipakai buat kerjaan, jadi jangan
dihapus. Kode app sudah diperbaiki: sekarang menarget Page tertentu lewat env
`INSTAGRAM_PAGE_NAME` (sudah diisi "Kang Nova"), BUKAN lagi page pertama di
daftar. Jadi dua Page (FEMAX + Kang Nova) boleh hidup berdampingan.

Catatan: kalau nanti nama Page finalnya bukan persis "Kang Nova", ubah nilai
`INSTAGRAM_PAGE_NAME` di file .env supaya cocok (tidak case-sensitive).

## LANGKAH 2 — Bikin Page baru

1. Buka facebook.com/pages/create.
2. Isi:
   - Nama Halaman: **Kang Nova**
   - Kategori: **Digital creator** (atau "Entrepreneur")
   - Bio/deskripsi (contoh): "Bisnis, AI & skill digital, dikupas simpel buat
     pemula."
3. Klik "Buat Halaman".

## LANGKAH 3 — Lengkapi tampilan Page (disarankan)

1. Foto profil: pakai logo/foto persona Kang Nova.
2. Foto cover: banner simple dengan nama Kang Nova + topik (bisnis/AI/skill).
3. Isi bagian "Intro": website lynk.id/kangnova, kontak, dll.

## LANGKAH 4 — Hubungkan ke Instagram

Pilih salah satu:

Cara A (dari Instagram, HP):
1. Buka Instagram → profil → Edit profil.
2. "Public business information" → "Page".
3. Pilih "Kang Nova" → sambungkan.

Cara B (dari Meta Business Suite, browser):
1. Buka business.facebook.com → Settings → Linked accounts → Instagram.
2. Connect akun IG influencer kamu.

Pastikan akun IG yang terhubung adalah akun IG influencer kamu (bukan yang lain).

## LANGKAH 5 — Verifikasi (biar asisten yang tes)

1. Kabari asisten: "page udah jadi + IG udah disambung".
2. Asisten tarik /me/accounts → pastikan "Kang Nova" muncul.
3. Asisten cek instagram_business_account → pastikan IG sudah tertaut.
4. Kalau semua OK → lanjut connect akun di app (Bagian F panduan lama).

---

## Rekomendasi Nama & Identitas

- Nama: **Kang Nova** (konsisten dengan handle IG + lynk.id/kangnova).
- Kategori: Digital creator.
- Bio contoh: "Bisnis, AI & skill digital, dikupas simpel buat pemula."

Kalau mau lebih spesifik sesuai niche (finance/bisnis/AI/skill), nama bisa
ditambah tagline di deskripsi, TAPI nama Page tetap "Kang Nova" supaya mudah
ditemukan dan konsisten dengan IG.
