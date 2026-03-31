# Generator Hari Peringatan 2026

Dokumen ini menjelaskan cara membuat ulang workbook pendukung `hari-peringatan.xlsx` untuk pemakaian manual redaksi.

## Artefak

- Output utama: `.data/pendukung/hari-peringatan.xlsx`
- Generator: `backend/scripts/analisis/generate_hari_peringatan_2026.py`

## Sumber Data

Workbook 2026 digabung dari beberapa sumber berikut:

1. `Nager.Date`
   - Endpoint: `https://date.nager.at/api/v3/PublicHolidays/2026/ID`
   - Dipakai untuk hari libur nasional Indonesia 2026 yang sudah berwujud tanggal Gregorian pasti.

2. `Wikipedia Indonesia`
   - Halaman: `https://id.wikipedia.org/wiki/Daftar_hari_penting_di_Indonesia`
   - Diambil lewat MediaWiki API agar lebih stabil untuk diparse dibanding HTML publik.
   - Dipakai untuk daftar hari penting Indonesia yang punya tanggal Gregorian tetap.

3. `Kurasi resmi`
   - Beberapa entri penting dari sumber resmi seperti `PBB`, `UNESCO`, dan `WHO` ditambahkan langsung di skrip.
   - Ini dipakai untuk observance internasional yang penting untuk konteks editorial, sekaligus mengurangi ketergantungan pada scraping halaman resmi yang tidak selalu ramah otomasi.

## Aturan Seleksi Data

Generator sengaja tidak mengambil seluruh item mentah. Aturan saat ini:

1. Hanya ambil tanggal Gregorian pasti di tahun 2026.
2. Abaikan tanggal bergerak, rentang tanggal, dan entri dengan tanggal tidak diketahui.
3. Untuk sumber Wikipedia, abaikan entri yang jelas bukan peringatan editorial umum, misalnya ulang tahun tokoh, hubungan diplomatik, dan ulang tahun provinsi/kota.
4. Jika tanggal dan nama peringatan sama muncul dari lebih dari satu sumber, prioritas sumber adalah `PBB/UNESCO/WHO`, lalu `Nager.Date`, lalu `Wikipedia Indonesia`.

## Struktur Workbook

Sheet utama berisi kolom berikut:

- `tanggal`
- `peringatan`
- `kategori`
- `sumber`
- `tautan`

Data diurutkan berdasarkan `tanggal`, lalu nama peringatan.

## Cara Generate Ulang

Jalankan dari root repo:

```powershell
Set-Location "C:/Kode/Kateglo/kateglo"
$py = "C:/Kode/Kateglo/kateglo/.venv/Scripts/python.exe"
& $py backend/scripts/analisis/generate_hari_peringatan_2026.py
```

Jika generator berhasil, file ini akan diperbarui:

```text
.data/pendukung/hari-peringatan.xlsx
```

## Catatan Operasional

1. Workbook ini adalah data pendukung manual, bukan sumber data utama aplikasi.
2. Jika nanti ingin menambah sumber baru, utamakan sumber resmi atau API yang stabil, lalu tambahkan aturan filter yang eksplisit di generator.
3. Jika ada kebutuhan tahun lain, cara paling aman adalah menduplikasi generator ini lalu mengganti konstanta `YEAR` dan sumber yang spesifik tahunnya.