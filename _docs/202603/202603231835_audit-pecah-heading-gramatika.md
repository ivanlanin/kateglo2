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
- [disepakati] Di halaman induk konten, tampilkan hanya anak langsung; cucu dan turunan yang lebih dalam tidak ditampilkan pada daftar tautan induk.
- [disepakati] Setiap file baru wajib memiliki frontmatter minimal `id` dan `title`.
- [disepakati] Setelah mengubah `frontend/src/constants/gramatikaData.js`, selalu jalankan `node frontend/scripts/sync-gramatika-toc.mjs` untuk memutakhirkan halaman daftar isi bab.
- [disepakati] Penamaan judul dan slug turunan diputuskan per file berdasarkan cakupan isi aktual. Untuk heading generik atau bentrok, pilih nama yang paling spesifik dan paling mudah dibedakan, tidak harus selalu memakai pola parent-first.

## Konsekuensi Implementasi

1. Setiap batch pecah halaman harus mencakup tiga jenis perubahan sekaligus:
  - file markdown induk dan anak di `frontend/public/gramatika/<subfolder>/`
  - struktur hierarki di `frontend/src/constants/gramatikaData.js`
  - daftar tautan pada halaman induk agar sinkron dengan struktur baru
2. Setelah `gramatikaData.js` diubah, halaman daftar isi bab harus digenerate ulang dengan `node frontend/scripts/sync-gramatika-toc.mjs`.
3. Daftar tautan pada halaman induk konten hanya menampilkan anak langsung dari halaman itu.
4. Halaman daftar isi bab yang digenerate dari `sync-gramatika-toc.mjs` tetap mengikuti struktur rekursif penuh per subfolder.
5. Karena breadcrumb dibangun dari `ancestorTrail`, `parentSlug`, dan `directParentSlug`, penambahan turunan baru tidak boleh dilakukan hanya di markdown tanpa pembaruan `gramatikaData.js`.
6. Untuk halaman induk yang isinya sebelumnya berupa teks penuh lalu dipecah, isi induk boleh direduksi menjadi daftar subhalaman saja jika memang tidak ada pengantar asli yang perlu dipertahankan.
7. Untuk judul/slug yang berpotensi ambigu, keputusan akhir mengikuti cakupan isi file hasil pecahan, bukan sekadar heading mentah. Contoh: subhalaman di bawah `penentu.md` memakai `numeralia-tentu-dan-taktentu` karena isi file memang mencakup dua kategori itu sekaligus.

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

- Total halaman konten yang masih memiliki heading internal: 35 file
- Total heading internal yang terdeteksi: 142 heading
- Bab yang terdampak: 7 bab
- Duplikasi antar kandidat heading baru: 0
- Bentrok langsung dengan slug/file yang sudah ada: 1 kasus

## Sebaran per Bab

| Bab | File | Heading Internal |
| --- | ---: | ---: |
| pendahuluan | 0 | 0 |
| adjektiva | 7 | 30 |
| adverbia | 3 | 9 |
| bunyi-bahasa | 0 | 0 |
| hubungan-antarklausa | 3 | 8 |
| kalimat | 10 | 47 |
| kata-tugas | 2 | 7 |
| nomina | 0 | 0 |
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
- halaman bab `tata-bahasa.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- halaman induk `pengertian-tata-bahasa.md` sudah memakai pola induk-anak yang benar dan menaut ke `fonologi`, `morfologi`, dan `sintaksis`
- halaman induk `semantik-pragmatik-dan-relasi-makna.md` sudah memakai pola induk-anak yang benar dan menaut ke empat subhalaman turunannya
- halaman induk `sintaksis.md` dirapikan agar hanya menampilkan anak langsung, bukan cucu, tanpa mengubah sifat rekursif halaman daftar isi bab
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

### Batch 3: Bab III Bunyi Bahasa

Status: selesai dipecah dan tervalidasi

Hasil verifikasi:

- subfolder `frontend/public/gramatika/bunyi-bahasa/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `bunyi-bahasa.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- halaman induk `vokal-dan-konsonan.md` tetap berupa daftar tautan hierarkis untuk subbab 3.2
- halaman induk `vokal-dan-alofon-vokal.md` dirapikan agar hanya menampilkan enam anak langsung
- halaman induk `konsonan-dan-alofon-konsonan.md` dirapikan agar hanya menampilkan tujuh belas anak langsung
- struktur Bab III di `frontend/src/constants/gramatikaData.js` sudah diperluas agar breadcrumb mengikuti hierarki baru sampai level turunan fonem
- slug berisiko untuk `/ə/`, `/ʃ/`, `/ɲ/`, dan `/ŋ/` dinormalisasi menjadi `vokal-pepet`, `konsonan-sy`, `konsonan-ny`, dan `konsonan-ng`
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk area terkait

File baru yang ditambahkan pada Bab III:

- `frontend/public/gramatika/bunyi-bahasa/vokal-i.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-u.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-e.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-o.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-pepet.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-a.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-b-dan-p.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-d-dan-t.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-g-dan-k.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-j-dan-c.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-f.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-s-dan-z.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-sy.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-kh.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-h.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-m.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-n.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-ny.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-ng.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-r.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-l.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-w.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-y.md`

Halaman induk Bab III yang diubah menjadi daftar subhalaman hierarkis:

- `frontend/public/gramatika/bunyi-bahasa/vokal-dan-alofon-vokal.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-dan-alofon-konsonan.md`

Implikasi:

- pola pemecahan Bab II tetap valid untuk Bab III, termasuk kombinasi daftar isi bab rekursif dan halaman induk konten yang hanya menampilkan anak langsung
- batch berikutnya dapat lanjut ke Bab IV

### Batch 4: Bab IV Nomina

Status: selesai dipecah dan tervalidasi

Hasil verifikasi:

- subfolder `frontend/public/gramatika/nomina/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `nomina.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- semua halaman induk konten Nomina yang sebelumnya mengandung heading internal kini dirapikan agar hanya menampilkan anak langsung
- bentrok slug `numeralia` di bawah `penentu.md` diselesaikan dengan slug aman `numeralia-tentu-dan-taktentu`
- struktur Bab IV di `frontend/src/constants/gramatikaData.js` sudah diperluas untuk seluruh turunan baru agar breadcrumb dan sidebar mengikuti hierarki baru
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk area terkait

File baru yang ditambahkan pada Bab IV:

- `frontend/public/gramatika/nomina/nama-jenis.md`
- `frontend/public/gramatika/nomina/nama-diri.md`
- `frontend/public/gramatika/nomina/nomina-dasar-umum.md`
- `frontend/public/gramatika/nomina/nomina-dasar-khusus.md`
- `frontend/public/gramatika/nomina/perulangan-utuh.md`
- `frontend/public/gramatika/nomina/perulangan-salin-suara.md`
- `frontend/public/gramatika/nomina/perulangan-sebagian.md`
- `frontend/public/gramatika/nomina/perulangan-disertai-pengafiksan.md`
- `frontend/public/gramatika/nomina/perulangan-sinonim.md`
- `frontend/public/gramatika/nomina/nomina-majemuk-berdasarkan-bentuk-morfologisnya.md`
- `frontend/public/gramatika/nomina/nomina-majemuk-berdasarkan-hubungan-komponennya.md`
- `frontend/public/gramatika/nomina/numeralia-tentu-dan-taktentu.md`
- `frontend/public/gramatika/nomina/penunjuk-atau-demonstrativa.md`
- `frontend/public/gramatika/nomina/penanda-ketakrifan.md`
- `frontend/public/gramatika/nomina/pronomina-dan-nomina-pemilik.md`
- `frontend/public/gramatika/nomina/nomina-sebagai-pelengkap-preposisi.md`
- `frontend/public/gramatika/nomina/nomina-sebagai-inti-frasa-nominal.md`
- `frontend/public/gramatika/nomina/nomina-pewatas.md`
- `frontend/public/gramatika/nomina/adjektiva-pewatas.md`
- `frontend/public/gramatika/nomina/verba-pewatas.md`
- `frontend/public/gramatika/nomina/frasa-preposisional-sebagai-pewatas.md`
- `frontend/public/gramatika/nomina/klausa-sebagai-pewatas.md`
- `frontend/public/gramatika/nomina/apositif-sebagai-pewatas.md`
- `frontend/public/gramatika/nomina/frasa-nominal-majemuk.md`
- `frontend/public/gramatika/nomina/pola-kanonik-frasa-nominal.md`
- `frontend/public/gramatika/nomina/bentuk-vokatif-yang-lazim.md`
- `frontend/public/gramatika/nomina/keakraban-dan-pemendekan.md`
- `frontend/public/gramatika/nomina/vokatif-dan-ungkapan-penyapa.md`
- `frontend/public/gramatika/nomina/bentuk-perulangan-an.md`
- `frontend/public/gramatika/nomina/kata-para.md`
- `frontend/public/gramatika/nomina/kata-kaum.md`
- `frontend/public/gramatika/nomina/kata-umat.md`
- `frontend/public/gramatika/nomina/hubungan-jumlah-dan-pengacuan.md`
- `frontend/public/gramatika/nomina/konsep-tunggal-jamak-dan-generik-simpulan.md`

Halaman induk Bab IV yang diubah menjadi daftar subhalaman hierarkis:

- `frontend/public/gramatika/nomina/nomina-berdasarkan-acuan.md`
- `frontend/public/gramatika/nomina/nomina-dasar.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-melalui-perulangan.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-melalui-pemajemukan.md`
- `frontend/public/gramatika/nomina/penentu.md`
- `frontend/public/gramatika/nomina/perilaku-sintaksis-nomina.md`
- `frontend/public/gramatika/nomina/perluasan-nomina-ke-kanan.md`
- `frontend/public/gramatika/nomina/susunan-kata-pada-frasa-nominal.md`
- `frontend/public/gramatika/nomina/frasa-nominal-vokatif.md`
- `frontend/public/gramatika/nomina/konsep-tunggal-jamak-dan-generik.md`

Implikasi:

- pola implementasi per subfolder tetap konsisten pada Bab IV: halaman bab rekursif penuh, halaman induk konten anak langsung saja
- batch berikutnya dapat lanjut ke Bab V

### Batch 5: Bab V Verba

Status: selesai dipecah dan tervalidasi dengan strategi mikro-batch

Hasil verifikasi:

- subfolder `frontend/public/gramatika/verba/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `verba.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- semua halaman induk konten Verba yang sebelumnya mengandung heading internal kini dirapikan agar hanya menampilkan anak langsung
- `verba-taktransitif-dengan-prefiks-meng.md` diperluas menjadi parent bertingkat karena bagian `pangkal nomina` masih memiliki lima subkelompok
- heading generik pada `verba-taktransitif-dengan-prefiks-se.md` dinormalisasi secara semantis menjadi dua subhalaman yang membedakan pola adverbial dan nominal
- struktur Bab V di `frontend/src/constants/gramatikaData.js` sudah diperluas untuk area `Bentuk Verba`, `Verba Transitif`, `Verba Taktransitif`, dan `Frasa Verbal` agar breadcrumb dan sidebar mengikuti hierarki baru
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk area terkait setelah setiap mikro-batch dan setelah batch final

File baru yang ditambahkan pada Bab V:

- `frontend/public/gramatika/verba/verba-dasar-bebas.md`
- `frontend/public/gramatika/verba/verba-dasar-terikat.md`
- `frontend/public/gramatika/verba/verba-hasil-pengonversian.md`
- `frontend/public/gramatika/verba/verba-turunan-melalui-pengafiksan.md`
- `frontend/public/gramatika/verba/verba-turunan-melalui-pengulangan.md`
- `frontend/public/gramatika/verba/verba-turunan-melalui-pemajemukan.md`
- `frontend/public/gramatika/verba/frasa-endosentrik-atributif.md`
- `frontend/public/gramatika/verba/pewatas-depan.md`
- `frontend/public/gramatika/verba/pewatas-belakang.md`
- `frontend/public/gramatika/verba/frasa-endosentrik-koordinatif.md`
- `frontend/public/gramatika/verba/verba-dan-frasa-verbal-sebagai-predikat.md`
- `frontend/public/gramatika/verba/verba-dan-frasa-verbal-sebagai-pelengkap.md`
- `frontend/public/gramatika/verba/verba-dan-frasa-verbal-sebagai-keterangan.md`
- `frontend/public/gramatika/verba/verba-yang-bersifat-atributif.md`
- `frontend/public/gramatika/verba/verba-yang-bersifat-apositif.md`
- `frontend/public/gramatika/verba/bentuk-se-pembentuk-klausa-subordinatif-adverbial.md`
- `frontend/public/gramatika/verba/bentuk-se-berciri-nominal.md`
- `frontend/public/gramatika/verba/pangkal-verba-sufiks-kan.md`
- `frontend/public/gramatika/verba/pangkal-adjektiva-sufiks-kan.md`
- `frontend/public/gramatika/verba/pangkal-nomina-sufiks-kan.md`
- `frontend/public/gramatika/verba/pengafiksan-verba-ber-dengan-pangkal-verba.md`
- `frontend/public/gramatika/verba/pengafiksan-verba-ber-dengan-pangkal-adjektiva.md`
- `frontend/public/gramatika/verba/pengafiksan-verba-ber-dengan-pangkal-nomina.md`
- `frontend/public/gramatika/verba/pengafiksan-verba-ber-dengan-pangkal-numeralia.md`
- `frontend/public/gramatika/verba/pengafiksan-verba-ber-dengan-pangkal-berbagai-frasa.md`
- `frontend/public/gramatika/verba/pangkal-verba-prefiks-meng.md`
- `frontend/public/gramatika/verba/pangkal-adjektiva-prefiks-meng.md`
- `frontend/public/gramatika/verba/pangkal-nomina-prefiks-meng.md`
- `frontend/public/gramatika/verba/nomina-berfitur-suara-atau-bunyi.md`
- `frontend/public/gramatika/verba/nomina-berfitur-tempatan.md`
- `frontend/public/gramatika/verba/nomina-berfitur-bangun-atau-wujud.md`
- `frontend/public/gramatika/verba/nomina-berfitur-barang-konsumsi.md`
- `frontend/public/gramatika/verba/nomina-berfitur-hasil-bumi.md`
- `frontend/public/gramatika/verba/pangkal-numeralia-prefiks-meng.md`

Halaman induk Bab V yang diubah menjadi daftar subhalaman hierarkis:

- `frontend/public/gramatika/verba/verba-dasar.md`
- `frontend/public/gramatika/verba/verba-turunan.md`
- `frontend/public/gramatika/verba/jenis-frasa-verbal.md`
- `frontend/public/gramatika/verba/fungsi-verba-dan-frasa-verbal.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-se.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-sufiks-kan.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-ber.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-meng.md`

Implikasi:

- strategi mikro-batch terbukti efektif untuk subfolder padat seperti Verba dan layak dipakai lagi pada bab lain yang berisiko memicu batas memori
- batch berikutnya dapat lanjut ke bab berikutnya di luar Verba

### Batch 6: Bab VI Adjektiva

Status: selesai dipecah dan tervalidasi dengan strategi mikro-batch

Hasil verifikasi:

- subfolder `frontend/public/gramatika/adjektiva/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `adjektiva.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- semua halaman induk konten Adjektiva yang sebelumnya mengandung heading internal kini dirapikan agar hanya menampilkan anak langsung
- `adjektiva-majemuk.md` dan `adjektiva-dan-kelas-kata-lain.md` diperluas menjadi parent bertingkat karena masing-masing masih memiliki subcabang di bawah salah satu anak langsungnya
- struktur Bab VI di `frontend/src/constants/gramatikaData.js` sudah diperluas untuk area `Perilaku Sintaksis Adjektiva`, `Pertarafan Adjektiva`, `Bentuk Adjektiva`, `Frasa Adjektival`, dan `Adjektiva dan Kelas Kata Lain` agar breadcrumb dan sidebar mengikuti hierarki baru
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk area terkait setelah batch final

File baru yang ditambahkan pada Bab VI:

- `frontend/public/gramatika/adjektiva/fungsi-atributif.md`
- `frontend/public/gramatika/adjektiva/fungsi-predikatif.md`
- `frontend/public/gramatika/adjektiva/fungsi-adverbial-atau-keterangan.md`
- `frontend/public/gramatika/adjektiva/tingkat-ekuatif.md`
- `frontend/public/gramatika/adjektiva/tingkat-komparatif.md`
- `frontend/public/gramatika/adjektiva/tingkat-superlatif.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival-dengan-pemarkah-negasi.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival-dengan-pemarkah-keaspekan.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival-dengan-pemarkah-modalitas.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival-dengan-pemarkah-kualitas.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival-dengan-pemarkah-pembandingan.md`
- `frontend/public/gramatika/adjektiva/adjektiva-berprefiks.md`
- `frontend/public/gramatika/adjektiva/adjektiva-berinfiks.md`
- `frontend/public/gramatika/adjektiva/adjektiva-bersufiks.md`
- `frontend/public/gramatika/adjektiva/adjektiva-berkonfiks.md`
- `frontend/public/gramatika/adjektiva/tingkat-positif.md`
- `frontend/public/gramatika/adjektiva/tingkat-intensif.md`
- `frontend/public/gramatika/adjektiva/tingkat-elatif.md`
- `frontend/public/gramatika/adjektiva/tingkat-eksesif.md`
- `frontend/public/gramatika/adjektiva/tingkat-augmentatif.md`
- `frontend/public/gramatika/adjektiva/tingkat-atenuatif.md`
- `frontend/public/gramatika/adjektiva/adjektiva-deverbal.md`
- `frontend/public/gramatika/adjektiva/adjektiva-denominal.md`
- `frontend/public/gramatika/adjektiva/adjektiva-bentuk-per-atau-peng.md`
- `frontend/public/gramatika/adjektiva/adjektiva-bentuk-ke-an-dengan-reduplikasi.md`
- `frontend/public/gramatika/adjektiva/gabungan-morfem-terikat-dengan-morfem-bebas.md`
- `frontend/public/gramatika/adjektiva/gabungan-morfem-bebas-dengan-morfem-bebas.md`
- `frontend/public/gramatika/adjektiva/pola-adjektiva-adjektiva.md`
- `frontend/public/gramatika/adjektiva/pola-adjektiva-nomina.md`
- `frontend/public/gramatika/adjektiva/pola-adjektiva-verba.md`

Halaman induk Bab VI yang diubah menjadi daftar subhalaman hierarkis:

- `frontend/public/gramatika/adjektiva/perilaku-sintaksis-adjektiva.md`
- `frontend/public/gramatika/adjektiva/tingkat-pembandingan.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival.md`
- `frontend/public/gramatika/adjektiva/adjektiva-berimbuhan.md`
- `frontend/public/gramatika/adjektiva/tingkat-kualitas.md`
- `frontend/public/gramatika/adjektiva/adjektiva-majemuk.md`
- `frontend/public/gramatika/adjektiva/adjektiva-dan-kelas-kata-lain.md`

Implikasi:

- strategi mikro-batch tetap efektif untuk bab yang memiliki kombinasi parent sederhana dan parent bertingkat
- batch berikutnya dapat lanjut ke bab berikutnya di luar Adjektiva

### Batch 7: Bab VII Adverbia

Status: selesai dipecah dan tervalidasi

Hasil verifikasi:

- subfolder `frontend/public/gramatika/adverbia/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `adverbia.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- semua halaman induk konten Adverbia yang sebelumnya mengandung heading internal kini dirapikan agar hanya menampilkan anak langsung
- struktur Bab VII di `frontend/src/constants/gramatikaData.js` sudah diperluas untuk area `Bentuk Adverbia` dan `Adverbia dan Kelas Kata Lain` agar breadcrumb dan sidebar mengikuti hierarki baru
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk area terkait setelah batch final

File baru yang ditambahkan pada Bab VII:

- `frontend/public/gramatika/adverbia/adverbia-berupa-kata-dasar.md`
- `frontend/public/gramatika/adverbia/adverbia-berupa-kata-berafiks.md`
- `frontend/public/gramatika/adverbia/adverbia-berupa-kata-ulang.md`
- `frontend/public/gramatika/adverbia/adverbia-gabungan-yang-berdampingan.md`
- `frontend/public/gramatika/adverbia/adverbia-gabungan-yang-tidak-berdampingan.md`
- `frontend/public/gramatika/adverbia/adverbia-deverbal.md`
- `frontend/public/gramatika/adverbia/adverbia-deadjektival.md`
- `frontend/public/gramatika/adverbia/adverbia-denominal.md`
- `frontend/public/gramatika/adverbia/adverbia-denumeral.md`

Halaman induk Bab VII yang diubah menjadi daftar subhalaman hierarkis:

- `frontend/public/gramatika/adverbia/adverbia-tunggal.md`
- `frontend/public/gramatika/adverbia/adverbia-gabungan.md`
- `frontend/public/gramatika/adverbia/adverbia-dan-kelas-kata-lain.md`

Implikasi:

- bab dengan jumlah heading kecil bisa diselesaikan aman dalam satu batch tanpa perlu mikro-batch tambahan
- batch berikutnya dapat lanjut ke bab berikutnya di luar Adverbia

### Batch 8: Bab VIII Pronomina

Status: selesai dipecah dan tervalidasi

Hasil verifikasi:

- subfolder `frontend/public/gramatika/pronomina/` sekarang tidak memiliki heading internal `##`, `###`, dan seterusnya
- halaman bab `pronomina.md` sudah disinkronkan ulang dari `gramatikaData.js` melalui `sync-gramatika-toc.mjs` dengan struktur daftar isi rekursif penuh
- halaman induk `pronomina-persona.md` dan `pronomina-penunjuk.md` kini hanya menampilkan anak langsung
- halaman `jenis-pronomina.md` ikut diselaraskan dengan hierarki baru sehingga daftar anak langsungnya lengkap
- struktur Bab VIII di `frontend/src/constants/gramatikaData.js` sudah diperluas untuk `Pronomina Persona`, simpul mandiri `Nomina Penyapa dan Pengacu sebagai Pengganti Pronomina Persona`, serta `Pronomina Penunjuk`
- validasi frontend lulus melalui `npm run lint` dan `vitest` untuk area terkait setelah batch final

File baru yang ditambahkan pada Bab VIII:

- `frontend/public/gramatika/pronomina/pronomina-persona-pertama.md`
- `frontend/public/gramatika/pronomina/pronomina-persona-kedua.md`
- `frontend/public/gramatika/pronomina/pronomina-persona-ketiga.md`
- `frontend/public/gramatika/pronomina/nomina-penyapa-dan-pengacu-sebagai-pengganti-pronomina-persona.md`
- `frontend/public/gramatika/pronomina/pronomina-penunjuk-umum.md`
- `frontend/public/gramatika/pronomina/pronomina-penunjuk-tempat.md`
- `frontend/public/gramatika/pronomina/pronomina-penunjuk-ihwal.md`

Halaman Bab VIII yang diubah:

- `frontend/public/gramatika/pronomina/jenis-pronomina.md`
- `frontend/public/gramatika/pronomina/pronomina-persona.md`
- `frontend/public/gramatika/pronomina/pronomina-penunjuk.md`

Implikasi:

- bagian yang secara penomoran sejajar tetapi sebelumnya menumpang di file lain perlu dipromosikan menjadi simpul sendiri di `gramatikaData.js` agar navigasi tetap semantis
- batch berikutnya dapat lanjut ke bab berikutnya di luar Pronomina

## Prioritas Pemecahan

File dengan kepadatan heading paling tinggi sebaiknya diproses lebih dulu karena memberi pengurangan kompleksitas paling besar per file.

1. `frontend/public/gramatika/kalimat/peran.md` — 14 heading
2. `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-meng.md` — 9 heading
3. `frontend/public/gramatika/kalimat/kalimat-imperatif.md` — 8 heading
4. `frontend/public/gramatika/kalimat/kalimat-dan-kemasan-informasi.md` — 7 heading
5. `frontend/public/gramatika/adjektiva/tingkat-kualitas.md` — 6 heading
6. `frontend/public/gramatika/adjektiva/adjektiva-majemuk.md` — 5 heading
7. `frontend/public/gramatika/verba/fungsi-verba-dan-frasa-verbal.md` — 5 heading

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
- pilih nama yang benar-benar mencerminkan isi file hasil pecahan; untuk implementasi Bab IV digunakan `numeralia-tentu-dan-taktentu.md`

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
2. Jika slug terlalu generik atau pendek, pertimbangkan dulu nama semantis yang paling akurat terhadap isi file hasil pecahan.
3. Jika nama semantis yang akurat masih ambigu, baru prefiks dengan slug file induk atau parent terdekat dari `gramatikaData.js`.
4. Jika heading memakai angka urut, buang angka dari slug final.
5. Jika heading memuat simbol fonetik, ganti dengan label semantis yang stabil, bukan karakter IPA mentah.

Contoh:

- `Numeralia` di bawah `penentu.md` -> `numeralia-tentu-dan-taktentu`
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