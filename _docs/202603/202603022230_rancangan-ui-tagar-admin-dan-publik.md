# Rancangan UI Sistem Tagar — Admin dan Halaman Publik

**Tanggal**: 2026-03-02
**Lanjutan dari**:
- [202603022120_rancangan-sistem-tagar-entri.md](202603022120_rancangan-sistem-tagar-entri.md)
- [202603022200_skenario-pengisian-entri-tagar.md](202603022200_skenario-pengisian-entri-tagar.md)

---

## Keputusan Desain yang Dikonfirmasi

| Pertanyaan | Keputusan |
|---|---|
| Alomorf (me/meng/mem/men/meny, ber, ter) | **Digabung** — satu tagar per prefiks dasar |
| Reduplikasi berimbuhan (`ber-R`) | **Dipisah** — tagar `ber-` + tagar `R-` secara terpisah |
| Konfiks (`ke--an`) | **Dipisah** — tagar `ke-` + tagar `-an` secara terpisah |

**Implikasi pada skema tagar**: Tidak ada tagar konfiks dan tidak ada tagar reduplikasi-berimbuhan gabungan. Kategori tagar menjadi lebih sederhana:
- `prefiks`, `sufiks`, `infiks`, `klitik`, `reduplikasi`, `prakategorial`
- Kategori `konfiks` **dihapus** dari rancangan

---

## 1. Halaman Admin: TagarAdmin vs EntriTagarAdmin

### 1.1 Apakah perlu dua halaman?

**Ya, dua halaman dengan tujuan berbeda:**

| Halaman | Path | Tujuan Utama |
|---|---|---|
| **TagarAdmin** | `/redaksi/tagar` | Master data — CRUD tagar (kode, nama, kategori, urutan, aktif) |
| **EntriTagarAdmin** | `/redaksi/entri-tagar` | Audit & kelola asosiasi — entri mana punya tagar, mana yang belum |

Ini analog dengan pola yang sudah ada:
- `BidangAdmin` = master data bidang
- (Pengelolaan bidang per glosarium) = dilakukan dari `GlosariumAdmin`

Demikian pula:
- `TagarAdmin` = master data tagar
- `EntriTagarAdmin` = pengelolaan tagar per entri (dari sudut pandang "entri")
- Chip editor di `KamusAdmin` = pengelolaan tagar per entri (dari sudut pandang "edit entri satu-satu")

---

### 1.2 TagarAdmin — Rancangan Detail

**Mengikuti pola `LabelAdmin` hampir persis.**

**Kolom tabel:**

| Kolom | Tipe | Keterangan |
|---|---|---|
| Nama | text | Tampilan dengan tanda morfologis (`meng-`, `-an`, `R-`) |
| Kode | text | Slug unik (`meng`, `an`, `R`) |
| Kategori | badge | `prefiks` / `sufiks` / `infiks` / `klitik` / `reduplikasi` / `prakategorial` |
| Urutan | number | Untuk pengurutan dalam kategori |
| Status | badge Aktif/Nonaktif | |

**Panel geser (form tambah/sunting):**

```
┌─────────────────────────────────────┐
│  Nama *              [ meng-      ] │  ← tampilan (mis. "meng-", "-an", "R-")
│  Kode *              [ meng       ] │  ← slug (url-safe)
│  Kategori *          [ prefiks  ▼ ] │  ← select dari enum
│  Urutan              [ 1          ] │
│  Aktif               [●  Aktif    ] │
│  Deskripsi           [            ] │  ← textarea
│                      [  Simpan  ] [Batal] │
└─────────────────────────────────────┘
```

**Filter di atas tabel:**

```
[ Cari tagar...  🔍 ]  [ Semua kategori ▼ ]  [ Semua status ▼ ]
```

**Route**: `GET/POST/PUT/DELETE /api/redaksi/tagar`
**Izin**: `kelola_tagar`

---

### 1.3 EntriTagarAdmin — Rancangan Detail

**Tujuan**: Audit cakupan tagar dan kelola asosiasi secara massal.

**Halaman ini menjawab pertanyaan:**
- Berapa entri turunan yang sudah punya tagar?
- Entri mana yang belum punya tagar sama sekali?
- Semua entri dengan tagar `ber-` itu apa saja?

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  TAGAR ENTRI                                           [?]  │
│                                                             │
│  📊  Cakupan: 5.234 dari 24.607 entri turunan (21%)       │
│      ████░░░░░░░░░░░░░░░░░░░  21%                         │
│                                                             │
│  Filter:                                                    │
│  [ Cari entri...  🔍 ]  [ Semua tagar ▼ ]  [ Jenis ▼ ]   │
│  [ Semua status tagar: Ada tagar / Belum ada tagar ▼ ]     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Entri          Jenis    Induk          Tagar         │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ beradab        turunan  adab           ber-          │   │
│  │ kebijakan      turunan  bijak          ke-, -an      │   │
│  │ memperebutkan  turunan  rebut          meng-, per-,  │   │
│  │                                        -kan          │   │
│  │ akibatnya      turunan  akibat         -nya          │   │
│  │ mengambil      turunan  ambil          meng-         │   │
│  │ abuhan         turunan  abuh (1)       [belum]  [+]  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Fitur khusus EntriTagarAdmin:**

1. **Progress bar cakupan** — visual berapa persen entri turunan sudah bertagar
2. **Filter "belum ada tagar"** — tampilkan entri yang perlu dikerjakan
3. **Filter per tagar** — klik tagar tertentu → lihat semua entri yang punya tagar itu
4. **Edit inline cepat** — klik baris → buka mini-panel dengan chip editor (sama seperti di KamusAdmin, tapi tanpa edit data entri lainnya)
5. **Filter jenis** — default hanya tampilkan `turunan`, bisa diperluas ke semua jenis

**Route backend yang diperlukan:**
```
GET /api/redaksi/entri-tagar
  Query: ?q=, tagar_id=, jenis=, punya_tagar=, limit=, cursor=
  Response: daftar entri + tagar mereka, total, pageInfo

PUT /api/redaksi/kamus/:id/tagar
  Body: { tagar_ids: [1, 5, 12] }
  → Replace semua tagar untuk entri ini
```

**Izin**: `edit_entri` (sama dengan edit makna/contoh)

---

## 2. Editor Tagar di KamusAdmin — Chip Autocomplete

### 2.1 Posisi di panel edit entri

Di `KamusAdmin.jsx`, setelah `<FormFooter>` dan sebelum/sesudah `<SeksiMakna>`, tambahkan `<SeksiTagar>` yang hanya muncul saat mode sunting (bukan mode tambah):

```jsx
{/* Tagar — only in edit mode, for jenis = turunan/prefiks/sufiks/konfiks/klitik */}
{!panel.modeTambah && panel.data.id && ['turunan', 'prefiks', 'sufiks', 'konfiks', 'klitik'].includes(panel.data.jenis) && (
  <SeksiTagar entriId={panel.data.id} />
)}
```

### 2.2 Tampilan chip editor

```
┌─ Tagar ─────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [meng- ×]  [per- ×]  [-kan ×]  [     tambah...   ] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ↳ saat input fokus, dropdown muncul:                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prefiks                                             │   │
│  │    me-  meng-  ber-  di-  ter-  per-  ke-  se-  pe- │   │
│  │  Sufiks                                             │   │
│  │    -an  -kan  -i                                     │   │
│  │  Klitik                                              │   │
│  │    -nya  -kah  -lah  -ku  -mu  -pun                 │   │
│  │  Reduplikasi                                         │   │
│  │    R-  R--an  R--kan  R--nya                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Perilaku:**
- Input teks → filter dropdown secara live (autocomplete)
- Klik item di dropdown → tambah chip
- Chip chip punya `×` untuk hapus
- Chips diurutkan: prefiks dulu, lalu sufiks, klitik, reduplikasi
- Perubahan langsung di-save ke `entri_tagar` (PUT `/api/redaksi/kamus/:id/tagar`) tanpa perlu klik Simpan utama (atau bisa batched saat Simpan — pilihan implementasi)
- Warna chip per kategori (opsional): biru = prefiks, hijau = sufiks, ungu = klitik, oranye = reduplikasi

### 2.3 Komponen baru yang dibutuhkan

**`SeksiTagar`** (baru, di `KamusAdmin.jsx` atau file terpisah):
- Props: `entriId`
- Query: `useTagarEntri(entriId)` → `GET /api/redaksi/kamus/:id/tagar`
- Mutation: `useSimpanTagarEntri()` → `PUT /api/redaksi/kamus/:id/tagar`
- State internal: daftar tagar terpilih + query input autocomplete

**Alternatif implementasi autocomplete:**
Tidak membutuhkan library eksternal. Mengikuti pola yang sudah ada di KamusAdmin untuk field Induk dan Entri Rujuk:
- `onFocus` → tampilkan dropdown
- `onBlur` (dengan delay 120ms) → sembunyikan dropdown
- `onChange` → filter list tagar dari `useQuery('semua-tagar', ambilSemuaTagar)`

---

## 3. Halaman Publik Kamus — Kotak Kategori Tagar

### 3.1 Posisi dan layout

Tagar ditambahkan sebagai baris **terakhir** di `BARIS_KATEGORI`, **mengisi penuh lebar** (satu kartu melebar dua kolom) karena jumlah item banyak (~35 tagar).

```javascript
// Kamus.jsx — BARIS_KATEGORI yang direvisi
const BARIS_KATEGORI = [
  ['abjad', 'kelas_kata'],
  ['bentuk', 'unsur_terikat'],
  ['ekspresi', 'ragam'],
  ['bahasa', 'bidang'],
  ['tagar'],  // ← baris baru, full-width
];
```

Karena hanya satu item di baris terakhir, grid `grid-cols-2` otomatis akan merentangkan satu kolom penuh.

### 3.2 Tampilan KartuKategori untuk tagar

**Tahap awal: flat list, tanpa sub-kelompok.** Tagar diurutkan berdasarkan `kategori` lalu `urutan` (mengikuti urutan di tabel `tagar`), disajikan sebagai satu daftar datar menggunakan `KartuKategori` yang sudah ada — tanpa perubahan apapun pada komponen tersebut.

**Tampilan kotak tagar di halaman kamus:**

```
┌─ Tagar ─────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  [R-]  [R--an]  [R--kan]  [R--nya]  [-el-]  [-em-]  [-er-]  [-nya]        │
│  [-kah]  [-lah]  [-ku]  [-mu]  [-pun]  [me-]  [ber-]  [di-]  [ter-]       │
│  [per-]  [ke-]  [se-]  [pe-]  [-an]  [-kan]  [-i]  …                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Urutan tampil mengikuti urutan `ORDER BY kategori, urutan` dari database — infiks sebelum klitik sebelum prefiks sebelum reduplikasi sebelum sufiks (alfabetis per kategori), atau bisa disesuaikan via kolom `urutan`.

### 3.3 Data flow untuk tampilan publik

Saat ini `ambilKategoriKamus()` memanggil `GET /api/publik/kamus/kategori` yang mengembalikan semua label per kategori. Tagar perlu ikut dalam response ini sebagai **flat array**:

```javascript
// Response yang direvisi
{
  abjad: [...],
  kelas_kata: [...],
  // ...existing...
  tagar: [
    { kode: 'R',   nama: 'R-'   },
    { kode: 'R-an', nama: 'R--an' },
    { kode: 'me',  nama: 'me-'  },
    { kode: 'ber', nama: 'ber-' },
    { kode: 'an',  nama: '-an'  },
    // ... dst, ORDER BY kategori, urutan
  ]
}
```

Backend: tambahkan query `SELECT kode, nama FROM tagar WHERE aktif = TRUE ORDER BY kategori, urutan` ke dalam fungsi yang menangani endpoint kategori kamus.

### 3.4 Route baru

```javascript
// App.jsx — route baru
<Route path="/kamus/tagar/:kode" element={<Kamus />} />
```

Di `Kamus.jsx`, deteksi parameter `tagar` dari path dan panggil `ambilEntriPerKategori('tagar', kode, ...)` yang diteruskan ke backend sebagai `GET /api/publik/tagar/:kode`.

Atau lebih eksplisit: tambahkan `modeTagarPublik` yang memanggil endpoint tagar khusus.

**Path**: `/kamus/tagar/meng` → daftar entri bertagar `meng-`
**Judul halaman**: `Kata bertagar meng- — Kamus Kateglo`

---

## 4. Ringkasan Perubahan Diperlukan per Layer

### Database
- ✅ Tabel `tagar` dan `entri_tagar` dibuat
- ✅ 26 tagar seed (8 prefiks, 3 sufiks, 4 infiks, 7 klitik, 4 reduplikasi)
- ✅ Izin `kelola_tagar` ditambahkan, di-assign ke peran `admin` dan `penyunting`
- ✅ `_docs/struktur-data.sql` diperbarui

### Backend — ✅ Selesai
| File | Status |
|---|---|
| `models/modelTagar.js` | ✅ Selesai |
| `routes/publik/tagar.js` | ✅ Selesai — `GET /api/publik/tagar`, `GET /api/publik/tagar/:kode` |
| `routes/redaksi/tagar.js` | ✅ Selesai — CRUD `GET/POST/PUT/DELETE /api/redaksi/tagar` |
| `routes/publik/kamus.js` | ✅ Selesai — endpoint `/kategori` menyertakan `tagar` flat array |
| `routes/redaksi/kamus.js` | ✅ Selesai — `GET/PUT /api/redaksi/kamus/:id/tagar` |
| `routes/publik/index.js` | ✅ Selesai — route `/tagar` terdaftar |
| `routes/redaksi/index.js` | ✅ Selesai — route `/tagar` terdaftar |

### Frontend — ⏳ Belum dikerjakan (sesi berikutnya)
| File | Perubahan | Prioritas |
|---|---|---|
| `api/apiPublik.js` | Tambah: `ambilSemuaTagar()`, `cariEntriPerTagar()` | Tinggi |
| `api/apiAdmin.js` | Tambah: `useDaftarTagarAdmin()`, `useDetailTagarAdmin()`, `useSimpanTagarAdmin()`, `useHapusTagarAdmin()`, `useTagarEntri()`, `useSimpanTagarEntri()` | Tinggi |
| `halaman/redaksi/TagarAdmin.jsx` | **Baru** — CRUD master data tagar. Ikuti pola `LabelAdmin.jsx` | Tinggi |
| `halaman/redaksi/KamusAdmin.jsx` | Modifikasi — tambah `<SeksiTagar>` chip editor di panel edit entri (hanya jenis `turunan/prefiks/sufiks/klitik`) | Tinggi |
| `halaman/publik/Kamus.jsx` | Modifikasi — tambah `'tagar'` ke `BARIS_KATEGORI`, handler `getTo` ke `/kamus/tagar/:kode` | Sedang |
| `App.jsx` | Tambah route `<Route path="/kamus/tagar/:kode" element={<Kamus />} />` | Sedang |
| `utils/metaUtils.js` | Tambah fungsi/konstanta meta untuk halaman tagar (`buildMetaTagarKamus`) | Sedang |
| `halaman/redaksi/EntriTagarAdmin.jsx` | **Baru** — audit cakupan + kelola asosiasi massal | Rendah |

---

## 5. Catatan Implementasi Frontend (Sesi Berikutnya)

### apiPublik.js — fungsi yang perlu ditambahkan

```javascript
// Ambil semua tagar aktif (flat array)
export async function ambilSemuaTagar() {
  const { data } = await klien.get('/publik/tagar');
  return data;
}

// Ambil entri per tagar (cursor pagination)
export async function cariEntriPerTagar(kode, params = {}) {
  const { data } = await klien.get(`/publik/tagar/${encodeURIComponent(kode)}`, { params });
  return data;
}
```

### apiAdmin.js — hooks yang perlu ditambahkan

Pattern: identik dengan `useDaftarLabelAdmin` / `useSimpanLabel` / `useHapusLabel`.

```javascript
// Query keys: ['admin-tagar', params]
export function useDaftarTagarAdmin(params) { ... }
export function useDetailTagarAdmin(id) { ... }
export function useSimpanTagarAdmin() { ... }   // invalidate 'admin-tagar'
export function useHapusTagarAdmin() { ... }    // invalidate 'admin-tagar'

// Untuk chip editor di KamusAdmin:
export function useTagarEntri(entriId) { ... }        // GET /redaksi/kamus/:id/tagar
export function useSimpanTagarEntri() { ... }          // PUT /redaksi/kamus/:id/tagar
export function useDaftarTagarUntukPilih() { ... }    // GET /publik/tagar (untuk dropdown)
```

### TagarAdmin.jsx — struktur minimal

- **Kolom tabel**: nama, kode, kategori (badge), urutan, aktif
- **Filter**: cari teks + filter kategori (dropdown 6 pilihan) + filter aktif
- **Panel geser**: form dengan InputField (kode, nama), SelectField (kategori), InputField (urutan), ToggleAktif, TextareaField (deskripsi)
- **Ikuti persis** struktur `LabelAdmin.jsx`

### SeksiTagar di KamusAdmin.jsx — chip autocomplete

- Tampilkan hanya jika `!panel.modeTambah && panel.data.id`
- Letakkan **setelah** `<FormFooter>` dan **sebelum** `<SeksiMakna>`
- State: `tagarTerpilih` (array), `queryInput` (string), `tampilDropdown` (bool)
- Dropdown: semua tagar dari `useDaftarTagarUntukPilih()`, filter by `queryInput`
- Autosave: panggil `simpanTagarEntri.mutate({ entriId, tagar_ids })` saat chip ditambah/dihapus

### Kamus.jsx — perubahan minimal

```javascript
// Tambahkan 'tagar' ke baris terakhir
const BARIS_KATEGORI = [
  ['abjad', 'kelas_kata'],
  ['bentuk', 'unsur_terikat'],
  ['ekspresi', 'ragam'],
  ['bahasa', 'bidang'],
  ['tagar'],  // ← baru
];

// Di dalam map, tambahkan handler khusus untuk tagar:
getTo={(item) => {
  if (kat === 'tagar') return `/kamus/tagar/${encodeURIComponent(item.kode)}`;
  // ... existing logic
}}
```

### App.jsx — route baru

```jsx
// Tambahkan di blok routes kamus, sebelum route kamus/:kata
<Route path="/kamus/tagar/:kode" element={<Kamus />} />
```

Di `Kamus.jsx`, deteksi param `kode` dari path `/kamus/tagar/:kode` dengan menambahkan prop/param baru atau menggunakan `useParams()` yang sudah ada — bedakan dari `kategori/:kategori/:kode` yang sekarang.

**Alternatif lebih bersih**: buat komponen `KamusTagar.jsx` terpisah khusus untuk mode tagar, agar tidak menambah kompleksitas ke `Kamus.jsx` yang sudah besar.

---

## 6. Urutan Implementasi yang Disarankan (Sisa)

---

## 6. Referensi Kode Pola yang Diikuti

| Komponen baru | Ikuti pola dari |
|---|---|
| `TagarAdmin.jsx` | [LabelAdmin.jsx](../../frontend/src/halaman/redaksi/LabelAdmin.jsx) |
| `SeksiTagar` di KamusAdmin | Autocomplete Induk di [KamusAdmin.jsx:1214-1248](../../frontend/src/halaman/redaksi/KamusAdmin.jsx) |
| Chip state management | `SeksiMakna` pattern (list lokal + mutasi terpisah) |
| Kotak tagar publik | [KartuKategori.jsx](../../frontend/src/komponen/publik/KartuKategori.jsx) + `BARIS_KATEGORI` di [Kamus.jsx](../../frontend/src/halaman/publik/Kamus.jsx) |
| React Query hooks admin | `useDaftarLabelAdmin`, `useSimpanLabel`, `useHapusLabel` di apiAdmin.js |
