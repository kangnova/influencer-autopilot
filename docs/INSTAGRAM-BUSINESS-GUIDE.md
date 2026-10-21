# Panduan Lengkap — Instagram Business + Facebook Page untuk Auto-Publish

Tujuan: supaya Influencer Autopilot bisa posting otomatis + tarik insights lewat API
(mode `SOCIAL_PROVIDER=instagram`). Ditulis per Oktober 2026 dari sumber resmi Meta.

Kalau kamu hanya mau jalankan sistem dengan aman tanpa API, mode `manual` (default)
sudah cukup — kamu posting sendiri lalu tandai "Mark published manually". Panduan ini
cuma untuk yang mau auto-publish penuh.

---

## Ringkasan: 4 hal yang wajib ada

1. Akun Instagram PROFESIONAL (Business atau Creator) — gratis.
2. Facebook Page yang terhubung ke akun IG itu.
3. Aplikasi Meta Developer (tipe "Business") dengan produk "Instagram".
4. Access token (Facebook User token, long-lived 60 hari) dengan permission
   `instagram_content_publish` + `instagram_manage_insights` + dependency-nya.

Kabar baik (penting): karena kamu publish ke akunmu SENDIRI, kamu TIDAK perlu
App Review. App dalam mode "Development" dengan dirimu sebagai admin sudah cukup.

---

## Bagian A — Ganti IG ke Professional (5 menit, gratis)

Syarat: akun tidak boleh PRIVATE (kalau private, akan otomatis jadi public saat switch).

Dari aplikasi Instagram di HP:

1. Buka profil kamu (ikon foto, kanan bawah).
2. Tap menu ☰ (tiga garis, kanan atas).
3. Tap "Settings and activity" / "Pengaturan dan aktivitas".
4. Di "For professionals", tap "Account type and tools" / "Jenis akun dan alat".
5. Tap "Switch to professional account" / "Beralih ke akun profesional".
6. Pilih kategori (misal: Digital creator / Entrepreneur).
7. Pilih tipe: Business atau Creator (lihat Bagian B).
8. Tap Next, review kontak (boleh skip).
9. Di "Connect a Facebook Page" — boleh skip dulu, nanti dikerjakan di Bagian C.

Akun sekarang profesional. Follower/post/riwayat TIDAK hilang. Bisa balik ke personal
kapan saja.

---

## Bagian B — Business atau Creator?

| | Business | Creator |
|---|---|---|
| Cocok untuk | brand / jualan | influencer / konten |
| Insights (reach, impression) | ya | ya |
| Dipakai jalur API posting | ya | ya |

Kode Influencer Autopilot memakai jalur "Facebook Login" (graph.facebook.com), dan
jalur itu jalan untuk Business MAUPUN Creator — asalkan terhubung ke Facebook Page.
Rekomendasi tetap: pilih BUSINESS kalau ragu, karena jalurnya paling terdokumentasi.

---

## Bagian C — Bikin & hubungkan Facebook Page

Syarat: satu akun Facebook biasa (akun pribadimu) yang akan jadi admin Page.

Cara 1 (paling cepat, dari Instagram):
1. IG → Edit profile (Edit profil).
2. Di "Public business information" → "Page".
3. Pilih "Create new Facebook Page" atau "Connect an existing Page".
4. Ikuti langkahnya sampai Page terhubung.

Cara 2 (dari Facebook):
1. Buka facebook.com/pages/create (login FB kamu).
2. Isi nama Page (misal nama persona influencer-mu) + kategori.
3. Selesai. Lalu hubungkan ke IG lewat Cara 1 (langkah 2-3).

Cara 3 (dari Meta Business Suite):
1. Buka business.facebook.com → Settings → Linked accounts → Instagram.
2. Connect akun IG kamu.

Yang wajib dipastikan:
- 1 Page untuk 1 akun IG (jangan bercabang).
- Kamu adalah ADMIN Page itu (bukan cuma editor).
- Kalau kamu punya BANYAK Page, catat: kode app mengambil Page PERTAMA di daftar,
  jadi pastikan Page yang benar (yang terhubung ke IG-mu) adalah satu-satunya yang
  relevan, atau setidaknya di urutan teratas akunmu.

---

## Bagian D — Bikin Aplikasi Meta Developer

1. Buka developers.facebook.com, login pakai akun FB yang jadi admin Page.
2. Klik "Create app" / "Buat aplikasi".
3. Pilih use case "Other", lalu tipe "Business".
4. Isi nama app (bebas, misal "Influencer Autopilot") + email kontak.
5. Di dashboard app, klik "Add product" / "Tambahkan produk" → pilih "Instagram".
6. Di dalam produk Instagram, pilih "API setup with Facebook Login"
   (BUKAN "Instagram Login" — kode kita pakai graph.facebook.com, jalur Facebook Login).
7. Catat dua hal ini (App Dashboard → App settings → Basic):
   - App ID (angka panjang)
   - App Secret (tekan "Show")

App Secret = kunci rahasia. Jangan pernah tampilkan ke publik atau commit ke git.

---

## Bagian E — Dapatkan Access Token (cara paling cepat: Graph API Explorer)

1. Buka developers.facebook.com/tools/explorer.
2. Di dropdown "Meta App" (kanan atas), pilih app yang barusan kamu buat.
3. Di dropdown "User or Page", pastikan pilih "User Token" (bukan Page Token).
4. Klik "Add a permission" → tambahkan SATU per SATU:
   - instagram_basic
   - instagram_content_publish
   - instagram_manage_insights
   - pages_show_list
   - pages_read_engagement
   (pages_show_list + pages_read_engagement adalah dependency yang diminta otomatis.)
5. Klik "Generate Access Token" → login FB (akun yang sama, admin Page) → izinkan semua.
6. Token yang muncul adalah SHORT-LIVED (1-2 jam). Salin dulu, jangan dipakai langsung.

7. Tukar jadi LONG-LIVED (60 hari). Buka URL ini di browser (ganti APP_ID, APP_SECRET,
   TOKEN_PENDEK dengan punyamu):

   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=TOKEN_PENDEK

   Hasilnya JSON berisi "access_token" baru (60 hari) + "expires_in". Salin access_token
   yang BARU ini — itulah yang dipakai di app.

8. (Opsional) Verifikasi token benar: di Graph API Explorer, panggil:
   GET /me/permissions — pastikan permission instagram_content_publish muncul dan
   statusnya "granted".

Catatan versi API: app membaca env INSTAGRAM_GRAPH_VERSION (default v21.0). Kalau
akunmu hanya menyediakan versi lebih baru, set env itu agar sama (lihat Bagian F).

Catatan akun: akun FB yang login untuk token HARUS punya peran (admin/developer) di
app tersebut. Pembuat app otomatis jadi admin, jadi selama kamu pakai akun yang sama,
aman.

---

## Bagian F — Masukkan ke Influencer Autopilot

1. Edit file .env, ubah:

   SOCIAL_PROVIDER=instagram

   (kalau versi API-mu bukan v21.0, tambah juga: INSTAGRAM_GRAPH_VERSION=vXX.0)

2. Restart server (kalau deploy, build ulang + restart). Env dibaca saat start.
3. Buka app → halaman "Social accounts" → isi:
   - Handle (misal namapersona)
   - Access token (tempel token LONG-LIVED dari Bagian E)
   - Account type (Business/Creator)
   → Connect. Kalau berhasil, muncul handle hasil verifikasi dari API.
4. Buka "Posts" → pilih content item yang sudah ada media → queue → approve → Publish.
5. Setelah publish, post akan punya "IG <id>" (externalPostId), dan tombol
   "Pull insights" muncul untuk menarik statistik ke Metrics.

Pesan error yang muncul di app adalah pesan ASLI dari API — baca baik-baik, biasanya
sudah menjelaskan penyebabnya (lihat Bagian G).

---

## Bagian G — Troubleshooting & jebakan umum

- "No Facebook Page found" / tidak ada Page
  → Token-nya bukan milik user yang admin Page, atau permission pages_show_list
  belum diizinkan. Ulangi Bagian E langkah 4-5, pastikan akun FB = admin Page.

- Page influencer-mu TIDAK muncul di daftar padahal kamu yakin sudah bikin
  → Kamu mungkin punya DUA akun Facebook dengan nama yang sama (mis. dua-duanya
  "Nova Suharyanto"). Token cuma melihat Page milik akun yang login saat
  generate token. Cara cek: panggil GET /me pakai token → catat ID-nya; lalu
  buka Page influencer → Settings → Page access → lihat ID profil pemiliknya.
  Kalau ID-nya beda, token dibuat dari akun yang SALAH. Solusi: (a) buat ulang
  token dari akun pemilik Page, atau (b) tambahkan akun pemilik token sebagai
  admin Page itu (Page access → Add new → cari pakai ID).

- Error menyebut "Page Publishing Authorization" (PPA)
  → Sebagian Page (terutama yang terhubung iklan) wajib PPA dulu sebelum boleh
  di-publish lewat API. Selesaikan di business.facebook.com → Page → Settings →
  Page Publishing Authorization.

- "media not ready" (error 9007)
  → App sudah menunggu container FINISHED sebelum publish, jadi harusnya tidak
  muncul. Kalau masih muncul, berarti media tidak bisa diproses Instagram
  (format/URL bermasalah).

- Media harus di URL PUBLIK
  → Instagram mengambil file dari URL. File di /uploads/ hanya jalan kalau app
  di-deploy publik + set PUBLIC_BASE_URL ke domainmu. Di localhost, auto-publish
  akan gagal ambil media — ini sebabnya deploy publik wajib untuk auto-publish.

- Token 60 hari, harus diperpanjang
  → Long-lived user token kedaluwarsa 60 hari dan TIDAK otomatis refresh di app.
  Sebelum habis (~tiap 50 hari), ulangi Bagian E langkah 5-7 lalu update token di
  halaman Social accounts. (Bisa diotomasi nanti kalau mau — bilang saja.)

- Rate limit
  → Maksimal 50-100 post via API per 24 jam (jendela bergulir). Jauh dari cukup
  untuk 1-3 post/hari.

- Video via API
  → Reels via API maksimal 90 detik. Kalau videomu lebih panjang, potong dulu.

- Akun tiba-tiba private / di-logout
  → IG kadang meminta verifikasi ulang keamanan. Cek akun di HP kalau ada notif,
  lalu coba connect ulang.

---

## Checklist akhir

- [ ] IG Professional (Business/Creator), status public
- [ ] Facebook Page terhubung ke IG, kamu admin
- [ ] Meta app (Business) + produk Instagram (Facebook Login)
- [ ] Token long-lived dengan instagram_content_publish + instagram_manage_insights
- [ ] .env: SOCIAL_PROVIDER=instagram
- [ ] Deploy publik + PUBLIC_BASE_URL diisi
- [ ] Connect akun di app sukses (muncul handle dari API)
- [ ] Publish post pertama sukses (muncul "IG <id>")

---

Sumber: developers.facebook.com (Instagram Platform: Content Publishing, Permissions
Reference), help.instagram.com (Set up a professional account).
