# Konvensi Gambar Gramatika

Folder ini menampung gambar statis yang dipakai oleh halaman Gramatika.

## Aturan penempatan

- Semua gambar Gramatika dipusatkan di `frontend/public/gramatika/gambar/`.
- Gunakan subfolder per bab jika jumlah gambar mulai bertambah, misalnya `bab-03/`, `bab-04/`, dan seterusnya.
- Referensi dari markdown memakai path absolut publik, misalnya `/gramatika/gambar/bab-03/bagan-03-01-alat-ucap.webp`.

## Aturan penamaan

- Nama file memakai huruf kecil semua dan kata dipisahkan dengan tanda hubung.
- Pola utama: `{jenis}-{bab-dua-digit}-{nomor-dua-digit}-{slug}`.
- Contoh:
  - `bagan-03-01-alat-ucap.webp`
  - `bagan-03-02-vokal.webp`
  - `tabel-09-05-pemenggalan-kata.webp`

## Aturan pemakaian

- Gunakan gambar hanya untuk bagan, diagram, pohon, atau tabel kompleks yang kehilangan makna jika dipaksa ke markdown biasa.
- Tetap pertahankan transkripsi teks, caption, atau uraian singkat di bawah gambar agar isi tetap dapat dicari dan dibaca tanpa bergantung penuh pada asset visual.
- Simpan aset yang dipakai frontend dalam format `webp`.
- Jika perlu menyimpan master kerja dengan format lain, letakkan di luar folder publik ini agar tidak ikut terlayani ke frontend.

## Contoh markdown

```md
![Bagan 3.1 Alat Ucap](/gramatika/gambar/bab-03/bagan-03-01-alat-ucap.webp)

**Bagan 3.1 Alat Ucap**
```
