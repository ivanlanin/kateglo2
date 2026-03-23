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
- [ ] Huruf tebal pada isi paragraf, label intra-paragraf, atau contoh dihapus jika PDF hanya menampilkan teks biasa atau italic; huruf tebal dipertahankan hanya untuk struktur yang memang tampak sebagai heading/subheading pada sumber.
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
| III Bunyi Bahasa | `frontend/public/gramatika/bunyi-bahasa/` | OK | Audit 2026-03-23: ditemukan dan diperbaiki 13 ketidaksesuaian terhadap PDF di 8 file — em-dash parenthetical (5 instances di 5 file), notasi fonem rusak /t> (1), hyphen deskripsi posisi vokal (5 instances), dan kalimat peringatan pelafalan yang hilang (3 instances di seksi /f/, /ʃ/, /x/). |
| IV Verba | `frontend/public/gramatika/verba/` | OK | Audit 2026-03-23: ditemukan dan diperbaiki ketidaksesuaian terhadap PDF di 25 file — terutama nomor contoh/daftar yang hilang, 4 contoh yang terlewat pada 4.1.1, dan satu blok derivasi (78) yang terpotong pada 4.1.3.2. |
| V Adjektiva | `frontend/public/gramatika/adjektiva/` | OK | Audit 2026-03-23 selesai: seluruh Bab V (5.1-5.7) tervalidasi. Dua koreksi diterapkan selama audit, yaitu pemulihan judul 5.2 sesuai heading PDF dan pengembalian `putih metah` pada 5.2.3 dari salah baca OCR. |
| VI Adverbia | `frontend/public/gramatika/adverbia/` | OK | Audit 2026-03-23 selesai: seluruh Bab VI (6.1-6.6) tervalidasi. Temuan yang perlu diedit terbatas pada 14 bold editorial yang tidak ada di PDF dan dibersihkan dari 5 file; tidak ada kehilangan isi substantif. |
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

### Bab III Bunyi Bahasa

Sumber audit:

- PDF bab: `_data/gramatika/bab-03/bab-03-bunyi-bahasa-dan-tata-bunyi.pdf`
- JPG verifikasi: `_data/gramatika/bab-03/bab-03-h069.jpg` s.d. `_data/gramatika/bab-03/bab-03-h118.jpg`

| Item | File | Hal. PDF | Status | Hasil ringkas |
|---|---|:---:|---|---|
| Bab III Bunyi Bahasa | `frontend/public/gramatika/bunyi-bahasa/bunyi-bahasa.md` | — | OK | Halaman landing; daftar isi sinkron dengan gramatikaData.js. |
| 3.1 Batasan dan Ciri Bunyi Bahasa | `frontend/public/gramatika/bunyi-bahasa/batasan-dan-ciri-bunyi-bahasa.md` | 69-71 | OK | 1 perbaikan: em-dash parenthetical "—dengan demikian pita suara tidak bergetar—" dipulihkan dari koma. |
| 3.1.1 Vokal | `frontend/public/gramatika/bunyi-bahasa/vokal.md` | 72 | OK | 1 perbaikan: em-dash parenthetical "—terutama bagian depan, tengah, dan belakang lidah—" dipulihkan dari koma. |
| 3.1.2 Konsonan | `frontend/public/gramatika/bunyi-bahasa/konsonan.md` | 73-74 | OK | Bersih; artefak OCR sudah tepat. |
| 3.1.3 Diftong | `frontend/public/gramatika/bunyi-bahasa/diftong.md` | 74-75 | OK | 1 perbaikan: em-dash parenthetical "—bukan diftong—" dipulihkan dari koma. |
| 3.1.4 Gugus Konsonan | `frontend/public/gramatika/bunyi-bahasa/gugus-konsonan.md` | 75 | OK | Bersih. |
| 3.1.5 Fonem dan Grafem | `frontend/public/gramatika/bunyi-bahasa/fonem-dan-grafem.md` | 75-77 | OK | 1 perbaikan: notasi fonem rusak "/t>" diperbaiki menjadi "/t/". |
| 3.1.6 Fonem Segmental dan Suprasegmental | `frontend/public/gramatika/bunyi-bahasa/fonem-segmental-dan-suprasegmental.md` | 77-78 | OK | Bersih. |
| 3.1.7 Suku Kata | `frontend/public/gramatika/bunyi-bahasa/suku-kata.md` | 78 | OK | Bersih. |
| 3.2 Vokal dan Konsonan | `frontend/public/gramatika/bunyi-bahasa/vokal-dan-konsonan.md` | 79 | OK | Halaman landing; bersih. |
| 3.2.1 Vokal dan Alofon Vokal | `frontend/public/gramatika/bunyi-bahasa/vokal-dan-alofon-vokal.md` | 79-85 | OK | 5 perbaikan: hyphen pada deskripsi posisi vokal — "belakang-tinggi", "sedang-depan", "sedang-belakang", "sedang-tengah", "rendah-tengah" sesuai PDF. |
| 3.2.2 Diftong dan Deret Vokal | `frontend/public/gramatika/bunyi-bahasa/diftong-dan-deret-vokal.md` | 86-87 | OK | Bersih. |
| 3.2.3 Cara Penulisan Vokal | `frontend/public/gramatika/bunyi-bahasa/cara-penulisan-vokal.md` | 88-89 | OK | Bersih. |
| 3.2.4 Konsonan dan Alofon Konsonan | `frontend/public/gramatika/bunyi-bahasa/konsonan-dan-alofon-konsonan.md` | 90-102 | OK | 3 perbaikan: kalimat peringatan pelafalan dipulihkan — seksi /f/ ("hendaklah dihindari"), seksi /ʃ/ ("harus dihindari"), seksi /x/ (kalimat lengkap dengan contoh [kas]/[tarik]/[akir] dan koreksi [xas]/[tarix]/[axir]). |
| 3.2.5 Gugus dan Deret Konsonan | `frontend/public/gramatika/bunyi-bahasa/gugus-dan-deret-konsonan.md` | 102-104 | OK | Bersih. |
| 3.3 Struktur Suku Kata dan Kata | `frontend/public/gramatika/bunyi-bahasa/struktur-suku-kata-dan-kata.md` | 105-106 | OK | Bersih. |
| 3.4 Pemenggalan Kata | `frontend/public/gramatika/bunyi-bahasa/pemenggalan-kata.md` | 106-107 | OK | Bersih. |
| 3.5 Ciri Suprasegmental | `frontend/public/gramatika/bunyi-bahasa/ciri-suprasegmental.md` | 108 | OK | 1 perbaikan: em-dash parenthetical "—baik dalam bentuk kata, frasa maupun kalimat—" dipulihkan dan koma editorial sebelum "maupun" dihapus. |
| 3.5.1 Tekanan dan Aksen | `frontend/public/gramatika/bunyi-bahasa/tekanan-dan-aksen.md` | 108-111 | OK | 1 perbaikan: dua em-dash parenthetical pada [kápitano]/[kapítano] dipulihkan dari koma. |
| 3.5.2 Intonasi dan Ritme | `frontend/public/gramatika/bunyi-bahasa/intonasi-dan-ritme.md` | 111-118 | OK | Bersih. |

Catatan: pola temuan terbanyak adalah em-dash parenthetical yang diganti koma saat konversi PDF ke markdown (5 dari 8 file lintasan perbaikan). Pola ini konsisten dengan temuan Bab I.

### Bab IV Verba

Sumber audit:

- PDF bab: `_data/gramatika/bab-04/bab-04-verba.pdf`
- JPG verifikasi: `_data/gramatika/bab-04/bab-04-h119.jpg` s.d. `_data/gramatika/bab-04/bab-04-h216.jpg`

Ringkasan hasil:

- Halaman landing `verba.md`, `verba-transitif.md`, `verba-taktransitif.md`, `verba-majemuk.md`, dan `frasa-verbal.md` tetap sinkron dengan struktur item di `gramatikaData.js`; yang perlu dikoreksi terutama ada pada file subbab.
- Temuan terbesar adalah nomor contoh, nomor daftar, dan label tabel/bagan yang hilang saat konversi PDF ke markdown; pola ini diperbaiki di 25 file agar referensi silang kembali sama dengan sumber.
- Pada `fitur-semantis-verba.md` dipulihkan contoh (11), (12), (14), dan (15), serta contoh (3), (6), dan (9) yang sebelumnya hanya tampil sebagai daftar tanpa nomor.
- Pada `verba-turunan.md` dipulihkan satu blok derivasi yang terpotong, yakni contoh (78) untuk *darat/layar/kuning*, dan contoh (83) untuk pengulangan.
- Pada subbagian morfofonemik, verba transitif, verba taktransitif, dan reduplikasi, audit menormalkan kembali penomoran contoh sesuai PDF tanpa menambah struktur editorial baru di luar kebutuhan teknis markdown.
- Verifikasi akhir menunjukkan sisa mismatch numerasi yang terdeteksi otomatis terutama berasal dari tumpang-tindih rentang halaman antar-subbagian, bukan dari contoh yang benar-benar hilang di file target.

### Bab V Adjektiva

Sumber audit:

- PDF bab: `_data/gramatika/bab-05/bab-05-adjektiva.pdf`
- JPG verifikasi: `_data/gramatika/bab-05/bab-05-h217.jpg` s.d. `_data/gramatika/bab-05/bab-05-h257.jpg`

| Item | File | Hal. PDF | Status | Hasil ringkas |
|---|---|:---:|---|---|
| Bab V Adjektiva | `frontend/public/gramatika/adjektiva/adjektiva.md` | — | OK | Halaman landing bab berfungsi sebagai daftar isi dan sudah sinkron dengan struktur item Bab V di `gramatikaData.js`. |
| 5.1 Batasan dan Ciri Adjektiva | `frontend/public/gramatika/adjektiva/batasan-dan-ciri-adjektiva.md` | 217-218 | OK | Isi, penomoran contoh (1)-(3), dan italic pada contoh sesuai sumber. Tidak ada temuan baru. |
| 5.2 Jenis Adjektiva Berdasarkan Ciri Semantis | `frontend/public/gramatika/adjektiva/ciri-semantis-adjektiva.md` | 218-220 | OK | Isi sesuai sumber; judul dipulihkan dari parafrase `Ciri Semantis Adjektiva` menjadi `Jenis Adjektiva Berdasarkan Ciri Semantis` agar sama dengan heading PDF. |
| 5.2.1 Adjektiva Pemeri Sifat | `frontend/public/gramatika/adjektiva/adjektiva-pemeri-sifat.md` | 220 | OK | Definisi singkat dan daftar contoh (6) sesuai sumber. Tidak ada temuan baru. |
| 5.2.2 Adjektiva Ukuran | `frontend/public/gramatika/adjektiva/adjektiva-ukuran.md` | 220 | OK | Definisi singkat dan daftar contoh (7) sesuai sumber. Tidak ada temuan baru. |
| 5.2.3 Adjektiva Warna | `frontend/public/gramatika/adjektiva/adjektiva-warna.md` | 221-223 | OK | 1 perbaikan: contoh (14) dipulihkan dari `putih merah` menjadi `putih metah` sesuai PDF; daftar contoh (8)-(16) selebihnya sesuai sumber. |
| 5.2.4 Adjektiva Bentuk | `frontend/public/gramatika/adjektiva/adjektiva-bentuk.md` | 223-224 | OK | Definisi dan daftar contoh (17)-(18) sesuai sumber. Tidak ada temuan baru. |
| 5.2.5 Adjektiva Waktu | `frontend/public/gramatika/adjektiva/adjektiva-waktu.md` | 224 | OK | Definisi dan daftar contoh (19) sesuai sumber. Tidak ada temuan baru. |
| 5.2.6 Adjektiva Jarak | `frontend/public/gramatika/adjektiva/adjektiva-jarak.md` | 225 | OK | Definisi singkat dan daftar contoh (20) sesuai sumber. Tidak ada temuan baru. |
| 5.2.7 Adjektiva Sikap Batin | `frontend/public/gramatika/adjektiva/adjektiva-sikap-batin.md` | 225 | OK | Definisi singkat dan daftar contoh (21) sesuai sumber. Tidak ada temuan baru. |
| 5.2.8 Adjektiva Cerapan | `frontend/public/gramatika/adjektiva/adjektiva-cerapan.md` | 226-227 | OK | Uraian pancaindra serta contoh (22)-(23) sesuai sumber. Tidak ada temuan baru. |
| 5.3 Perilaku Sintaksis Adjektiva | `frontend/public/gramatika/adjektiva/perilaku-sintaksis-adjektiva.md` | 228-231 | OK | Fungsi atributif, predikatif, dan adverbial beserta contoh (24)-(32) sesuai sumber. Tidak ada temuan baru. |
| 5.4 Pertarafan Adjektiva | `frontend/public/gramatika/adjektiva/pertarafan-adjektiva.md` | 231 | OK | Halaman pengantar dan navigasi tingkat kualitas/pembandingan sesuai struktur sumber. |
| 5.4.1 Tingkat Kualitas | `frontend/public/gramatika/adjektiva/tingkat-kualitas.md` | 231-235 | OK | Uraian tingkat positif sampai atenuatif dan contoh (33)-(45) sesuai sumber. Tidak ada temuan baru. |
| 5.4.2 Tingkat Pembandingan | `frontend/public/gramatika/adjektiva/tingkat-pembandingan.md` | 235-242 | OK | Tingkat ekuatif, komparatif, dan superlatif beserta contoh (46)-(67) sesuai sumber. Tidak ada temuan baru. |
| 5.5 Bentuk Adjektiva | `frontend/public/gramatika/adjektiva/bentuk-adjektiva.md` | 242 | OK | Halaman pengantar dan navigasi ke bentuk dasar serta turunan sesuai struktur sumber. |
| 5.5.1 Adjektiva Dasar | `frontend/public/gramatika/adjektiva/adjektiva-dasar.md` | 242 | OK | Uraian singkat dan daftar contoh (68) sesuai sumber. Tidak ada temuan baru. |
| 5.5.2 Adjektiva Turunan | `frontend/public/gramatika/adjektiva/adjektiva-turunan.md` | 243 | OK | Uraian pengantar dan navigasi ke adjektiva berimbuhan, berulang, dan majemuk sesuai struktur sumber. |
| 5.5.2.1 Adjektiva Berimbuhan | `frontend/public/gramatika/adjektiva/adjektiva-berimbuhan.md` | 243-245 | OK | Uraian prefiks, infiks, sufiks, dan konfiks serta contoh (72)-(79) sesuai sumber. Tidak ada temuan baru. |
| 5.5.3 Adjektiva Berulang | `frontend/public/gramatika/adjektiva/adjektiva-berulang.md` | 245-246 | OK | Uraian tiga pola reduplikasi dan contoh (80)-(82) sesuai sumber. Tidak ada temuan baru. |
| 5.5.4 Adjektiva Majemuk | `frontend/public/gramatika/adjektiva/adjektiva-majemuk.md` | 246-251 | OK | Subjenis majemuk dan contoh (83)-(91) sesuai sumber. Tidak ada temuan baru. |
| 5.6 Frasa Adjektival | `frontend/public/gramatika/adjektiva/frasa-adjektival.md` | 252-254 | OK | Lima tipe pemarkah pada frasa adjektival dan contoh (92)-(101) sesuai sumber. Tidak ada temuan baru. |
| 5.7 Adjektiva dan Kelas Kata Lain | `frontend/public/gramatika/adjektiva/adjektiva-dan-kelas-kata-lain.md` | 255-257 | OK | Uraian adjektiva deverbal dan denominal serta contoh (102)-(114) sesuai sumber. Tidak ada temuan baru. |

### Bab VI Adverbia

Sumber audit:

- PDF bab: `_data/gramatika/bab-06/bab-06-adverbia.pdf`
- JPG verifikasi: `_data/gramatika/bab-06/bab-06-h258.jpg` s.d. `_data/gramatika/bab-06/bab-06-h281.jpg`

| Item | File | Hal. PDF | Status | Hasil ringkas |
|---|---|:---:|---|---|
| Bab VI Adverbia | `frontend/public/gramatika/adverbia/adverbia.md` | — | OK | Halaman landing bab berfungsi sebagai daftar isi dan sudah sinkron dengan struktur item Bab VI di `gramatikaData.js`. |
| 6.1 Batasan dan Ciri Adverbia | `frontend/public/gramatika/adverbia/batasan-dan-ciri-adverbia.md` | 258-261 | OK | Isi dan penomoran contoh (1)-(10) sesuai sumber. 2 bold editorial pada pembuka paragraf dan istilah *inversi* dihapus agar kembali sama dengan PDF. |
| 6.2 Perilaku Semantis Adverbia | `frontend/public/gramatika/adverbia/perilaku-semantis-adverbia.md` | 262 | OK | Halaman pengantar dan navigasi delapan jenis adverbia sesuai struktur sumber. |
| 6.2.1 Adverbia Kualitatif | `frontend/public/gramatika/adverbia/adverbia-kualitatif.md` | 262 | OK | Definisi singkat dan contoh (11) sesuai sumber. Tidak ada temuan baru. |
| 6.2.2 Adverbia Kuantitatif | `frontend/public/gramatika/adverbia/adverbia-kuantitatif.md` | 262 | OK | Definisi singkat dan contoh (12) sesuai sumber. Tidak ada temuan baru. |
| 6.2.3 Adverbia Limitatif | `frontend/public/gramatika/adverbia/adverbia-limitatif.md` | 262-263 | OK | Uraian makna pembatasan dan contoh (13) sesuai sumber. Tidak ada temuan baru. |
| 6.2.4 Adverbia Frekuentatif | `frontend/public/gramatika/adverbia/adverbia-frekuentatif.md` | 263 | OK | Definisi singkat dan contoh (14) sesuai sumber. Tidak ada temuan baru. |
| 6.2.5 Adverbia Kewaktuan | `frontend/public/gramatika/adverbia/adverbia-kewaktuan.md` | 263 | OK | Definisi singkat dan contoh (15) sesuai sumber. Tidak ada temuan baru. |
| 6.2.6 Adverbia Kecaraan | `frontend/public/gramatika/adverbia/adverbia-kecaraan.md` | 264 | OK | Definisi singkat dan contoh (16) sesuai sumber. Tidak ada temuan baru. |
| 6.2.7 Adverbia Kontrastif | `frontend/public/gramatika/adverbia/adverbia-kontrastif.md` | 264 | OK | Definisi singkat dan contoh (17) sesuai sumber. Tidak ada temuan baru. |
| 6.2.8 Adverbia Keniscayaan | `frontend/public/gramatika/adverbia/adverbia-keniscayaan.md` | 264 | OK | Definisi singkat dan contoh (18) sesuai sumber. Tidak ada temuan baru. |
| 6.3 Perilaku Sintaksis Adverbia | `frontend/public/gramatika/adverbia/perilaku-sintaksis-adverbia.md` | 265 | OK | Halaman pengantar dan navigasi enam posisi sintaktis adverbia sesuai struktur sumber. |
| 6.3.1 Adverbia Sebelum Kata yang Diterangkan | `frontend/public/gramatika/adverbia/adverbia-sebelum-kata-yang-diterangkan.md` | 265 | OK | Tabel (19) dan contoh (20) sesuai sumber. Tidak ada temuan baru. |
| 6.3.2 Adverbia Sesudah Kata yang Diterangkan | `frontend/public/gramatika/adverbia/adverbia-sesudah-kata-yang-diterangkan.md` | 265-266 | OK | Tabel (21) dan contoh (22) sesuai sumber. Tidak ada temuan baru. |
| 6.3.3 Adverbia Sebelum atau Sesudah Kata yang Diterangkan | `frontend/public/gramatika/adverbia/adverbia-sebelum-atau-sesudah-kata-yang-diterangkan.md` | 266 | OK | Tabel (23) dan contoh (24) sesuai sumber. Tidak ada temuan baru. |
| 6.3.4 Adverbia Sebelum dan Sesudah Kata yang Diterangkan | `frontend/public/gramatika/adverbia/adverbia-sebelum-dan-sesudah-kata-yang-diterangkan.md` | 266-267 | OK | Contoh (25)-(26) sesuai sumber. 1 bold editorial pada kata penghubung dihapus agar kembali sama dengan PDF. |
| 6.3.5 Adverbia Pembuka Wacana | `frontend/public/gramatika/adverbia/adverbia-pembuka-wacana.md` | 267-268 | OK | Uraian jenis pembuka wacana, contoh (27)-(36), dan catatan bentuk arkais sesuai sumber. Tidak ada temuan baru. |
| 6.3.6 Adverbia Intraklausal dan Ekstraklausal | `frontend/public/gramatika/adverbia/adverbia-intraklausal-dan-ekstraklausal.md` | 269-270 | OK | Uraian lingkup frasa/klausa dan contoh (37)-(40) sesuai sumber. 2 bold editorial pada istilah intraklausal/ekstraklausal dihapus agar kembali sama dengan PDF. |
| 6.4 Bentuk Adverbia | `frontend/public/gramatika/adverbia/bentuk-adverbia.md` | 271 | OK | Halaman pengantar dan navigasi bentuk tunggal/gabungan sesuai struktur sumber. |
| 6.4.1 Adverbia Tunggal | `frontend/public/gramatika/adverbia/adverbia-tunggal.md` | 271-275 | OK | Uraian kata dasar, kata berafiks, kata ulang, serta contoh (41)-(53) sesuai sumber. 6 label bernomor yang dibold secara editorial dihapus. |
| 6.4.2 Adverbia Gabungan | `frontend/public/gramatika/adverbia/adverbia-gabungan.md` | 276-278 | OK | Uraian gabungan berdampingan/tidak berdampingan dan contoh (54)-(58) sesuai sumber. Tidak ada temuan baru. |
| 6.5 Bentuk Adverbial | `frontend/public/gramatika/adverbia/bentuk-adverbial.md` | 278-279 | OK | Uraian fungsi adverbial dan contoh (59)-(61) sesuai sumber. 4 bold editorial pada istilah dan label subbagian dihapus agar kembali sama dengan PDF. |
| 6.6 Adverbia dan Kelas Kata Lain | `frontend/public/gramatika/adverbia/adverbia-dan-kelas-kata-lain.md` | 279-281 | OK | Uraian adverbia deverbal, deadjektival, denominal, dan denumeral beserta contoh (62)-(65) sesuai sumber. Tidak ada temuan baru. |

## Catatan Kerja

- Audit pertama sebaiknya dimulai dari bab yang pendek agar format pencatatan cepat stabil.
- PDF per bab sekarang memudahkan audit tanpa perlu membuka file sumber 616 halaman.
- Jika sebuah item terbukti `OK`, pemecahan lebih lanjut baru dipertimbangkan setelah semua item dalam bab itu diaudit.
- Audit format bukan pemolesan editorial. Jika sumber menampilkan paragraf biasa, markdown tidak boleh menambahkan huruf tebal atau penekanan visual baru hanya untuk memperindah tampilan. Secara praktik, bold di tubuh teks harus diasumsikan salah sampai terbukti ada pada PDF.