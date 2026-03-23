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
| II Tata Bahasa | `frontend/public/gramatika/tata-bahasa/` | OK | Audit 2026-03-24: ditemukan dan diperbaiki 4 ketidaksesuaian terhadap PDF di 3 file — label contoh (1)/(6)/(7) yang hilang, dan satu kesalahan parafrase pertanyaan literal. |
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

### Bab II Tata Bahasa

Sumber audit:

- PDF bab: `_data/gramatika/bab-02/bab-02-tata-bahasa-tinjauan-selayang-pandang.pdf`
- JPG verifikasi: `_data/gramatika/bab-02/bab-02-h047.jpg` s.d. `_data/gramatika/bab-02/bab-02-h068.jpg`

| Item | File | Hal. PDF | Status | Hasil ringkas |
|---|---|:---:|---|---|
| Bab II Tata Bahasa | `frontend/public/gramatika/tata-bahasa/tata-bahasa.md` | — | OK | Halaman landing; daftar isi sinkron dengan gramatikaData.js. |
| 2.1 Deskripsi dan Teori | `frontend/public/gramatika/tata-bahasa/deskripsi-dan-teori.md` | 47-48 | OK | Bersih; koreksi OCR sudah tepat. |
| 2.2 Pengertian Tata Bahasa | `frontend/public/gramatika/tata-bahasa/pengertian-tata-bahasa.md` | 49 | OK | Teks dan navigasi sesuai sumber. |
| 2.2.1 Fonologi | `frontend/public/gramatika/tata-bahasa/fonologi.md` | 49-51 | OK | 1 perbaikan: label `(1)` ditambahkan sebelum tabel tulisan/fonemis/fonetis; teks merujuk "contoh (1)" dua kali. |
| 2.2.2 Morfologi | `frontend/public/gramatika/tata-bahasa/morfologi.md` | 51-52 | OK | Contoh (2) dan diagram (3) sudah berlabel benar, tidak ada temuan. |
| 2.2.3 Sintaksis | `frontend/public/gramatika/tata-bahasa/sintaksis.md` | 52-61 | OK | 2 perbaikan: label `(6)` ditetapkan sebelum tabel kategori leksikal; label `(7)` ditetapkan sebelum tabel kategori frasa. |
| 2.3 Semantik, Pragmatik, dan Relasi Makna | `frontend/public/gramatika/tata-bahasa/semantik-pragmatik-dan-relasi-makna.md` | 61 | OK | Halaman landing; satu paragraf pembuka dan navigasi sesuai sumber. |
| 2.3.1 Kondisi Kebenaran dan Perikutan | `frontend/public/gramatika/tata-bahasa/kondisi-kebenaran-dan-perikutan.md` | 62-63 | OK | Contoh (17)–(21) dan teks penjelasan sesuai sumber; OCR artifacts tidak terbawa. |
| 2.3.2 Aspek Takberkondisi Benar Makna Kalimat | `frontend/public/gramatika/tata-bahasa/aspek-takberkondisi-benar-makna-kalimat.md` | 63-65 | OK | Contoh (22)–(24) dan teks penjelasan sesuai sumber; OCR typo "kovensional" dan "had" sudah dikembalikan ke bentuk baku. |
| 2.3.3 Pragmatik dan Implikatur Percakapan | `frontend/public/gramatika/tata-bahasa/pragmatik-dan-implikatur-percakapan.md` | 65-66 | OK | 1 perbaikan: "Apa kamu sudah mendapat izin dari Dekan?" dikembalikan ke "Apa kamu sudah menghadap Dekan?" sesuai pertanyaan literal di sumber (implikatur tetap "dapat izin"). |
| 2.3.4 Pengacuan dan Deiksis | `frontend/public/gramatika/tata-bahasa/pengacuan-dan-deiksis.md` | 66-68 | OK | Contoh (27)–(32) dan teks penjelasan sesuai sumber; OCR errors (Omngitu, huku, la, deksis, seorangpemhantu) sudah dikoreksi. |

## Catatan Kerja

- Audit pertama sebaiknya dimulai dari bab yang pendek agar format pencatatan cepat stabil.
- PDF per bab sekarang memudahkan audit tanpa perlu membuka file sumber 616 halaman.
- Jika sebuah item terbukti `OK`, pemecahan lebih lanjut baru dipertimbangkan setelah semua item dalam bab itu diaudit.
- Audit format bukan pemolesan editorial. Jika sumber menampilkan paragraf biasa, markdown tidak boleh menambahkan huruf tebal atau penekanan visual baru hanya untuk memperindah tampilan.