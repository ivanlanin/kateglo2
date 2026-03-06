# Rancangan Gim Pilih Ganda

Tanggal: 2026-03-07
Status: Rancangan

---

## Latar Belakang

Gim sederhana berbasis kuis untuk menarik pengunjung beranda Kateglo. Terinspirasi dari Google Word Games (Kuis Kata). Pemain menjawab 5 soal pilihan ganda per ronde, satu soal per domain utama Kateglo.

Tujuan jangka pendek: meningkatkan engagement dan waktu kunjungan di beranda.
Tujuan jangka panjang: menjadi daya tarik untuk mendaftar akun (Fase 2).

---

## Fase

### Fase 1 (Rancangan ini)
- Tidak perlu login
- Skor hanya disimpan di memori sesi browser (hilang saat halaman ditutup)
- Widget embedded di beranda, bukan halaman terpisah
- 5 soal per ronde, satu per domain

### Fase 2 (Masa depan)
- Skor harian tersimpan jika login
- Streak harian (main tiap hari = streak naik) — hook utama untuk registrasi
- Riwayat kata yang pernah dijawab salah → daftar belajar personal
- Lencana/pencapaian

---

## Mekanisme Permainan

**Per ronde:**
1. Backend menyiapkan 5 soal — satu dari tiap domain (kamus, tesaurus, glosarium, makna, rima) — dalam urutan acak
2. Pemain melihat soal satu per satu: pertanyaan + 2 tombol pilihan
3. Setelah memilih, tampil umpan balik (benar/salah) + penjelasan singkat
4. Tombol "Lanjut" → soal berikutnya
5. Setelah soal ke-5, tampil ringkasan ronde: skor total, semua soal + ✓/✗ + penjelasan
6. Tombol "Ronde berikutnya" → muat 5 soal baru

**Skor:**
- Benar = +100 poin
- Salah = +0 poin
- Maks per ronde: 500 poin

---

## Lima Domain Soal

### 1. Kamus
- **Pertanyaan**: "Apa arti dari **[indeks]**?"
- **Pilihan**: definisi benar (dari tabel `makna`) vs. definisi acak dari entri lain
- **Penjelasan**: "[indeks] artinya: [definisi benar]."
- **SQL inti**:
  ```sql
  -- Soal: ambil entri aktif acak yang punya makna
  SELECT e.indeks, m.makna AS makna_benar
  FROM entri e
  JOIN makna m ON m.entri_id = e.id
  WHERE e.aktif = 1 AND e.jenis = 'dasar' AND e.jenis_rujuk IS NULL
    AND m.aktif = true AND m.polisem = 1
    AND CHAR_LENGTH(e.indeks) BETWEEN 4 AND 12
    AND e.indeks NOT LIKE '% %'
  ORDER BY RANDOM() LIMIT 1;

  -- Distractor: makna dari entri berbeda
  SELECT m.makna AS makna_salah
  FROM makna m
  JOIN entri e ON e.id = m.entri_id
  WHERE m.aktif = true AND m.polisem = 1
    AND e.indeks != $1
  ORDER BY RANDOM() LIMIT 1;
  ```

### 2. Tesaurus
- **Pertanyaan**: "Mana sinonim dari **[indeks]**?"
- **Pilihan**: sinonim benar (dari kolom `sinonim` tabel `tesaurus`) vs. kata acak dari `entri`
- **Penjelasan**: "[sinonim benar] adalah sinonim dari [indeks]."
- **Catatan**: kolom `sinonim` berisi string dipisah koma — ambil satu token acak sebagai jawaban benar
- **SQL inti**:
  ```sql
  -- Soal: entri tesaurus yang punya sinonim
  SELECT t.indeks, t.sinonim
  FROM tesaurus t
  WHERE t.aktif = true AND t.sinonim IS NOT NULL AND t.sinonim != ''
  ORDER BY RANDOM() LIMIT 1;

  -- Distractor: kata acak dari entri (bukan sinonim soal ini)
  SELECT e.indeks AS kata_salah
  FROM entri e
  WHERE e.aktif = 1 AND e.jenis = 'dasar' AND e.jenis_rujuk IS NULL
    AND e.indeks != $1 AND e.indeks NOT LIKE '% %'
  ORDER BY RANDOM() LIMIT 1;
  ```

### 3. Glosarium
- **Pertanyaan**: "Apa padanan Indonesia dari *[asing]*?"
- **Pilihan**: istilah Indonesia benar (kolom `indonesia`) vs. istilah Indonesia acak dari entri glosarium lain
- **Penjelasan**: "Padanan Indonesia dari '[asing]' adalah [indonesia benar]."
- **SQL inti**:
  ```sql
  -- Soal + jawaban benar
  SELECT g.asing, g.indonesia AS indonesia_benar
  FROM glosarium g
  WHERE g.aktif = true AND g.bahasa = 'en'
    AND CHAR_LENGTH(g.asing) BETWEEN 3 AND 20
  ORDER BY RANDOM() LIMIT 1;

  -- Distractor: indonesia dari entri glosarium lain
  SELECT g.indonesia AS indonesia_salah
  FROM glosarium g
  WHERE g.aktif = true AND g.indonesia != $1
  ORDER BY RANDOM() LIMIT 1;
  ```

### 4. Makna (Kamus Terbalik)
- **Pertanyaan**: "Kata mana yang bermakna: *[potongan makna]*?"
- **Pilihan**: indeks entri benar vs. indeks entri acak lain
- **Penjelasan**: "Kata yang bermakna '[makna]' adalah [indeks benar]."
- **Catatan**: potong makna maks ~80 karakter agar soal tidak terlalu panjang
- **SQL inti**:
  ```sql
  -- Soal: ambil makna + entri terkait
  SELECT e.indeks AS indeks_benar, m.makna
  FROM makna m
  JOIN entri e ON e.id = m.entri_id
  WHERE m.aktif = true AND m.polisem = 1
    AND e.aktif = 1 AND e.jenis = 'dasar' AND e.jenis_rujuk IS NULL
    AND CHAR_LENGTH(m.makna) BETWEEN 10 AND 80
    AND e.indeks NOT LIKE '% %'
  ORDER BY RANDOM() LIMIT 1;

  -- Distractor: indeks dari entri lain
  SELECT e.indeks AS indeks_salah
  FROM entri e
  WHERE e.aktif = 1 AND e.jenis = 'dasar' AND e.indeks != $1
    AND e.indeks NOT LIKE '% %'
  ORDER BY RANDOM() LIMIT 1;
  ```

### 5. Rima
- **Pertanyaan**: "Mana yang berima dengan **[kata]**?"
- **Pilihan**: kata yang berima (akhiran sama ≥3 huruf) vs. kata yang tidak berima
- **Penjelasan**: "[jawaban benar] berima dengan [soal] (keduanya berakhiran -[akhiran])."
- **SQL inti**:
  ```sql
  -- Soal: kata acak panjang 4-8 huruf dari entri dasar
  SELECT e.indeks AS soal
  FROM entri e
  WHERE e.aktif = 1 AND e.jenis = 'dasar' AND e.jenis_rujuk IS NULL
    AND e.indeks NOT LIKE '% %'
    AND CHAR_LENGTH(e.indeks) BETWEEN 4 AND 8
  ORDER BY RANDOM() LIMIT 1;

  -- Jawaban benar: kata lain dengan akhiran sama (3 huruf terakhir)
  SELECT e.indeks AS rima_benar
  FROM entri e
  WHERE e.aktif = 1 AND e.jenis = 'dasar'
    AND e.indeks NOT LIKE '% %'
    AND RIGHT(LOWER(e.indeks), 3) = RIGHT(LOWER($1), 3)
    AND e.indeks != $1
  ORDER BY RANDOM() LIMIT 1;

  -- Distractor: kata dengan akhiran berbeda
  SELECT e.indeks AS rima_salah
  FROM entri e
  WHERE e.aktif = 1 AND e.jenis = 'dasar'
    AND e.indeks NOT LIKE '% %'
    AND RIGHT(LOWER(e.indeks), 3) != RIGHT(LOWER($1), 3)
  ORDER BY RANDOM() LIMIT 1;
  ```
- **Fallback**: jika tidak ada rima yang cocok, ganti ke soal kamus

---

## Desain API

### Endpoint

```
GET /api/publik/gim/pilih-ganda/ronde
```

Tidak menerima parameter. Mengembalikan 5 soal sekaligus (untuk menghindari 5 round-trip terpisah).

### Respons

```json
{
  "ronde": [
    {
      "mode": "kamus",
      "soal": "jaksa",
      "konteks": null,
      "pilihan": ["penuntut umum", "penjaga gudang"],
      "jawaban": 0,
      "penjelasan": "Jaksa artinya: penuntut umum."
    },
    {
      "mode": "tesaurus",
      "soal": "berani",
      "konteks": null,
      "pilihan": ["pengecut", "pemberani"],
      "jawaban": 1,
      "penjelasan": "Pemberani adalah sinonim dari berani."
    },
    {
      "mode": "glosarium",
      "soal": "prosecutor",
      "konteks": null,
      "pilihan": ["jaksa", "hakim"],
      "jawaban": 0,
      "penjelasan": "Padanan Indonesia dari 'prosecutor' adalah jaksa."
    },
    {
      "mode": "makna",
      "soal": "orang yang bertugas mengadili perkara",
      "konteks": null,
      "pilihan": ["hakim", "jaksa"],
      "jawaban": 0,
      "penjelasan": "Kata yang bermakna 'orang yang bertugas mengadili perkara' adalah hakim."
    },
    {
      "mode": "rima",
      "soal": "laut",
      "konteks": null,
      "pilihan": ["perahu", "maut"],
      "jawaban": 1,
      "penjelasan": "Maut berima dengan laut (keduanya berakhiran -aut)."
    }
  ]
}
```

**Catatan keamanan**: field `jawaban` dikirim bersama soal karena Fase 1 tidak ada akun dan tidak ada taruhan. Ini menyederhanakan frontend dan tidak ada kerugian nyata.

Urutan `pilihan` diacak di backend sebelum dikirim (sehingga jawaban benar tidak selalu di posisi yang sama).

---

## Desain Frontend

### Lokasi komponen

```
frontend/src/komponen/publik/GimPilihGanda.jsx
```

Dipanggil dari `frontend/src/halaman/publik/Beranda.jsx`, di bawah blok pencarian utama.

### State mesin

```
MEMUAT → SOAL (indeks 0-4) → RINGKASAN → SOAL (ronde baru, kembali ke indeks 0)
```

Transisi detail:
- `MEMUAT`: fetch API, tampilkan skeleton/spinner
- `SOAL`: tampilkan satu soal, 2 tombol pilihan
  - Sebelum pilih: kedua tombol aktif
  - Setelah pilih: tombol yang dipilih highlight (hijau/merah), tombol lain redup, muncul teks penjelasan + tombol "Lanjut"
  - Tombol "Lanjut" di soal ke-5 → transisi ke `RINGKASAN`
- `RINGKASAN`: tampilkan skor, semua soal dengan ✓/✗ + penjelasan, tombol "Ronde berikutnya"
  - "Ronde berikutnya" → fetch ronde baru → kembali ke `MEMUAT`

### State data

```js
{
  fase: 'memuat' | 'soal' | 'ringkasan',
  ronde: [...],          // 5 soal dari API
  indeks: 0,             // soal ke berapa (0-4)
  jawaban: [null, ...],  // null = belum dijawab, 0/1 = pilihan user
  skor: 0,               // akumulasi poin
}
```

### Tampilan per soal

```
[Label mode kecil: "Kamus • Soal 1/5"]

Apa arti dari jaksa?

[ penuntut umum ]
[ penjaga gudang ]
```

Setelah menjawab:
```
[Label mode kecil: "Kamus • Soal 1/5"]

Apa arti dari jaksa?

[ ✓ penuntut umum ]   ← hijau
[ penjaga gudang ]    ← redup

Jaksa artinya: penuntut umum.

                    [ Lanjut → ]
```

### Tampilan ringkasan

```
Skor • 400 / 500

4/5 Hampir sempurna!

[ Ronde berikutnya ]

──────────────────────────
✓  Apa arti dari jaksa?        ˄
   ✓ penuntut umum
   ✗ penjaga gudang
   Jaksa artinya: penuntut umum.
──────────────────────────
✓  Mana sinonim dari berani?   ˅
...
```

Tiap soal di ringkasan bisa dilipat/dibuka (accordion sederhana).

### Label skor

| Skor | Label |
|---:|---|
| 500 | Sempurna! |
| 400 | Hampir sempurna! |
| 300 | Lumayan! |
| 200 | Terus berlatih! |
| 0–100 | Coba lagi! |

---

## Struktur File Baru

```
backend/
  models/modelPilihGanda.js       ← query untuk 5 mode
  routes/gim/pilihGanda.js        ← route handler
  routes/gim/index.js             ← tambah: router.use('/pilih-ganda', ...)

frontend/
  src/
    komponen/publik/
      GimPilihGanda.jsx           ← komponen utama
    api/
      apiPublik.js                ← tambah: ambilRondePilihGanda()
    halaman/publik/
      Beranda.jsx                 ← tambah widget GimPilihGanda
```

---

## Pertimbangan Teknis

### Rate limiting
Endpoint ini menggunakan `publicApiLimiter` yang sudah ada. Tidak perlu limiter khusus karena satu pengguna hanya perlu 1 request per ronde.

### Error handling
Jika salah satu dari 5 mode gagal diambil (misal: tidak ada data rima yang cocok), fallback ke mode kamus dengan soal berbeda. Backend tidak boleh mengembalikan respons parsial.

### Fallback rima
Karena rima bergantung pada ketersediaan kata berakhiran sama, jika query gagal mendapat pasangan dalam 3 percobaan, ganti mode rima dengan mode kamus (soal ke-6 yang disiapkan backup).

---

## Rencana Implementasi

1. Backend: `backend/models/modelPilihGanda.js` — 5 metode query
2. Backend: `backend/routes/gim/pilihGanda.js` — route + fallback logic
3. Backend: daftarkan route di `backend/routes/gim/index.js`
4. Frontend: tambah `ambilRondePilihGanda()` di `apiPublik.js`
5. Frontend: buat `GimPilihGanda.jsx`
6. Frontend: integrasikan di `Beranda.jsx`
