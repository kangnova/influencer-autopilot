# Panduan: Aktifkan Login Google di Kang Nova Autopilot

Panduan ini langkah demi langkah untuk mengaktifkan tombol **"Continue with Google"**
di halaman login aplikasi (https://kangnova.web.id).

Analogi sederhana: login Google itu kayak **nambah satu pintu baru ke rumah**.
Rumah (akun di aplikasi) harus **sudah ada dulu**, baru pintu Google bisa dipasang
di atasnya. Jadi ada satu syarat penting sebelum mulai — baca bagian 0 di bawah.

---

## 0. Syarat awal (WAJIB — jangan dilewati)

Email Google yang mau dipakai untuk login **harus sudah terdaftar sebagai pengguna**
di aplikasi. Login Google di sini hanya untuk "masuk", bukan untuk "daftar otomatis".

Caranya (2 menit):

1. Buka https://kangnova.web.id dan login dengan akun admin kamu
   (email + password biasa).
2. Masuk menu **Settings** (paling kanan di baris menu atas).
3. Di bagian **Add user**, isi:
   - **Email**: email Google kamu, misal `imedia287@gmail.com`
   - **Password**: buat password (minimal 8 karakter, bebas)
4. Klik **Add user**.

Selesai. Sekarang email Google itu sudah punya "rumah" di aplikasi, dan nanti bisa
dipakai login lewat Google.

> Catatan: kalau kamu mau beberapa orang bisa login pakai Google, tambahkan semua
> email Google mereka satu per satu lewat **Add user** ini.

---

## 1. Buka Google Cloud Console dan buat project

1. Buka browser, masuk ke: https://console.cloud.google.com
2. Login dengan akun Google kamu (sebaiknya email yang sama dengan yang mau dipakai
   login di aplikasi).
3. Di bagian paling atas, klik dropdown nama project (tulisan **"Select a project"**
   atau nama project yang sudah ada).
4. Di jendela yang muncul, klik tombol **"New Project"** (pojok kanan atas).
5. Isi **Project name**, misal: `Kang Nova Autopilot`.
   (Organization boleh dikosongkan.)
6. Klik **"Create"**. Tunggu beberapa detik sampai project jadi.
7. Pastikan project baru itu yang terpilih (lihat dropdown atas sudah berubah
   ke `Kang Nova Autopilot`).

---

## 2. Atur OAuth consent screen (layar izin Google)

Langkah ini adalah "papan nama" yang ditunjukkan Google ke pengguna saat pertama
kali login: "Aplikasi X minta akses ke email & profil kamu".

1. Di menu kiri, klik **"APIs & Services"**.
2. Klik **"OAuth consent screen"**.
3. Pilih **User Type = External**, lalu klik **"Create"**.
   (Pilih External karena ini aplikasi untuk umum / bukan dalam organisasi perusahaan.)
4. Isi halaman **App information**:
   - **App name**: `Kang Nova Autopilot`
   - **User support email**: email Google kamu
   - **Developer contact email**: email Google kamu (Google wajib isi ini)
   - Lainnya dibiarkan kosong.
5. Klik **"Save and Continue"**.
6. Halaman **Scopes**: biarkan default (email, profile, openid — sudah dicentang).
   Klik **"Save and Continue"**.
7. Halaman **Test users** (PENTING):
   - Klik **"+ Add Users"**.
   - Ketik email Google yang boleh login (misal `imedia287@gmail.com`).
   - Klik **"Add"**.
   - (Ulangi untuk setiap orang lain yang boleh login pakai Google.)
8. Klik **"Save and Continue"**.
9. Halaman ringkasan (Summary): klik **"Back to Dashboard"**.

> Kenapa "Test users" dan bukan langsung publish? Karena app masih status
> **Testing**. Di status ini HANYA email yang terdaftar di Test users yang bisa
> login — persis yang kita mau untuk aplikasi internal. Kalau nanti mau semua
> orang (umum) bisa login, baru klik **"Publish App"** di dashboard consent screen.

---

## 3. Buat OAuth Client ID (kunci pintunya)

Sekarang bikin "kunci" yang menghubungkan Google dengan aplikasi kita.

1. Masih di menu kiri **"APIs & Services"**, klik **"Credentials"**.
2. Klik tombol **"+ Create Credentials"** (atas), pilih **"OAuth client ID"**.
3. Isi formulir:
   - **Application type**: pilih **Web application**.
   - **Name**: `Kang Nova Autopilot` (bebas).
   - **Authorized JavaScript origins**: isi `https://kangnova.web.id` (asal/domain saja — TANPA path, TANPA garis miring di akhir). Kolom ini WAJIB diisi untuk fitur "deteksi otomatis" (Google One Tap) — yaitu popup "Lanjutkan sebagai [nama]" yang muncul otomatis saat kamu buka halaman login dan sedang login Google di browser. Kalau kolom ini kosong, tombol "Continue with Google" tetap jalan, tapi popup otomatis tidak muncul. Kalau kamu juga tes dari komputer lokal (localhost), tambahkan satu baris lagi: `http://localhost:3007`.
   - **Authorized redirect URIs**: klik **"+ Add URI"**, lalu ketik PERSIS (tanpa
     spasi, tanpa garis miring di akhir):

     ```
     https://kangnova.web.id/api/auth/callback/google
     ```

4. Klik **"Create"**.
5. Muncul jendela popup berisi dua hal:
   - **Your Client ID** (bentuknya `xxxxx.apps.googleusercontent.com`)
   - **Your Client Secret**
6. Klik tombol **copy** di samping masing-masing (atau klik **"Download JSON"**),
   lalu simpan di tempat aman. Keduanya akan dipakai di langkah berikutnya.

---

## 4. Masukkan Client ID + Client Secret ke file .env

File konfigurasi aplikasi ada di VPS.

1. Buka VPS dengan **WinSCP** (alamat `43.156.225.212`, user `ubuntu`).
2. Ingat: file `.env` itu **tersembunyi** — tekan **Ctrl+Alt+H** di WinSCP untuk
   menampilkan file tersembunyi.
3. Buka folder: `/home/ubuntu/influencer-autopilot/`
4. Klik kanan file `.env` → **Edit**.
5. Cari baris ini (kalau belum ada, tambahkan di baris paling bawah):

   ```
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   ```

6. Isi di antara tanda kutip dengan nilai yang kamu salin tadi, contoh:

   ```
   GOOGLE_CLIENT_ID="123456789-abcde12345.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
   ```

   (Ganti dengan Client ID dan Client Secret ASLI milikmu, bukan contoh ini.)
7. Simpan file (Ctrl+S), lalu tutup.

---

## 5. Restart aplikasi

1. Login SSH ke VPS (pakai terminal / PuTTY / WinSCP console).
2. Jalankan perintah ini:

   ```bash
   cd /home/ubuntu/influencer-autopilot
   pm2 restart influencer-autopilot --update-env
   ```

3. Cek tidak ada error (opsional, buat memastikan):

   ```bash
   pm2 logs influencer-autopilot --lines 20
   ```

---

## 6. Tes login

1. Buka https://kangnova.web.id/login (kalau sudah login, klik **Log out** dulu).
2. Sekarang tombol **"Continue with Google"** sudah muncul di atas form email.
3. Klik tombol itu → pilih akun Google kamu → izinkan akses.
4. Kalau berhasil: kamu masuk ke halaman **Niches**.
5. Cek di **Settings**: akun kamu sekarang bertuliskan **"Google account: ✓ Linked"**.

Bonus — deteksi otomatis: di halaman login, coba ketik email Google kamu di kolom
**Email**. Aplikasi akan otomatis mendeteksi email itu terhubung Google dan
menampilkan tulisan hijau *"This email is linked to Google — use Continue with Google"*.

---

## Kalau ada masalah (troubleshooting)

| Pesan error / gejala | Penyebab & solusi |
|---|---|
| `redirect_uri_mismatch` | Redirect URI salah ketik. Pastikan persis `https://kangnova.web.id/api/auth/callback/google` (tanpa slash di akhir), lalu simpan lagi di Credentials. |
| `Error 403: access_denied` atau "Akses diblokir" | Email kamu belum jadi Test user. Tambahkan email di OAuth consent screen → Test users. |
| `invalid_client` | Client ID salah, atau belum diisi di `.env`, atau belum `pm2 restart`. Periksa langkah 4 dan 5. |
| Halaman login: *"This email is not registered yet"* | Email Google belum ditambahkan sebagai pengguna di aplikasi. Ulangi bagian 0 (Settings → Add user). |
| Tombol Google tidak muncul sama sekali | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` masih kosong di `.env`, atau aplikasi belum di-restart. Cek langkah 4 dan 5. |
| Setelah klik Google, kembali ke login tanpa pesan | Cek log: `pm2 logs influencer-autopilot --lines 50`. Pesan di log akan menjelaskan masalah pastinya. |

---

## Ringkasan cepat

1. Tambah email Google sebagai pengguna dulu (Settings → Add user).
2. Buat project di Google Cloud Console.
3. Atur OAuth consent screen (External + Test users).
4. Buat OAuth client ID (Web application) + redirect URI `https://kangnova.web.id/api/auth/callback/google`.
5. Salin Client ID + Secret ke `.env`.
6. `pm2 restart influencer-autopilot --update-env`.
7. Tes login → Settings → "Google linked: ✓ Linked".
