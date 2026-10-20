# Panduan Instagram Business/Professional — untuk Influencer Autopilot

Tujuan: biar akun Instagram-mu bisa dipakai untuk posting otomatis di fase M4.
Panduan ini ditulis setelah riset ke sumber resmi Meta + Instagram (Oktober 2026).

---

## Bagian A — Ganti akun Personal jadi Profesional (5 menit, GRATIS)

Syaratnya cuma satu: akunmu tidak boleh dalam keadaan PRIVATE dulu.
Kalau masih private, akun akan otomatis jadi public saat ganti.

Langkah (dari aplikasi Instagram di HP):

1. Buka profil kamu (ikon foto profil, kanan bawah).
2. Tap menu ☰ (tiga garis, kanan atas).
3. Tap "Settings and activity" (atau "Pengaturan dan aktivitas").
4. Di bawah "For professionals" (Untuk profesional), tap "Account type and tools".
5. Tap "Switch to professional account".
6. Pilih kategori yang paling cocok (misal: Digital creator, Entrepreneur, Product/service).
7. Pilih tipe: "Business" atau "Creator" (lihat Bagian B).
8. Tap Next.
9. Review info kontak — boleh tap "Don't use my contact info" kalau tidak mau tampil.
10. "Connect a Facebook Page" — ini OPSIONAL di tahap ini, boleh Skip dulu.
    (Tapi nanti WAJIB untuk posting otomatis penuh — lihat Bagian D.)

Selesai. Akunmu sekarang profesional, gratis, dan bisa balik ke personal kapan saja.
Followermu, postingan, dan riwayat TIDAK hilang sama sekali.

Yang berubah:
- Akun jadi PUBLIC (tidak bisa private).
- Dapat Instagram Insights (statistik reach/impression/follower).
- Bisa dipakai alat scheduling/API pihak ketiga.

---

## Bagian B — Business atau Creator? (untuk AI influencer)

| | Business | Creator |
|---|---|---|
| Cocok untuk | toko, brand, jual produk | influencer, konten kreator, freelancer |
| Instagram Insights | ya | ya |
| Tombol kontak | ya | ya |
| DM filter/folder | tidak | ya |
| Instagram Shopping | ya | tidak |

Rekomendasi: pilih CREATOR kalau fokusnya membangun persona influencer
dan jual produk digital via link. Pilih BUSINESS kalau mau maksimal di
jalur Facebook Page + content publishing.

Catatan teknis (jujur): untuk posting OTOMATIS lewat API, jalur yang paling
banyak dipakai dan paling terdokumentasi adalah BUSINESS account yang terhubung
ke Facebook Page. Creator juga bisa, tapi Business lebih "aman" untuk M4.
Kalau ragu: pilih Business.

---

## Bagian C — Apa yang HARUS disiapkan untuk posting OTOMATIS (M4)

Ganti ke Business saja TIDAK cukup untuk posting otomatis. Yang lengkap butuh:

1. Akun Instagram PROFESIONAL (Business, selesai di Bagian A).
2. Facebook Page yang terhubung ke akun Instagram itu (satu Page untuk satu IG).
3. Akun Meta for Developers + buat "App" dengan produk "Instagram API".
4. Permission `instagram_business_content_publish` (untuk posting).
5. Access token (Instagram User token atau Facebook Page token) yang long-lived.

Yang penting dipahami (ini bagian yang bikin M4 "berat", bukan salah coding):

- Untuk akun SENDIRI, kamu TIDAK perlu App Review. Pakai app dalam mode
  "Development" dengan dirimu sendiri sebagai admin/tester sudah cukup untuk
  posting ke akunmu sendiri.
- App Review cuma wajib kalau kamu mau posting ke akun ORANG LAIN.
- Rate limit: maksimal 100 post via API per 24 jam (jauh lebih dari cukup
  untuk 1 post/hari).

Rekomendasi langkah: kerjakan Bagian A sekarang (5 menit). Bagian C
(Facebook Page + Meta app + token) nanti saya bantu setup-nya pas masuk M4,
karena butuh akun Meta Developer dan beberapa konfigurasi yang lebih teknis.

---

## Checklist

- [ ] Akun IG sudah public (bukan private)
- [ ] Sudah switch ke Professional (Business atau Creator)
- [ ] Sudah punya Facebook Page (untuk M4 nanti)
- [ ] (nanti, M4) Meta Developer app + Instagram API + content_publish permission
- [ ] (nanti, M4) Long-lived access token tersimpan aman (terenkripsi)

Sumber: help.instagram.com (Set up a professional account),
developers.facebook.com (Instagram Content Publishing).
