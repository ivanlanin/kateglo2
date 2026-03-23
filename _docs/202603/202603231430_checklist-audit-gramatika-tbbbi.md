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
| I Pendahuluan | `frontend/public/gramatika/pendahuluan/` | Sedang | Item 1.1 dan 1.2 induk sudah lolos audit awal |
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
| 1.1 Kedudukan Bahasa Indonesia | `frontend/public/gramatika/pendahuluan/kedudukan-bahasa-indonesia.md` | 25-26 | OK | Teks markdown lengkap terhadap dua halaman sumber; koreksi OCR seperti `keperiuan`→`keperluan`, `Francis`→`Prancis`, dan `Arena`→`Atena` sudah benar. |
| 1.2 Ragam Bahasa | `frontend/public/gramatika/pendahuluan/ragam-bahasa.md` | 27 | OK | Dua paragraf pembuka sesuai halaman sumber; sisa uraian memang diteruskan ke dua file turunan sehingga halaman induk berfungsi sebagai pengantar + navigasi. |
| 1.2.1 Ragam Menurut Golongan Penutur | `frontend/public/gramatika/pendahuluan/ragam-menurut-golongan-penutur.md` | 27-29 | OK | Isi sesuai pecahan sumber setelah paragraf pengantar 1.2; koreksi OCR pada istilah, italic, dan simbol bunyi sudah rapi, lalu transisi ke 1.2.2 dimulai di halaman berikutnya. |
| 1.2.2 Ragam Menurut Jenis Pemakaian | `frontend/public/gramatika/pendahuluan/ragam-menurut-jenis-pemakaian.md` | 30-34 | Belum | — |
| 1.3 Diglosia | `frontend/public/gramatika/pendahuluan/diglosia.md` | 35-36 | Belum | — |
| 1.4 Pembakuan Bahasa | `frontend/public/gramatika/pendahuluan/pembakuan-bahasa.md` | 37-39 | Belum | — |
| 1.5 Bahasa Baku | `frontend/public/gramatika/pendahuluan/bahasa-baku.md` | 39-41 | Belum | — |
| 1.6 Fungsi Bahasa Baku | `frontend/public/gramatika/pendahuluan/fungsi-bahasa-baku.md` | 41-43 | Belum | — |
| 1.7 Bahasa yang Baik dan Benar | `frontend/public/gramatika/pendahuluan/bahasa-yang-baik-dan-benar.md` | 43-44 | Belum | — |
| 1.8 Hubungan Bahasa Indonesia dengan Bahasa Daerah dan Bahasa Asing | `frontend/public/gramatika/pendahuluan/hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing.md` | 44-46 | Belum | — |

## Catatan Kerja

- Audit pertama sebaiknya dimulai dari bab yang pendek agar format pencatatan cepat stabil.
- PDF per bab sekarang memudahkan audit tanpa perlu membuka file sumber 616 halaman.
- Jika sebuah item terbukti `OK`, pemecahan lebih lanjut baru dipertimbangkan setelah semua item dalam bab itu diaudit.