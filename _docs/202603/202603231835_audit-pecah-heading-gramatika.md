# Audit Pemecahan Heading Halaman Gramatika

Tanggal: 2026-03-23

## Tujuan

Mencatat halaman Gramatika yang masih memuat heading internal `##`, `###`, dan seterusnya di dalam satu file, lalu menyiapkan aturan penamaan file pecahan agar tidak bentrok dengan slug yang sudah terdaftar di `frontend/src/constants/gramatikaData.js`.

## Keputusan yang Sudah Dikunci

- [disepakati] Contoh pola acuan adalah file induk-anak yang sudah ada, seperti `adjektiva-turunan.md` dan `pronomina-tanya.md`.
- [disepakati] Saat halaman dipecah, `frontend/src/constants/gramatikaData.js` wajib dimutakhirkan dalam batch yang sama agar navigasi dan breadcrumb tetap benar.
- [disepakati] Semua file hasil pecahan harus muncul secara hierarkis di daftar isi per bab melalui struktur `daftarIsiGramatika`.
- [disepakati] Aturan penamaan dan mitigasi risiko slug pada dokumen ini dipakai sebagai aturan kerja.
- [disepakati] Proses dikerjakan per subfolder agar perubahan lebih mudah dilacak.
- [disepakati] Batch dimulai dari Bab I, lalu lanjut subfolder berikutnya secara berurutan.
- [disepakati] Halaman induk setelah dipecah tidak perlu diberi pengantar baru; jika tidak ada pengantar asli yang layak dipertahankan, cukup tampilkan daftar subhalaman.
- [disepakati] Setiap file baru wajib memiliki frontmatter minimal `id` dan `title`.

## Konsekuensi Implementasi

1. Setiap batch pecah halaman harus mencakup tiga jenis perubahan sekaligus:
  - file markdown induk dan anak di `frontend/public/gramatika/<subfolder>/`
  - struktur hierarki di `frontend/src/constants/gramatikaData.js`
  - daftar tautan pada halaman induk agar sinkron dengan struktur baru
2. Karena breadcrumb dibangun dari `ancestorTrail`, `parentSlug`, dan `directParentSlug`, penambahan turunan baru tidak boleh dilakukan hanya di markdown tanpa pembaruan `gramatikaData.js`.
3. Untuk halaman induk yang isinya sebelumnya berupa teks penuh lalu dipecah, isi induk boleh direduksi menjadi daftar subhalaman saja jika memang tidak ada pengantar asli yang perlu dipertahankan.

## Sumber Audit

- Struktur kanonik navigasi: `frontend/src/constants/gramatikaData.js`
- Konten halaman aktual: `frontend/public/gramatika/**/*.md`
- Manifest audit terdahulu: `_docs/202603/202603231545_manifest-audit-gramatika.md`

## Metode

1. Ambil semua item Gramatika dari `daftarItemGramatika` di `gramatikaData.js` sebagai daftar slug yang sudah dipakai.
2. Pindai seluruh `frontend/public/gramatika/**/*.md` untuk heading internal `##+`.
3. Ubah setiap heading internal menjadi kandidat slug file dengan normalisasi yang sama seperti slug markdown biasa.
4. Bandingkan kandidat itu terhadap:
   - slug yang sudah ada di `gramatikaData.js`
   - nama file markdown Gramatika yang sudah ada
   - kandidat heading baru lain

## Ringkasan Temuan

- Total halaman konten yang masih memiliki heading internal: 47 file
- Total heading internal yang terdeteksi: 199 heading
- Bab yang terdampak: 9 bab
- Duplikasi antar kandidat heading baru: 0
- Bentrok langsung dengan slug/file yang sudah ada: 1 kasus

## Sebaran per Bab

| Bab | File | Heading Internal |
| --- | ---: | ---: |
| pendahuluan | 0 | 0 |
| adjektiva | 7 | 30 |
| adverbia | 3 | 9 |
| bunyi-bahasa | 2 | 23 |
| hubungan-antarklausa | 3 | 8 |
| kalimat | 10 | 47 |
| kata-tugas | 2 | 7 |
| nomina | 10 | 34 |
| pronomina | 2 | 7 |
| tata-bahasa | 0 | 0 |
| verba | 8 | 34 |

## Status Eksekusi Batch

### Batch 1: Bab I Pendahuluan

Status: selesai diperiksa, tidak perlu pemecahan

Hasil verifikasi:

- subfolder `frontend/public/gramatika/pendahuluan/` tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman induk `pendahuluan.md` sudah berupa daftar isi bab
- halaman `ragam-bahasa.md` sudah memakai pola induk-anak yang benar dan menaut ke dua subhalaman turunannya
- struktur Bab I di `frontend/src/constants/gramatikaData.js` sudah konsisten dengan file markdown yang ada

Implikasi:

- tidak ada file baru yang perlu dibuat untuk Bab I
- tidak ada perubahan yang diperlukan pada `frontend/src/constants/gramatikaData.js` untuk Bab I
- batch berikutnya dapat lanjut ke Bab II

### Batch 2: Bab II Tata Bahasa

Status: selesai dipecah dan tervalidasi

Hasil verifikasi:

- subfolder `frontend/public/gramatika/tata-bahasa/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `tata-bahasa.md` sudah berupa daftar isi bab
- halaman induk `pengertian-tata-bahasa.md` sudah memakai pola induk-anak yang benar dan menaut ke `fonologi`, `morfologi`, dan `sintaksis`
- halaman induk `semantik-pragmatik-dan-relasi-makna.md` sudah memakai pola induk-anak yang benar dan menaut ke empat subhalaman turunannya
- struktur Bab II di `frontend/src/constants/gramatikaData.js` sudah diperluas agar breadcrumb mengikuti hierarki baru sampai level turunan
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk `Gramatika.test.jsx`

File baru yang ditambahkan pada Bab II:

- `frontend/public/gramatika/tata-bahasa/struktur-konstituen.md`
- `frontend/public/gramatika/tata-bahasa/kategori-sintaksis.md`
- `frontend/public/gramatika/tata-bahasa/kategori-leksikal.md`
- `frontend/public/gramatika/tata-bahasa/kategori-frasa.md`
- `frontend/public/gramatika/tata-bahasa/konstruksi-tata-bahasa-dan-fungsinya.md`
- `frontend/public/gramatika/tata-bahasa/inti-dan-noninti.md`
- `frontend/public/gramatika/tata-bahasa/jenis-jenis-noninti.md`
- `frontend/public/gramatika/tata-bahasa/konstruksi-tanpa-inti.md`
- `frontend/public/gramatika/tata-bahasa/representasi-fungsi-dengan-diagram.md`
- `frontend/public/gramatika/tata-bahasa/cabang-tunggal.md`
- `frontend/public/gramatika/tata-bahasa/model-diagram.md`
- `frontend/public/gramatika/tata-bahasa/proposisi-kalimat.md`
- `frontend/public/gramatika/tata-bahasa/perikutan.md`
- `frontend/public/gramatika/tata-bahasa/proposisi-tertutup-dan-proposisi-terbuka.md`
- `frontend/public/gramatika/tata-bahasa/pengacuan.md`
- `frontend/public/gramatika/tata-bahasa/deiksis.md`
- `frontend/public/gramatika/tata-bahasa/makna-ilokusi-dan-isi-proposisi.md`
- `frontend/public/gramatika/tata-bahasa/implikatur-konvensional.md`

Halaman induk Bab II yang diubah menjadi daftar subhalaman hierarkis:

- `frontend/public/gramatika/tata-bahasa/sintaksis.md`
- `frontend/public/gramatika/tata-bahasa/kondisi-kebenaran-dan-perikutan.md`
- `frontend/public/gramatika/tata-bahasa/pengacuan-dan-deiksis.md`
- `frontend/public/gramatika/tata-bahasa/aspek-takberkondisi-benar-makna-kalimat.md`

Implikasi:

- pola implementasi per bab terbukti bisa langsung dipakai setelah audit minimum dan pembaruan `gramatikaData.js` pada batch yang sama
- batch berikutnya dapat langsung memakai pola yang sama untuk Bab III

## Prioritas Pemecahan

File dengan kepadatan heading paling tinggi sebaiknya diproses lebih dulu karena memberi pengurangan kompleksitas paling besar per file.

1. `frontend/public/gramatika/bunyi-bahasa/konsonan-dan-alofon-konsonan.md` — 17 heading
2. `frontend/public/gramatika/kalimat/peran.md` — 14 heading
3. `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-meng.md` — 9 heading
4. `frontend/public/gramatika/kalimat/kalimat-imperatif.md` — 8 heading
5. `frontend/public/gramatika/kalimat/kalimat-dan-kemasan-informasi.md` — 7 heading
6. `frontend/public/gramatika/nomina/perluasan-nomina-ke-kanan.md` — 7 heading
7. `frontend/public/gramatika/adjektiva/tingkat-kualitas.md` — 6 heading

Catatan eksekusi:

- daftar prioritas di atas bersifat lokal di dalam subfolder
- urutan batch global mengikuti bab, dimulai dari Bab I, bukan langsung dari file terpadat lintas semua bab

## Bentrok yang Terdeteksi

Hanya ada satu bentrok langsung terhadap slug global yang sudah ada di `gramatikaData.js`.

| File Asal | Heading | Kandidat Slug | Bentrok Dengan |
| --- | --- | --- | --- |
| `frontend/public/gramatika/nomina/penentu.md` | `Numeralia (7.1.5.1.1)` | `numeralia` | `frontend/public/gramatika/numeralia/numeralia.md` |

Rekomendasi untuk kasus ini:

- jangan gunakan `numeralia.md` sebagai file pecahan baru
- pilih slug berinduk, misalnya `penentu-numeralia.md` atau `numeralia-sebagai-penentu.md`

## Risiko Penamaan yang Perlu Diantisipasi

Walaupun bentrok langsung hanya satu, ada tiga kelompok heading yang berisiko jika dipecah tanpa aturan tambahan.

### 1. Heading bernomor

Beberapa file memakai heading seperti `1) ...`, `2) ...`, dan seterusnya. Jika slug dibuat mentah, hasilnya diawali angka, misalnya:

- `1-konsonan-b-dan-p`
- `1-vokal-i`
- `1-kalimat-imperatif-halus`

Rekomendasi:

- buang prefiks angka dari slug akhir
- gunakan nama semantis, misalnya `konsonan-b-dan-p`, `vokal-i`, `kalimat-imperatif-halus`

### 2. Heading dengan simbol fonetik atau karakter khusus

Beberapa heading bunyi bahasa kehilangan informasi saat dislugifikasi, misalnya:

- `7) Konsonan /ʃ/` menjadi `7-konsonan`
- `12) Konsonan /ɲ/` menjadi `12-konsonan`
- `13) Konsonan /ŋ/` menjadi `13-konsonan`
- `5) Vokal /ə/` menjadi `5-vokal`

Rekomendasi:

- jangan pakai hasil slug mentah untuk kasus IPA/simbol
- gunakan nama fonem yang eksplisit, misalnya `konsonan-sy`, `konsonan-ny`, `konsonan-ng`, `vokal-pepet`

### 3. Heading generik atau terlalu pendek

Sebagian heading hanya menghasilkan satu sampai dua kata yang cukup generik, misalnya:

- `pelaku`
- `alat`
- `tujuan`
- `hasil`
- `pengafiksan`
- `pengulangan`
- `pengacuan`
- `deiksis`
- `simpulan`

Rekomendasi:

- untuk slug generik, gunakan prefiks slug file induk
- contoh:
  - `kalimat-pelaku`
  - `kalimat-alat`
  - `verba-pengafiksan`
  - `tata-bahasa-pengacuan`
  - `nomina-simpulan`

## Aturan Penamaan yang Disarankan

Gunakan hirarki berikut saat memecah halaman menjadi file baru.

1. Jika heading menghasilkan slug yang spesifik, tidak diawali angka, dan tidak bentrok, pakai slug mentah.
2. Jika slug terlalu generik atau pendek, prefiks dengan slug file induk saat ini.
3. Jika slug masih ambigu, prefiks dengan slug parent terdekat dari `gramatikaData.js`.
4. Jika heading memakai angka urut, buang angka dari slug final.
5. Jika heading memuat simbol fonetik, ganti dengan label semantis yang stabil, bukan karakter IPA mentah.

Contoh:

- `Numeralia` di bawah `penentu.md` -> `penentu-numeralia`
- `Pelaku` di bawah `peran.md` -> `kalimat-pelaku` atau `peran-pelaku`
- `Pengacuan` di bawah `pengacuan-dan-deiksis.md` -> `tata-bahasa-pengacuan` atau `pengacuan-bagian`
- `Konsonan /ʃ/` di bawah `konsonan-dan-alofon-konsonan.md` -> `konsonan-sy`

## Inventaris Lengkap

Daftar file terdampak beserta kandidat slug per heading tercatat di dokumen terpisah:

- `_docs/202603/202603231835_inventaris-pecah-heading-gramatika.md`

## Kesimpulan Kerja Lanjut

- Struktur `gramatikaData.js` sudah cukup baik sebagai kanvas hierarki target.
- Pekerjaan berikutnya dilakukan per subfolder, dimulai dari Bab I.
- Di dalam setiap subfolder, urutan kerja bisa mengikuti file berheading paling padat agar perubahan cepat terasa.
- Bab II membuktikan bahwa pemecahan langsung satu bab penuh dapat dilakukan sambil menjaga breadcrumb, prev/next, dan daftar isi hierarkis.
- Saat pemecahan dilakukan, penambahan item baru ke `gramatikaData.js` harus mengikuti aturan prefiks untuk mencegah slug global bertabrakan.