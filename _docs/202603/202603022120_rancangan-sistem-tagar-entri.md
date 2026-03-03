# Rancangan Sistem Tagar untuk Entri Kamus

**Tanggal**: 2026-03-02
**Status**: Rancangan awal

---

## 1. Latar Belakang dan Tujuan

Sistem tagar dirancang untuk memberi anotasi morfologis pada entri kamus — yaitu menandai afiks, klitik, dan morfem terikat yang melekat pada suatu kata. Ini berbeda dari sistem `label` yang ada (yang mengklasifikasikan ragam, kelas kata, dll.) karena tagar menyentuh kata secara konstruktif, bukan deskriptif.

**Contoh penggunaan yang diinginkan:**

| Entri | Tagar | Kategori |
|---|---|---|
| merebut | `meng-` | prefiks |
| memperebutkan | `meng-`, `per-`, `-kan` | prefiks, prefiks, sufiks |
| kebijakan | `ke--an` | konfiks |
| akibatnya | `-nya` | klitik |

---

## 2. Desain Skema Database

### 2.1 Tabel `tagar`

Menyimpan daftar tagar morfologis yang tersedia.

```sql
CREATE TABLE tagar (
  id SERIAL PRIMARY KEY,
  kode TEXT NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  urutan INTEGER NOT NULL DEFAULT 1,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT tagar_kode_key UNIQUE (kode),
  CONSTRAINT tagar_nama_check CHECK (TRIM(BOTH FROM nama) <> ''),
  CONSTRAINT tagar_kode_check CHECK (TRIM(BOTH FROM kode) <> ''),
  CONSTRAINT tagar_kategori_check CHECK (
    kategori IN ('prefiks', 'sufiks', 'infiks', 'konfiks', 'klitik', 'prakategorial')
  )
);

CREATE UNIQUE INDEX tagar_kode_key ON tagar USING BTREE (kode);
CREATE INDEX idx_tagar_kategori ON tagar USING BTREE (kategori, urutan);
CREATE INDEX idx_tagar_aktif ON tagar USING BTREE (aktif);

CREATE TRIGGER trg_set_timestamp_fields__tagar
  BEFORE INSERT OR UPDATE ON tagar
  FOR EACH ROW EXECUTE FUNCTION set_timestamp_fields();
```

**Kolom penting:**

- `kode`: slug URL-safe, unik (contoh: `meng`, `kan`, `ke-an`, `nya`). Tidak mengandung tanda hubung di awal/akhir sebagai identifer.
- `nama`: bentuk tampilan dengan tanda morfologis (contoh: `meng-`, `-kan`, `ke--an`, `-nya`).
- `kategori`: salah satu dari `prefiks`, `sufiks`, `infiks`, `konfiks`, `klitik`, `prakategorial`.

### 2.2 Tabel `entri_tagar` (Junction Table)

Relasi many-to-many antara `entri` dan `tagar`.

```sql
CREATE TABLE entri_tagar (
  entri_id INTEGER NOT NULL REFERENCES entri(id) ON DELETE CASCADE,
  tagar_id INTEGER NOT NULL REFERENCES tagar(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entri_id, tagar_id)
);

CREATE INDEX idx_entri_tagar_tagar_id ON entri_tagar USING BTREE (tagar_id);
CREATE INDEX idx_entri_tagar_entri_id ON entri_tagar USING BTREE (entri_id);
```

### 2.3 Data Awal (Seed)

Beberapa tagar yang kemungkinan langsung dibutuhkan:

```sql
-- Prefiks
INSERT INTO tagar (kode, nama, kategori, urutan) VALUES
  ('meng', 'meng-', 'prefiks', 1),
  ('peng', 'peng-', 'prefiks', 2),
  ('di',   'di-',   'prefiks', 3),
  ('ter',  'ter-',  'prefiks', 4),
  ('ber',  'ber-',  'prefiks', 5),
  ('per',  'per-',  'prefiks', 6),
  ('ke',   'ke-',   'prefiks', 7),
  ('se',   'se-',   'prefiks', 8);

-- Sufiks
INSERT INTO tagar (kode, nama, kategori, urutan) VALUES
  ('kan', '-kan', 'sufiks', 1),
  ('i', '-i', 'sufiks', 2),
  ('an', '-an', 'sufiks', 3);

-- Infiks
INSERT INTO tagar (kode, nama, kategori, urutan) VALUES
  ('el', '-el-', 'infiks', 1),
  ('em', '-em-', 'infiks', 2),
  ('er', '-er-', 'infiks', 3);

-- Konfiks
INSERT INTO tagar (kode, nama, kategori, urutan) VALUES
  ('ke-an',   'ke--an',   'konfiks', 1),
  ('peng-an', 'peng--an', 'konfiks', 2),
  ('ber-an',  'ber--an',  'konfiks', 3),
  ('meng-kan','meng--kan','konfiks', 4),
  ('meng-i',  'meng--i',  'konfiks', 5);

-- Klitik
INSERT INTO tagar (kode, nama, kategori, urutan) VALUES
  ('nya', '-nya', 'klitik', 1),
  ('ku', '-ku', 'klitik', 2),
  ('mu', '-mu', 'klitik', 3),
  ('kah', '-kah', 'klitik', 4),
  ('lah', '-lah', 'klitik', 5),
  ('pun', '-pun', 'klitik', 6);
```

---

## 3. Pertimbangan Desain

### 3.1 Mengapa bukan kolom di `entri` atau `makna`?

Tagar bersifat many-to-many: satu entri bisa punya banyak tagar (mis. `memperebutkan` punya 3 tagar), dan satu tagar bisa muncul di ribuan entri. Junction table adalah satu-satunya struktur yang benar untuk relasi ini.

### 3.2 Hubungan dengan sistem `label` yang ada

Tagar morfologis **berbeda** dari `label`:
- `label` mendeskripsikan properti *makna* (ragam, kelas kata, bidang, bahasa)
- `tagar` mendeskripsikan struktur *pembentukan kata* pada *entri*

Karena itu `tagar` diimplementasikan sebagai tabel terpisah (bukan menambah kategori ke tabel `label`).

### 3.3 Granularitas: per-entri, bukan per-makna

Tagar melekat pada `entri` (kata/lema), bukan pada `makna` (definisi polisem). Ini karena struktur morfologis suatu kata biasanya berlaku untuk semua maknanya. Jika di masa depan perlu granularitas per-makna, struktur bisa diperluas dengan menambah tabel `makna_tagar`.

### 3.4 Kategori tagar (nilai enum `kategori`)

Enam kategori sesuai linguistik morfologi Indonesia:

| Kategori | Contoh |
|---|---|
| `prefiks` | `meng-`, `peng-`, `di-`, `ber-`, `ter-`, `per-`, `ke-`, `se-` |
| `sufiks` | `-kan`, `-i`, `-an` |
| `infiks` | `-el-`, `-em-`, `-er-` |
| `konfiks` | `ke--an`, `peng--an`, `ber--an`, `meng--kan` |
| `klitik` | `-nya`, `-ku`, `-mu`, `-kah`, `-lah`, `-pun` |
| `prakategorial` | bentuk terikat yang tidak masuk kategori di atas |

---

## 4. Implementasi Backend

### 4.1 Model: `backend/models/modelTagar.js`

Model baru mengikuti pola fat model yang sudah ada. Method yang dibutuhkan:

```javascript
class ModelTagar {
  // Ambil semua tagar aktif, dikelompokkan per kategori (untuk publik & form)
  static async ambilSemuaTagar()

  // Ambil daftar tagar untuk entri tertentu (dipakai di detail kamus)
  static async ambilTagarEntri(entriId)

  // Cari entri berdasarkan tagar (dengan cursor pagination)
  static async cariEntriPerTagar(tagarKode, { limit, cursor, direction, lastPage, hitungTotal })

  // Admin: daftar semua tagar dengan filter + cursor pagination
  static async daftarAdmin({ limit, cursor, direction, lastPage, q, kategori, aktif })

  // Admin: ambil satu tagar berdasarkan ID
  static async ambilDenganId(id)

  // Admin: simpan (insert/update) tagar
  static async simpan({ id, kode, nama, kategori, deskripsi, urutan, aktif })

  // Admin: hapus tagar
  static async hapus(id)

  // Simpan tagar untuk satu entri (replace all — hapus lama, insert baru)
  static async simpanTagarEntri(entriId, tagarIds)
}
```

### 4.2 Routes Publik: `backend/routes/publik/tagar.js`

```
GET /api/publik/tagar
  → Semua tagar aktif, dikelompokkan per kategori
  Response: { success: true, data: { prefiks: [...], sufiks: [...], ... } }

GET /api/publik/tagar/:kode
  → Daftar entri yang memiliki tagar ini (cursor pagination)
  Query: ?limit=20&cursor=&direction=next
  Response: { success: true, data: [...], tagar: { kode, nama, kategori },
              hasNext, hasPrev, nextCursor, prevCursor, total }
```

Didaftarkan di `backend/routes/publik/index.js`:
```javascript
router.use('/tagar', require('./tagar'));
```

### 4.3 Integrasi dengan Detail Kamus

Di `modelEntri.js`, method `ambilDetailKamus()` (atau setara) perlu diperluas untuk menyertakan tagar:

```javascript
// Tambahkan join atau subquery ke entri_tagar + tagar
// Sertakan dalam response: entri.tagar = [{ kode, nama, kategori }, ...]
```

Alternatif: load tagar secara terpisah di route handler (dua query), lalu gabungkan sebelum response. Ini lebih sederhana dan tidak memodifikasi model entri secara invasif.

### 4.4 Routes Redaksi: `backend/routes/redaksi/tagar.js`

```
GET    /api/redaksi/tagar            → daftarAdmin (periksaIzin: kelola_tagar)
GET    /api/redaksi/tagar/:id        → ambilDenganId (periksaIzin: kelola_tagar)
POST   /api/redaksi/tagar            → simpan (periksaIzin: kelola_tagar)
PUT    /api/redaksi/tagar/:id        → simpan+id (periksaIzin: kelola_tagar)
DELETE /api/redaksi/tagar/:id        → hapus (periksaIzin: kelola_tagar)

GET    /api/redaksi/kamus/:id/tagar  → ambilTagarEntri (periksaIzin: edit_entri)
PUT    /api/redaksi/kamus/:id/tagar  → simpanTagarEntri (periksaIzin: edit_entri)
```

### 4.5 Izin Baru

Tambahkan satu izin ke tabel `izin`:

```sql
INSERT INTO izin (kode, nama, kelompok)
VALUES ('kelola_tagar', 'Kelola tagar morfologis', 'tagar');
```

Assign ke peran yang relevan (mis. `redaksi`, `admin`) via tabel `peran_izin`.

---

## 5. Implementasi Frontend

### 5.1 Fungsi API Publik: `frontend/src/api/apiPublik.js`

Tambahkan fungsi berikut ke file yang sudah ada:

```javascript
// Ambil semua tagar (grouped per kategori)
export async function ambilSemuaTagar() { ... }

// Ambil entri per tagar (cursor pagination)
export async function cariEntriPerTagar(kode, params = {}) { ... }
```

### 5.2 Hook Admin: `frontend/src/api/apiAdmin.js`

Tambahkan hooks React Query berikut:

```javascript
// Query: daftar tagar untuk admin
export function useDaftarTagarAdmin(params) { ... }

// Query: detail satu tagar
export function useDetailTagarAdmin(id) { ... }

// Mutation: simpan tagar
export function useSimpanTagarAdmin() { ... }

// Mutation: hapus tagar
export function useHapusTagarAdmin() { ... }

// Query: tagar untuk satu entri (dipakai di form edit entri)
export function useTagarEntri(entriId) { ... }

// Mutation: simpan tagar untuk entri
export function useSimpanTagarEntri() { ... }
```

### 5.3 Halaman Admin: `frontend/src/halaman/redaksi/TagarAdmin.jsx`

Halaman baru mengikuti pola `LabelAdmin.jsx`. Fitur:
- Tabel daftar tagar dengan kolom: nama, kode, kategori, aktif, aksi (edit/hapus)
- Filter: pencarian teks, filter kategori
- Form modal: tambah/edit tagar (nama, kode, kategori, deskripsi, urutan, aktif)
- Konfirmasi hapus

### 5.4 Integrasi di Halaman Detail Kamus

Di `frontend/src/halaman/publik/KamusDetail.jsx`, tampilkan tagar morfologis jika ada:

```jsx
{/* Contoh tampilan */}
{entri.tagar && entri.tagar.length > 0 && (
  <div className="tagar-entri">
    <span className="label-seksi">Pembentukan kata:</span>
    {entri.tagar.map(t => (
      <a key={t.kode} href={`/kamus/tagar/${t.kode}`} className="chip-tagar">
        {t.nama}
      </a>
    ))}
  </div>
)}
```

### 5.5 Halaman Publik: Indeks Tagar

Opsional (fase berikutnya): halaman `/kamus/tagar/:kode` yang menampilkan semua entri dengan tagar tertentu. Mengikuti pola halaman `/kamus/kategori/:kategori/:kode` yang sudah ada.

### 5.6 Integrasi di Form Edit Entri Admin

Di `frontend/src/halaman/redaksi/KamusAdmin.jsx` (form edit entri), tambahkan seksi "Tagar Morfologis":
- Multi-select dari daftar tagar yang tersedia (dikelompokkan per kategori)
- Simpan via `PUT /api/redaksi/kamus/:id/tagar`

---

## 6. Langkah Implementasi

Urutan pengerjaan yang disarankan:

1. **[DB]** Buat file migrasi SQL: `_docs/202603/YYYYMMDDHHMM_tambah-tabel-tagar.sql`
   - CREATE TABLE `tagar` dan `entri_tagar`
   - INSERT izin `kelola_tagar`
   - INSERT data awal tagar (seed morfologis)
   - Assign izin ke peran admin/redaksi

2. **[Backend]** Buat `backend/models/modelTagar.js`
   - Implementasikan semua method yang dirancang di atas

3. **[Backend]** Buat `backend/routes/publik/tagar.js` + daftarkan di index
   - GET all tags, GET entries per tag

4. **[Backend]** Buat `backend/routes/redaksi/tagar.js` + daftarkan di index
   - CRUD tagar, GET/PUT tagar-per-entri

5. **[Backend]** Modifikasi query detail kamus untuk menyertakan tagar entri
   - Di model atau route handler `kamus.js`

6. **[Backend]** Jalankan `npm run lint && npm run test` di `backend/`

7. **[Frontend]** Tambahkan fungsi ke `apiPublik.js` dan hooks ke `apiAdmin.js`

8. **[Frontend]** Buat `TagarAdmin.jsx`

9. **[Frontend]** Integrasikan tagar di `KamusDetail.jsx` (tampilan publik)

10. **[Frontend]** Integrasikan form tagar di halaman edit entri admin

11. **[Frontend]** Jalankan `npm run lint && npm run test` di `frontend/`

12. **[DB]** Jalankan `node scripts/db-schema.js` untuk update `_docs/struktur-data.sql`

---

## 7. Pertanyaan Terbuka

Beberapa hal yang perlu dikonfirmasi sebelum implementasi:

1. **Apakah satu entri bisa punya banyak tagar dari kategori yang sama?** (mis. `memperebutkan` punya `meng-` dan `per-`, keduanya prefiks) → Asumsi: **ya**, tidak ada constraint unik per-kategori.

2. **Apakah tagar perlu urutan dalam konteks satu entri?** (mis. prefiks selalu sebelum sufiks) → Asumsi: **tidak perlu** — urutan bisa diinferensikan dari kategori. Jika perlu, tambahkan kolom `urutan` ke `entri_tagar`.

3. **Apakah halaman indeks per tagar** (`/kamus/tagar/meng-`) **termasuk scope MVP?** → Asumsi: opsional, bisa ditunda.

4. **Siapa yang bisa mengedit tagar entri?** → Asumsi: siapapun yang memiliki izin `edit_entri` (sama dengan mengedit makna/contoh).

---

## 8. Referensi

- Skema aktual: [_docs/struktur-data.sql](../../_docs/struktur-data.sql)
- Pola model label: [backend/models/modelLabel.js](../../backend/models/modelLabel.js)
- Pola route publik: [backend/routes/publik/kamus.js](../../backend/routes/publik/kamus.js)
- Pola route redaksi: [backend/routes/redaksi/](../../backend/routes/redaksi/)
- Pola API frontend: [frontend/src/api/apiAdmin.js](../../frontend/src/api/apiAdmin.js)
