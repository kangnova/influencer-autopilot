# Panduan Penggunaan — Influencer Autopilot

App ini adalah "pabrik konten otomatis" buat persona AI kamu (Kang Nova).
Kerjanya urut seperti pabrik: tentukan tema → bikin karakter → bikin rencana
konten → tempel gambar/video → antri posting → terbit ke Instagram → lihat hasil.

Alamat: https://kangnova.web.id
Login: email + password kamu (default awal: admin@autopilot.local)

---

## Bagian 1 — Peta Tab (menu di atas setelah login)

Ada 9 tab, urutannya sudah sesuai alur kerja:

1. Niches — tema/ceruk yang kamu garap (mis. "Keuangan", "AI untuk UMKM").
   Titik awal. Di sini kamu bikin tema, riset, dan jalankan AI (tombol generate).
2. Personas — karakter AI kamu (Kang Nova): nama, kepribadian, avatar.
3. Courses — produk digital yang mau dijual (kursus berisi lesson).
4. Content plans — rencana konten 30 hari. Tiap "Day" = 1 konten (hook + script).
5. Media — gudang bahan: upload gambar/video.
6. Accounts — koneksi akun Instagram (sudah terisi: nova.suharyanto).
7. Posts — antrian postingan: queue → approve → publish.
8. Metrics — laporan angka (impressions, reach, likes, klik, sales).
9. Jobs — riwayat kerja AI. Setiap tombol "generate" hasilnya masuk sini,
   keliatan sukses/gagal (bukan gagal diam-diam).

---

## Bagian 2 — CONTOH PRAKTIS dari Nol Sampai Posting

Ikuti langkah ini persis. Contohnya: kamu mau bikin konten tema "Keuangan".

### LANGKAH 1 — Bikin tema (tab Niches)

1. Klik tab "Niches".
2. Di kotak "Add niche", isi:
   - Niche name: Keuangan Pribadi
   - Description: Tips hemat, budgeting, dan investasi buat karyawan muda
   - Sales link: https://lynk.id/kangnova   (boleh dikosongkan)
3. Klik "Add niche".
   → Tema "Keuangan Pribadi" muncul di daftar di bawah.

### LANGKAH 2 — Bikin karakter AI (tab Personas)

1. Klik tab "Personas".
2. Di kotak "Add persona", isi:
   - Select a niche: Keuangan Pribadi
   - Persona name: Kang Nova
   - Identity: Pria 30-an, gaya bicara santai kayak teman, ahli keuangan
     buat pemula, suka kasih analogi sederhana   (boleh dikosongkan)
3. Klik "Add persona".
   → Persona "Kang Nova" jadi. Semua konten nanti bakal "berasa" dari orang ini.

   (Alternatif otomatis: tab Niches → kartu tema → klik "Generate persona",
   tunggu sebentar, cek tab Jobs sampai "SUCCEEDED".)

### LANGKAH 3 — Bikin rencana konten 30 hari

1. Klik tab "Niches".
2. Di kartu "Keuangan Pribadi", klik tombol "Generate content plan".
3. Tunggu beberapa detik (AI lagi kerja). Buka tab "Jobs" untuk lihat progres:
   - PENDING → RUNNING → SUCCEEDED.
4. Setelah SUCCEEDED, klik tab "Content plans" → klik judul plan yang muncul.
   → Ada 30 item (Day 1 sampai Day 30), masing-masing isinya:
     - hook (kalimat pembuka yang narik),
     - script (teks video),
     - video prompt (buat bikin videonya di alat lain).

### LANGKAH 4 — Tempel gambar/video ke konten

1. Di halaman detail content plan, cari "Day 1".
2. Klik tombol "Attach video" (walaupun namanya "video", bisa gambar juga).
3. Pilih file gambar/video yang sudah kamu buat (di HP / Canva / Higgsfield / dll).
4. Klik upload.
   → Sekarang Day 1 punya media (keliatan thumbnail-nya).

### LANGKAH 5 — Antri postingan (tab Posts)

1. Klik tab "Posts".
2. Di kotak "Queue a post", isi:
   - Select a content item: pilih "Keuangan Pribadi · <judul plan> · Day 1 — <hook>".
   - Select an account: @nova.suharyanto.
   - Caption: isi sendiri, ATAU kosongkan (otomatis pakai hook-nya).
   - Jadwal (datetime): kosongkan = posting sekarang.
3. Klik "Queue post".
   → Post muncul di daftar "Queue" dengan status DRAFT / not approved.

### LANGKAH 6 — Setujui lalu terbitkan

1. Di kartu post tadi, klik tombol "Approve".
   → Status berubah jadi "approved".
2. Muncul 2 tombol baru:
   - "Publish" → posting otomatis ke Instagram (pakai yang ini).
   - "Mark published manually" → kalau kamu posting sendiri di HP, cuma tandai.
3. Klik "Publish", tunggu beberapa detik.
   → Status jadi "PUBLISHED" dan muncul "IG <angka>" — artinya udah beneran
     terbit di Instagram kamu.

### LANGKAH 7 — Cek hasil (tab Metrics, opsional)

1. Klik tab "Metrics" → lihat angka impressions/reach/likes.
2. Di tab "Posts", post yang sudah publish ada tombol "Pull insights"
   → klik untuk menarik statistik asli dari Instagram.

---

## Bagian 3 — Catatan Penting

- Content item WAJIB ada medianya dulu, baru bisa di-queue. Item tanpa media
  tidak muncul di dropdown Posts.
- "Generate content plan" / "Generate persona" / "Generate course" itu kerjaan
  AI (LLM). Progresnya lihat di tab Jobs. Kalau gagal, pesan errornya keliatan
  di Jobs — bukan gagal diam-diam.
- Urutan benar: Niche → Persona → Content plan/Course → Media → Posts.
- App ini nggak bikin video sendiri. Dia yang bikin script + prompt-nya, kamu
  (atau alat lain seperti Higgsfield/Canva) yang bikin videonya, terus upload ke sini.
- Kalau tombol "Publish" error, baca pesannya — itu pesan asli dari Instagram
  (mis. "media not ready" = gambar/video bermasalah).
