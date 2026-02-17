# Pemetaan KBBI dan Kateglo

Tanggal: 2026-02-17

## Ringkasan

Dokumen ini menjadi acuan pemetaan data entri antara halaman KBBI dan skema Kateglo.
Tujuan utamanya adalah memperkaya data Kateglo secara konsisten, terukur, dan mudah diaudit.

Secara operasional, pengayaan mencakup tiga tindakan utama:

- **melengkapi data entri yang belum ada**
- **mengoreksi data entri yang berbeda**
- **menambahkan subentri yang belum ada**

Tiga tindakan ini berlaku untuk entri induk maupun turunan (kata turunan, gabungan kata, peribahasa, idiom).

## Tujuan Operasional Tim

Gunakan pernyataan standar berikut agar dipahami konsisten oleh seluruh tim:

> Untuk setiap indeks yang dipetakan, sistem membandingkan data sumber dan data Kateglo, lalu menghasilkan aksi per item:
> `LENGKAPI` bila item belum ada,
> `KOREKSI` bila item ada tetapi nilainya berbeda,
> `TAMBAH_SUBENTRI` bila subentri pada sumber belum ada di relasi anak Kateglo.

### Definisi Aksi

| Aksi | Kondisi | Dampak |
|---|---|---|
| `LENGKAPI` | Entitas belum ada di Kateglo (tidak ditemukan padanan kunci) | Buat baris baru entri/makna/contoh |
| `KOREKSI` | Entitas ada, tetapi satu atau lebih field berbeda | Perbarui field yang berbeda |
| `TAMBAH_SUBENTRI` | Subentri sumber tidak ditemukan pada anak parent (`entri.induk = parent_id`) dengan `jenis` yang sesuai | Tambahkan baris anak baru, set relasi `induk`, dan set status awal `aktif = 0` (false) |

### Kunci Pencocokan Minimum

- **Entri induk**: `indeks + homonim (+ jenis bila perlu)`
- **Makna**: `entri_id + polisem/urutan`
- **Contoh**: `makna_id + urutan` (atau teks contoh ter-normalisasi)
- **Subentri**: `parent_id + jenis + indeks_subentri_ternormalisasi`

### Status Hasil Pemetaan

| Status | Arti |
|---|---|
| `ADA_SAMA` | Item ada dan nilainya sama |
| `PERLU_KOREKSI` | Item ada tetapi ada selisih field |
| `BELUM_ADA` | Item tidak ditemukan dan perlu ditambahkan |
| `PERLU_REVIEW` | Ada kandidat, tetapi ambigu (mis. parent/jenis tidak konsisten) |

### Bentuk Catatan yang Disarankan

Gunakan format record berikut pada hasil audit agar mudah diproses lanjutan:

| indeks | parent_id | jenis_item | kunci | status | aksi | field_berbeda | catatan |
|---|---:|---|---|---|---|---|---|
| seri | 34739 | subentri | `menyeri` | ADA_SAMA | - | - | cocok dengan relasi induk |
| seri | 34739 | subentri | `contoh-x` | BELUM_ADA | TAMBAH_SUBENTRI | - | belum ada di anak parent |
| per | 28608 | entri | `per(1)` | PERLU_KOREKSI | KOREKSI | `lafal` | format lafal belum seragam |

## Contoh Hasil Audit dan Tindak Lanjut

Contoh berikut menggambarkan bentuk keluaran audit untuk satu indeks, lalu aksi lanjutan yang dikerjakan tim.

### Contoh Audit (Indeks `seri`)

| parent_id | parent_entri | jenis | item_sumber | status | aksi | catatan |
|---:|---|---|---|---|---|---|
| 34737 | seri (1) | turunan | berseri | ADA_SAMA | - | sudah ada di anak parent |
| 34739 | seri (3) | turunan | menyeri | ADA_SAMA | - | cocok dengan petunjuk “cari: menyeri” |
| 34737 | seri (1) | gabungan | seri muka | ADA_SAMA | - | sudah terhubung ke parent |
| 34737 | seri (1) | gabungan | seri pamungkas | BELUM_ADA | TAMBAH_SUBENTRI | ada di sumber, belum ada di anak parent |
| 34737 | seri (1) | gabungan | seri pembuka | BELUM_ADA | TAMBAH_SUBENTRI | ada di sumber, belum ada di anak parent |
| 34737 | seri (1) | gabungan | seri tanah | BELUM_ADA | TAMBAH_SUBENTRI | ada di sumber, belum ada di anak parent |
| 34737 | seri (1) | gabungan | seri wajah | BELUM_ADA | TAMBAH_SUBENTRI | ada di sumber, belum ada di anak parent |
| 34743 | seri (2) | entri | lafal = `/sêri/` | PERLU_KOREKSI | KOREKSI | nilai saat ini masih `seri` |

Ringkasan hasil audit `seri` (berdasarkan salinan halaman KBBI):

- Kata Turunan: 5/5 sudah ada (`berseri`, `berseri-seri`, `menyerikan`, `perserian`, `menyeri`).
- Gabungan Kata: 5/9 sudah ada; 4 item belum ada (`seri pamungkas`, `seri pembuka`, `seri tanah`, `seri wajah`).
- Peribahasa/Idiom: tidak tercantum pada salinan halaman yang digunakan saat audit.

### Tindak Lanjut Tim

1. **Eksekusi aksi `TAMBAH_SUBENTRI`**
	- Tambahkan baris entri anak baru dengan `jenis` sesuai kelompok.
	- Set `induk` ke `parent_id` hasil audit.
	- Isi `indeks`, `entri`, dan field pendukung minimum (`aktif`, `urutan`).
	- Tetapkan status awal subentri baru: `aktif = 0` (false).

2. **Eksekusi aksi `KOREKSI`**
	- Perbarui hanya field yang berbeda (contoh: `lafal`, `pemenggalan`, `kelas_kata`, teks `makna`).
	- Jangan ubah field lain yang sudah sama.

3. **Verifikasi pasca-update**
	- Jalankan audit ulang pada indeks yang sama.
	- Pastikan item berstatus `BELUM_ADA`/`PERLU_KOREKSI` berubah menjadi `ADA_SAMA` atau `PERLU_REVIEW`.

4. **Catat perubahan**
	- Simpan ringkasan hasil eksekusi (jumlah tambah, jumlah koreksi, sisa review) pada catatan kerja tim.

### Contoh Audit (Indeks `gajah`)

Berdasarkan cek data Kateglo saat ini dan ringkasan halaman publik KBBI untuk `gajah`:

| parent_id | parent_entri | jenis | item_sumber | status | aksi | catatan |
|---:|---|---|---|---|---|---|
| 10918 | gajah (1) | entri | pemenggalan = `ga.jah` | ADA_SAMA | - | cocok |
| 10919 | gajah (2) | entri | homonim = `2` | ADA_SAMA | - | cocok |
| 10918 | gajah (1) | turunan | menggajah | ADA_SAMA | - | sudah ada sebagai anak parent |
| 10918 | gajah (1) | gabungan | gajah mina | ADA_SAMA | - | sudah ada sebagai anak parent |
| 10918 | gajah (1) | peribahasa | gajah mati karena gadingnya | ADA_SAMA | - | sudah ada sebagai anak parent |
| 10918 | gajah (1) | idiom | (daftar idiom sumber) | PERLU_REVIEW | - | daftar kelompok idiom tidak terlihat lengkap pada cuplikan halaman publik |

Jika nanti ditemukan item sumber `BELUM_ADA` pada audit `gajah`, gunakan aksi `TAMBAH_SUBENTRI` dan set default `aktif = 0` (false).

### Contoh Audit (Indeks `beri`)

Berdasarkan salinan halaman KBBI yang memuat `be.ri`, `be.ri /bêri/`, dan `be.ri3 /bêri/`:

| parent_id | parent_entri | jenis | item_sumber | status | aksi | catatan |
|---:|---|---|---|---|---|---|
| 4628 | beri | entri | pemenggalan = `be.ri` | ADA_SAMA | - | cocok |
| 4628 | beri | entri | lafal = `/bêri/` | PERLU_KOREKSI | KOREKSI | nilai saat ini `lafal` masih kosong |
| 4628 | beri | makna | `n Bot ... buah-buahan ...` | BELUM_ADA | LENGKAPI | belum ditemukan di makna aktif saat ini |
| 4628 | beri | makna | `v serahkan ...` | ADA_SAMA | - | sudah ada |
| 4628 | beri | makna | `n Ldy suara gemuruh ...` | BELUM_ADA | LENGKAPI | belum ditemukan di makna aktif saat ini |
| 4628 | beri | turunan | beri-memberi; berian; memberi; memberikan; pemberi; pemberian | ADA_SAMA | - | 6/6 turunan sudah ada |
| 4628 | beri | gabungan | beri arar | BELUM_ADA | TAMBAH_SUBENTRI | tambah sebagai `jenis = gabungan`, `aktif = 0` |
| 4628 | beri | gabungan | beri juniper | BELUM_ADA | TAMBAH_SUBENTRI | tambah sebagai `jenis = gabungan`, `aktif = 0` |
| 4628 | beri | peribahasa | kuman beri bertali | BELUM_ADA | TAMBAH_SUBENTRI | tambah sebagai `jenis = peribahasa`, `aktif = 0` |

Ringkasan hasil audit `beri`:

- Entri aktif yang ada saat ini: 1 (`beri`, `homonim = null`).
- Makna aktif yang terdeteksi saat ini: 1 (`v serahkan atau bagi sesuatu kepada orang lain`).
- Turunan: 6/6 sudah ada.
- Gabungan: 0/2 ada (2 belum ada).
- Peribahasa: 0/1 ada (1 belum ada).

## Ruang Lingkup

Pemetaan mencakup komponen berikut.

- identitas entri (`entri`, `indeks`, homonim, urutan)
- lafal
- kelas kata
- makna/polisemi
- status rujukan (mis. bentuk tidak baku)
- relasi turunan/subentri yang relevan

## Prinsip Pemetaan

1. **Satu halaman KBBI dapat menghasilkan banyak baris entri Kateglo** karena homonim dan jenis unsur (dasar/prefiks/turunan).
2. **Indeks sebagai kunci pengelompokan utama**, sedangkan `entri` menyimpan bentuk tampil (termasuk penanda homonim seperti `(1)`, `(2)`).
3. **Lafal diperlakukan sebagai data fonetis terstruktur**, bukan bagian dari teks makna.
4. **Makna dipisahkan per polisem** dan disimpan berurutan (`urutan` naik).
5. **Rujukan nonbaku/lihat** dipetakan ke `jenis_rujuk` dan `lema_rujuk` jika tersedia.
6. **Informasi “cari: …” atau keterkaitan turunan** dipetakan sebagai relasi entri (induk–anak), bukan dijadikan makna baru.

## Tabel Pemetaan Field

| Sumber KBBI | Bentuk di KBBI | Target Kateglo | Catatan |
|---|---|---|---|
| Lema | `per1`, `per2`, `per-1`, dst. | `entri.entri`, `entri.indeks`, `entri.homonim`, `entri.jenis`, `entri.urutan` | `indeks` dinormalisasi ke bentuk dasar tanpa nomor; homonim disimpan numerik |
| Lafal | `/pêr/` | `entri.lafal` | Disarankan format konsisten (mis. `pêr` atau `/pêr/`, pilih satu standar) |
| Kelas kata | `n`, `p`, `num`, dst. | `makna.kelas_kata` | Per makna (polisem), bukan per entri global |
| Makna bernomor | `1. ...`, `2. ...` | `makna.makna`, `makna.polisem`, `makna.urutan` | Urutan dipertahankan sesuai tampilan sumber |
| Bentuk tidak baku/rujuk | `bentuk tidak baku: ...` | `entri.jenis_rujuk`, `entri.lema_rujuk` | Isi panah/rujukan ke entri target |
| Tautan turunan/cari | `cari: mengeper` | relasi `entri.induk` / subentri | Ditangkap sebagai relasi struktur lema |

## Verifikasi Lokasi Semua Field

Catatan: di skema saat ini tidak ada tabel bernama `indeks`; yang ada adalah kolom `indeks` pada tabel `entri`.

### Tabel `entri`

| Field | Lokasi Sumber | Status Pemetaan |
|---|---|---|
| `id` | Internal database | Internal |
| `entri` | Judul lema pada blok entri KBBI | Langsung dari halaman |
| `jenis` | Diturunkan dari bentuk lema (mis. `per-` sebagai prefiks, bentuk lain sebagai dasar/turunan) | Turunan aturan |
| `induk` | Relasi lema/turunan (mis. entri “cari: ...”/turunan) | Turunan relasi |
| `pemenggalan` | Bagian pemenggalan (jika tersedia di sumber) | Opsional |
| `lafal` | Notasi lafal, mis. `/pêr/` | Langsung dari halaman |
| `varian` | Penanda varian, mis. `varian: pe-, pel-` | Langsung dari halaman |
| `jenis_rujuk` | Penanda rujukan, mis. panah/label rujuk | Langsung dari halaman |
| `lema_rujuk` | Target rujukan, mis. `bentuk tidak baku: pir2` | Langsung dari halaman |
| `aktif` | Status aktif data | Internal |
| `indeks` | Normalisasi dari teks lema (tanpa nomor homonim) | Turunan aturan |
| `homonim` | Angka pembeda pada lema, mis. `per1`, `per2` | Langsung dari halaman |
| `urutan` | Urutan kemunculan blok entri pada indeks yang sama | Turunan aturan |

### Tabel `makna`

| Field | Lokasi Sumber | Status Pemetaan |
|---|---|---|
| `id` | Internal database | Internal |
| `entri_id` | Relasi ke baris `entri` yang sedang dipetakan | Turunan relasi |
| `polisem` | Nomor makna (`1.`, `2.`, dst.) | Langsung dari halaman |
| `urutan` | Urutan makna dalam satu entri | Turunan aturan |
| `makna` | Teks definisi utama | Langsung dari halaman |
| `ragam` | Label ragam (jika muncul) | Opsional |
| `ragam_varian` | Label ragam varian (jika muncul) | Opsional |
| `kelas_kata` | Kode kelas kata, mis. `n`, `p`, `num` | Langsung dari halaman |
| `bahasa` | Label bahasa (jika muncul) | Opsional |
| `bidang` | Label bidang/ranah (jika muncul) | Opsional |
| `kiasan` | Penanda makna kias (`ki`) | Turunan aturan |
| `tipe_penyingkat` | Penanda jenis penyingkat (akronim/kependekan/singkatan) | Turunan aturan |
| `ilmiah` | Label nama ilmiah (jika muncul) | Opsional |
| `kimia` | Label istilah kimia (jika muncul) | Opsional |

### Tabel `contoh`

| Field | Lokasi Sumber | Status Pemetaan |
|---|---|---|
| `id` | Internal database | Internal |
| `makna_id` | Relasi ke baris `makna` terkait | Turunan relasi |
| `urutan` | Urutan contoh dalam satu makna | Turunan aturan |
| `contoh` | Kalimat contoh pada blok makna | Langsung dari halaman |
| `ragam` | Label ragam contoh (jika ada) | Opsional |
| `bahasa` | Label bahasa contoh (jika ada) | Opsional |
| `bidang` | Label bidang contoh (jika ada) | Opsional |
| `kiasan` | Penanda kiasan pada contoh (jika ada) | Turunan aturan |
| `makna_contoh` | Glosa/arti untuk contoh (jika tersedia) | Opsional |

## Aturan Normalisasi Minimum

- `indeks`: huruf kecil, trim spasi, tanpa penanda homonim `(n)`.
- `entri`: boleh menyimpan penanda homonim untuk membedakan bentuk tampil.
- `lafal`: jangan dicampur ke kolom makna; simpan terpisah.
- `kelas_kata`: gunakan kode baku yang sama lintas entri.
- `urutan`: wajib stabil untuk menjaga konsistensi tampilan detail kamus.

## Pemetaan Jenis Turunan KBBI ↔ Kateglo

Untuk komponen turunan, pemetaan mengikuti 4 kelompok pada halaman KBBI dan disimpan pada kolom `entri.jenis` di Kateglo.

| Kelompok di KBBI | Nilai `entri.jenis` di Kateglo | Keterangan |
|---|---|---|
| Kata Turunan | `turunan` | Bentuk berimbuhan atau turunan langsung dari entri induk |
| Gabungan Kata | `gabungan` | Frasa gabungan yang diturunkan dari entri induk |
| Peribahasa | `peribahasa` | Entri peribahasa yang terhubung ke induk |
| Idiom | `idiom` | Entri idiomatik yang terhubung ke induk |

Catatan relasi: setiap baris turunan wajib menunjuk ke parent melalui `entri.induk = entri.id (parent)`.

## Aturan Menandai Turunan yang Belum Ada

Turunan dinilai **belum ada** jika item pada kelompok turunan KBBI tidak ditemukan pada Kateglo dengan kombinasi relasi dan jenis yang sesuai.

Kriteria pencocokan minimum:

1. `induk` sama dengan `id` entri parent yang dipetakan.
2. `jenis` sama dengan hasil pemetaan kelompok KBBI (`turunan`/`gabungan`/`peribahasa`/`idiom`).
3. `indeks` sama setelah normalisasi ringan (trim, lower-case, spasi konsisten).

Status hasil pencocokan:

- **Ada**: ketiga kriteria terpenuhi.
- **Perlu review**: teks mirip tetapi berbeda pada salah satu unsur (mis. jenis atau parent).
- **Belum ada**: tidak ditemukan kandidat yang memenuhi.

Rekomendasi audit per parent:

- kumpulkan daftar turunan KBBI per kelompok
- bandingkan dengan daftar anak Kateglo berdasarkan `entri.induk = parent_id`
- keluarkan selisih per kelompok sebagai backlog pengayaan

## Contoh Pemetaan: Indeks `per`

### Hasil Korespondensi Utama

- `per (1)` → kelas kata `num` → makna `tiap-tiap`
- `per (2)` → kelas kata `p` → makna `demi (satu-satu)`
- `per (3)` → kelas kata `p` → makna `mulai; sejak`
- `per (4)` → kelas kata `p` → makna `bagi (dalam angka pecahan)`
- `per (5)` → kelas kata `p` → makna `dengan (memakai, menggunakan, dsb.)`
- `per- (6)` → jenis `prefiks` → 4 makna prefiks
- `per- (7)` → jenis `prefiks` → 7 makna prefiks

### Catatan Validasi

- Rujukan nonbaku terwakili: `pir (2)` mengarah ke `per (1)`.
- Keterkaitan turunan terwakili: `mengeper` berelasi sebagai turunan dari entri berindeks `per`.
- Pada kasus tertentu, satu entri dapat tidak memiliki makna langsung tetapi tetap valid jika relasi turunannya lengkap.

## Checklist Verifikasi Pemetaan

Gunakan checklist ini untuk setiap indeks yang dipetakan.

- semua homonim pada halaman sumber sudah tercatat
- `indeks` konsisten untuk seluruh homonim
- lafal terisi jika tersedia di sumber
- kelas kata dan makna sejajar per polisem
- rujukan nonbaku/lihat tersimpan ke kolom rujukan
- relasi turunan/subentri tidak hilang
- semua item pada 4 kelompok turunan (turunan, gabungan, peribahasa, idiom) sudah dicocokkan
- daftar turunan yang belum ada sudah ditandai per parent dan per jenis

## Penutup

Pemetaan ini difokuskan pada konsistensi struktur dan keterlacakan data agar proses pengayaan entri berjalan stabil di seluruh indeks.
