# Fitur Populer Beranda dan Cache API

Tanggal: 2026-03-02

## Ringkasan

Menambahkan endpoint publik untuk mengambil frasa pencarian populer lintas domain, lalu menampilkannya sebagai tautan cepat di beranda tepat di bawah kotak cari.

Format UI:

Populer: <kamus> <tesaurus> <glosarium> <makna> <rima>

## Perubahan Backend

### Endpoint baru

- `GET /api/publik/pencarian/populer`
- Query opsional:
  - `tanggal=YYYY-MM-DD` (disarankan dari tanggal lokal browser pengguna)

Perilaku tanggal:

- API mencoba mengambil data pada `tanggal` yang diminta.
- Jika tanggal itu belum ada data, API otomatis mundur ke tanggal sebelumnya yang tersedia (per domain).
- Respons mengembalikan:
  - `tanggal`: tanggal yang diminta
  - `tanggalData`: tanggal data efektif terbaru yang ditemukan di hasil

Contoh respons:

```json
{
  "tanggal": "2026-03-02",
  "tanggalData": "2026-03-01",
  "data": {
    "kamus": "air",
    "tesaurus": "kata",
    "glosarium": "istilah",
    "makna": "arti",
    "rima": "sajak"
  }
}
```

### Sumber data

Mengambil dari tabel `pencarian` (domain 1..5), mencari tanggal aktif terakhir `<= tanggal` per domain, lalu memilih 1 frasa dengan total `jumlah` tertinggi pada tanggal aktif tersebut (`ROW_NUMBER() OVER (PARTITION BY domain, tanggal ...)`).

### Cache

- Menggunakan `backend/services/layananCache.js` (Redis + fallback in-memory sesuai konfigurasi cache global).
- Key cache: `publik:pencarian:populer:v1:<periode>`.
- Key cache: `publik:pencarian:populer:v2:<tanggal>`.
- TTL cache khusus endpoint: env `POPULAR_SEARCH_CACHE_TTL_SECONDS` (default 300 detik, dibatasi 60..3600).
- Header HTTP:
  - `Cache-Control: public, max-age=60, stale-while-revalidate=<ttl>`

## Perubahan Frontend

- Menambahkan pemanggilan API `ambilPencarianPopuler()` pada halaman beranda.
- Frontend mengirim `tanggal` berdasarkan tanggal lokal browser (bukan tanggal server).
- Menampilkan 5 tautan populer berurutan untuk:
  1. kamus
  2. tesaurus
  3. glosarium
  4. makna
  5. rima
- Jika data domain kosong/gagal dimuat, ditampilkan placeholder nama domain agar layout tetap konsisten.

## File yang diubah

- `backend/models/modelPencarian.js`
- `backend/routes/publik/pencarian.js` (baru)
- `backend/routes/publik/index.js`
- `frontend/src/api/apiPublik.js`
- `frontend/src/halaman/publik/Beranda.jsx`
- `frontend/src/styles/index.css`
- `backend/__tests__/models/modelPencarian.test.js`
- `backend/__tests__/routes/routesPublik.test.js`
- `frontend/__tests__/api/apiPublik.test.js`
- `frontend/__tests__/halaman/publik/Beranda.test.jsx`
- `README.md`
- `frontend/public/changelog.md`
