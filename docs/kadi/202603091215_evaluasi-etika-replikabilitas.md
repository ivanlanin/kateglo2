# Evaluasi, Etika, dan Replikabilitas

**Tanggal**: 2026-03-09
**Status**: Lampiran Proposal Doktoral
**Terkait**: `202603090933_cetak-biru-kamus-deskriptif.md`

---

## Ringkasan

Dokumen ini mengurai enam aspek yang belum tercakup cukup dalam pada cetak biru utama: desain studi reliabilitas antar-redaktur, operasionalisasi metrik temporal untuk siklus hidup neologisme, metodologi perbandingan baseline eksternal, strategi mengatasi masalah cold start pada jalur crowdsourcing, kepatuhan terhadap etika penelitian dan regulasi perlindungan data pribadi, penanganan neologisme semantik (makna baru untuk kata lama), serta kerangka replikabilitas sistem.

---

## 1. Reliabilitas Antar-Redaktur (Inter-Annotator Agreement)

### 1.1 Mengapa Ini Kritis

Keputusan kurasi (`disetujui`, `ditolak`, `tunda`) adalah **label emas** bagi seluruh evaluasi sistem. Jika label ini tidak reliabel — jika dua redaktur yang melihat kandidat yang sama sering tidak sepakat — maka metrik presisi/recall menjadi tidak bermakna. IAA bukan formalitas metodologis; ia menentukan apakah data kurasi *bisa dipakai sebagai data penelitian*.

### 1.2 Desain Studi

| Parameter | Nilai |
|---|---|
| **Jumlah redaktur** | Minimal 2, idealnya 3 |
| **Sampel** | 200 kandidat, dipilih secara stratified (50 dari masing-masing jalur masuk + 50 campuran) |
| **Tugas** | Tentukan status: setujui / tolak / tunda |
| **Kondisi** | Independen — redaktur tidak melihat keputusan satu sama lain |
| **Metrik** | Cohen's kappa (2 annotator) atau Fleiss' kappa (3 annotator) |
| **Timing** | Akhir Fase 1, setelah rubric v1 digunakan selama minimal 2 minggu |

### 1.3 Interpretasi dan Tindak Lanjut

| Kappa | Interpretasi | Tindak lanjut |
|---|---|---|
| 0.81–1.00 | Hampir sempurna | Rubric berfungsi baik; lanjutkan |
| 0.61–0.80 | Substansial | Cukup untuk riset; identifikasi pola ketidaksepakatan |
| 0.41–0.60 | Moderat | Perlu revisi rubric; adjudication meeting wajib |
| < 0.40 | Lemah | Rubric harus ditulis ulang sebelum data kurasi dipakai sebagai label |

Ketidaksepakatan yang konsisten pada kategori tertentu (misalnya: kandidat code-mixing selalu diperdebatkan) lebih berharga daripada angka kappa gabungan. Analisis per-kategori harus dilaporkan.

### 1.4 Adjudikasi

Kandidat dengan ketidaksepakatan diselesaikan melalui diskusi bersama (adjudication meeting). Keputusan adjudikasi dicatat di `riwayat_kurasi` dengan aksi `'adjudikasi'` dan catatan alasan. Pola ketidaksepakatan yang berulang menjadi bahan revisi rubric.

Studi IAA sebaiknya diulang setidaknya sekali di Fase 2 (setelah scraper aktif) untuk mengukur apakah rubric tetap berfungsi saat volume dan tipe kandidat berubah.

---

## 2. Operasionalisasi Siklus Hidup Neologisme

### 2.1 Masalah Definisi

Sub-pertanyaan 5 bertanya tentang kata yang "bertahan" versus kata yang "hanya viral sesaat." Tapi kapan sebuah kata dianggap bertahan? Dan kapan ia dianggap mati? Tanpa definisi operasional yang eksplisit, analisis longitudinal tidak bisa direproduksi.

### 2.2 Definisi Operasional

Definisi berikut diusulkan berdasarkan data yang tersedia di sistem:

| Konsep | Definisi operasional | Proksi data |
|---|---|---|
| **Kemunculan** | Tanggal atestasi pertama dalam korpus | `MIN(atestasi.tanggal_terbit)` atau `MIN(korpus_frekuensi_bulanan.bulan)` |
| **Aktif** | Muncul di ≥2 sumber berbeda dalam 3 bulan terakhir | `COUNT(DISTINCT sumber_nama)` dari `atestasi` dalam window 3 bulan |
| **Stabil** | Aktif selama ≥6 bulan berturut-turut | 6 bulan berturut-turut dengan `frekuensi > 0` di `korpus_frekuensi_bulanan` |
| **Dorman** | Pernah aktif, tapi 0 kemunculan dalam 6 bulan terakhir | Sudah pernah di `korpus_frekuensi`, tapi `frekuensi = 0` untuk 6 bulan terakhir |
| **Mati** | Dorman selama ≥12 bulan | Tidak muncul di korpus selama 12 bulan berturut-turut |

Ambang-ambang ini bersifat tentatif dan harus dikalibrasi setelah data 6 bulan pertama tersedia. Perlu diakui bahwa "mati" dalam linguistik bersifat probabilistik — kata yang tampak mati bisa hidup kembali (contoh: kata arkais yang dipakai ulang secara ironis).

### 2.3 Survival Analysis (Kaplan-Meier)

Untuk menjawab sub-pertanyaan 5 dengan rigor statistik, pendekatan **survival analysis** diusulkan:

- **Event**: kata menjadi dorman (6 bulan tanpa kemunculan)
- **Time-to-event**: jumlah bulan dari kemunculan pertama hingga event
- **Censoring**: kata yang masih aktif pada akhir observasi di-kanan-sensor
- **Stratifikasi**: kurva Kaplan-Meier per jalur masuk (scraper/crowdsource/pencarian), per genre sumber pertama, per tipe kata (serapan/slang/akronim/dll.)

```
Contoh output yang diharapkan:

Probabilitas bertahan (%)
100 ┤────────╮
    │        ╰──╮
 80 ┤           ╰────╮
    │                ╰──╮
 60 ┤    serapan teknis  ╰────────────────────── stabil
    │
 40 ┤
    │    ╰──╮
 20 ┤       ╰──╮
    │  slang    ╰──╮
  0 ┤              ╰────────── cepat mati
    └──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──
       1  2  3  4  5  6  7  8  9 10 11 12 bulan
```

Implementasi menggunakan Python (`lifelines` library) sebagai skrip analisis terpisah, bukan bagian dari backend. Data diekspor dari `korpus_frekuensi_bulanan` dan `kandidat_entri`.

### 2.4 Faktor Prediktor

Setelah kurva Kaplan-Meier mengidentifikasi pola dasar, **Cox proportional hazards model** dapat digunakan untuk menguji faktor prediktor:

| Faktor (kovariat) | Hipotesis | Proksi data |
|---|---|---|
| Jumlah sumber berbeda pada 3 bulan pertama | Lebih banyak sumber → lebih lama bertahan | `COUNT(DISTINCT sumber_nama)` dari atestasi |
| Genre sumber pertama | Serapan teknis bertahan lebih lama dari slang viral | `sumber_tipe` dari atestasi pertama |
| Produktivitas morfologis | Kata yang bisa diimbuhi → lebih terintegrasi | Ada/tidaknya bentuk berimbuhan di korpus |
| Frekuensi puncak | Kata yang terlalu cepat viral → lebih cepat mati | `MAX(frekuensi)` dari `korpus_frekuensi_bulanan` |
| Jalur masuk | Kata dari pencarian organik mungkin bertahan lebih lama | `sumber_scraper` dari `kandidat_entri` |

Analisis ini memerlukan data minimal 12 bulan dan idealnya 18–24 bulan — sesuai dengan timeline Fase 3–4.

---

## 3. Baseline Comparison Eksternal

### 3.1 Masalah

Evaluasi presisi dan recall internal (berapa persen kandidat disetujui, berapa yang terlewat) hanya mengukur konsistensi sistem terhadap keputusan redaktur sendiri. Tanpa **baseline eksternal**, tidak ada anchor yang menunjukkan bahwa sistem memang menangkap neologisme yang *nyata*.

### 3.2 Dua Strategi Baseline

#### A. Baseline Retroaktif: KBBI Edisi Terbaru

KBBI diperbarui secara berkala oleh Badan Bahasa. Kata-kata baru yang masuk KBBI edisi terbaru — terutama yang tidak ada di edisi sebelumnya — menjadi ground truth retroaktif.

**Operasionalisasi:**
1. Pada awal observasi, ambil daftar kata KBBI daring (atau edisi cetak terakhir)
2. Setelah KBBI diperbarui, identifikasi delta (kata-kata yang ditambahkan)
3. Hitung: berapa persen dari delta ini *sudah* masuk sebagai kandidat di sistem sebelum KBBI memasukkannya?
4. Metrik: **recall terhadap KBBI delta** — proporsi kata baru KBBI yang sudah ditangkap sistem

Limitasi: KBBI bersifat preskriptif, jadi kata-kata slang dan cakapan yang ditangkap sistem tapi tidak masuk KBBI bukan berarti false positive — ini justru intinya. Metrik ini hanya berlaku satu arah: KBBI delta sebagai subset dari neologisme yang seharusnya direkam.

#### B. Baseline Paralel: Wiktionary Indonesia

Wiktionary berbasis crowdsourcing dan lebih deskriptif dari KBBI. Kata baru yang muncul di Wiktionary bahasa Indonesia dalam periode observasi yang sama memberikan baseline yang lebih dekat dengan spirit sistem ini.

**Operasionalisasi:**
1. Unduh dump Wiktionary Indonesia di awal dan akhir periode observasi
2. Identifikasi entri baru
3. Hitung overlap: berapa persen entri baru Wiktionary sudah ada di kandidat sistem?
4. Hitung kebalikannya: berapa persen kandidat sistem yang juga muncul di Wiktionary?

Limitasi: Wiktionary Indonesia relatif kecil dan didominasi kontributor tertentu. Overlap yang rendah belum tentu menandakan kegagalan, tapi pola overlap/non-overlap memberikan wawasan tentang jenis kata yang ditangkap oleh mekanisme berbeda.

### 3.3 Timeline Baseline

| Aksi | Kapan |
|---|---|
| Snapshot KBBI daring awal | Awal Fase 1 |
| Snapshot Wiktionary Indonesia awal | Awal Fase 1 |
| Cek delta KBBI | Setiap kali KBBI diperbarui (biasanya tahunan) |
| Cek delta Wiktionary | Setiap 6 bulan |
| Laporan baseline pertama | Akhir Fase 2 (bulan 10) |

---

## 4. Strategi Cold Start Crowdsourcing

### 4.1 Masalah

Jalur 2 (kontribusi pengguna) mengasumsikan ada pengguna yang mau berkontribusi. Tapi fitur baru di platform yang sudah ada sering menghadapi **masalah cold start**: tanpa kontribusi, fitur terlihat kosong → pengguna tidak tertarik → tidak ada kontribusi.

### 4.2 Data yang Ada

Kateglo 2.0 sudah memiliki statistik pencarian. Pertanyaan kritis:
- Berapa unique visitors per bulan?
- Berapa persen yang sudah login?
- Berapa pencarian gagal (kata tidak ditemukan) per hari?

Angka-angka ini menentukan apakah crowdsourcing realistis atau perlu di-bootstrap terlebih dahulu.

### 4.3 Strategi Bootstrap

| Strategi | Mekanisme | Risiko |
|---|---|---|
| **Seed dari pencarian gagal** | Tampilkan daftar kata yang sering dicari tapi gagal; ajak pengguna melengkapi definisi | Rendah — kata sudah relevan |
| **Pre-populate kandidat** | Isi 100–200 kandidat awal dari sumber yang jelas (trending Twitter/X, daftar kata-kata viral bulanan) | Menengah — perlu kurasi awal |
| **Badge kontributor** | Tampilkan jumlah kontribusi di profil; badge "Pewaris Bahasa" untuk kontributor aktif | Rendah — gamifikasi ringan |
| **Notifikasi setelah pencarian gagal** | "Kata ini belum ada. Kamu orang ke-47 yang mencarinya. Bantu kami?" | Rendah — mengubah frustrasi jadi motivasi |
| **Kolaborasi komunitas** | Ajak komunitas linguistik/NLP Indonesia untuk jadi kontributor awal | Bergantung jaringan |

### 4.4 Anti-Spam dan Vandalism

Kontribusi terbuka berisiko spam. Guardrail minimum:

| Lapisan | Mekanisme |
|---|---|
| **Autentikasi** | Login Google OAuth wajib — menaikkan barrier of entry untuk spam |
| **Rate limit** | Maksimal 10 kontribusi/hari per pengguna |
| **Duplicate check** | Cek real-time saat mengetik — jika kata sudah ada di kamus atau antrian, arahkan ke halaman yang sudah ada |
| **Flag sistem** | Kontribusi dari akun baru (< 7 hari) otomatis masuk flag `perlu-moderasi` |
| **Reputasi implisit** | Kontributor yang kontribusinya sering disetujui mendapat flag internal `tepercaya`; kontribusi dari akun `tepercaya` naik prioritas |
| **Report** | Pengguna lain dapat melaporkan kata yang jelas spam/vandalism |

---

## 5. Kepatuhan Etika dan Regulasi

### 5.1 Ethical Clearance

Untuk disertasi doktoral, sebagian besar universitas mensyaratkan ethical clearance dari komite etik jika penelitian melibatkan data yang berkaitan dengan manusia. Apakah sistem ini termasuk?

| Aspek | Melibatkan data manusia? | Alasan |
|---|---|---|
| Scraping teks berita | Tidak langsung | Teks publik; penulis sudah mempublikasikan atas nama media |
| Kontribusi pengguna | Ya | Pengguna membuat akun, menyumbang konten, pola aktivitas terekam |
| Statistik pencarian | Abu-abu | Agregat anonim umumnya tidak perlu ethical clearance; log per-pengguna perlu |
| Atestasi dari media sosial (Fase lanjut) | Ya | Ucapan individu, meskipun publik, memiliki ekspektasi privasi tertentu |

**Rekomendasi**: ajukan ethical clearance untuk komponen crowdsourcing dan penelitian dengan data pencarian yang terkait pengguna login. Untuk komponen scraper berita, cukup deklarasi di metodologi bahwa data berasal dari sumber publik.

### 5.2 UU Perlindungan Data Pribadi (UU 27/2022)

UU PDP Indonesia mulai berlaku penuh Oktober 2024. Beberapa implikasi langsung:

| Kewajiban UU PDP | Bagaimana sistem memenuhi |
|---|---|
| **Dasar pemrosesan** | Konsen eksplisit saat registrasi (Google OAuth) untuk kontributor; kepentingan sah untuk data publik |
| **Transparansi** | Kebijakan privasi di halaman `/privasi` yang menjelaskan data apa yang dikumpulkan, digunakan untuk apa, berapa lama disimpan |
| **Minimalisasi data** | Tidak simpan data pribadi di luar yang diperlukan: nama tampilan, email, kontribusi |
| **Hak penghapusan** | Pengguna dapat menghapus akun; kontribusi yang sudah disetujui tetap ada tapi dianonimisasi (`kontributor_id = NULL`, penulis anonim) |
| **Retensi** | Data akun tidak aktif dihapus setelah 2 tahun; data kurasi dan atestasi dipertahankan (kepentingan ilmiah) |

### 5.3 Anonimisasi Atestasi

Untuk atestasi dari media sosial (jika ditambahkan di fase lanjut), kolom `penulis_anonim` di tabel `atestasi` sudah disiapkan. Prinsipnya:

- Atestasi dari berita: penulis diidentifikasi (wartawan sudah publik)
- Atestasi dari kontribusi pengguna: nama tampilan diperlihatkan, bisa dianonimisasi atas permintaan
- Atestasi dari media sosial: **selalu** dianonimisasi; handle/username tidak disimpan, hanya URL (yang mungkin sudah dihapus oleh pemiliknya — dicatat di `konten_dihapus`)

### 5.4 Pertimbangan Hak Cipta Scraping

Dilengkapi lebih detail dari yang sudah ada di cetak biru:

| Sumber | Status hukum | Kebijakan sistem |
|---|---|---|
| Artikel berita (teks penuh) | Dilindungi hak cipta | Simpan di object storage internal; **tidak** didistribusikan |
| Kutipan (2–3 kalimat) | Fair use untuk penelitian (*de minimis*) | Boleh ditampilkan di panel atestasi |
| Judul + URL + metadata | Fakta, tidak dilindungi | Boleh didistribusikan |
| Frekuensi token agregat | Statistik, bukan karya | Boleh didistribusikan (CC-BY) |
| Wikipedia, JDIH | CC-BY-SA / domain publik | Boleh disimpan dan didistribusikan |

Sebagai praktek baik, User-Agent bot menyertakan URL informasi (`KategloBot/1.0 (+https://kateglo.com/bot)`) dan sistem menghormati `robots.txt` serta `Crawl-delay`.

---

## 6. Neologisme Semantik: Makna Baru untuk Kata Lama

### 6.1 Celah dalam Desain Saat Ini

Skema `kandidat_entri` dirancang untuk menangkap **kata-kata baru yang tidak ada di kamus**. Tapi neologisme tidak selalu berbentuk kata baru — kadang kata lama memperoleh makna baru:

| Kata | Makna lama (sudah di kamus) | Makna baru (belum tercatat) |
|---|---|---|
| **viral** | berkaitan dengan virus | menyebar luas di internet |
| **nyinyir** | cerewet (KBBI) | berkomentar negatif di media sosial |
| **sultan** | penguasa kerajaan Islam | orang sangat kaya |
| **ghosting** | - (belum di KBBI) | menghilang tanpa kabar dalam hubungan |
| **healing** | - (belum di KBBI) | berwisata untuk pemulihan mental |
| **bucin** | - (baru) | "budak cinta" — terlalu mengabdi pada pasangan |

Tiga kata pertama sudah ada di kamus tapi dengan makna berbeda. Pipeline saat ini akan melewatkannya karena stemming + lookup menemukan kata di `entri` → dianggap sudah dikenal → dilewati.

### 6.2 Solusi: Jalur Makna Baru

Untuk menangkap neologisme semantik tanpa mengubah skema secara besar, dua pendekatan bisa digunakan:

**Pendekatan A — Via crowdsourcing (Fase 1)**

Form `/usul-kata` di langkah 1 (cek keberadaan) dimodifikasi:
- Jika kata ditemukan di kamus, tampilkan makna yang sudah ada
- Tambahkan opsi: *"Kata ini sudah ada, tapi saya tahu makna lain yang belum tercatat"*
- Pengguna mengisi makna baru + contoh kalimat → masuk ke `kandidat_entri` dengan `entri_id` terisi (merujuk entri yang sudah ada)
- Status: `menunggu`, tapi `entri_id IS NOT NULL` menandakan ini kandidat makna baru, bukan kata baru

**Pendekatan B — Via deteksi distribusional (Fase 3)**

Teknik yang lebih canggih menggunakan data korpus:
- Pantau konteks kolokasi kata yang sudah ada di kamus dari bulan ke bulan
- Jika distribusi kolokasi berubah signifikan (cosine similarity < threshold), flag sebagai kandidat pergeseran makna
- Contoh: "viral" yang tadinya muncul bersama "penyakit", "vaksin", "infeksi" mulai dominan muncul bersama "video", "TikTok", "meme" → sinyal makna baru
- Memerlukan `korpus_frekuensi_bulanan` dan FastText embeddings

### 6.3 Implikasi Skema

Skema `kandidat_entri` sudah cukup mendukung pendekatan A:
- `entri_id` sudah ada: jika terisi, kandidat ini adalah makna baru untuk entri yang sudah ada
- `definisi_awal`: makna baru yang diusulkan
- Migrasi: alih-alih `INSERT INTO entri`, lakukan `INSERT INTO makna` + `INSERT INTO contoh` pada `entri_id` yang sudah ada

Tidak perlu kolom atau tabel baru — cukup logika yang berbeda di jalur kurasi.

---

## 7. Kerangka Replikabilitas

### 7.1 Mengapa Ini Penting untuk DSR

Design Science Research menuntut artefak yang dapat **dievaluasi dan direplikasi** oleh peneliti lain. Untuk sistem perangkat lunak, ini berarti:

- Apakah peneliti lain bisa menjalankan sistem yang sama?
- Apakah mereka bisa memverifikasi klaim tentang presisi, recall, dan siklus hidup?
- Apakah metodologi bisa diterapkan untuk bahasa lain?

### 7.2 Komponen Replikabilitas

| Komponen | Bentuk | Lisensi |
|---|---|---|
| **Kode sistem** | Repository GitHub (backend + frontend + pipeline scraper) | MIT |
| **Skema database** | SQL migration files di `_docs/` | MIT |
| **Konfigurasi scraper** | File konfigurasi per sumber (URL, selector, rate limit) | MIT |
| **Pipeline normalisasi** | Modul terpisah: peta varian, afiks cakapan, filter NE | MIT |
| **Rubric kurasi** | Dokumen teks di repository | CC-BY |
| **Dataset kandidat berlabel** | Ekspor CSV/JSON: kata, status, atestasi, metadata | CC-BY |
| **Dataset frekuensi** | Ekspor CSV: token, frekuensi, df, pertama, terakhir | CC-BY |
| **Dokumentasi metodologi** | Dokumen `_docs/kadi/` | CC-BY |

### 7.3 Configuration-as-Code

Untuk memudahkan replikasi, semua parameter yang mempengaruhi pipeline harus dikonfigurasi dari file, bukan hardcoded:

```javascript
// Contoh: config/kadi.config.js
module.exports = {
  scraper: {
    intervalJam: 1,
    maxReqPerDetikPerDomain: 1,
    userAgent: 'KategloBot/1.0 (+https://kateglo.com/bot)',
  },
  normalisasi: {
    minPanjangToken: 3,
    stopwordList: 'config/stopwords-id.txt',
    petaVarian: 'config/peta-varian.json',
    afiksCakapan: ['nge-', 'di-', '-in', '-an'],
    stemmer: 'nazief-adriani',       // 'nazief-adriani' | 'pysastrawi' | 'none'
  },
  kandidat: {
    thresholdPencarianGagal: 10,     // min pencarian gagal per minggu
    windowPencarianHari: 7,
    maxKandidatPerSumberPerHari: 500,
    coolingOffHari: 3,               // jeda sebelum scraper menaikkan prioritas
  },
  kurasi: {
    minAtestasi: 2,                  // minimum sebelum layak review
    iaaIntervalBulan: 3,             // frekuensi studi IAA
    iaaSampleSize: 200,
  },
  temporal: {
    windowAktifBulan: 3,
    windowDormanBulan: 6,
    windowMatiBulan: 12,
  },
};
```

Peneliti yang ingin menerapkan sistem untuk bahasa lain (Melayu, Tagalog, bahasa aglutinatif lain) cukup mengganti file konfigurasi — terutama `stopwordList`, `petaVarian`, `afiksCakapan`, dan `stemmer`.

### 7.4 Panduan Replikasi untuk Bahasa Lain

Sistem ini dirancang untuk bahasa Indonesia, tapi arsitekturnya cukup generik untuk bahasa aglutinatif lain. Komponen yang perlu diadaptasi:

| Komponen | Adaptasi untuk bahasa lain |
|---|---|
| Stemmer | Ganti dengan stemmer yang sesuai (Snowball untuk bahasa Eropa, dll.) |
| Peta varian | Buat peta varian spesifik bahasa |
| Stopword list | Ganti dengan stopword bahasa target |
| Afiks cakapan | Identifikasi afiks informal spesifik bahasa |
| Heuristik NE | Mungkin berbeda — bahasa tanpa kapital (Jepang, dll.) butuh pendekatan lain |
| Sumber RSS | Ganti dengan media lokal bahasa target |
| Rubric kurasi | Adaptasi untuk norma leksikografis lokal |

---

## 8. Rangkuman Implikasi untuk Jadwal

Penambahan-penambahan di atas mempengaruhi beberapa item jadwal yang sudah ada:

| Fase | Tambahan | Item baru |
|---|---|---|
| **Fase 1** | IAA study + rubric v1 | Snapshot baseline KBBI + Wiktionary; form "makna baru untuk kata lama" |
| **Fase 2** | Laporan IAA pertama | Laporan baseline pertama (bulan 10); studi cold start |
| **Fase 3** | `korpus_frekuensi_bulanan` | Deteksi distribusional untuk neologisme semantik |
| **Fase 4** | Survival analysis | Cox regression; studi IAA ulang; laporan baseline akhir |

Tidak ada perubahan pada durasi fase — item-item ini terintegrasi ke dalam timeline yang sudah ada. `korpus_frekuensi_bulanan` dimasukkan ke Fase 3 karena tabel ini baru bermakna setelah data temporal cukup terkumpul.

---

## 9. Keputusan yang Perlu Diambil

Dokumen ini menambahkan beberapa keputusan yang belum final dan perlu diputuskan sebelum atau selama implementasi:

| # | Pertanyaan | Status | Rekomendasi |
|---|---|---|---|
| 1 | Ambang window dorman dan mati | Tentatif | 6 dan 12 bulan; kalibrasi setelah data 6 bulan |
| 2 | Ethical clearance diperlukan? | Belum diajukan | Ajukan untuk komponen crowdsourcing |
| 3 | Gamifikasi spesifik apa? | Belum final | Mulai dengan badge + notifikasi; evaluasi engagement setelah 3 bulan |
| 4 | Deteksi neologisme semantik otomatis | Fase 3 | Manual via crowdsourcing dulu (Fase 1), otomatis belum urgent |
| 5 | Frekuensi studi IAA | Awal setiap fase | Minimal awal Fase 1 dan awal Fase 2 |
