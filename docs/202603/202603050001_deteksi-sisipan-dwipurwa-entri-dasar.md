# Deteksi Sisipan dan Dwipurwa dari Entri Dasar

**Tanggal dibuat**: 2026-03-05
**Diperbarui**: 2026-03-05 (ditambah: analisis etimologi + masalah homonim)
**Skrip**: `backend/scripts/deteksi-sisipan-dwipurwa.js`
**CSV hasil**: `_docs/202603/202603051204_kandidat-sisipan-dwipurwa.csv`
**CSV terfilter (makna)**: `_docs/202603/202603051219_kandidat-sisipan-dwipurwa-lolos-makna.csv`
**Status**: Pendataan awal + penyaringan makna selesai — belum menulis ke database

---

## 1. Latar Belakang

Proses seed tagar di `seed-entri-tagar.js` menangani entri `jenis = 'turunan'`
dengan memanfaatkan kolom `entri.induk` yang sudah diisi. Entri tersebut
memiliki basis yang diketahui, sehingga pola imbuhan dapat dideteksi dengan
membandingkan string entri terhadap string induknya.

Namun, sebagian entri yang mengandung sisipan atau dwipurwa dikategorikan
sebagai **`jenis = 'dasar'`** dalam data sumber (KBBI lama) karena struktur
data lama tidak mencatat hierarki induk untuk pola ini. Contoh:

| Entri      | Pola   | Basis     |
|------------|--------|-----------|
| kinerja    | -in-   | kerja     |
| sinambung  | -in-   | sambung   |
| cemerlang  | -em-   | cerlang   |
| gemilang   | -em-   | gilang    |
| gemuruh    | -em-   | guruh     |
| temali     | -el-   | tali      |
| telunjuk   | -el-   | tunjuk    |
| seruling   | -er-   | suling    |
| gerigi     | -er-   | gigi      |
| tetangga   | R.purwa| tangga    |
| lelaki     | R.purwa| laki      |
| leluhur    | R.purwa| luhur     |

---

## 2. Algoritme Deteksi (Arah Terbalik)

Karena induk tidak diketahui, deteksi dilakukan secara terbalik:
dari string entri, ekstrak basis kandidat, lalu verifikasi keberadaannya di database.

### 2.1 Dwipurwa (R.purwa)

```
Pola: entri = C + 'e' + C_sama + rest
Basis: entri.slice(2)

Syarat:
  - entri[0] adalah konsonan
  - entri[1] === 'e'
  - entri[2] === entri[0]
  - basis.length >= 2

Contoh:
  "tetangga"  → 't'+'e'+'t'+'angga' → basis = "tangga"
  "lelaki"    → 'l'+'e'+'l'+'aki'   → basis = "laki"
  "rerumput"  → 'r'+'e'+'r'+'umput' → basis = "rumput"
  "jejamu"    → 'j'+'e'+'j'+'amu'   → basis = "jamu"
```

### 2.2 Sisipan (el, em, er, in)

```
Pola: entri = C + infix + rest
Basis: C + rest  (= entri[0] + entri.slice(1 + len(infix)))

Syarat:
  - entri[0] adalah konsonan
  - entri[1 : 1+len(infix)] === infix
  - basis.length >= 2

Contoh (-el-):  "temali"   → 't'+'el'+'ali' → basis = "tali"
Contoh (-em-):  "gemilang" → 'g'+'em'+'ilang' → basis = "gilang"
Contoh (-er-):  "seruling" → 's'+'er'+'uling' → basis = "suling"
Contoh (-in-):  "kinerja"  → 'k'+'in'+'erja'  → basis = "kerja"
```

### 2.3 Penanganan Sufiks

Sebelum deteksi, skrip juga mencoba strip satu sufiks terluar (an, kan, i, dll.)
dengan syarat stem hasil strip minimal 4 karakter. Ini menangkap kasus seperti:
- `sinambungan` → strip `-an` → `sinambung` → basis `sambung` (-in-)
- `dedaunan` → strip `-an` → `dedaun` → basis `daun` (R.purwa, via sufiks `-an`)

---

## 3. Hasil Eksekusi (2026-03-05)

```
Total entri dasar aktif       : 39.678
Kandidat terdeteksi (unik)    : 2.086
  - basis jenis 'dasar'       : 2.001  (95,9%)
  - basis jenis prakategorial :    73  ( 3,5%)
  - basis jenis turunan       :    12  ( 0,6%)
Kandidat tanpa strip sufiks   : 1.861
Kandidat via strip sufiks     :   225
Entri yang muncul >1 pola     :    48
```

### Distribusi per pola

| Pola     | Total | Basis ≥ 4 char (tanpa sufiks) | Keterangan estimasi             |
|----------|------:|------------------------------:|---------------------------------|
| -el-     |   776 |                           486 | ~72 rawan false positive        |
| -er-     |   699 |                           403 | ~52 rawan false positive        |
| -em-     |   266 |                           152 | mayoritas plausibel             |
| R.purwa  |   252 |                           212 | ~185 non-'b' umumnya genuine    |
| -in-     |    93 |                            35 | ~10–15 genuine; sisanya serapan |
| **Total**| **2.086** |                       |                                 |

### Distribusi sufiks (225 via-strip-sufiks)

| Sufiks | Jumlah |
|--------|-------:|
| -i     |    123 |
| -an    |     57 |
| -kan   |     13 |
| -ku    |      9 |
| -tah   |      9 |
| -kah   |      8 |
| lainnya|      6 |

---

## 4. Analisis per Pola

### 4.1 R.purwa (252 kandidat)

Distribusi konsonan awal: b (27), t (26), p (24), l (23), k (23), s (20),
d (13), r (10), m (10), j (9), c (12), g (12), n (3).

**Entri non-'b' (185 kandidat) → umumnya genuine**, karena pola `C+e+C+rest`
dengan C ≠ b tidak bisa dikacaukan dengan prefiks `be-`:

| Entri      | Basis   | Entri     | Basis   |
|------------|---------|-----------|---------|
| tetangga   | tangga  | lelaki    | laki    |
| tetap      | tap     | leluhur   | luhur   |
| sesawi     | sawi    | rerata    | rata    |
| sesepuh    | sepuh   | jejaka    | jaka    |
| pepaya     | paya    | jejamu    | jamu    |
| pepatah    | patah   | gegana    | gana    |
| dedaunan   | daunan  | kekang    | kang    |
| dedemit    | demit   | pepaku    | paku    |

**Entri 'b' (27 kandidat) → campuran genuine dan perlu verifikasi**:
- Genuine: `bebatu` ← `batu`, `beberapa` ← `berapa`, `bebali` ← `bali`
- Perlu verifikasi: `beban` ← `ban`, `bebas` ← `bas`, `bebek` ← `bek`
  (bisa jadi kata mandiri, bukan dwipurwa dari monosuku tersebut)

**Estimasi false positive R.purwa**: terutama basis < 3 char (sering
hanya suku kata, bukan kata bermakna) dan sebagian kecil kata 'b' yang
mandiri.

---

### 4.2 Sisipan -el- (776 kandidat)

Kandidat terbanyak. Dari 486 berdasar ≥ 4 char (tanpa sufiks):
- **414 konsonan awal non-'b'** → lebih meyakinkan sebagai sisipan sejati:

| Entri       | Basis    | Entri        | Basis    |
|-------------|----------|--------------|----------|
| celampak    | campak   | telunjuk     | tunjuk   |
| celempung   | cempung  | selendang    | sendang  |
| gelombang   | gombang  | gelanggang   | ganggang |
| gelitik     | gitik    | seladang     | sadang   |
| telunjuk    | tunjuk   | kelabang     | kabang   |

- **72 start `bel-` + basis start `b`** → rawan false positive (bisa `be-`
  + akar berawalan `l`, bukan sisipan `el` dalam kata berawalan `b`):
  `belabar` ← `babar`, `belacak` ← `bacak`, `belaka` ← `baka` — kasus ini
  perlu diverifikasi apakah memang ada hubungan etimologis.

---

### 4.3 Sisipan -er- (699 kandidat)

Dari 403 basis ≥ 4 char (tanpa sufiks):
- **351 konsonan awal non-'b'** → kandidat kuat:

| Entri       | Basis    | Entri        | Basis    |
|-------------|----------|--------------|----------|
| seruling    | suling   | gerigi       | gigi     |
| cerabut     | cabut    | geronggang   | gonggang |
| cerita      | cita     | terusan      | tusan    |
| ceracau     | cacau    | cerempung    | cempung  |

- **52 start `ber-` + basis start `b`** → rawan false positive (bisa prefiks
  `ber-`, bukan sisipan `er`): `beranda` ← `banda`, `berandang` ← `bandang`.

---

### 4.4 Sisipan -em- (266 kandidat)

Seluruh 152 basis ≥ 4 (tanpa sufiks) memiliki konsonan awal konsisten.
Mayoritas plausibel sebagai sisipan genuine:

| Entri       | Basis    | Entri         | Basis    |
|-------------|----------|---------------|----------|
| cemerlang   | cerlang  | gemuruh       | guruh    |
| gemilang    | gilang   | gemebyar      | gebyar   |
| temali      | tali     | gemeletak     | geletak  |
| gemawan     | gawan    | semerbak      | serbak   |
| gemaung     | gaung    | gemelugut     | gelugut  |

Kemungkinan false positive: `cemara` ← `cara` (cemara kemungkinan kata
mandiri, bukan `c` + `em` + `ara`).

---

### 4.5 Sisipan -in- (93 kandidat)

Pola paling selektif. Dari 35 basis ≥ 4 (tanpa sufiks), terdapat dua kelompok jelas:

**Genuine (sisipan bahasa Indonesia/Melayu Klasik/Jawa):**

| Entri       | Basis    | Catatan                      |
|-------------|----------|------------------------------|
| kinerja     | kerja    | contoh klasik, disebutkan dalam buku teks |
| sinambung   | sambung  | contoh klasik                |
| kinasih     | kasih    | bentuk Jawa Kuno             |
| minantu     | mantu    | bentuk variasi menantu       |
| linuhung    | luhung   | bentuk Jawa, 'mulia'         |
| sinandung   | sandung  | bentuk syair lama            |
| kinanti     | kanti    | bentuk metrum Jawa           |
| kinantan    | kantan   | nama tempat/burung           |
| tinulat     | tulat    | bentuk Jawa Kuno             |

**Serapan asing (false positive):**

| Entri     | Basis (salah) | Asal sebenarnya          |
|-----------|---------------|--------------------------|
| dinamik   | damik         | Yunani: dynamikos        |
| dinar     | dar           | Arab: dīnār              |
| dinas     | das           | Belanda: dienst          |
| sinema    | sema          | Prancis: cinéma          |
| sinus     | sus           | Latin: sinus             |
| sinis     | sis           | Yunani: kynikos          |
| sinyal    | syal          | Belanda: signaal         |
| tiner     | ter           | Inggris: thinner         |
| lining    | ling          | Inggris: lining          |
| minim     | mim           | Latin: minimus           |
| minus     | mus           | Latin: minus             |
| pinus     | pus           | Latin: pinus             |
| kinetik   | ketik         | Yunani: kinētikos        |
| minaret   | maret         | Arab/Prancis: minaret    |
| binari    | bari          | Inggris: binary          |

**Ambiguous (perlu kaji etimologi):**

| Entri     | Basis kandidat | Catatan                                     |
|-----------|----------------|---------------------------------------------|
| binatang  | batang         | Tidak jelas; binatang kemungkinan dari bi+natang atau kata mandiri |
| binasa    | basa           | Mungkin dari Sansekerta vinasa; basa = bahasa? Perlu kajian |
| bineka    | beka           | Dalam "bhinneka" berasal dari Sansekerta    |
| sinabar   | sabar          | Nama mineral (cinnabar); bukan sisipan Indonesia |
| jinawi    | jawi           | Kemungkinan bentuk kerakyatan, perlu verifikasi |

---

## 5. Estimasi False Positive

**Estimasi awal (berbasis pola fonotaktis):**

| Kategori FP                              | Estimasi jumlah |
|------------------------------------------|----------------:|
| Basis < 3 char (suku kata saja)          |            ~204 |
| `bel-`/`ber-` + basis berawalan `b`      |            ~124 |
| Serapan asing masuk pola -in-            |             ~23 |
| **Total FP (estimasi konservatif awal)** |           **~393** |

**Estimasi diperbarui (cross-reference etimologi):**

Dari 2.086 kandidat, **1.034 entri** memiliki data etimologi yang mengonfirmasi
asal bahasa asing (Belanda, Arab, Inggris, Latin, Yunani, Portugis, Persia,
Tamil, Amoy, Prancis). Ini adalah batas atas false positive yang dapat dikonfirmasi
secara programatik — hanya dari entri yang *kebetulan* memiliki data etimologi.

| Kategori                                        | Jumlah |
|-------------------------------------------------|-------:|
| FP terkonfirmasi via etimologi asing            |  1.034 |
| Tidak terkonfirmasi (tidak ada data etimologi)  |  1.052 |
| **Total kandidat**                              |  **2.086** |

Dari 1.052 tanpa data etimologi, sebagian besar kemungkinan adalah:
- Kata asli Indonesia/Melayu yang genuine ber-sisipan atau ber-dwipurwa
- False positive fonotaktis yang basisnya kebetulan ada di kamus

**Estimasi sisa kandidat plausibel setelah filter etimologi: ~1.052.**
Verifikasi lebih lanjut memerlukan inspeksi manual atau sumber referensi leksikografi
di luar yang tersedia dalam sistem saat ini.

---

## 6. Cara Penggunaan Skrip

```bash
cd backend

# Ringkasan per pola
node scripts/deteksi-sisipan-dwipurwa.js

# Daftar semua kandidat ke konsol
node scripts/deteksi-sisipan-dwipurwa.js --verbose

# Hanya kandidat yang basisnya juga berjenis 'dasar'
node scripts/deteksi-sisipan-dwipurwa.js --dasar-only

# Simpan hasil ke CSV (di _docs/YYYYMM/)
node scripts/deteksi-sisipan-dwipurwa.js --csv

# Kombinasi lengkap
node scripts/deteksi-sisipan-dwipurwa.js --verbose --csv --dasar-only
```

---

## 7. Keterbatasan Teknis

1. **Strip sufiks tunggal**: Skrip hanya mencoba strip satu sufiks terluar.
   Kata seperti `kinerjakannya` (hipotetis) tidak akan terdeteksi.

2. **Tidak ada pengecekan prefiks**: Kata `berlanda` bisa terdeteksi sebagai
   `-er-` dari `blanda`, padahal ini jelas false positive. Skrip tidak menyaring
   berdasarkan prefiks yang sudah terdeteksi.

3. **Kecocokan kebetulan fonotaktis**: Kata yang secara kebetulan cocok pola
   (terutama kata serapan dengan konsonan nasal di tengah) banyak masuk.

4. **Lookup hanya berdasarkan string**: Tidak ada pengecekan semantik atau
   keterhubungan makna antara entri dan basis kandidat.
   Lihat Bagian 8 untuk hasil filter berbasis makna.

---

## 8. Penyaringan Berbasis Makna (Hasil)

Setelah pendataan awal, setiap kandidat disaring dengan cek kecocokan makna:
apakah teks `makna.makna` dari entri terdeteksi mengandung `entri.indeks` dari
basis kandidat sebagai kata utuh (*word-boundary*).

Alasan menggunakan `entri.indeks` (bukan `entri.entri`): `indeks` adalah bentuk
kanonik tanpa nomor homonim seperti `(1)`, `(2)`, sehingga cocok dipakai sebagai
needle dalam pencarian teks definisi.

### 8.1 Hasil Kuantitatif (basis ≥ 4 char, tanpa sufiks, word-boundary)

```
Subset kandidat : 1.194
Lolos           :    50  (4,2%)
Tidak lolos     :   931
Tanpa makna     :   213  (entri atau basis tidak punya definisi aktif)
```

| Pola     | Subset | Lolos | % Lolos |
|----------|-------:|------:|--------:|
| -el-     |    486 |     9 |   1,9%  |
| -em-     |    152 |     5 |   3,3%  |
| -er-     |    403 |    18 |   4,5%  |
| -in-     |     35 |     1 |   2,9%  |
| R.purwa  |    118 |    17 |  14,4%  |
| **Total**|  **1.194** | **50** | **4,2%** |

### 8.2 Interpretasi

**Tingkat lolos 4,2% bukan berarti 95,8% adalah false positive.**
KBBI sering mendefinisikan kata dengan sinonim atau deskripsi fungsional,
tanpa menyebut kata dasarnya secara eksplisit. Contoh:

| Entri       | Basis    | Definisi (tidak menyebut basis)                          |
|-------------|----------|----------------------------------------------------------|
| cemerlang   | cerlang  | "bercahaya atau bersinar sangat terang; berkilauan..."   |
| gemilang    | gilang   | (likely: "bercahaya; gemerlapan")                        |
| berandang   | bandang  | "tampak dengan jelas; mudah terlihat..."                 |
| binatang    | batang   | "makhluk bernyawa yang mampu bergerak..."                |

Sebaliknya, kandidat yang **lolos** adalah yang definisinya kebetulan
mencantumkan kata dasar — ini merupakan **bukti kuat** keterkaitan.

### 8.3 Kandidat Lolos Terpilih per Pola

**R.purwa (17 lolos):**

| Entri       | Basis   | Penggalan definisi                                    |
|-------------|---------|-------------------------------------------------------|
| lelaki      | laki    | "laki-laki"                                           |
| bebesaran   | besaran | "pohon murbei; besaran"                               |
| cecongor    | congor  | "moncong; congor"                                     |
| cecere      | cere    | "ikan air tawar... panjang mencapai 9 cm..."          |
| bebuku      | buku    | "kumpulan buku"                                       |
| gegala      | gala    | "gala; gala-gala ..."                                 |
| kekara      | kara    | "kacang kara"                                         |
| dedulang    | dulang  | "pohon merunggai; petai laut; dulang-dulang"          |

**-er- (18 lolos):**

| Entri       | Basis   | Penggalan definisi                               |
|-------------|---------|--------------------------------------------------|
| gerigi      | gigi    | "gigi-gigi tajam pada tepi (gergaji...)"         |
| cerabut     | cabut   | "lepas; cabut"                                   |
| berewok     | bewok   | "bulu...pada dagu dan pipi belakang; bewok..."   |
| gerapai     | gapai   | "gapai"                                          |
| gerinjal    | ginjal  | "ginjal"                                         |
| gerunyam    | gunyam  | "gunyam"                                         |
| jerongkok   | jongkok | "jongkok"                                        |

**-el- (9 lolos):**

| Entri       | Basis   | Penggalan definisi                              |
|-------------|---------|--------------------------------------------------|
| lelaki      | laki    | "laki-laki"                                     |
| gelantung   | gantung | "gantung"                                       |
| gelosok     | gosok   | "gosok"                                         |
| seloyak     | soyak   | "soyak; keloyak; koyak"                         |

**-em- (5 lolos):**

| Entri       | Basis   | Penggalan definisi                                        |
|-------------|---------|-----------------------------------------------------------|
| gemuruh     | guruh   | "menderu-deru seperti bunyi guruh atau suara ombak..."    |
| gemebyar    | gebyar  | "serba gebyar; gemerlap"                                  |
| gemirang    | girang  | "suka ria; girang"                                        |
| gemulung    | gulung  | "bergulung-gulung (tentang ombak dsb.)"                   |

**-in- (1 lolos):**

| Entri   | Basis | Penggalan definisi                                            |
|---------|-------|---------------------------------------------------------------|
| kinerja | kerja | "sesuatu yang dicapai; prestasi...; kemampuan kerja..."       |

### 8.4 Kesimpulan Filter Makna

- Lolos 50 kandidat → **keyakinan tinggi** (bukti ganda: pola fonotaktis + definisi menyebut basis)
- Tidak lolos 931 → **masih perlu evaluasi manual**: mayoritas kandidat genuine memang tidak lolos
  karena KBBI mendefinisikan dengan cara deskriptif, bukan derivasional
- Filter makna berguna sebagai **lapisan konfirmasi**, bukan sebagai satu-satunya filter
- **CSV terfilter** tersedia di `_docs/202603/202603051219_kandidat-sisipan-dwipurwa-lolos-makna.csv`
  (50 entri, kolom: entri, pola, basis, makna_snippet)

---

## 9. Fakta Menarik untuk Makalah Ilmiah

Bagian ini merangkum temuan kuantitatif dan linguistis yang berpotensi
diangkat dalam karya ilmiah tentang deteksi mesin terhadap pola sisipan
dan dwipurwa bahasa Indonesia.

### 9.1 Properti Matematis Algoritme

**Delta panjang selalu tepat 2 karakter.** Semua sisipan (el, em, er, in) dan
dwipurwa menambah tepat 2 karakter dari basis ke entri turunannya. Hal ini
terverifikasi pada 100% dari 1.194 kandidat (basis ≥ 4 char, tanpa sufiks).
Sifat ini membuat deteksi sangat efisien secara komputasional: kompleksitas
per entri adalah O(k) dengan k = jumlah infix (konstan = 4), karena hanya
perlu memeriksa posisi karakter ke-1 dan ke-2.

### 9.2 Fonotaktis: Sisipan Hampir Selalu Mendahului Vokal

Sisipan bahasa Indonesia disisipkan antara konsonan pertama dan vokal pertama
kata dasar (*CVC → C+infix+VC*). Data menunjukkan bahwa properti ini sangat
konsisten:

| Pola  | Basis[1] vokal | Basis[1] konsonan | Keterangan                      |
|-------|---------------:|------------------:|---------------------------------|
| -el-  |   486 (100%)   |          0 (0%)   | mutlak: semua setelah konsonan+vokal |
| -em-  |   152 (100%)   |          0 (0%)   | mutlak                          |
| -er-  |   394 (97,8%)  |          9 (2,2%) | 9 pengecualian (gugus konsonan) |
| -in-  |    33 (94,3%)  |          2 (5,7%) | 2 pengecualian                  |

Ini konsisten dengan deskripsi tata bahasa tradisional: sisipan disisipkan
setelah konsonan awal, sebelum vokal pertama kata dasar. Pengecualian pada
-er- dan -in- umumnya muncul dari kata-kata yang basis[1]-nya adalah konsonan
karena gugus konsonan (*st-, *bl-, dsb.) yang lebih banyak ditemukan pada
kata serapan.

### 9.3 Ambiguitas Struktural: Tumpang Tindih R.purwa dan -el-

Sebanyak **46 entri** cocok secara simultan dengan dua pola berbeda
(R.purwa dan -el-) dengan basis yang identik. Ini bukan bug algoritme,
melainkan fenomena linguistis nyata:

```
Contoh "lela":
  Pola R.purwa: l + e + [la] → basis = "la"
  Pola -el-  : l + [el] + a  → basis = "la"
  → Kedua pola menghasilkan basis yang sama ("la"), tapi interpretasi morfologisnya berbeda.
```

Kata-kata terdampak: *lela, lelah, lelai, lelak, lelaki, lelakon, lelancur, lelap, lelas,
lelat, lelatu, lelawa, lelembut, leles, lelewa, leluasa, leluhur, lelung*, dll.

Kasus paling menarik adalah **lelaki** — secara tradisional dianggap R.purwa
dari *laki*, tetapi algoritmis juga terbaca sebagai *l* + `-el-` + *aki*.
Konfirmasi semantik (definisi: "laki-laki") mendukung interpretasi R.purwa,
bukan sisipan -el-.

Temuan ini menunjukkan bahwa **resolusi ambiguitas tidak dapat diselesaikan
oleh pola fonotaktis semata** dan memerlukan informasi semantik atau etimologis.

### 9.4 Transparansi Semantik Berbeda Antar Pola

Persentase entri yang definisinya secara eksplisit menyebut kata dasarnya
(*semantic transparency*) bervariasi signifikan:

| Pola     | Transparansi semantik | Interpretasi                              |
|----------|----------------------:|-------------------------------------------|
| R.purwa  |                14,4%  | Paling tinggi; definisi sering merujuk langsung ke bentuk dasar |
| -er-     |                 4,5%  | Sedang                                    |
| -em-     |                 3,3%  | Sedang                                    |
| -in-     |                 2,9%  | Rendah; hanya *kinerja* yang lolos        |
| -el-     |                 1,9%  | Paling rendah; kebanyakan definisi deskriptif |

Tingginya transparansi R.purwa konsisten dengan sifatnya sebagai reduplikasi
partial yang secara semantik lebih "transparan" (orang lebih mudah mengenali
hubungan *tetangga–tangga*, *lelaki–laki*) dibanding sisipan yang lebih
kabur (*cemerlang–cerlang*, *gemilang–gilang*).

### 9.5 Cakupan dalam Korpus KBBI

Dari 39.678 entri dasar aktif dalam KBBI digital:

```
Entri berawalan konsonan (eligible)    : 33.567  (84,6%)
Kandidat terdeteksi (entri unik)       :  1.928  ( 5,7% dari eligible)
  → dengan konfirmasi makna (50)       :     50  (     ~2,6% dari 1.928)
```

Angka 5,7% dari entri eligible memberikan estimasi batas atas proporsi
kosakata KBBI yang berpotensi mengandung sisipan atau dwipurwa *dan* basisnya
masih terdaftar sebagai entri aktif. Proporsi sesungguhnya lebih rendah
setelah mengeluarkan false positive.

### 9.6 Kelas Kata Basis: Dominasi Nomina

Dari 1.165 entri basis unik (basis ≥ 4 char), distribusi kelas kata:

| Kelas kata | Jumlah | % |
|------------|-------:|--:|
| n (nomina) |    513 | 44% |
| v (verba)  |    143 | 12% |
| a (adjektiva)|  128 | 11% |
| lainnya/campuran | ~381 | 33% |

Dominasi nomina konsisten dengan kajian morfologi: sisipan dan dwipurwa
bahasa Indonesia cenderung dibentuk dari kata benda dan kata sifat, bukan
dari verba aktif yang sudah memiliki sistem prefiks meN- sendiri.

### 9.7 Satu Basis, Dua Sisipan Berbeda

Basis *tali* menghasilkan dua turunan sisipan berbeda:
- **temali** (*t* + `-em-` + *ali*): pasangan yang diakui secara leksikal
- **terali** (*t* + `-er-` + *ali*): kisi-kisi/jeruji (terali besi)

Ini menunjukkan bahwa satu kata dasar dapat mengalami dua sisipan berbeda
secara bersamaan dalam bahasa Indonesia, menghasilkan makna yang berbeda pula.
Temuan serupa: basis *sinar* → **seminar** (false positive: kata serapan Latin)
memperlihatkan risiko kemiripan fonotaktis antara sisipan asli dan kata serapan.

### 9.8 Rentanan Pola -in- terhadap Serapan Asing

Dari 35 kandidat -in- (basis ≥ 4 char, tanpa sufiks), setidaknya 13 adalah
kata serapan asing yang fonotaktisnya kebetulan cocok pola sisipan:

| Sumber bahasa | Contoh entri     |
|---------------|------------------|
| Yunani        | dinamik, kinetik |
| Latin         | sinus, minus, pinus, minim |
| Arab          | dinar, minaret, diniah |
| Belanda       | dinas, sinyal    |
| Inggris       | lining, binari   |

Bahasa-bahasa ini memiliki banyak kata ber-konsonan + "in" + vokal secara
kebetulan, bukan karena proses morfologis bahasa Indonesia. Ini menjadi
kasus uji yang menarik untuk menilai apakah filter berbasis kamus etimologi
dapat meningkatkan presisi secara signifikan.

### 9.9 Data Etimologi: Cakupan, Manfaat, dan Masalah Homonim

Tabel `etimologi` di database mengandung **16.512 baris** (10 aktif, 16.502
tidak aktif). Baris tidak aktif ini merupakan data etimologi lama dari KBBI
yang belum sepenuhnya diintegrasikan ke sistem baru.

**Cakupan terhadap entri dasar aktif:**

```
Entri dasar aktif dengan data etimologi  : 15.176 dari 39.678 (38,2%)
```

Data etimologi didominasi serapan asing:

| Bahasa       | Jumlah entri |
|--------------|-------------:|
| Belanda      |        7.824 |
| Arab         |        2.539 |
| Inggris      |        2.536 |
| Sanskerta    |          802 |
| Amoy         |          320 |
| Persia       |          273 |
| Portugis     |          244 |
| Latin        |          207 |
| Tamil        |          148 |
| Yunani       |          100 |

**Manfaat untuk deteksi false positive:**

Cross-reference terhadap 2.086 kandidat menghasilkan:
- **1.034 kandidat** memiliki pola cocok infix/dwipurwa *dan* etimologi dari
  bahasa asing (Belanda, Arab, Inggris, Latin, Yunani, Portugis, Persia,
  Tamil, Cina, Prancis) → konfirmasi kuat sebagai **false positive**.
- Hanya **1 kandidat** terkonfirmasi berasal dari bahasa Melayu/Indonesia/Jawa/
  Sunda via etimologi — bukan karena hampir semua positif palsu, melainkan karena
  **data etimologi hampir sepenuhnya mencakup kata serapan, bukan kata asli**.
  Kata-kata asli Indonesia (yang kemungkinan genuine sisipan/dwipurwa) umumnya
  tidak memiliki entri etimologi.

Ini menghasilkan asimetri penting: etimologi efektif untuk **menolak**
kandidat (konfirmasi serapan), tetapi tidak bisa digunakan untuk **menerima**
kandidat (mengonfirmasi sisipan asli).

**Masalah homonim yang belum dibersihkan:**

Data etimologi memiliki tiga tipe anomali yang mencegah penggunaan programatik
langsung:

| Tipe masalah | Jumlah terdampak | Contoh |
|---|---:|---|
| Homonim etimologi > jumlah entri di DB | 233 indeks | *blok*: 5 homonim etim → 1 entri |
| Duplikat (entri_id + homonim sama) | 177 pasangan | *kaf (1)*: 3 baris, homonim=1 |
| Orphan (entri_id IS NULL) | 156 baris | — |

*Tipe 1 (mayoritas)* terjadi karena data etimologi lama mencatat homonim KBBI
secara terpisah (e.g., *blok* punya 5 makna berbeda → 5 baris etimologi
homonim=1..5), tetapi tabel `entri` hanya memiliki satu baris *blok* karena
konsolidasi belum selesai.

*Tipe 2* terjadi karena baris duplikat dengan nomor homonim sama masuk ke DB,
kemungkinan dari impor data yang tidak deduplikasi.

*Tipe 3* (orphan) adalah baris yang entri_id-nya hilang saat impor, biasanya
karena entri asal tidak ada padanannya di tabel `entri`.

Sebelum data etimologi dapat digunakan secara programatik untuk penyaringan
otomatis, ketiga masalah ini perlu diselesaikan.

### 9.10 Ringkasan Potensi Argumen Makalah

| Klaim | Bukti dari data |
|-------|----------------|
| Deteksi berbasis pola fonotaktis dapat diimplementasikan dengan efisiensi O(k) | Delta=2 konstan, k=4 infix |
| Sisipan bahasa Indonesia taat aturan fonotaktis C+V di awal basis | 97-100% basis[1] adalah vokal |
| Ambiguitas R.purwa/el- memerlukan disambiguasi semantik | 46 entri multi-pola, basis identik |
| Transparansi semantik bervariasi antar pola | 1,9%–14,4% konfirmasi makna |
| Konfirmasi makna sebagai lapisan kedua meningkatkan presisi | 50 high-confidence dari 1.194 |
| Pola -in- paling rentan terhadap serapan asing | ≥13 dari 35 kandidat (≥37%) adalah serapan |
| Basis nomina dominan (44%) dibanding verba (12%) | distribusi kelas kata |
| Data etimologi efektif untuk menolak tapi tidak menerima kandidat | 1.034 FP terkonfirmasi asing; 1 terkonfirmasi asli |
| Kamus etimologi digital harus bebas duplikat sebelum digunakan programatik | 233 indeks + 177 pasangan duplikat + 156 orphan |

---

## 10. Disambiguasi: R.purwa vs. Sisipan

Bagian ini mendokumentasikan secara lengkap masalah ambiguitas struktural
antara pola R.purwa dan sisipan, termasuk kondisi matematis terjadinya,
daftar entri terdampak, dan strategi resolusi.

### 10.1 Kondisi Matematis Terjadinya Ambiguitas

Ambiguitas struktural antara R.purwa dan sisipan hanya mungkin terjadi
ketika **kedua pola menghasilkan basis yang identik dari string yang sama**.

Peta kondisi:

| Pasangan pola   | Kondisi terpicu                  | Contoh string |
|-----------------|----------------------------------|---------------|
| R.purwa + -el-  | stem[0]='l' (kata mulai "lel…") | "lelaki"      |
| R.purwa + -em-  | stem[0]='m' (kata mulai "mem…") | "memar"       |
| R.purwa + -er-  | stem[0]='r' (kata mulai "rer…") | "rerata"      |
| R.purwa + -in-  | **tidak mungkin** — R.purwa butuh stem[1]='e', -in- butuh stem[1]='i' | — |

Derivasi untuk kasus "lel…":
```
R.purwa:  stem = l + e + l + rest  →  basis = l + rest
-el-:     stem = l + el  + rest   →  basis = l + rest
```
Karena `stem[2] = 'l' = stem[0]`, kedua algoritme menghasilkan string basis
yang persis sama. Ambiguitas ini bersifat **tidak dapat diselesaikan secara
fonotaktis** — perlu informasi eksternal.

**Ambiguitas antar-sisipan** (misalnya -el- dan -er- pada entri yang sama)
secara matematis tidak mungkin, karena posisi karakter ke-1 dan ke-2 hanya
bisa berisi satu string sekaligus. Ini terkonfirmasi dari data: **0 entri**
yang cocok dua infix berbeda dengan dua basis yang berbeda sekaligus.

### 10.2 Daftar Entri Terdampak (46 Entri Aktif)

**R.purwa + -el- (26 entri, semua mulai "lel…"):**

| Entri        | Basis bersama | Keterangan                                   |
|--------------|---------------|----------------------------------------------|
| lelaki       | laki          | R.purwa; terdokumentasi dalam tata bahasa    |
| leluhur      | luhur         | R.purwa; bentuk kolektif "para luhur"        |
| lelembut     | lembut        | R.purwa; "makhluk halus"                     |
| leluasa      | luasa         | R.purwa (luasa → leluasa = bebas/lapang)     |
| lelakon      | lakon         | R.purwa (lakon = cerita/sandiwara)           |
| lelancur     | lancur        | R.purwa (lancur = licin/lancar)              |
| lelangit     | langit        | R.purwa (bagian dalam tutup mulut)           |
| lelangse     | langse        | R.purwa (tirai/kelambu)                      |
| lelawa       | lawa          | R.purwa (jenis kelelawar)                    |
| lelah        | lah           | *"lah"* bukan kata bermakna → kedua pola FP |
| lela         | la            | *"la"* suku kata saja → kedua pola FP       |
| lelang       | lang          | *"lang"* tidak berdiri sendiri → FP         |
| lelap        | lap           | *"lap"* ada di KBBI (kain lap) — ambigu     |
| lelas        | las           | *"las"* ada di KBBI (pengelasan) — ambigu   |
| leles        | les           | *"les"* ada di KBBI (kursus) — ambigu       |
| lelatu       | latu          | *"latu"* = api (Jawa/Melayu Kuno)           |
| lelai        | lai           | *"lai"* = jenis durian — ambigu             |
| lelak        | lak           | *"lak"* = sejenis lem — ambigu              |
| lelat        | lat           | mungkin suku kata saja                       |
| leles        | les           | (homonim kedua)                              |
| lewa         | lewa          | *(varian "lelewa")*                          |
| luing        | luing         | *(dua homonim "leluing")*                    |
| lelung       | lung          | *"lung"* = (Jawa: daun muda) — ambigu       |
| memerang     | merang        | *"merang"* = jerami — mungkin R.purwa        |

**R.purwa + -em- (10 entri, semua mulai "mem…"):**

| Entri        | Basis bersama | Keterangan                                   |
|--------------|---------------|----------------------------------------------|
| memang       | mang          | *"mang"* (sebutan paman) — mungkin R.purwa  |
| memar        | mar           | kata mandiri (luka memar); bukan derivasi    |
| memek        | mek           | kata mandiri — kedua pola FP                 |
| memelas      | melas         | *"melas"* ada? — ambigu                      |
| memengkis    | mengkis       | *"mengkis"* = tumbuhan (Jawa) — R.purwa?    |
| memerang     | merang        | *"merang"* = jerami — mungkin R.purwa        |
| memori       | mori          | serapan Inggris "memory"; bukan derivasi     |
| memur        | mur           | *"mur"* = sekrup — ambigu                    |
| memutah      | mutah         | *"mutah"* = muntah — mungkin R.purwa        |

**R.purwa + -er- (10 entri, semua mulai "rer…"):**

| Entri        | Basis bersama | Keterangan                                   |
|--------------|---------------|----------------------------------------------|
| rerata       | rata          | **R.purwa** terdokumentasi (statistik: mean) |
| rerangka     | rangka        | **R.purwa** (kolektif "rangka-rangka")       |
| reranting    | ranting       | **R.purwa** (kolektif "ranting-ranting")     |
| rerugi       | rugi          | **R.purwa** (lebih formal dari "rugi-rugi")  |
| reruntuk     | runtuk        | **R.purwa** (bentuk Melayu Klasik)           |
| reramuan     | ramuan        | **R.purwa** (kolektif "ramuan-ramuan")       |
| rerongkong   | rongkong      | *"rongkong"* ada? — perlu verifikasi         |
| rerak        | rak           | *"rak"* ada di KBBI — ambigu                |
| reras        | ras           | *"ras"* ada di KBBI — ambigu                |
| reruku       | ruku          | *"ruku"* = sejenis pohon — ambigu            |

### 10.3 Analisis Pola per Kelompok

**Kelompok "rer…" paling mudah diselesaikan**: Mayoritas (≥6 dari 10) adalah
R.purwa yang terdokumentasi dalam tata bahasa maupun pemakaian umum. Pola
R.purwa dari kata berawalan 'r' menghasilkan "rer…" yang sangat khas dan
hampir tidak pernah dikacaukan dengan sisipan -er- dalam praktik.

**Kelompok "lel…" paling bermasalah**: Hanya sebagian yang genuine R.purwa
(lelaki, leluhur, leluasa). Banyak basis bersama berupa suku kata bermakna
sempit atau tidak umum (lah, la, lang, lat). Sisipan -el- ke basis "laki",
"luhur" dll. juga secara fonotaktis valid — perbedaannya hanya semantis.

**Kelompok "mem…" paling banyak false positive**: Banyak entri "mem…" adalah
kata mandiri (memar) atau serapan (memori) yang tidak terkait morfologis.
Kata-kata ini masuk karena basis "mar", "mori", dll. kebetulan ada di KBBI.

### 10.4 Strategi Disambiguasi

Berikut strategi resolusi yang dapat diterapkan secara bertingkat (dari yang
paling andal ke paling spekulatif):

**Tingkat 1 — Filter etimologi (paling andal):**
Jika entri memiliki data etimologi dari bahasa asing → bukan R.purwa maupun
sisipan Indonesia. Contoh: *memori* (← Inggris *memory*), *memar* (perlu
cek etimologi).

**Tingkat 2 — Kualitas basis (sangat membantu):**
Jika basis < 3 karakter, atau bukan kata bermakna dalam KBBI → kedua pola
kemungkinan besar false positive. Contoh: "lelah" → basis "lah" bukan kata
bermakna → bukan R.purwa dari "lah" (lelah kemungkinan kata mandiri).

**Tingkat 3 — Konfirmasi semantik via definisi:**
Apakah definisi entri menyebut basis secara eksplisit? Jika ya → keyakinan
tinggi. Contoh: *lelaki* → definisi "laki-laki" → konfirmasi R.purwa dari
*laki*. Dari 46 entri ambigu, hasil filter makna (§8) menunjukkan beberapa
yang lolos justru dari kelompok ini.

**Tingkat 4 — Default assignment (fallback):**
Untuk entri "rer…" yang basisnya valid: assign **R.purwa** (terdukung data
dan tradisi linguistik). Untuk "lel…" dan "mem…": R.purwa juga menjadi
default, karena secara historis pola ini lebih produktif di Melayu Klasik
dibanding sisipan yang fosil. Dengan catatan bahwa assignment ini bersifat
tentatif dan perlu konfirmasi manual.

**Aturan praktis yang diusulkan untuk implementasi:**
```
Jika stem cocok ambiguitas R.purwa + infix:
  1. Cek etimologi → jika asing: skip
  2. Cek panjang basis → jika basis < 3 char: skip
  3. Cek makna → jika definisi menyebut basis: assign R.purwa
  4. Default: assign R.purwa (bukan infix)
```

### 10.5 Mengapa -in- Tidak Pernah Ambigu dengan R.purwa

Ini adalah properti yang menarik untuk dicatat dalam makalah ilmiah: sisipan
-in- **tidak dapat** menghasilkan ambiguitas struktural dengan R.purwa, karena:

- R.purwa mensyaratkan karakter ke-2 adalah 'e'
- Sisipan -in- mensyaratkan karakter ke-2 adalah 'i'

Karena 'e' ≠ 'i', kedua pola tidak bisa terpicu sekaligus pada string yang sama.
Ini berarti **seluruh 93 kandidat -in- bersifat non-ambigu secara struktural**
terhadap R.purwa — meskipun tetap ambigu terhadap serapan asing.

Sifat ini tidak dimiliki oleh -el-, -em-, dan -er-, karena ketiganya dimulai
dengan 'e' (sama seperti vokal "penyisip" pada R.purwa).

---

## 11. Rencana Tindak Lanjut

1. **Verifikasi manual CSV terfilter**: Mulai dari `202603051219_kandidat-sisipan-dwipurwa-lolos-makna.csv`
   (50 kandidat keyakinan tinggi), lalu lanjut ke `202603051204_kandidat-sisipan-dwipurwa.csv`
   (2.086 kandidat lengkap) untuk sisanya.

2. **Tentukan kebijakan jenis entri**: Apakah entri sisipan/dwipurwa yang
   berjenis `'dasar'` perlu:
   - Diubah jenis menjadi `'turunan'` + isi kolom `induk` → dapat menggunakan
     mekanisme seed-entri-tagar yang sudah ada, atau
   - Diberi tagar langsung tanpa mengubah jenis (skrip tagging terpisah).

3. **Implementasi tagging**: Buat skrip `assign-tagar-sisipan-dwipurwa.js`
   yang membaca hasil verifikasi dan memasukkan tagar ke `entri_tagar`.

4. **Filter tambahan via etimologi**: Dari cross-reference, 1.034 kandidat sudah
   terkonfirmasi sebagai serapan asing dan dapat langsung disingkirkan. Sisanya
   ~1.052 tidak memiliki data etimologi dan memerlukan pendekatan lain.

5. **Bersihkan masalah homonim di tabel `etimologi`** sebelum menggunakan data
   tersebut secara programatik: 233 indeks kelebihan homonim, 177 pasangan duplikat,
   156 baris orphan (entri_id NULL).

---

## 12. Referensi

- `backend/scripts/deteksi-sisipan-dwipurwa.js` — skrip deteksi
- `backend/scripts/seed-entri-tagar.js` — fungsi `detectDwipurwa` dan
  `detectInfiks` (untuk entri 'turunan' dengan induk diketahui)
- `_docs/202603/202603051204_kandidat-sisipan-dwipurwa.csv` — CSV semua kandidat (2.086)
- `_docs/202603/202603051219_kandidat-sisipan-dwipurwa-lolos-makna.csv` — CSV kandidat lolos filter makna (50)
- `_docs/202603/202603022120_rancangan-sistem-tagar-entri.md` — rancangan sistem tagar
- `_docs/202603/202603031955_audit-entri-turunan-belum-bertagar-dan-saran.md`
  — audit entri turunan belum bertagar
