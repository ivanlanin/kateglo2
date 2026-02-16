# Hierarki Induk Gabungan

Tanggal: 2026-02-16

## Ringkasan

Lema gabungan yang sebelumnya langsung menjadi anak lema dasar, kini dipindahkan menjadi anak dari lema berimbuhan yang sesuai. Breadcrumb diperluas untuk mendukung rantai induk multi-level.

## Latar Belakang

Sebelumnya, semua sublema (berimbuhan maupun gabungan) langsung menunjuk ke lema dasar sebagai `induk`. Contoh untuk lema "latih":

```
latih (dasar)
├── berlatih (berimbuhan)
├── latihan (berimbuhan)
├── berlatih tanding (gabungan)   ← langsung anak "latih"
├── latihan elokan (gabungan)     ← langsung anak "latih"
└── pelatih kuda (gabungan)       ← langsung anak "latih"
```

Padahal, "berlatih tanding" secara linguistik adalah turunan dari "berlatih", bukan "latih".

## Perubahan

### 1. Migrasi Database

File: `_docs/202602/20260216_hierarki_induk_gabungan.sql`

Untuk setiap lema gabungan yang `induk`-nya lema dasar, cari lema berimbuhan saudara yang menjadi prefix (kata pertama). Jika cocok, pindahkan `induk` ke berimbuhan tersebut. Pilih berimbuhan terpanjang untuk menghindari ambiguitas.

Dampak: 3.367 baris dari total 23.536 gabungan (14,3%) diperbarui. Sisanya (20.169) tetap anak langsung lema dasar karena tidak ada berimbuhan yang cocok (mis. "abad keemasan" — tidak ada berimbuhan "keemasan" di bawah "abad").

Hasil untuk "latih":

```
latih (dasar)
├── berlatih (berimbuhan)
│   └── berlatih tanding (gabungan)
├── latihan (berimbuhan)
│   ├── latihan elokan (gabungan)
│   ├── latihan formal (gabungan)
│   └── ... (22 gabungan)
├── melatih (berimbuhan)
├── pelatih (berimbuhan)
│   └── pelatih kuda (gabungan)
├── pelatihan (berimbuhan)
└── terlatih (berimbuhan)
```

### 2. Backend: Rantai Induk (Ancestor Chain)

File: `backend/models/modelLema.js`

Ditambahkan metode `ambilRantaiInduk(indukId)` menggunakan recursive CTE. Mengembalikan array leluhur dari akar ke induk langsung, maksimum 5 level.

```js
// Contoh: untuk "berlatih tanding" (induk = berlatih)
// Mengembalikan: [{ id: 21353, lema: 'latih' }, { id: 67420, lema: 'berlatih' }]
```

File: `backend/services/layananKamusPublik.js`

Field `induk` di response berubah dari objek tunggal menjadi array:

```js
// Sebelum
induk: { id: 21353, lema: 'latih' }

// Sesudah
induk: [{ id: 21353, lema: 'latih' }, { id: 67420, lema: 'berlatih' }]

// Atau null jika tidak ada induk
induk: null
```

### 3. Frontend: Breadcrumb Multi-Level

File: `frontend/src/halaman/KamusDetail.jsx`

Breadcrumb sekarang me-render seluruh rantai induk:

```
Sebelum: Kamus › latih › berlatih tanding
Sesudah: Kamus › latih › berlatih › berlatih tanding
```

## Kedalaman Hierarki

Setelah perubahan, kedalaman maksimum adalah 3 level:

- `dasar > berimbuhan > gabungan` (jika ada berimbuhan cocok)
- `dasar > gabungan` (jika tidak ada berimbuhan cocok)

Recursive CTE dibatasi 5 level sebagai pengaman.
