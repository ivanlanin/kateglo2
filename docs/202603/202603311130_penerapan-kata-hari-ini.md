# Penerapan Kata Hari Ini

Tanggal: 31 Maret 2026

## Ringkasan

Fitur Kata Hari Ini ditambahkan sebagai kartu ringkas di beranda Kateglo dan dilayani melalui endpoint publik baru:

- `GET /api/publik/kamus/kata-hari-ini`

Versi saat ini memakai tabel `kata_hari_ini` sebagai arsip pemilihan kata per tanggal. Jika tanggal yang diminta belum ada di tabel, backend memilih kandidat secara otomatis, menyimpan referensi entrinya, lalu membentuk payload publik langsung dari data kamus terkini.

## Tujuan Implementasi

- Menambah elemen engagement harian di beranda.
- Memakai data kamus yang sudah kaya: makna, contoh kalimat, dan etimologi.
- Menyediakan arsip tanggal yang stabil dan bisa diedit admin.
- Menjaga tabel tetap sederhana dengan hanya menyimpan referensi entri dan metadata editorial minimum.

## Perubahan Backend

### Endpoint Baru

- `GET /api/publik/kamus/kata-hari-ini`
- Query opsional:
  - `tanggal=YYYY-MM-DD`

Jika `tanggal` tidak valid atau tidak dikirim, backend memakai tanggal hari ini zona waktu `Asia/Jakarta`.

### Tabel Baru

Tabel `kata_hari_ini` menyimpan satu baris per tanggal dengan kolom inti berikut:

- `tanggal`
- `entri_id`
- `sumber`
- `catatan`
- `created_at`
- `updated_at`

Constraint utama:

- unique pada `tanggal`
- `sumber` hanya `auto` atau `admin`

Tidak ada kolom `diubah_oleh`. Admin tetap bisa mengedit data melalui mekanisme administrasi berikutnya tanpa menyimpan identitas editor di tabel ini.

### Strategi Pemilihan

Pemilihan kandidat dilakukan di model entri dengan dua tingkat filter:

1. Kandidat utama:
   - entri aktif
   - induk `NULL`
   - `jenis = 'dasar'`
   - bukan entri rujukan
   - punya minimal 1 makna aktif yang tidak kosong
   - punya minimal 1 contoh aktif yang tidak kosong
   - punya minimal 1 etimologi aktif yang punya bahasa atau kata asal

2. Fallback:
   - sama seperti di atas, tetapi tanpa syarat etimologi

Saat endpoint dipanggil, alurnya seperti ini:

1. Cek `kata_hari_ini` berdasarkan tanggal.
2. Jika ada, ambil entri kamus terkini berdasarkan referensi yang tersimpan lalu bentuk payload publik.
3. Jika belum ada, pilih kandidat otomatis dari data kamus.
4. Simpan referensi entri dan metadata editorialnya ke `kata_hari_ini`.
5. Kembalikan payload yang dibentuk dari data kamus saat ini.

Pemilihan otomatis masih memakai hash tanggal untuk menentukan offset kandidat:

`offset = hash(tanggal) % total_kandidat`

Dengan pendekatan ini:

- kata untuk tanggal yang sama akan tetap konsisten
- hasil tanggal yang pernah diminta akan punya arsip persisten di database
- perubahan makna, contoh, atau etimologi di kamus akan otomatis tercermin di publik
- admin bisa mengganti kata untuk tanggal tertentu tanpa menyimpan salinan snapshotnya

### Payload Respons

Contoh respons:

```json
{
  "tanggal": "2026-03-31",
  "indeks": "aktif",
  "entri": "aktif",
  "url": "/kamus/detail/aktif",
  "kelas_kata": "a",
  "makna": "giat dalam bekerja",
  "contoh": "Ia sangat aktif di kelas.",
  "pemenggalan": "ak.tif",
  "lafal": "aktif",
  "etimologi": {
    "bahasa": "Arab",
    "bahasa_kode": null,
    "kata_asal": "faal",
    "sumber": null,
    "sumber_kode": null
  }
}
```

Jika belum ada kandidat yang layak, endpoint mengembalikan `404` dengan pesan `Kata Hari Ini belum tersedia`.

### Cache

Respons di-cache per tanggal dengan key:

- `kamus:kata-hari-ini:<tanggal>`

Header HTTP:

- `Cache-Control: public, max-age=300, stale-while-revalidate=900`

Cache tetap dipakai sebagai lapisan baca, tetapi sumber kebenaran pemilihan kata tetap tabel `kata_hari_ini`, sedangkan isi payload publik dibentuk ulang dari kamus saat dibaca.

## Perubahan Frontend

### Beranda

Beranda kini memuat dua data secara paralel:

- pencarian populer
- Kata Hari Ini

Kartu Kata Hari Ini ditampilkan dalam grid sorotan di bawah hero pencarian, berdampingan dengan kartu `KuisKata` dan memakai shell visual yang seragam.

Elemen yang ditampilkan:

- judul entri
- metadata ringkas: kelas kata, pemenggalan, lafal
- satu makna utama
- satu contoh kalimat
- ringkasan etimologi
- tautan cepat ke halaman detail kamus

Jika API gagal atau data tidak tersedia, kartu tidak dirender agar beranda tetap stabil.

## File Utama yang Berubah

- `backend/models/leksikon/modelEntri.js`
- `backend/models/leksikon/modelKataHariIni.js`
- `backend/services/publik/layananKamusPublik.js`
- `backend/routes/publik/leksikon/kamus.js`
- `docs/202603/202603311215_tambah_tabel_kata_hari_ini.sql`
- `docs/202603/202603311300_sederhanakan_tabel_kata_hari_ini.sql`
- `frontend/src/api/apiPublik.js`
- `frontend/src/pages/publik/Beranda.jsx`
- `frontend/src/styles/index.css`

## Trade-off Versi Tabel

Kelebihan:

- ada arsip resmi per tanggal
- hasil publik stabil walaupun entri berubah di kemudian hari
- siap untuk override admin
- endpoint tetap bisa auto-backfill saat tanggal baru diminta

Keterbatasan:

- menambah migration dan model baru
- edit admin khusus Kata Hari Ini belum dibuat di UI redaksi
- belum ada mekanisme blacklist kandidat khusus untuk fitur ini

## Rekomendasi Fase Lanjutan

1. Tambah endpoint redaksi untuk override manual per tanggal.
2. Tambah halaman arsip `/kata-hari-ini` dengan navigasi per tanggal.
3. Tambah aturan blacklist kandidat agar entri yang kurang representatif bisa dikeluarkan dari rotasi otomatis.
4. Tambah integrasi SEO dan Open Graph untuk halaman arsip harian.