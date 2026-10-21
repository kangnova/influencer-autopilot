# Panduan: Token Facebook Supaya "Kang Nova" Terdeteksi Lagi

## Kenapa tadi bisa, sekarang hilang?

Token itu seperti "surat izin masuk" yang kamu cetak dari Graph API Explorer. Setiap
kamu cetak ulang (generate token baru), Facebook bertanya lagi:

> "Izinkan aplikasi ini mengakses halaman mana?"

Di layar itu ada daftar halaman dengan tombol on/off. Waktu token LAMA dibuat,
halaman "Kang Nova" dalam keadaan ON. Waktu kamu generate token BARU, kemungkinan
besar "Kang Nova" tidak ikut terpilih — makanya token baru cuma melihat "FEMAX".

Masalahnya BUKAN di aplikasi, tapi di langkah "pilih halaman" saat generate token.
Ikuti panduan di bawah PERSIS, jangan ada langkah yang dilewati.

---

## Bagian A — Sebelum mulai: pastikan akun yang benar

1. Buka facebook.com, pastikan kamu sudah login.
2. Klik foto profil kamu → cari menu yang menampilkan daftar Halaman (Pages).
3. Lihat daftar halaman yang kamu kelola. Harusnya ada:
   - "Teknologi Gurah Mesin FEMAX Terbukti 100%"
   - "Kang Nova"

   - Kalau KEDUANYA ada → lanjut ke Bagian B.
   - Kalau "Kang Nova" TIDAK ada di daftar → itulah masalahnya. Halaman Kang Nova
     ada di akun Facebook LAIN. Kamu harus login dengan akun yang itu dulu.
     JANGAN lanjut sampai "Kang Nova" ketemu di daftar ini.

---

## Bagian B — Generate token langkah demi langkah

1. Buka: https://developers.facebook.com/tools/explorer
2. Pastikan browser masih login Facebook dengan akun yang sama (yang mengelola Kang Nova).
3. Di pojok kanan atas ada dropdown nama aplikasi ("Meta App"). Klik dan pilih
   aplikasi kamu (yang ID-nya 1131377682590996).
4. Di dropdown "User or Page", pilih **Get User Access Token**
   (bukan "Get Page Access Token").
5. Di bagian "Permissions", klik "Add a permission", cari dan tambahkan SATU PER SATU:
   - pages_show_list
   - pages_read_engagement
   - pages_manage_posts
   - instagram_basic
   - instagram_content_publish
   - instagram_manage_insights
6. Klik tombol **Generate Access Token**.

7. ===== LANGKAH PALING PENTING =====

   Facebook akan munculkan popup konfirmasi. Di popup itu ada daftar halaman yang
   akan diberi akses, masing-masing ada tombol on/off (centang).

   - Cari nama "Kang Nova" di daftar itu.
   - Pastikan "Kang Nova" dalam keadaan AKTIF/tercentang.
   - Kalau "Kang Nova" TIDAK muncul di popup ini → STOP. Artinya akun Facebook ini
     bukan yang mengelola Kang Nova. Ulangi Bagian A.

8. Klik "Lanjutkan" / "Continue" sampai proses selesai dan kembali ke Explorer.

---

## Bagian C — VERIFIKASI (jangan dilewati!)

1. Kembali di Graph API Explorer, di kolom isian (sebelah tombol GET), hapus isinya,
   lalu ketik tepat seperti ini:

       me/accounts?fields=id,name

2. Klik tombol **Submit**.
3. Lihat hasilnya. Harus muncul DUA halaman:
   - "Teknologi Gurah Mesin FEMAX Terbukti 100%"
   - "Kang Nova"

   - Kalau "Kang Nova" muncul → BERHASIL. Lanjut ke Bagian D.
   - Kalau cuma FEMAX → token belum benar. Ulangi Bagian B, perhatikan popup di langkah 7.

---

## Bagian D — Simpan & pakai

1. Salin token yang ada di kanan atas Explorer (yang bentuknya EAA...).
2. Update ke aplikasi (pilih salah satu cara):

   Cara 1 (lewat aplikasi):
   - Buka https://kangnova.web.id → menu Accounts
   - Di kartu akun, kolom "New token for @..." → paste token → klik "Update token"

   Cara 2 (lewat file):
   - Update isi file "ID-Aplikasi -admin.txt" di folder docs/
   - Beri tahu saya, nanti saya update ke database

---

## Bagian E — Supaya tidak berubah/expired lagi

Token dari Graph API Explorer itu BERUMUR PENDEK (sekitar 1-2 jam). Setiap kali
expired dan kamu generate ulang, kamu HARUS mengulang langkah 7 (pastikan
"Kang Nova" ON) — dan di situlah biasanya salah.

Supaya tidak bolak-balik, setelah token baru berhasil melihat "Kang Nova", kita
tukar menjadi token LONG-LIVED (60 hari). Caranya saya bantu setelah token barumu
benar. Dengan token 60 hari, kamu tidak perlu generate ulang tiap hari.
