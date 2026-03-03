# Skenario Pengisian `entri_tagar` dan Inventaris Tagar Lengkap

**Tanggal**: 2026-03-02
**Lanjutan dari**: [202603022120_rancangan-sistem-tagar-entri.md](202603022120_rancangan-sistem-tagar-entri.md)
**Status**: Analisis data — siap implementasi

---

## 1. Temuan dari Analisis Data

### 1.1 Populasi entri yang bisa ditandai

Tabel `entri` berisi beberapa `jenis` yang relevan untuk tagar:

| `jenis` | Deskripsi | Relevansi |
|---|---|---|
| `turunan` | Kata turunan dari kata dasar/prakategorial | **Utama** — punya `induk`, bisa dianotasi otomatis |
| `prefiks` | Entri yang merupakan unsur prefiks itu sendiri | Relevan (misal: `meng-`, `ber-`) |
| `sufiks` | Entri yang merupakan unsur sufiks | Relevan |
| `konfiks` | Entri yang merupakan unsur konfiks | Relevan |
| `klitik` | Entri yang merupakan klitik | Relevan |
| `dasar` | Kata dasar — tidak butuh tagar | Tidak relevan |
| `prakategorial` | Bentuk terikat dasar — tidak butuh tagar | Tidak relevan |
| `idiom` / `peribahasa` | Ekspresi — tidak butuh tagar | Tidak relevan |

Total entri `turunan` aktif: **24.607 entri**

### 1.2 Distribusi pola morfologis (dari sampel 5.000 entri turunan)

| Pola | Jumlah | % | Contoh |
|---|---:|---:|---|
| Prefiks `ber-` saja | ~2.580 | 51,6% | `beradab`, `berabonemen`, `berabstraksi` |
| Sufiks `-an` saja | ~602 | 12,0% | `abaian`, `abaran`, `acatan`, `alasan` |
| Konfiks `ber--an` | ~529 | 10,6% | `beradegan`, `berakhiran`, `beragaman` |
| Reduplikasi + `ber-` | ~597 | 11,9% | `adik-beradik`, `anak-beranak`, `bahu-membahu` |
| Sufiks `-kan` saja | ~97 | 1,9% | `adukan`, `ajakan`, `amukan` |
| Reduplikasi murni | ~145 | 2,9% | `abar-abar`, `acap-acap`, `aki-aki` |
| Reduplikasi + `-an` | ~86 | 1,7% | `abuh-abuhan`, `acak-acakan`, `aci-acian` |
| Reduplikasi + `-nya` | ~6 | 0,1% | `aci-acinya`, `ada-adanya`, `akhir-akhirnya` |
| Konfiks `meng--kan` | tersebar | ~?% | `mengadukan`, `mempersoalkan` |
| Klitik `-nya` | ~6 | 0,1% | `adanya`, `agaknya`, `akibatnya`, `akhirnya` |
| Klitik `-kah` | ~10 | 0,2% | `berakikah`, `apakah`, `bagaimanakah` |
| Klitik `-lah` | ~2 | 0,04% | `hendaklah`, `itulah` |
| Lain-lain | ~31 | 0,6% | `ajisesirep`, `almuhit`, `bekerja` |

**Kesimpulan kunci**: sekitar 85–90% entri turunan mengikuti pola yang bisa dideteksi otomatis dari pasangan (entri, induk).

---

## 2. Inventaris Tagar Lengkap (Revisi dari Rancangan Awal)

Berdasarkan analisis data nyata, berikut inventaris tagar yang komprehensif:

### 2.1 Kategori `prefiks`

| `kode` | `nama` | Keterangan |
|---|---|---|
| `meng` | `meng-` | Prefiks aktif; mencakup semua alomorf me-/mem-/men-/meng-/meny- (melatih, mengambil, membuat, mendapat, menyapu) |
| `di` | `di-` | Prefiks pasif (diambil, dibuang) |
| `ber` | `ber-` | Prefiks statis/intransitif (berada, berjalan) |
| `ter` | `ter-` | Prefiks pasif/hasil/aspek (terjatuh, tersenyum) |
| `per` | `per-` | Prefiks kausatif (perbesar, perlambat) |
| `ke` | `ke-` | Prefiks (ketua, kelima) |
| `se` | `se-` | Prefiks 'satu/semua' (seorang, semuanya) |
| `peng` | `peng-` | Prefiks agentif; mencakup semua alomorf pe-/pem-/pen-/peng-/peny- (pelari, pembuat, penulis, pengambil, penyapu) |

> **Catatan implementasi**: Varian alomorfik (me-/mem-/men-/meng-/meny- dan pe-/pem-/pen-/peng-/peny-) disatukan ke dalam satu tagar `meng` dan `peng` per famili, sesuai konvensi KBBI, karena varian ditentukan secara fonemis otomatis dari akar kata.

### 2.2 Kategori `sufiks`

| `kode` | `nama` | Keterangan |
|---|---|---|
| `an` | `-an` | Sufiks paling umum (nominalisasi, iteratif) |
| `kan` | `-kan` | Sufiks kausatif (jalankan, angkatkan) |
| `i` | `-i` | Sufiks lokatif/benefaktif (hampiri, ikuti) |

### 2.3 Kategori `infiks`

| `kode` | `nama` | Keterangan |
|---|---|---|
| `el` | `-el-` | Infiks (telunjuk, geligi) |
| `em` | `-em-` | Infiks (gemuruh, temali) |
| `er` | `-er-` | Infiks (gerigi, seruling) |
| `in` | `-in-` | Infiks serapan (sinambung) |

### 2.4 Kategori `konfiks`

Konfiks adalah kombinasi prefiks+sufiks yang muncul bersamaan sebagai satu unit.

| `kode` | `nama` | Keterangan |
|---|---|---|
| `ke-an` | `ke--an` | Abstraksi/keadaan (kebijakan, keadaan, kemiskinan) |
| `peng-an` | `peng--an` | Proses/hasil (pelajaran, pembuatan, penerbangan) |
| `per-an` | `per--an` | Abstraksi verbal (perjalanan, persoalan, perdebatan) |
| `ber-an` | `ber--an` | Resiprokal/intransitif (berlomba-an, berdesakan) |
| `meng-kan` | `meng--kan` | Kausatif aktif (menjalankan, mengangkatkan) |
| `meng-i` | `meng--i` | Aplikatif aktif (menghampiri, mengikuti) |
| `di-kan` | `di--kan` | Kausatif pasif (dijalankan, diangkatkan) |
| `di-i` | `di--i` | Aplikatif pasif (dihampiri, diikuti) |
| `ter-kan` | `ter--kan` | Pasif tidak sengaja + kan (terbuatkan) |
| `ter-i` | `ter--i` | Pasif tidak sengaja + i (terbuati) |
| `per-kan` | `per--kan` | Kausatif per- (persoalkan, pertemukan) |
| `per-i` | `per--i` | Aplikatif per- (perbaiki, perlakukan) |
| `memper-kan` | `memper--kan` | Kausatif ganda (mempersoalkan, mempertahankan) |
| `memper-i` | `memper--i` | Aplikatif ganda (memperbaiki, memperlakukan) |
| `diper-kan` | `diper--kan` | Pasif kausatif ganda (dipersoalkan) |
| `diper-i` | `diper--i` | Pasif aplikatif ganda (diperbaiki) |

### 2.5 Kategori `klitik`

| `kode` | `nama` | Keterangan |
|---|---|---|
| `nya` | `-nya` | Klitik posesif/referensial (akibatnya, agaknya, adanya) |
| `ku` | `-ku` | Klitik posesif orang pertama (bukuku, mobilku) |
| `mu` | `-mu` | Klitik posesif orang kedua (bukumu, hidupmu) |
| `kah` | `-kah` | Klitik interogatif (apakah, bagaimanakah) |
| `lah` | `-lah` | Klitik imperatif/penegas (hendaklah, sudahlah) |
| `pun` | `-pun` | Klitik penegas/konsesif (adapun, walaupun) |
| `tah` | `-tah` | Klitik arkaik interogatif (entahtah, apatah) |

### 2.6 Kategori `reduplikasi` ← **KATEGORI BARU**

Ini adalah temuan penting dari analisis data. Reduplikasi dalam bahasa Indonesia adalah proses morfologis tersendiri, bukan hanya pengulangan ortografis.

| `kode` | `nama` | Keterangan | Contoh |
|---|---|---|---|
| `R.penuh` | `R.penuh` | Reduplikasi murni (X → X-X) | abar-abar, acap-acap, aki-aki |
| `R.penuh` + `-an` | `R.penuh` + `-an` | Reduplikasi + sufiks -an | abuh-abuhan, acak-acakan, aci-acian |
| `R.penuh` + `-kan` | `R.penuh` + `-kan` | Reduplikasi + sufiks -kan | aduk-adukan |
| `R.penuh` + `-nya` | `R.penuh` + `-nya` | Reduplikasi + klitik -nya | ada-adanya, akhir-akhirnya, asyik-asyiknya |
| `ber-` + `R.penuh` | `ber-` + `R.penuh` | Reduplikasi + prefiks ber- | adik-beradik, anak-beranak, bahu-membahu |
| `meng-` + `R.penuh` | `meng-` + `R.penuh` | Reduplikasi + prefiks meng- | ambil-mengambil, antar-mengantar, balas-membalas |
| `ber-` + `R.penuh` + `-an` | `ber-` + `R.penuh` + `-an` | Reduplikasi + ber- + -an | beramah-ramahan, berdesak-desakan |
| `ter-` + `R.penuh` | `ter-` + `R.penuh` | Reduplikasi + ter- | terkucar-kacir, terkena-kena |

> **Notasi**: `R.penuh` menandakan reduplikasi penuh (pengulangan). Sufiks/klitik tetap ditulis sebagai tag terpisah (`-an`, `-nya`, dst.).

---

## 3. Skenario Pengisian `entri_tagar`

### 3.1 Skenario A — Pengisian otomatis via script seeder

**Prinsip**: Bandingkan string `entri` dengan `entri_induk` secara algoritme untuk mendeteksi imbuhan.

**Kondisi yang memungkinkan deteksi akurat:**
- Kolom `entri.induk` ada dan terisi (semua entri `turunan` punya `induk`)
- String entri mengandung string induk sebagai substring yang bisa dilokalisasi

**Algoritme deteksi imbuhan:**

```
GIVEN: entri = "memperebutkan", induk = "rebut"

1. Cek reduplikasi: apakah entri mengandung '-'?
   → tidak → bukan reduplikasi

2. Tentukan awalan (prefix):
   Sisa setelah buang awalan yang dikenal:
   - "mem" + "perebutkan"
   → prefix: mem- (varian meng-)

3. Tentukan akhiran (suffix) dari sisa:
   - "per" + "ebutkan"  → prefix tambahan: per-
   - "ebut" + "kan"     → suffix: -kan, akar: "ebut" (→ rebut dengan fonem awal)

4. Hasil: tagar = [meng, per, kan]
  → jika ada tagar ke--an, tapi ada prefix DAN suffix → ini konfiks meng--kan + per
   → tagar final: meng, per, kan  (3 tagar terpisah)
```

**Contoh kasus sederhana (deteksi string langsung):**

| entri | induk | Deteksi otomatis | Tagar |
|---|---|---|---|
| `akibatnya` | `akibat` | `akibat` + `nya` | `nya` |
| `kebijakan` | `bijak` | `ke` + `bijak` + `an` | `ke-an` |
| `abaian` | `abai` | `abai` + `an` | `an` |
| `adukan` | `aduk` | `aduk` + `kan` | `kan` |
| `beradab` | `adab` | `ber` + `adab` | `ber` |
| `abar-abar` | `abar` | `abar` `-` `abar` | `R.penuh` |
| `abuh-abuhan` | `abuh` | `abuh` `-` `abuh` + `an` | `R.penuh`, `-an` |
| `adik-beradik` | `adik` | `adik` `-` `ber` + `adik` | `ber-`, `R.penuh` |
| `akhirnya` | `akhir` | `akhir` + `nya` | `nya` |
| `ambil-mengambil` | `ambil` | `ambil` `-` `meng` + `ambil` | `meng-`, `R.penuh` |

**Estimasi cakupan otomatis:**

Dari distribusi pola (analisis 5.000 sampel):
- Pola deterministik (1 tagar): ~66% → ~16.240 entri
- Pola 2 tagar: ~20% → ~4.920 entri
- Pola kompleks/reduplikasi: ~10% → ~2.460 entri
- Tidak dapat dideteksi: ~4% → ~984 entri (perlu input manual)

**Total estimasi** yang bisa diisi otomatis: **~22.000 dari 24.607 entri (89%)**

### 3.2 Skenario B — Input manual via antarmuka admin

Untuk kasus yang tidak dapat dideteksi otomatis:
- Entri yang berubah secara fonologis drastis (mis. `bekerja` dari `kerja` via zero-derivation)
- Kata majemuk yang tidak mengikuti pola afiks
- Entri dengan beberapa interpretasi morfologis

Antarmuka: form multi-select di halaman edit entri admin (multi-pilih dari dropdown tagar terkelompok per kategori).

### 3.3 Skenario C — Pengisian inkremental (prioritas praktis)

Tidak semua 24.607 entri perlu ditandai sekaligus. Urutan prioritas:

1. **Fase 1 (MVP)**: Entri yang paling banyak dicari (join dengan tabel `pencarian`)
2. **Fase 2**: Semua entri dengan pola deterministik (run script seeder)
3. **Fase 3**: Entri reduplikasi (butuh aturan lebih kompleks)
4. **Fase 4**: Kasus tepi — input manual oleh redaksi

---

## 4. Implikasi untuk Desain Tabel `tagar`

Berdasarkan analisis, tabel `tagar` perlu mengakomodasi **kategori `reduplikasi`** secara eksplisit.

### Revisi constraint `kategori`:

```sql
CONSTRAINT tagar_kategori_check CHECK (
  kategori IN ('prefiks', 'sufiks', 'infiks', 'konfiks', 'klitik', 'prakategorial', 'reduplikasi')
)
```

### Contoh data seed tagar reduplikasi:

```sql
INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan) VALUES
  ('R.penuh', 'R.penuh', 'reduplikasi', 'Reduplikasi penuh (X → X-X)', 1),
  ('R.salin', 'R.salin', 'reduplikasi', 'Reduplikasi dwilingga salin suara', 2),
  ('R.purwa', 'R.purwa', 'reduplikasi', 'Reduplikasi dwipurwa', 3),
  ('R.wasana','R.wasana','reduplikasi', 'Reduplikasi dwiwasana', 4),
  ('R.tri',   'R.tri',   'reduplikasi', 'Reduplikasi tri-leksikal', 5);
```

---

## 5. Rancangan Script Seeder Otomatis

Script ini akan dijalankan sekali untuk pre-populate `entri_tagar`.
Letakkan di `backend/scripts/seed-entri-tagar.js`.

### Pseudocode algoritme:

```javascript
async function deteksiTagar(entri, induk) {
  const tagarTerdeteksi = [];
  let sisaKiri = entri;  // bagian yang belum diklasifikasi (dari kiri)
  let sisaKanan = entri; // bagian yang belum diklasifikasi (dari kanan)

  // 1. Cek reduplikasi terlebih dahulu (ada tanda hubung)
  if (entri.includes('-')) {
    const parts = entri.split('-');
    const before = parts[0];
    const after = parts.slice(1).join('-');

    if (before === after) {
      return [{ kode: 'R.penuh' }];
    }
    if (after === before + 'an') return [{ kode: 'R.penuh' }, { kode: '-an' }];
    if (after === before + 'kan') return [{ kode: 'R.penuh' }, { kode: '-kan' }];
    if (after === before + 'nya') return [{ kode: 'R.penuh' }, { kode: '-nya' }];
    if (before === induk && after.startsWith('ber')) return [{ kode: 'R.penuh' }, { kode: 'ber-' }];
    if (before === induk && (after.startsWith('me') || after.startsWith('meng'))) return [{ kode: 'R.penuh' }, { kode: 'meng-' }];
    if (entri.startsWith('ber') && after.endsWith('an')) return [{ kode: 'R.penuh' }, { kode: 'ber-' }, { kode: '-an' }];
    // ... dst
    return []; // reduplikasi tidak terdeteksi → tandai manual
  }

  // 2. Deteksi klitik di akhir
  const klitik = [
    { kode: 'nya', suffix: 'nya' },
    { kode: 'ku', suffix: 'ku' },
    { kode: 'mu', suffix: 'mu' },
    { kode: 'kah', suffix: 'kah' },
    { kode: 'lah', suffix: 'lah' },
    { kode: 'pun', suffix: 'pun' },
  ];
  for (const k of klitik) {
    if (entri === induk + k.suffix) {
      return [{ kode: k.kode }]; // hanya klitik
    }
  }

  // 3. Deteksi prefiks dari awal
  const prefiksList = ['meng', 'mem', 'men', 'meny', 'me', 'di', 'ber', 'ter', 'per', 'ke', 'se', 'pe'];
  // ... strip prefix, catat tagar

  // 4. Deteksi sufiks dari akhir
  const sufiksList = ['kan', 'an', 'i'];
  // ... strip suffix, catat tagar

  // 5. Deteksi konfiks (prefix + suffix bersamaan)
  // Jika ada prefix AND suffix, cek apakah ini konfiks yang dikenal
  // → jika ya, simpan sebagai satu tagar konfiks
  // → jika tidak, simpan sebagai dua tagar terpisah

  return tagarTerdeteksi;
}
```

### Penanganan alomorf `meng-`:

```javascript
// Entri "mengambil" → induk "ambil"
// String entri dimulai dengan "meng", tapi kode tagarnya "meng"
// Varian: me-, mem-, men-, meny-, meng- → semua dikode sebagai "meng"
const ALOMORF_ME = ['meng', 'mem', 'men', 'meny', 'me'];
const ALOMORF_PE = ['peng', 'pem', 'pen', 'peny', 'pe'];

function normalisasiPrefiks(awalan) {
  if (ALOMORF_ME.includes(awalan)) return 'meng';
  if (ALOMORF_PE.includes(awalan)) return 'peng';
  return awalan;
}
```

### Penanganan peluluhan KPST (`k/p/s/t`) pada `meng-`/`peng-`

Saat prefiks meN-/peN- menempel pada akar berawalan `k/p/s/t`, fonem awal akar dapat luluh:

- `kenal` → `mengenal`, `pengenal`
- `pakai` → `memakai`, `pemakai`
- `siram` → `menyiram`, `penyiram`
- `tukar` → `menukar`, `penukar`

Aturan implementasi:

- Peluluhan hanya dianggap valid untuk keluarga prefiks `meN-`/`peN-`.
- Kecocokan akar diterima jika `sisa_setelah_prefiks === induk.slice(1)` **dan** huruf awal induk ada di himpunan `k/p/s/t`.
- Hasil tagar tetap dinormalisasi ke bentuk kanonik: `meng` atau `peng`.

---

## 6. Pertanyaan Baru yang Perlu Dikonfirmasi

Sebelum implementasi script seeder dan skema final:

1. **Alomorf sebagai tagar terpisah atau digabung?** ✅ **Diputuskan: Digabung**
   - Satu tagar `meng-` untuk semua varian (me-, mem-, men-, meng-, meny-)
   - Satu tagar `peng-` untuk semua varian (pe-, pem-, pen-, peng-, peny-)
   - Sesuai konvensi KBBI yang menggunakan `meng-` dan `peng-` sebagai bentuk kanonik.

2. **Tagar `ber-R` vs `ber-` + `R`?**
   - Apakah reduplikasi berimbuhan disimpan sebagai *satu* tagar gabungan (`ber-R`)
     atau sebagai dua tagar (`ber-` dan `R`)?
   - **Rekomendasi**: Satu tagar gabungan di kategori `reduplikasi` (lebih representatif)

3. **Konfiks `ke--an` vs tagar `ke-` + `-an`?**
   - Pada kata `kebijakan`, apakah tagar yang disimpan adalah `ke-an` (konfiks)
     atau dua tagar terpisah `ke` dan `an`?
   - **Rekomendasi**: Konfiks (`ke-an`) sebagai satu tagar — secara linguistik lebih benar
     karena `ke-` dan `-an` tidak hadir sendiri-sendiri dalam konteks ini

4. **Apakah script seeder dijalankan sekali atau inkremental?**
   - **Rekomendasi**: Sekali (batch insert via `ON CONFLICT DO NOTHING`), lalu redaksi
     bisa memperbarui kasus tepi via admin

---

## 7. Ringkasan Perubahan dari Rancangan Awal

Dibandingkan dengan [rancangan pertama](202603022120_rancangan-sistem-tagar-entri.md):

| Aspek | Rancangan Awal | Revisi Setelah Analisis |
|---|---|---|
| Kategori tagar | 6 (tanpa reduplikasi) | **7** (tambah `reduplikasi`) |
| Tagar reduplikasi | Tidak ada | **8 tagar baru** (R, R-an, ber-R, dst.) |
| Pengisian data | Manual via admin | **85–90% otomatis** via script seeder |
| Script seeder | Tidak direncanakan | **Direncanakan** di `backend/scripts/seed-entri-tagar.js` |
| Constraint SQL | `IN (6 kategori)` | `IN (7 kategori)` |
| Perkiraan data awal | ~20 tagar | **~35–40 tagar** |

---

## 8. Referensi Data

- Total entri `turunan`: **24.607** (per 2026-03-02)
- Analisis morfologis dari sampel: **5.000 entri turunan**
- Script analisis: sudah dihapus setelah dijalankan (hasil ada di dokumen ini)
