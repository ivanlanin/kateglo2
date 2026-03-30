# Asesmen Pemenggalan: Kata Gabungan

**Tanggal asesmen:** 2026-03-04
**Tabel:** `entri`
**Filter:** `jenis = 'gabungan'`
**Status:** Selesai — implementasi diterapkan 2026-03-04

## Ringkasan

| Metrik | Nilai |
|---|---|
| Total entri gabungan | 23.544 |
| Sudah ada pemenggalan | 8 |
| Belum ada pemenggalan | 23.536 (99,97%) |

## Struktur Data

### Format entri

Kata gabungan adalah frasa/kata majemuk bahasa Indonesia. Sebagian besar terdiri dari 2 kata:

| Jumlah kata | Entri | Persentase |
|---|---|---|
| 1 kata | 24 | 0,1% |
| 2 kata | 21.600 | 91,8% |
| 3 kata | 1.724 | 7,3% |
| 4 kata | 173 | 0,7% |
| 5+ kata | 23 | 0,1% |

### Kolom `induk`

Kolom `induk` merujuk ke ID entri kata kepala (kata pertama). Entri induk sudah memiliki pemenggalan karena berasal dari jenis `dasar`.

Contoh: `abad keemasan` → `induk = 10` → entri id 10 adalah `abad` dengan pemenggalan `a.bad`.

### Format pemenggalan yang diharapkan

Pemenggalan setiap kata dipisahkan spasi. Contoh dari 8 entri yang sudah ada:

| Entri | Pemenggalan |
|---|---|
| berlidah ular | ber.li.dah u.lar |
| langit-langit keras | la.ngit-la.ngit ke.ras |
| merenggang gawai | me.reng.gang ga.wai |
| aji sesirep | aji se.si.rep |

### 8 pemenggalan yang sudah ada — masalah data

Dari 8 entri yang sudah memiliki pemenggalan, **3 perlu dikoreksi**:

| id | entri | pemenggalan saat ini | seharusnya | masalah |
|---|---|---|---|---|
| (ada-ada saja) | ada-ada saja | `ada-ada sa.ja` | `a.da-a.da sa.ja` | Pemenggalan kata kepala tidak sesuai induk (`a.da`) |
| (aji sesirep) | aji sesirep | `aji se.si.rep` | `a.ji se.si.rep` | Pemenggalan kata kepala tidak sesuai induk (`a.ji`) |
| (berlidah dua) | berlidah dua | `ber.li.dah dua` | `ber.li.dah du.a` | `dua` seharusnya `du.a` (konsisten dengan induk) |

Yang sudah benar (5 entri): `berlidah lembut`, `berlidah panjang`, `berlidah ular`, `langit-langit keras`, `merenggang gawai`.

### Entri "1 kata" (24 entri) — masalah data

Ini bukan kata gabungan sebenarnya. Dikelompokkan berdasarkan jenis masalah:

**A. Pemenggalan tersimpan di kolom `entri` (data korup — titik bukan tanda hubung)**

| id | entri (salah) | seharusnya entri | seharusnya pemenggalan |
|---|---|---|---|
| 50226 | cekakak-ce.ki.kik | cekakak-cekikik | ce.ka.kak-ce.ki.kik |
| 55380 | geliat-ge.li.ut | geliat-geliut | ge.li.at-ge.li.ut |
| 81439 | selap-se.lip | selap-selip | se.lap-se.lip |

**B. Kata ditulis tanpa spasi (kesalahan pengetikan)**

| id | entri (salah) | seharusnya | induk |
|---|---|---|---|
| 45146 | bahanpengajaran | bahan pengajaran | bahan (2) |
| 62380 | kawalbatas | kawal batas | kawal |
| 63301 | kempaair | kempa air | kempa |

**C. Kata berulang bertanda hubung yang salah masuk jenis `gabungan`**

Kata-kata ini adalah reduplikasi (kata ulang berubah bunyi) — kemungkinan seharusnya jenis `dasar` atau `turunan`:

| id | entri | induk |
|---|---|---|
| 44268 | asal-usul | asal (1) |
| 50460 | cengkung-cengking | cengkung (2) |
| 50459 | cengkung-mengkung | cengkung (1) |
| 55688 | genjang-genjot | genjang |
| 63380 | kenapa-kenapa | kenapa |
| 76155 | piut-miut | piut |
| 81627 | selit-belit | selit |
| 81628 | selit-sepit | selit |
| 82148 | senget-menget | senget |
| 82235 | senguk-sengak | senguk |
| 82552 | serak-serik | serak (3) |
| 82553 | serak-seruk | serak (3) |
| 82635 | serba-sedikit | serba- (1) |
| 83182 | sidik-midik | sidik (1) |
| 84977 | susup-sasap | susup |

**D. Nama diri (bukan kata gabungan)**

| id | entri | induk |
|---|---|---|
| 54358 | Algaffar | gaffar |
| 59653 | Aljalil | jalil |

**E. Lain-lain**

| id | entri | masalah | induk |
|---|---|---|---|
| 71358 | misalnya | Kata turunan (`misal` + `-nya`), bukan gabungan | misal |

**Rekomendasi:** Tinjau 24 entri ini secara manual sebelum proses pemenggalan massal. Kelompok A dan B perlu koreksi data entri terlebih dahulu. Kelompok C perlu keputusan jenis yang tepat. Kelompok D dan E perlu keputusan apakah dihapus atau dipindah jenis.

## Strategi Implementasi

### Pendekatan: Lookup dari Tabel Entri

Untuk setiap kata gabungan, pecah entri berdasarkan spasi, lookup pemenggalan tiap kata dari tabel `entri`, lalu gabungkan dengan spasi.

```
pemenggalan("abad keemasan") = pemenggalan("abad") + " " + pemenggalan("keemasan")
                              = "a.bad" + " " + "ke.e.mas.an"
                              = "a.bad ke.e.mas.an"
```

### Lookup Map

Buat map `kata_normal → pemenggalan` dari tabel entri dengan normalisasi:
1. Lowercase semua entri
2. Strip suffiks disambiguasi: `kata (1)`, `kata (2)` → `kata`
3. Prioritas jenis: `dasar` > `turunan` > `prakategorial` > lainnya
4. Jika ada lebih dari satu entri (homograf), ambil pemenggalan yang sama (biasanya identik)

### Tantangan Lookup

Beberapa entri gabungan memiliki format `kata (N) modifier` — angka disambiguasi menjadi token saat split. Perlu filter token yang hanya berisi angka/tanda kurung.

Cara bersih: bersihkan entri gabungan sebelum split:
```javascript
const kata = entri
  .replace(/\(\d+\)\s*/g, '')  // hapus "(N) "
  .trim()
  .split(' ')
  .filter(Boolean);
```

### Estimasi Coverage

| Kategori | Estimasi | Keterangan |
|---|---|---|
| Bisa auto-generate 100% | ~80-85% | Semua kata ada di entri tabel |
| Parsial (≥1 kata hilang) | ~10-15% | Kata asing, istilah teknis, nama diri |
| Tidak bisa auto | <5% | Kata yang benar-benar tidak ada di DB |

Coverage naïf (tanpa strip disambiguasi) dari tes: **72%**. Estimasi setelah perbaikan lookup: **~85%**.

Kata-kata yang kemungkinan tidak ada di entri tabel (sampel dari tes):
- Istilah teknis/asing: `folklorik`, `ageostrofik`, `adenotropik`, `afluvial`
- Kata Jawa/daerah: `sesirep`, `tridasa`, `kawung`, `belangkas`
- Loanword baru: `gawai`, `aptiklus`, `tronton`, `derbi`
- Nama diri: `Adam` (nama di frasa), dll.

### Penanganan Kata Tidak Ditemukan

Opsi A — **Algoritma fallback**: jalankan algoritma pemenggalan PUEBI (seperti yang digunakan untuk dasar) pada kata yang tidak ditemukan. Cukup andal untuk kata Indonesia asli; kurang akurat untuk loanword.

Opsi B — **Tandai dan skip**: isi pemenggalan hanya untuk kata yang ditemukan, tandai posisi yang tidak ditemukan dengan `?`. Contoh: `sta.si.un ka.pal te.tap` → kata kepala `sta.si.un` diisi, `kapal` dan `tetap` perlu verifikasi.

Opsi C — **Lookup hibrida**: coba lookup dulu, jika tidak ketemu gunakan algoritma.

**Rekomendasi: Opsi C** (lookup + algoritma fallback).

## Rencana Implementasi

1. **Persiapan lookup map** — Buat map `stem → pemenggalan` dari semua entri dasar/turunan/prakategorial
2. **Bersihkan entri gabungan** — Filter token disambiguasi sebelum split
3. **Auto-generate pemenggalan** — Untuk entri yang semua katanya ditemukan
4. **Algoritma fallback** — Untuk kata yang tidak ditemukan di lookup
5. **Dry run + log** — Tampilkan semua perubahan sebelum apply, flag kasus tidak pasti
6. **Apply + dokumentasi** — Sama seperti fix sebelumnya

## Yang Perlu Dilakukan Sebelum Implementasi

### Koreksi data (prioritas tinggi)

- [ ] **3 pemenggalan yang salah** (lihat tabel di atas): `ada-ada saja`, `aji sesirep`, `berlidah dua`
- [ ] **Kelompok A** (3 entri) — perbaiki kolom `entri`, pindahkan titik pemenggalan ke kolom `pemenggalan`:
  - id 50226: `entri = cekakak-cekikik`, `pemenggalan = ce.ka.kak-ce.ki.kik`
  - id 55380: `entri = geliat-geliut`, `pemenggalan = ge.li.at-ge.li.ut`
  - id 81439: `entri = selap-selip`, `pemenggalan = se.lap-se.lip`
- [ ] **Kelompok B** (3 entri) — perbaiki kolom `entri` (tambahkan spasi):
  - id 45146: `bahanpengajaran` → `bahan pengajaran`
  - id 62380: `kawalbatas` → `kawal batas`
  - id 63301: `kempaair` → `kempa air`

### Keputusan jenis (perlu diskusi)

- [ ] **Kelompok C** (15 entri) — kata berulang: apakah pindah ke jenis `dasar`/`turunan`, atau tetap di `gabungan` dengan pemenggalan saja?
- [ ] **Kelompok D** (2 entri) — `Algaffar`, `Aljalil`: hapus atau pindah jenis?
- [ ] **Kelompok E** (1 entri) — `misalnya`: pindah ke jenis `turunan`?

### Keputusan strategi

- [ ] Putuskan apakah menggunakan Opsi A, B, atau C untuk kata tidak ditemukan di lookup

## Hasil Implementasi

**Tanggal apply:** 2026-03-04

| Metrik | Nilai |
|---|---|
| Lookup map (entri dasar/turunan/dll) | 60.011 |
| Total gabungan diproses | 23.541 |
| Diperbarui | 23.536 |
| Baru (null → pemenggalan) | 23.533 |
| Dikoreksi (salah → benar) | 3 |
| Menggunakan fallback algoritma | 1.508 (6,4%) |

Daftar lengkap entri yang menggunakan fallback tersimpan di: `202603041200_gabungan-fallback-review.md`

## Pembersihan Fallback (Review Lanjutan)

**Tanggal:** 2026-03-04

Setelah review 1.508 entri fallback, ditemukan 3 masalah sistematis yang diperbaiki:

| Masalah | Jumlah | Contoh |
|---|---|---|
| Huruf kapital dari lookup nama diri | 297 | `Pi.sang → pi.sang`, `Be.lan.da → be.lan.da` |
| Titik di dalam / sebelum tanda kurung | 62 | `sa.bung.(an) → sa.bung(an)`, `(gi.ling) → (giling)` |
| `sei.` bukan diftong (prefix `se-` + `i`) | 2 | `sei.bu → se.i.bu` |
| **Total diperbarui** | **359** | |

**Penjelasan masalah:**
- **Kapital**: Lookup map mengambil pemenggalan dari entri nama diri (e.g., `Jawa → Ja.wa`), lalu diterapkan ke kata dalam gabungan yang ditulis lowercase. Konvensi pemenggalan kamus: semua huruf kecil.
- **Tanda kurung**: Konten dalam `(...)` seharusnya tidak disyllabify — merupakan alternatif/keterangan tambahan.
- **`seibu`**: Prefix `se-` + `ibu` menghasilkan morfem boundary, bukan diftong `ei`. Algoritma tidak mengenali batas morfem.

**Kasus minor yang diterima:**
- `sofa (huruf) L → so.fa (huruf) l` — huruf bentuk benda jadi lowercase
- `dsb.` dalam kurung → `dsb` — titik singkatan ikut dihapus

## Referensi

- Dokumen terkait: `202603041040_fix-pemenggalan-vokal-awal-akhir.md`
- Log fallback untuk review: `202603041200_gabungan-fallback-review.md`
