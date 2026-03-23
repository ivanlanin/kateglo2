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
| I Pendahuluan | `frontend/public/gramatika/pendahuluan/` | OK | Semua item Bab I sudah diaudit; 1.2.2, 1.6, dan 1.8 dikoreksi secara isi, lalu Bab I diaudit ulang untuk menghapus penekanan editorial yang tidak ada di sumber |
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
| 1.1 Kedudukan Bahasa Indonesia | `frontend/public/gramatika/pendahuluan/kedudukan-bahasa-indonesia.md` | 25-26 | OK | Teks markdown lengkap terhadap dua halaman sumber; koreksi OCR seperti `keperiuan`→`keperluan`, `Francis`→`Prancis`, dan `Arena`→`Atena` sudah benar. |
| 1.2 Ragam Bahasa | `frontend/public/gramatika/pendahuluan/ragam-bahasa.md` | 27 | OK | Dua paragraf pembuka sesuai halaman sumber; sisa uraian memang diteruskan ke dua file turunan sehingga halaman induk berfungsi sebagai pengantar + navigasi. |
| 1.2.1 Ragam Menurut Golongan Penutur | `frontend/public/gramatika/pendahuluan/ragam-menurut-golongan-penutur.md` | 27-29 | OK | Isi sesuai pecahan sumber setelah paragraf pengantar 1.2; koreksi OCR pada istilah, italic, dan simbol bunyi sudah rapi, lalu transisi ke 1.2.2 dimulai di halaman berikutnya. |
| 1.2.2 Ragam Menurut Jenis Pemakaian | `frontend/public/gramatika/pendahuluan/ragam-menurut-jenis-pemakaian.md` | 30-32 | OK | Isi lengkap terhadap sumber; ditambahkan kembali uraian tentang ragam tulis yang muncul kemudian, peran *lingua franca* Melayu, dan kalimat penutup transisi sebelum 1.3. |
| 1.3 Diglosia | `frontend/public/gramatika/pendahuluan/diglosia.md` | 33-34 | OK | Isi sesuai dua halaman sumber, termasuk oposisi ragam tinggi-rendah, kodifikasi, dan paradoks mudah-sukar dalam pemakaian bahasa Indonesia. |
| 1.4 Pembakuan Bahasa | `frontend/public/gramatika/pendahuluan/pembakuan-bahasa.md` | 34-35 | OK | Uraian norma monosentris-majemuk serta contoh *perusak/pengrusak* dan kata penggolong sudah lengkap dan bersih dari artefak OCR. |
| 1.5 Bahasa Baku | `frontend/public/gramatika/pendahuluan/bahasa-baku.md` | 36-37 | OK | Tiga ciri ragam baku tercakup lengkap; istilah, contoh, dan makna pembakuan tetap sesuai sumber. |
| 1.6 Fungsi Bahasa Baku | `frontend/public/gramatika/pendahuluan/fungsi-bahasa-baku.md` | 37-42 | OK | Empat fungsi bahasa baku dan lanjutan pembakuan ejaan, lafal, kosakata, serta tata bahasa sudah lengkap; ditambahkan lagi rincian edisi kamus dan konteks contoh idiom yang sebelumnya hilang. |
| 1.7 Bahasa yang Baik dan Benar | `frontend/public/gramatika/pendahuluan/bahasa-yang-baik-dan-benar.md` | 43-44 | OK | Penjelasan perbedaan bahasa yang benar dan bahasa yang baik tetap lengkap; dua contoh percakapan pasar masih mewakili substansi sumber dengan jelas. |
| 1.8 Hubungan Bahasa Indonesia dengan Bahasa Daerah dan Bahasa Asing | `frontend/public/gramatika/pendahuluan/hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing.md` | 44-46 | OK | Uraian fungsi antarbahasa lengkap; koreksi dilakukan pada contoh sumber serapan agar kembali mengikuti sumber, termasuk penyebutan bahasa Cina. |

Catatan: beberapa rentang halaman Bab I saling tumpang-tindih karena heading subbab berikutnya mulai pada halaman yang sama dengan paragraf penutup subbab sebelumnya. Audit ulang Bab I juga menormalkan format markdown agar tidak menambahkan bold, heading tambahan, atau blockquote editorial yang tidak tampak pada TBBBI.

## Catatan Kerja

- Audit pertama sebaiknya dimulai dari bab yang pendek agar format pencatatan cepat stabil.
- PDF per bab sekarang memudahkan audit tanpa perlu membuka file sumber 616 halaman.
- Jika sebuah item terbukti `OK`, pemecahan lebih lanjut baru dipertimbangkan setelah semua item dalam bab itu diaudit.
- Audit format bukan pemolesan editorial. Jika sumber menampilkan paragraf biasa, markdown tidak boleh menambahkan huruf tebal atau penekanan visual baru hanya untuk memperindah tampilan.