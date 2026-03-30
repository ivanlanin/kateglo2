# Pertimbangan Lanjutan: Entitas Bernama, Slang, dan Varian

**Tanggal**: 2026-03-09
**Status**: Lampiran Cetak Biru
**Terkait**: `202603090933_cetak-biru-kamus-deskriptif.md`, `202603090941_strategi-ne-slang-varian.md`

Dokumen ini membahas hal-hal yang secara konsisten muncul dalam proyek serupa dan belum tercakup
di dokumen strategi sebelumnya.

---

## 1. Normalisasi Morfologis Sebelum Lookup (Stemming)

**Ini adalah gap paling kritis dalam pipeline scraper.**

Bahasa Indonesia bersifat aglutinatif — satu kata dasar menghasilkan puluhan bentuk turunan. Jika
scraper mengambil teks mentah, setiap bentuk berimbuhan akan dianggap token berbeda:

```
membatalkan   → kandidat baru?
dibatalkan    → kandidat baru?
pembatalan    → kandidat baru?
membatalkan   → (duplikasi dari atas)
ketidakbatalan → kandidat baru?
```

Semuanya berakar dari `batal`, yang sudah ada di kamus.

### Solusi: Stemming Sebelum Lookup

Lakukan stemming di scraper *sebelum* lookup ke `entri`. Simpan bentuk mentah di atestasi,
stemmed form untuk lookup:

```javascript
// Pseudocode alur
const bentukMentah = 'membatalkan';
const bentukDasar  = stem(bentukMentah);  // → 'batal'

// Lookup menggunakan bentuk dasar
const adaDiKamus = await cekEntri(bentukDasar);   // ditemukan → lewati
// Simpan bentuk mentah di atestasi untuk konteks
await simpanAtestasi({ kata: bentukDasar, kutipan: kalimat });
```

### Library Stemmer Bahasa Indonesia

| Library | Bahasa | Akurasi | Keterangan |
|---|---|---|---|
| `natural` (Stemmer Nazief-Adriani) | Node.js | ~85% | Built-in, mudah diintegrasikan |
| PySastrawi | Python | ~91% | Lebih akurat, tapi butuh Python sidecar |
| `indonesian-stemmer` (npm) | Node.js | ~80% | Ringan, akurasi lebih rendah |

**Rekomendasi**: mulai dengan `natural` (Nazief-Adriani) di Node.js. Cukup untuk menyaring
sebagian besar false candidate. Akurasi tidak perlu sempurna di tahap ini — redaktur tetap
yang memutuskan.

### Kasus Stemmer yang Harus Diwaspadai

Stemmer Bahasa Indonesia sering salah pada:

| Token | Hasil Stemmer | Harusnya | Masalah |
|---|---|---|---|
| `berlari` | `lari` | `lari` | Benar |
| `berlabuh` | `labuh` | `labuh` | Benar |
| `berlian` | `lian` | `berlian` | *Salah* — bukan ber- + lian |
| `pelatih` | `latih` | `latih` | Benar |
| `pelabuhan` | `labuh` | `labuh` | Benar |
| `pelajaran` | `ajar` | `ajar` | Benar |
| `pelangi` | `langi` | `pelangi` | *Salah* — bukan pe- + langi |
| `nge-cancel` | ? | `cancel` | Perlu aturan afiks cakapan khusus |

Kata-kata yang gagal di-stem dan tidak ada di kamus perlu masuk kandidat dengan flag
`skor_konfiden` rendah.

### Afiks Cakapan Perlu Penanganan Khusus

Afiks seperti `nge-`, `-in`, `-an` (cakapan) tidak dikenal stemmer standar.
Perlu normalisasi pre-stemmer:

```javascript
function normalisasiAfiksCapakao(token) {
  return token
    .replace(/^nge-?/i, '')    // nge-cancel → cancel
    .replace(/^di-/i, '')      // di-ghosting → ghosting
    .replace(/-in$/i, '')      // cancel-in → cancel
    .replace(/-an$/i, '');     // cancel-an → cancel (hati-hati: bisa salah)
}
```

---

## 2. Frasa Leksikal (Multi-Word Expressions)

Kamus deskriptif bukan hanya soal kata tunggal. Banyak ekspresi yang maknanya tidak bisa
disimpulkan dari kata pembentuknya — dan ini justru penting untuk direkam.

### Dua Jenis Target

**A. Frasa idiomatik** — maknanya bukan penjumlahan kata:
- *tidak mau tahu* (cuek, tidak peduli) ≠ tidak + mau + tahu
- *jaga jarak* (menjaga jarak sosial; dipopulerkan masa pandemi)
- *cuci tangan* (literal + kiasan: lepas tanggung jawab)
- *ketok palu* (memutuskan resmi, dari sidang)

**B. Kolokasi leksikal** — dua kata yang nyaris selalu muncul bersama:
- *tersangka kasus* — pola berita kriminal
- *rapid test* — masih sering pakai bahasa Inggris
- *work from home / WFH* — unit frasa yang berperilaku sebagai kata

### Kapan Frasa Layak Jadi Satu Entri?

Kriteria dari leksikografi komparatif (Cambridge, OED):

| Kriteria | Keterangan |
|---|---|
| **Idiomatis** | Makna tidak bisa diturunkan dari bagian-bagiannya |
| **Leksikal stabil** | Urutan kata tidak bisa dibalik bebas |
| **Frekuensi kolokasi tinggi** | MI (Mutual Information) score tinggi di korpus |
| **Cenderung dipakai sebagai unit** | Penutur memperlakukannya sebagai satu leksem |

### Implikasi Pipeline

Scraper token-per-token tidak akan menangkap frasa ini. Dua opsi:

1. **N-gram extraction** (lebih kompleks): ekstrak bigram/trigram dan hitung MI score.
   Jika MI ≥ threshold, masuk sebagai kandidat frasa.
2. **Jalur kontribusi pengguna** (lebih simpel): andalkan pengguna yang melaporkan frasa
   yang tidak ditemukan. Ini justru lebih organik untuk frasa idiomatik.

Kolom `jenis = 'frasa'` di `kandidat_entri` sudah ada dalam skema.

---

## 3. Pergeseran Makna Temporal (Semantic Drift)

Satu hal yang tidak bisa dilakukan kamus statis tapi bisa dilakukan sistem berbasis atestasi
bertimestamp: **merekam kapan makna berubah**.

### Contoh Pergeseran Makna di Bahasa Indonesia

| Kata | Makna lama | Makna baru / tambahan | Pemicu pergeseran |
|---|---|---|---|
| `binal` | Lincah, tidak bisa diam | Konotasi seksual | Pergeseran semantik negatif |
| `jomlo` | Anak yatim (Sunda) | Belum punya pasangan | Adopsi slang nasional |
| `galau` | Kacau, ricuh (formal) | Sedih, bimbang hati | Media sosial ~2010 |
| `viral` | Menyebar seperti virus (medis) | Menyebar cepat di media sosial | Domain extension |
| `apresiasi` | Penilaian, penghargaan | Sering dipakai eufemisme untuk kritik | Penggunaan ironis |
| `gawai` | Diusulkan untuk "gadget" | Jarang dipakai, kalah lawan "gadget" | Resistensi pengguna |

### Sistem Pelacakan Pergeseran

Timestamp atestasi yang sudah ada di skema (`tanggal_terbit` di `atestasi`) sudah cukup
sebagai fondasi. Yang perlu ditambahkan adalah cara memvisualisasikan:

```
frekuensi
    │         [makna A]
    │   ████████████████▓▓▒░
    │                       ░▒▓██████ [makna B]
    └────────────────────────────────→ waktu
        2015  2017  2019  2021  2023
```

Untuk melacak ini, atestasi perlu diklasifikasikan per makna (`makna_id` di atestasi),
bukan hanya per kandidat. Ini memerlukan perpanjangan skema atestasi:

```sql
ALTER TABLE atestasi ADD COLUMN makna_id integer REFERENCES makna(id);
-- Diisi saat kandidat sudah disetujui dan makna sudah dibuat
-- Untuk kandidat yang belum punya makna: NULL
```

### Indikator Otomatis Pergeseran Makna

Sinyal yang bisa dipantau dari frekuensi korpus:
- Kata lama yang tiba-tiba naik frekuensi → kemungkinan makna baru
- Kolokasi yang berubah (kata X yang biasanya berdampingan dengan Y, kini dengan Z)
- Distribusi rubrik berita yang bergeser (kata yang tadinya di rubrik sains, kini di rubrik gaya hidup)

Fitur ini membutuhkan `korpus_frekuensi` (Fase 3 roadmap).

---

## 4. Granularitas Label: Register, Dialek, Sosiolek

Dokumen strategi sebelumnya membahas slang dan varian, tapi ketiga dimensi sosiolinguistik ini
berbeda dan perlu dibedakan sejak awal — karena ketiganya dibutuhkan untuk pelabelan yang akurat.

### Tiga Dimensi

| Dimensi | Definisi | Contoh | Kolom di DB |
|---|---|---|---|
| **Register** | Situasi penggunaan (formal↔informal) | arkais, cakapan, teknis, jurnalistik | `ragam` (sudah ada) |
| **Dialek** | Variasi geografis/regional | Betawi, Melayu Medan, Surabayaan | Belum ada |
| **Sosiolek** | Variasi komunitas/kelompok | slang gamer, slang LGBTQ+, jargon akademik | Belum ada |

### Mengapa Dibedakan

- `kagak` → bukan register informal biasa, tapi **dialek Betawi**. Orang Jakarta Selatan tidak
  memakai `kagak` meski informal.
- `sultan` (orang kaya) → **sosiolek** yang berasal dari komunitas game online, kini meluas
- `wibu` (penggemar budaya Jepang) → **sosiolek** komunitas spesifik
- `gue/lo` → bisa dialek Jakarta ATAU register cakapan nasional — konteksnya berbeda

### Ekstensi Skema yang Diperlukan

```sql
-- Opsi 1: Kolom terpisah di makna (lebih bersih)
ALTER TABLE makna
  ADD COLUMN dialek   text,   -- 'betawi', 'medan', 'surabaya', 'minang', dll
  ADD COLUMN sosiolek text;   -- 'gamer', 'k-pop', 'akademik', 'hukum', dll

-- Opsi 2: Gunakan tabel label yang sudah ada
-- Tambah kategori baru: 'dialek' dan 'sosiolek' ke tabel label
INSERT INTO label (kategori, kode, nama) VALUES
  ('dialek', 'betawi',   'Betawi'),
  ('dialek', 'medan',    'Melayu Medan'),
  ('sosiolek', 'gamer',  'Komunitas gamer'),
  ('sosiolek', 'kpop',   'Komunitas K-Pop');
```

**Rekomendasi**: Opsi 2 (gunakan tabel `label` yang sudah ada) lebih konsisten dengan arsitektur
yang ada. Tidak perlu kolom baru di `makna`.

---

## 5. Privasi dan Etika Atestasi

Ini sering diabaikan di tahap desain tapi menjadi masalah serius saat produksi.

### Sumber Masalah

**Atestasi dari media sosial:**
- Kutipan tweet/posting yang kemudian dihapus penulis — apakah tetap valid sebagai atestasi?
- Kutipan dari akun privat yang terindeks sementara — tidak boleh disimpan
- Kutipan yang mengidentifikasi individu dalam konteks sensitif (kesehatan, hukum)

**Kontribusi pengguna:**
- Pengguna menyertakan nama diri orang lain di contoh kalimat
- Contoh kalimat mengandung informasi pribadi secara tidak sengaja

### UU PDP Indonesia (Berlaku 2024)

UU Pelindungan Data Pribadi No. 27/2022 mengatur:
- Data pribadi tidak boleh diproses tanpa dasar hukum
- Subjek data berhak minta penghapusan (right to erasure)
- Termasuk kutipan yang bisa mengidentifikasi orang

### Kebijakan yang Harus Ditetapkan

| Situasi | Kebijakan yang diusulkan |
|---|---|
| Atestasi dari berita publik | Aman: konten jurnalistik, URL tersimpan untuk atribusi |
| Atestasi dari media sosial | Simpan kutipan, anonimkan username; tandai platform |
| Konten yang dihapus sumber | Pertahankan kutipan (sudah publik saat diambil), tapi hapus URL |
| Permintaan takedown dari individu | Hapus atestasi spesifik, tapi bukan kandidat katanya |
| Kontribusi pengguna | Review sebelum tersimpan jika mengandung nama diri |

### Implikasi Teknis

```sql
-- Kolom tambahan di atestasi untuk status privasi
ALTER TABLE atestasi
  ADD COLUMN penulis_anonim boolean DEFAULT false,  -- username sudah dianonimkan
  ADD COLUMN konten_dihapus boolean DEFAULT false;  -- sumber asli sudah dihapus
```

Saat `konten_dihapus = true`: tampilkan kutipan tapi tanpa URL. Cukup nama platform dan tanggal.

---

## 6. Kata dari Media Non-Teks

**Gap inheren scraper berbasis teks**: banyak slang viral berasal dari format yang tidak
bisa di-scrape secara teks.

### Sumber yang Tidak Terjangkau Scraper

| Sumber | Contoh | Keterangan |
|---|---|---|
| Meme gambar | Teks dalam gambar meme | OCR bisa membantu, tapi noise tinggi |
| Video TikTok/Reels | Kata-kata yang viral dari audio/caption | Caption TikTok kadang tersedia via API |
| Audio/podcast | Kata baru yang pertama muncul lisan | Butuh speech-to-text |
| Caption YouTube | Lebih mudah: tersedia via YouTube API | Kualitas auto-caption masih kurang |
| Grup WhatsApp | Tertutup, tidak bisa di-scrape | — |

### Implikasi Desain

Jalur **kontribusi pengguna** menjadi lebih penting untuk menangkap kata-kata ini.
Orang yang terpapar konten non-teks adalah satu-satunya yang bisa melaporkannya.

Tambahan yang berguna di form `/usul-kata`:
- Pilihan sumber: Media Sosial, Video, Percakapan, Berita, Lainnya
- Jika "Video": minta judul/URL video sebagai referensi (tidak wajib)

---

## 7. Homonim Baru dari Slang

Slang bisa menciptakan homonim baru — kata yang sama bentuknya dengan kata lama tapi maknanya
berbeda sama sekali. Sistem homonim yang sudah ada di Kateglo (`homonim` integer di tabel `entri`)
harus mengantisipasi ini.

### Contoh

| Kata | Makna lama | Makna baru (slang) |
|---|---|---|
| `sultan` | Gelar penguasa kerajaan Muslim | Orang kaya (slang gamer) |
| `toxic` | Beracun (kimia) | Perilaku destruktif dalam hubungan |
| `cringe` | — (baru masuk) | Memalukan, canggung (serapan langsung) |
| `gas` | Gas (benda) + "ayo mulai" (slang) | Ekspresi semangat |
| `bet` | Taruhan (Inggris) | Kata persetujuan ("oke", "setuju") |

### Implikasi Migrasi

Saat kandidat slang disetujui dan ada entri dengan kata yang sama:
1. Jangan buat entri baru yang menimpa
2. Tambahkan `makna` baru ke entri yang sudah ada DENGAN nomor polisem baru
3. Jika maknanya benar-benar lepas dari makna asli → buat entri homonim baru
   dengan `homonim = 2` (atau angka berikutnya)

Proses migrasi perlu logic tambahan: cek apakah `entri` dengan `indeks` sama sudah ada,
dan jika ada, tawarkan pilihan ke redaktur: tambah makna baru atau buat entri homonim.

---

## 8. Ringkasan: Prioritas Penanganan

Tidak semua hal di dokumen ini perlu diimplementasi di Fase 1. Tabel prioritas:

| Topik | Prioritas | Fase | Alasan |
|---|---|---|---|
| Stemming sebelum lookup | **Kritis** | Fase 2 (scraper) | Tanpa ini, kandidat table penuh duplikasi |
| Peta varian (sebelumnya) | **Kritis** | Fase 2 | Sama: dedup mendasar |
| Privasi atestasi | **Tinggi** | Fase 1 | Risiko hukum sejak awal |
| Homonim baru saat migrasi | **Tinggi** | Fase 1 | Bisa merusak data yang ada |
| Label dialek & sosiolek | **Menengah** | Fase 2 | Memperkaya tapi tidak blokir Fase 1 |
| Frasa leksikal | **Menengah** | Fase 3 | Butuh N-gram atau antrian manual |
| Pergeseran makna temporal | **Rendah** | Fase 3–4 | Butuh korpus yang sudah cukup besar |
| Media non-teks | **Rendah** | Fase 4 | Ditangani via kontribusi pengguna dulu |
