# Checklist Audit Gramatika TBBBI

Tanggal dibuat: 2026-03-23
Status: aktif

Dokumen ini dipakai untuk audit bertahap konten Gramatika hasil ekstraksi TBBBI. Prinsipnya: audit sumber dulu, pecah atau rapikan struktur kemudian.

## Cara Pakai

Untuk setiap item markdown di `frontend/public/gramatika/` lakukan pemeriksaan berikut.

### Checklist per Item

- [ ] Judul dan nomor subbab cocok dengan TBBBI.
- [ ] Cakupan teks lengkap terhadap PDF sumber, tidak ada paragraf atau contoh substantif yang hilang.
- [ ] Artefak OCR sudah dibersihkan tanpa mengubah isi.
- [ ] Format penting dipertahankan dengan benar: daftar, penomoran, huruf miring, tabel, atau bagan yang dideskripsikan.
- [ ] Tidak ada penekanan editorial baru yang tidak didukung sumber, seperti huruf tebal, huruf miring tambahan, heading tambahan, atau label dekoratif yang tidak muncul di TBBBI, kecuali memang diperlukan secara teknis oleh halaman.
- [ ] Header/footer halaman TBBBI tidak ikut terbawa ke markdown.
- [ ] Jika PDF extraction meragukan, sudah diverifikasi silang dengan JPG per halaman.
- [ ] Jika item mengandung turunan atau navigasi khusus, sinkron dengan `frontend/src/constants/gramatikaData.js`.
- [ ] Hasil audit dicatat: `OK`, `Perlu Revisi`, atau `Tunda`.

### Skala Status

- `Belum` = belum diperiksa.
- `Sedang` = sedang diperiksa, belum final.
- `OK` = isi tervalidasi, belum perlu perubahan.
- `Perlu Revisi` = ada temuan yang harus diedit.
- `Tunda` = perlu verifikasi lanjutan, biasanya karena tabel, bagan, atau scan kurang jelas.

## Ringkasan Status per Bab

| Bab | Folder | Status | Catatan |
|---|---|---|---|
| Bab I Pendahuluan | `frontend/public/gramatika/pendahuluan/` | OK | Audit ulang 2026-03-23: ditemukan dan diperbaiki 26 ketidaksesuaian terhadap PDF di 7 file — em-dash/koma, tanda kurung, kata terlewat, label editorial, dan perubahan kalimat pembuka 1.2.2. |
| II Tata Bahasa | `frontend/public/gramatika/tata-bahasa/` | Belum | — |
| III Bunyi Bahasa | `frontend/public/gramatika/bunyi-bahasa/` | Belum | — |
| IV Verba | `frontend/public/gramatika/verba/` | Belum | — |
| V Adjektiva | `frontend/public/gramatika/adjektiva/` | Belum | — |
| VI Adverbia | `frontend/public/gramatika/adverbia/` | Belum | — |
| VII Nomina | `frontend/public/gramatika/nomina/` | Belum | — |
| VII Pronomina | `frontend/public/gramatika/pronomina/` | Belum | — |
| VII Numeralia | `frontend/public/gramatika/numeralia/` | Belum | — |
| VIII Kata Tugas | `frontend/public/gramatika/kata-tugas/` | Belum | — |
| IX Kalimat | `frontend/public/gramatika/kalimat/` | Belum | — |
| X Hubungan Antarklausa | `frontend/public/gramatika/hubungan-antarklausa/` | Belum | — |

## Audit Berjalan

### Bab I Pendahuluan

Sumber audit:

- PDF bab: `_data/gramatika/bab-01/bab-01-pendahuluan.pdf`
- JPG verifikasi: `_data/gramatika/bab-01/bab-01-h025.jpg` s.d. `_data/gramatika/bab-01/bab-01-h046.jpg`

| Item | File | Hal. PDF | Status | Hasil ringkas |
|---|---|:---:|---|---|
| Bab I Pendahuluan | `frontend/public/gramatika/pendahuluan/pendahuluan.md` | — | OK | Halaman landing bab berfungsi sebagai daftar isi turunan dan sudah sinkron dengan struktur item Bab I di `gramatikaData.js`; tidak memerlukan audit teks PDF langsung. |
| 1.1 Kedudukan Bahasa Indonesia | `frontend/public/gramatika/pendahuluan/kedudukan-bahasa-indonesia.md` | 25-26 | OK | Audit ulang: kalimat *lingua franca* dikembalikan dari em-dash ke koma sesuai sumber; hapus koma editorial setelah "manusia". |
| 1.2 Ragam Bahasa | `frontend/public/gramatika/pendahuluan/ragam-bahasa.md` | 27 | OK | Tidak ada temuan baru; isi sesuai dua paragraf pembuka, sisanya di file turunan. |
| 1.2.1 Ragam Menurut Golongan Penutur | `frontend/public/gramatika/pendahuluan/ragam-menurut-golongan-penutur.md` | 27-29 | OK | Audit ulang: 5 perbaikan — tanda kurung *misalnya* dan *(darat, laut, udara)/(cetak, elektronik)* dikembalikan; em-dash *persekolahan* dikembalikan; "dan jenis pemakaiannya—yang dapat disebut langgam atau gaya—" dipulihkan; "(bahasa Jawa)" setelah *gerah* ditambahkan kembali. |
| 1.2.2 Ragam Menurut Jenis Pemakaian | `frontend/public/gramatika/pendahuluan/ragam-menurut-jenis-pemakaian.md` | 30-32 | OK | Audit ulang: 5 perbaikan — "dan/atau"; em-dash fungsi gramatikal dan "dan" (bukan "serta"); kalimat pembuka paragraf percampuran dikembalikan ke sumber; em-dash *teras bersamanya*; "dimaksudkan". |
| 1.3 Diglosia | `frontend/public/gramatika/pendahuluan/diglosia.md` | 33-34 | OK | Audit ulang: titik koma → koma sebelum "sebaliknya"; hapus koma sebelum "maupun kosakata". |
| 1.4 Pembakuan Bahasa | `frontend/public/gramatika/pendahuluan/pembakuan-bahasa.md` | 34-35 | OK | Tidak ada temuan baru. |
| 1.5 Bahasa Baku | `frontend/public/gramatika/pendahuluan/bahasa-baku.md` | 36-37 | OK | Tidak ada temuan baru. |
| 1.6 Fungsi Bahasa Baku | `frontend/public/gramatika/pendahuluan/fungsi-bahasa-baku.md` | 37-42 | OK | Audit ulang: 8 perbaikan — hapus 4 label editorial "Fungsi X." yang tidak ada di sumber; koma → tanda kurung *(dan mungkin juga di Afrika)*; "atau" → tanda kurung pada istilah fonologi/morfologi/sintaksis; hapus koma setelah "karya asli"; "populer, maupun" → "populer maupun". |
| 1.7 Bahasa yang Baik dan Benar | `frontend/public/gramatika/pendahuluan/bahasa-yang-baik-dan-benar.md` | 43-44 | OK | Audit ulang: em-dash dikembalikan ke koma pada kalimat pembuka sesuai sumber. |
| 1.8 Hubungan Bahasa Indonesia dengan Bahasa Daerah dan Bahasa Asing | `frontend/public/gramatika/pendahuluan/hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing.md` | 44-46 | OK | Audit ulang: 3 perbaikan — hapus koma sebelum "maupun" (2 tempat); kembalikan tanda kurung referensi UU No. 20 Tahun 2003. |

Catatan: beberapa rentang halaman Bab I saling tumpang-tindih karena heading subbab berikutnya mulai pada halaman yang sama dengan paragraf penutup subbab sebelumnya. Audit ulang Bab I juga menormalkan format markdown agar tidak menambahkan bold, heading tambahan, atau blockquote editorial yang tidak tampak pada TBBBI.

## Catatan Kerja

- Audit pertama sebaiknya dimulai dari bab yang pendek agar format pencatatan cepat stabil.
- PDF per bab sekarang memudahkan audit tanpa perlu membuka file sumber 616 halaman.
- Jika sebuah item terbukti `OK`, pemecahan lebih lanjut baru dipertimbangkan setelah semua item dalam bab itu diaudit.
- Audit format bukan pemolesan editorial. Jika sumber menampilkan paragraf biasa, markdown tidak boleh menambahkan huruf tebal atau penekanan visual baru hanya untuk memperindah tampilan.