# Penerapan Pohon Kalimat — Catatan Implementasi Aktual

**Tanggal**: 2026-03-27
**Status**: Selesai diterapkan dan divalidasi

## Ringkasan

Alat Pohon Kalimat sudah diperluas untuk mendukung struktur yang lebih kaya, tetapi antarmukanya juga disederhanakan agar tidak terlalu membebani pengguna. Implementasi aktual saat ini mencakup:

1. Singkatan gramatikal dipakai langsung di bagan.
2. Konjungsi selalu tampil dengan induk `Konj`.
3. Ekspor hanya tersedia sebagai PNG dengan satu tombol `Unduh`.
4. Legenda di dalam bagan hanya menampilkan singkatan yang benar-benar dipakai pada susunan aktif.
5. Opsi UI untuk menampilkan `Klausa Utama` dihapus agar panel masukan lebih ringkas.
6. Dropdown builder menampilkan nama penuh, bukan singkatan kode.
7. Opsi segitiga dihapus dari model, UI, dan contoh.
8. `KetOps` dihapus; seluruh keterangan memakai `Ket`.
9. Pemilihan contoh memakai dropdown ringkas di sisi kanan header panel masukan, bukan deretan tombol.

## File yang Diubah

1. `frontend/src/pages/publik/alat/pohon-kalimat/pohonKalimatModel.js`
2. `frontend/src/pages/publik/alat/pohon-kalimat/PohonKalimatDiagram.jsx`
3. `frontend/src/pages/publik/alat/PohonKalimat.jsx`
4. `frontend/src/styles/alat.css`
5. `frontend/public/halaman/alat/pohon-kalimat.md`
6. `frontend/__tests__/pages/publik/alat/pohon-kalimat/pohonKalimatModel.test.js`
7. `frontend/__tests__/pages/publik/alat/PohonKalimat.test.jsx`

## Perilaku Model

- `PERAN` mencakup `O` dan `Konj`.
- `JENIS_FRASA` mencakup bentuk frasa dan kategori kata tunggal seperti `V`, `N`, `Adj`, `Adv`, dan `Pron`.
- Konstituen dapat direalisasikan sebagai frasa atau klausa melalui properti `realisasi` dan `klausaAnak`.
- `KetOps` sudah dihapus dari model peran.
- Properti `klausaUtama` masih didukung oleh model untuk state contoh yang membutuhkannya, tetapi tidak lagi diekspos sebagai pilihan UI.

## Perilaku Bagan

- Semua label peran dan jenis frasa ditampilkan dalam bentuk singkatan.
- Konjungsi pada kalimat majemuk maupun subklausa tersisip dibungkus sebagai nodus `Konj` dengan anak berupa teks konjungsi.
- Legenda dirakit otomatis dari nodus yang benar-benar muncul pada bagan saat ini.
- Nodus segitiga tidak lagi didukung.

## Perilaku UI

- Panel hasil hanya memiliki satu aksi unduh: `Unduh`.
- Tombol tersebut menghasilkan PNG resolusi 2×.
- Catatan teks di bawah bagan dihapus karena informasi penting sudah masuk ke legenda bagan dan dokumentasi alat.
- Opsi `Tampilkan Klausa Utama` dihapus dari panel masukan.
- Dropdown peran dan jenis frasa menampilkan nama penuh agar dua dropdown tetap mudah dipindai saat disejajarkan.
- Contoh cepat dipilih melalui satu dropdown di sisi kanan header panel masukan agar daftar contoh tidak memakan banyak ruang horizontal maupun vertikal.

## Istilah

- Di kode fitur ini, istilah internal diseragamkan menjadi `nodus` agar selaras dengan istilah yang dipakai di antarmuka dan dokumentasi.

## Validasi

Validasi yang dijalankan setelah perubahan:

```bash
Set-Location frontend
npm run lint
npx vitest related --run src/pages/publik/alat/PohonKalimat.jsx src/pages/publik/alat/pohon-kalimat/pohonKalimatModel.js src/pages/publik/alat/pohon-kalimat/PohonKalimatDiagram.jsx src/styles/alat.css
```

Hasil terakhir: lint lulus dan seluruh test terkait lulus.
