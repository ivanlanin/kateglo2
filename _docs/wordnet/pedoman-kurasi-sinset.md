# Pedoman Kurasi Sinset WordNet

> Panduan untuk tim redaksi mengisi dan memverifikasi data sinset di halaman Redaksi Kateglo.

## Konsep Dasar

### Apa itu Sinset?
**Sinset** (synonym set) adalah kelompok kata yang memiliki makna yang sama. Contoh:
- Sinset `00947128-v` berisi kata: *membeli, memborong, menebus*
- Definisi EN: "obtain by purchase; acquire by means of a financial transaction"
- Semua kata dalam sinset ini bermakna "mendapatkan sesuatu lewat pembelian"

### Struktur Data
Setiap sinset memiliki:
- **ID** — format WN30 (misal `00947128-v`), huruf terakhir = kelas kata (n/v/a/r)
- **Kelas Kata** — nomina (n), verba (v), adjektiva (a), adverbia (r)
- **Definisi EN** — definisi bahasa Inggris dari WordNet Princeton (rujukan)
- **Lema EN** — kata-kata Inggris dalam sinset (rujukan)
- **Lema ID** — kata-kata Indonesia (dari wordnetid, dicocokkan dengan entri Kateglo)
- **Definisi ID** — definisi bahasa Indonesia (yang perlu ditulis/disunting)
- **Status** — draf → tinjau → terverifikasi
- **Relasi** — hubungan antar-sinset (hipernim, hiponim, antonim, dll.)

### Status Kurasi
| Status | Arti | Kapan |
|--------|------|-------|
| **draf** | Belum ditinjau | Data awal impor |
| **tinjau** | Sudah ada definisi ID, perlu verifikasi | Sudah punya definisi dari wordnetid lama |
| **terverifikasi** | Definisi dan pemetaan sudah benar | Setelah dikurasi manual |

## Cara Menggunakan Halaman Redaksi

### 1. Buka Halaman Sinset
Dari dasbor redaksi, klik **Sinset** di kelompok WordNet, atau buka `/redaksi/sinset`.

### 2. Statistik Dashboard
Di bagian atas terlihat ringkasan:
- **Total Sinset** — semua sinset (termasuk yang belum ada kata Indonesia)
- **Draf / Tinjau / Terverifikasi** — progres kurasi
- **Lema Indonesia** — total kata Indonesia di semua sinset
- **Lema Terpetakan** — yang sudah dihubungkan ke makna Kateglo
- **Lema Terverifikasi** — yang sudah dikonfirmasi benar

### 3. Filter dan Cari
- **Pencarian** — cari berdasarkan ID sinset, lema, atau definisi
- **Status** — filter draf/tinjau/terverifikasi
- **Kelas Kata** — filter nomina/verba/adjektiva/adverbia
- **Pemetaan** — "Ada pemetaan" (sudah ada lema → makna) atau "Belum dipetakan"
- **Hierarki** — "Akar" (sinset tanpa hipernim, paling umum) atau "Nonakar" (punya induk yang lebih umum)

### 4. Menyunting Sinset
Klik baris sinset → panel detail terbuka di kanan.

**Yang perlu dilakukan:**
1. **Baca definisi EN** — pahami makna sinset dari definisi Inggris
2. **Tulis definisi ID** — terjemahkan/adaptasi ke bahasa Indonesia
3. **Set status** — ubah ke "tinjau" setelah menulis definisi, "terverifikasi" setelah yakin benar
4. **Simpan** — klik tombol Simpan

### 5. Memetakan Lema ke Makna Kateglo
Setiap lema (kata Indonesia) dalam sinset perlu dihubungkan ke **makna** di Kateglo.

1. Di bagian **Lema Indonesia**, klik **"pilih makna"** pada lema yang ingin dipetakan
2. Muncul daftar **kandidat makna** yang cocok kelas katanya
3. Bandingkan definisi sinset EN dengan makna di Kateglo
4. Klik **"Pilih"** pada makna yang paling cocok
5. Jika tidak ada yang cocok, bisa pilih dari "Semua makna entri" (tanpa filter kelas kata)
6. Jika memang tidak ada makna yang sesuai → biarkan, nanti bisa ditambah di halaman Kamus

### 6. Memahami Relasi
Di bagian bawah panel ada daftar relasi:
- **Keluar** — relasi dari sinset ini ke sinset lain (misal: hiponim, meronim)
- **Masuk** — relasi dari sinset lain ke sinset ini (misal: hipernim, holonim)

Relasi penting:
| Relasi | Arti | Contoh |
|--------|------|--------|
| Hipernim | Kata yang lebih umum | hewan → kucing |
| Hiponim | Kata yang lebih spesifik | kucing → hewan |
| Antonim | Lawan kata | panas ↔ dingin |
| Meronim | Bagian dari | roda → mobil |
| Holonim | Keseluruhan | mobil → roda |
| Mirip | Makna mirip | cantik ~ indah |

---

## Strategi Pengisian Terstruktur

### Prinsip: Top-Down (dari akar ke daun)

WordNet memiliki struktur hierarki. Setiap kelas kata punya **akar** (root synset) yang paling umum. Strategi terbaik adalah **mulai dari atas** karena:
1. Sinset akar paling sedikit dan paling jelas maknanya
2. Definisi sinset anak bisa mengacu pada definisi induk
3. Konsistensi terminologi terjaga dari atas ke bawah

### Urutan Kerja yang Disarankan

#### Fase 1: Sinset Akar (Entity, Act, State, ...)
Gunakan filter **Hierarki = Akar** untuk melihat semua sinset tanpa hipernim.

Verifikasi definisi yang sudah ada, perbaiki jika perlu, lalu set status = terverifikasi.

**Jumlah akar per kelas kata:**
| Kelas Kata | Jumlah Akar | Catatan |
|------------|-------------|---------|
| Nomina (n) | ~25 | Pohon paling rapi, sedikit akar |
| Verba (v) | ~4.214 | Hierarki datar, banyak akar |
| Adjektiva (a) | ~620 | Cukup banyak akar |
| Adverbia (r) | ~3.154 | Mayoritas tanpa hipernim |

**Root nomina utama (mulai dari sini):**
- `00001740-n` — **entity** — akar semua nomina
- `00001930-n` — **physical entity** — entitas fisik
- `00023100-n` — **abstraction** — entitas abstrak
- `00004258-n` — **thing** — benda

**Cara kerja:** Filter Hierarki = Akar + Kelas = Nomina → mulai dari sini, lalu turun ke hiponim melalui relasi di panel detail.

#### Fase 2: Sinset Level 1 (Hiponim langsung dari akar)
Dari sinset akar yang sudah terverifikasi, lihat relasi **hiponim** (keluar) di panel detail.
Klik ID sinset anak untuk membukanya, verifikasi/tulis definisi, lalu lanjut ke anak berikutnya.

Contoh dari `entity`:
- `00001930-n` — physical entity (entitas fisik)
- `00023100-n` — abstract entity (entitas abstrak)
- `00004258-n` — thing (benda)

#### Fase 3: Sinset dengan Definisi ID (Status = tinjau)
Ini 2.733 sinset yang sudah punya definisi dari proyek wordnetid lama.
- Filter **Status = tinjau**
- Periksa definisi, perbaiki yang salah/Melayu
- Petakan lema ke makna Kateglo
- Set status = terverifikasi

#### Fase 4: Sinset dengan Lema Terpetakan
- Filter **Pemetaan = Ada pemetaan**
- Sinset ini sudah punya lema yang otomatis terpetakan (3.832)
- Verifikasi apakah pemetaan otomatis benar
- Tulis definisi ID jika belum ada

#### Fase 5: Sinset Sisa (Status = draf, ada lema)
- Filter **Status = draf**, **Pemetaan = Belum dipetakan**
- Kerjakan per kelas kata, mulai dari:
  1. **Nomina** — paling banyak, tapi juga paling konkret (mudah didefinisikan)
  2. **Verba** — lebih menantang, perlu perhatian pada valensi
  3. **Adjektiva** — sering subjektif, perlu konsistensi
  4. **Adverbia** — paling sedikit

### Tips Menulis Definisi Indonesia
1. **Gunakan kalimat lengkap** — "sesuatu yang …", "tindakan …", "sifat …"
2. **Jangan salin terjemahan mentah** — adaptasi ke gaya bahasa Indonesia baku
3. **Cek KBBI** jika ragu tentang makna kata Indonesia
4. **Konsisten dengan Kateglo** — definisi sinset harus selaras dengan makna di Kateglo
5. **Rujuk definisi EN** — selalu bandingkan dengan definisi Inggris asli
6. **Jangan terlalu literal** — terjemahkan makna, bukan kata per kata

### Target Progres
Mulai dari yang sudah ada (2.733 tinjau + 3.832 otomatis terpetakan), lalu kembangkan ke ~30K sinset yang punya lema Indonesia. Target realistis:
- **Minggu 1–2**: Verifikasi 2.733 sinset tinjau
- **Minggu 3–4**: Verifikasi 3.832 pemetaan otomatis + tulis definisi
- **Bulan 2+**: Kerjakan sinset draf per kelas kata secara top-down

---

## Glosarium Istilah

| Istilah | Arti |
|---------|------|
| Sinset | Synonym set — kelompok kata bermakna sama |
| Lema | Kata/frasa dalam sinset |
| Hipernim | Kata yang lebih umum (superclass) |
| Hiponim | Kata yang lebih spesifik (subclass) |
| Meronim | Bagian dari sesuatu |
| Holonim | Keseluruhan yang mengandung bagian |
| ILI | Interlingual Index — penghubung antar versi WordNet |
| POS | Part of Speech — kelas kata |
| WN30 | WordNet 3.0 Princeton — kerangka dasar |
| OEWN | Open English WordNet — versi terbaru (2024) |
