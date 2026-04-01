# Implementasi Leipzig Similar Context

Tanggal: 2026-04-01 16:40
Status: aktif
Terkait:
- `backend/models/leipzig/modelKookurensi.js`
- `backend/routes/publik/leipzig.js`
- `frontend/src/pages/publik/alat/KorpusLeipzig.jsx`

## Ringkasan

Fitur `Words with Similar Context` pada alat Korpus Leipzig di Kateglo diimplementasikan mengikuti penjelasan metodologis dari FAQ Wortschatz/Leipzig, bukan memakai embedding modern seperti word2vec atau transformer.

Rujukan primer:
- `https://wortschatz-leipzig.de/en/faq-dict_portal#DictCoocs`
- `https://wortschatz-leipzig.de/en/faq-dict_portal#DictCoocSim`
- `https://wortschatz-leipzig.de/en/faq-dict_portal#DictCoocGraph`

## Metode Leipzig yang Ditiru

Menurut FAQ Leipzig:

1. Cooccurrences adalah kata yang muncul sangat sering bersama kata target.
2. Hubungan itu dapat berasal dari tetangga langsung atau dari kemunculan dalam kalimat yang sama.
3. Relevansi cooccurrence diurutkan memakai significance measure.
4. Leipzig memakai `log-likelihood ratio` sebagai significance measure.
5. Similar context dibentuk dengan membandingkan himpunan `significant cooccurrences` antar kata.
6. Similarity antar himpunan tersebut dihitung memakai `Dice coefficient`.
7. Hanya kandidat dengan jumlah common cooccurrences minimum yang dipertimbangkan.

## Pemetaan ke Data Lokal Kateglo

Pada SQLite Leipzig yang diimpor lokal, tabel yang relevan adalah:

- `co_s`: cooccurrence dalam kalimat yang sama
- `co_n`: cooccurrence tetangga langsung
- `words`: kosakata dan frekuensi bentuk kata

Catatan penting:

- `co_s` dan `co_n` sudah membawa kolom `sig`, sehingga signifikansi tidak dihitung ulang saat request.
- Karena tabel kiri/kanan signifikan terpisah tidak tersedia, implementasi similar context memakai gabungan `co_s` dan `co_n`.
- Tetangga kiri/kanan yang ditampilkan di UI tetap dihitung dari `inv_w` untuk kebutuhan eksplorasi posisi token, tetapi fitur similar context tidak bergantung pada `inv_w`.

## Algoritme Implementasi

Implementasi saat ini berada di `ModelKookurensi.ambilMiripKonteks`.

Langkahnya:

1. Normalisasi kata pencarian dan cari semua bentuk kata yang cocok secara case-insensitive.
2. Ambil fitur konteks signifikan dari `co_s` dan `co_n` untuk seluruh bentuk kata target.
3. Bentuk `featureKey` sebagai gabungan `jenis relasi + kata ternormalisasi`.
   Contoh:
   - `kalimat:pemerintah`
   - `tetangga:negara`
4. Urutkan fitur target berdasarkan `signifikansi DESC`, lalu `frekuensi DESC`.
5. Ambil kandidat kata lain yang berbagi fitur-fitur target tersebut.
6. Untuk setiap kandidat, bangun lagi himpunan fitur signifikannya.
7. Hitung Dice coefficient:

$$
Dice(A, B) = \frac{2|A \cap B|}{|A| + |B|}
$$

8. Buang kandidat yang memiliki `jumlahKonteksSama < minimumKonteksSama`.
9. Urutkan hasil berdasarkan:
   - `skorDice DESC`
   - `jumlahKonteksSama DESC`
   - `frekuensi DESC`
   - `kata ASC`

## Endpoint Publik

Endpoint baru:

`GET /api/publik/leipzig/korpus/:korpusId/kata/:kata/mirip-konteks`

Parameter query yang didukung:

- `limit`
- `minimumKonteksSama`

Response utama:

- `kata`
- `limit`
- `minimumKonteksSama`
- `jumlahKonteksAcuan`
- `total`
- `data[]`

Setiap item pada `data[]` berisi:

- `kata`
- `frekuensi`
- `skorDice`
- `jumlahKonteksSama`
- `konteksBersama[]`

`konteksBersama[]` dipotong untuk tampilan ringkas dan dipakai sebagai penjelas konteks yang bertumpang tindih.

## Alasan Desain

### Mengapa tidak memakai embedding?

Tujuan fitur ini adalah meniru cara kerja Leipzig yang terlihat di portal mereka. Karena Leipzig mendokumentasikan similarity berbasis cooccurrence sets dan Dice coefficient, implementasi lokal mengikuti metode itu agar hasil dan interpretasinya sejalan.

### Mengapa `co_s` + `co_n`?

FAQ Leipzig menyatakan cooccurrence dapat berasal dari tetangga dan kalimat yang sama. Pada artefak lokal, representasi signifikan yang tersedia adalah `co_s` dan `co_n`, sehingga keduanya dipakai sebagai sumber fitur.

### Mengapa ada `minimumKonteksSama`?

FAQ Leipzig menyebut hanya kandidat dengan jumlah common cooccurrences minimum yang dipertimbangkan. Di implementasi ini parameter tersebut dibuat eksplisit agar bisa dikalibrasi.

## Keterbatasan Saat Ini

1. Similarity dihitung saat request, belum dipraproses menjadi indeks khusus.
2. Hasil untuk korpus besar bisa lebih lambat daripada endpoint frekuensi biasa.
3. Belum ada tuning berbasis evaluasi manual untuk ambang `minimumKonteksSama`, `featureLimit`, dan `candidatePoolLimit`.
4. Bentuk kata masih digabung secara case-insensitive, tetapi belum memakai lemmatisasi.
5. Implementasi graph tetap fokus pada `co_s`, sesuai tampilan Leipzig untuk sentence cooccurrences.

## Rekomendasi Lanjutan

1. Jika performa Wikipedia kurang baik, buat cache materialized untuk similar context per `normalized_word`.
2. Tambahkan benchmark lokal untuk korpus `ind_wikipedia_2021_1M`.
3. Evaluasi apakah `co_n` perlu dibobot berbeda dari `co_s`.
4. Pertimbangkan menyimpan jumlah fitur signifikan per kata saat tahap impor agar Dice lebih murah dihitung.

## File yang Diubah Saat Implementasi Ini

- `backend/models/leipzig/modelKookurensi.js`
- `backend/routes/publik/leipzig.js`
- `backend/__tests__/models/leipzig/modelKookurensi.test.js`
- `backend/__tests__/routes/publik/leipzig.test.js`
- `frontend/src/api/apiPublik.js`
- `frontend/__tests__/api/apiPublik.test.js`
- `frontend/src/pages/publik/alat/KorpusLeipzig.jsx`
- `frontend/src/styles/alat.css`
- `frontend/__tests__/pages/publik/alat/KorpusLeipzig.test.jsx`