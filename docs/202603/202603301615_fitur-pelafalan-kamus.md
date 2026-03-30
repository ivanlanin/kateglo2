# Fitur Pelafalan (Pronunciation) Kamus

Tanggal: 30 Maret 2026

## Ringkasan

Penambahan fitur pelafalan di halaman detail kamus, terinspirasi pendekatan Dictionary.com dan Merriam-Webster. Fitur ini mencakup:

1. **Tombol audio** (Web Speech API) di setiap entri kamus
2. **IPA otomatis** (Bulk generator) untuk mengisi kolom `lafal` dengan notasi IPA + aturan alofon TBBBI

## Notasi & Pendekatan

- Bahasa Indonesia bersifat **fonemis** → aturan pelafalan lebih reguler dari bahasa Inggris
- **Notasi IPA standar** dipilih karena bersifat internasional dan dikenal luas
- Audio via Web Speech API (browser TTS, voice `id-ID`)
- Aturan alofon diterapkan berdasarkan TBBBI §3.2.1 (vokal) dan §3.2.4 (konsonan)
- Ambiguitas utama: huruf 'e' (pepet /ə/ vs taling /e/) — default ke schwa, editor dapat mengoreksi

## Implementasi

### 1. Frontend: TombolLafal

**File:** `frontend/src/pages/publik/kamus/KamusDetail.jsx`

Komponen `TombolLafal` ditambahkan ke halaman detail kamus:
- Menggunakan `window.speechSynthesis` dengan `SpeechSynthesisUtterance`
- Parameter: `lang: 'id-ID'`, `rate: 0.9`
- Preferensi voice Indonesia jika tersedia di browser
- Ikon speaker SVG, berubah saat sedang berbicara (animasi gelombang suara)
- Tombol muncul di semua entri, baik yang punya lafal/pemenggalan maupun tidak
- Sufiks homonim (e.g. "(1)") otomatis dihapus sebelum diucapkan

**Styling:** `frontend/src/styles/index.css`
- Class `.kamus-detail-btn-lafal` — rounded, hover blue, dark mode support
- `.kamus-detail-heading-meta` diubah ke flexbox untuk alignment tombol

### 2. Backend: Bulk IPA Generator

**File:** `backend/scripts/analisis/generate_lafal_ipa.js`

Script untuk mengisi kolom `lafal` secara massal dengan aturan grapheme-to-IPA:

#### Pemetaan Dasar
- **Digraf:** ng→ŋ, ny→ɲ, kh→x, sy→ʃ, ngg→ŋɡ, ngk→ŋk
- **Konsonan:** c→tʃ, j→dʒ, y→j, v→f, q→k
- **Vokal:** a, i, o, u; e→ə (default schwa), é/è→e (taling)
- **Diftong:** ai→ai̯, au→au̯, oi→oi̯, ei→ei̯
- **Khusus:** x→s di awal kata (xilofon → /silofon/), x→ks di posisi lain

#### Aturan Alofon (TBBBI)
| Fonem | Alofon | Kondisi | Referensi |
|-------|--------|---------|-----------|
| /i/ | [ɪ] | Suku tutup terakhir (tak bertekanan) | TBBBI §3.2.1.1 |
| /u/ | [ʊ] | Suku tutup terakhir (tak bertekanan) | TBBBI §3.2.1.2 |
| /e/ | [ɛ] | Suku tutup terakhir + harmoni mundur ke suku buka sebelumnya | TBBBI §3.2.1.3 |
| /o/ | [ɔ] | Suku tutup terakhir + harmoni mundur ke suku buka sebelumnya | TBBBI §3.2.1.4 |
| /k/ | [kʔ] | Akhir kata (variasi bebas [kʔ]/[ʔ], diambil yang aman) | TBBBI §3.2.4.3 |

#### Contoh Keluaran
| Kata | Pemenggalan | IPA | Catatan |
|------|-------------|-----|---------|
| simpang | sim.pang | /sim.paŋ/ | /i/ di penultima tetap [i] |
| banting | ban.ting | /ban.tɪŋ/ | /i/ di suku tutup terakhir → [ɪ] |
| tunda | tun.da | /tun.da/ | /u/ di penultima tetap [u] |
| warung | wa.rung | /wa.rʊŋ/ | /u/ di suku tutup terakhir → [ʊ] |
| rokok | ro.kok | /rɔ.kɔkʔ/ | /o/ → [ɔ] + harmoni mundur |
| tokoh | to.koh | /tɔ.kɔh/ | /o/ → [ɔ] + harmoni mundur |
| toko | to.ko | /to.ko/ | suku buka, tidak ada lowering |
| nenek | ne.nek | /nɛ.nɛkʔ/ | /e/ → [ɛ] + harmoni mundur (setelah restore e-taling) |
| sore | so.re | /so.re/ | suku buka, tidak ada lowering |
| batik | ba.tik | /ba.tɪkʔ/ | /k/ akhir → [kʔ], /i/ → [ɪ] |
| aktif | ak.tif | /ak.tɪf/ | /i/ hanya di suku terakhir |
| vaksin | vak.sin | /fak.sɪn/ | v→f, /i/ di suku tutup terakhir |
| xilofon | xi.lo.fon | /si.lo.fɔn/ | x awal→s, /o/ suku tutup → [ɔ] |
| abai | a.bai | /a.bai̯/ | diftong |
| khayal | kha.yal | /xa.jal/ | digraf kh→x |

#### Mode Eksekusi
- `--dry-run` — pratinjau tanpa mengubah database
- `--limit N` — proses hanya N entri
- `--force` — regenerasi semua entri (termasuk yang sudah punya lafal)

**Statistik:** 65.585 entri kata tunggal diisi IPA dari total 92.010 entri aktif. 26.425 entri dilewati (kata majemuk/multi-kata).

### 3. Pemulihan E-taling dari KBBI Lama

**File:** `backend/scripts/analisis/restore_etaling.js`

Data e-taling (é) ditemukan di database SQLite KBBI4 lama (`.data/kbbi/db/kbbi4.db`, tabel `kata`). Script ini:

1. Mengekstrak 8.804 kata dengan penanda é dari SQLite via Python subprocess
2. Membandingkan karakter per karakter antara `kata` (tanpa aksen) dan `lafal` (dengan é) untuk menentukan posisi e-taling
3. Mengganti ə→e di posisi yang sesuai pada IPA di PostgreSQL
4. Menerapkan ɛ lowering (TBBBI §3.2.1.3): jika e-taling berada di suku tutup terakhir, diubah ke ɛ + harmoni mundur

**Statistik:** 8.367 entri dipulihkan dari total 8.449 yang cocok.

**Penggunaan:**
```powershell
Set-Location backend
node scripts/analisis/restore_etaling.js --dry-run --limit 50
node scripts/analisis/restore_etaling.js
```

### 4. Skema Database

Kolom `lafal` sudah ada di tabel `entri` (`lafal text`, nullable). Tidak perlu migrasi.

### 5. Koreksi Gramatika

Lambang hambat glotal `[?]` (tanda tanya biasa) di file TBBBI markdown diperbaiki menjadi `[ʔ]` (U+0294, IPA glottal stop) di 3 file:
- `frontend/public/gramatika/bunyi-bahasa/batasan-dan-ciri-bunyi-bahasa.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-g-dan-k.md`

## Penggunaan

```powershell
# Dry run — lihat preview IPA tanpa mengubah database
Set-Location backend
node scripts/analisis/generate_lafal_ipa.js --dry-run --limit 50

# Eksekusi — tulis IPA ke database
node scripts/analisis/generate_lafal_ipa.js --limit 1000

# Regenerasi semua (termasuk yang sudah ada)
node scripts/analisis/generate_lafal_ipa.js --force
```

## Catatan & Keterbatasan

1. **Huruf 'e'**: Generator default ke schwa (ə). 8.367 kata dengan e-taling dipulihkan dari KBBI4 SQLite lama. Sisa entri dengan 'e' taling perlu koreksi manual oleh redaksi
2. **Aturan alofon kontekstual**: /i/→[ɪ] dan /u/→[ʊ] hanya diterapkan di suku tutup terakhir (TBBBI). Kata serapan Indo-Eropa cenderung tetap [i]/[u] walau posisi sama (e.g. politik [politik]) — tidak dapat dideteksi otomatis
3. **Harmoni vokal**: /e/→[ɛ] dan /o/→[ɔ] dengan harmoni mundur hanya ke suku buka sebelumnya. Harmoni berhenti di suku tutup (sesuai TBBBI)
4. **Web Speech API**: Kualitas TTS bergantung pada browser dan OS pengguna. Voice Indonesia tersedia di Chrome, Edge, dan Safari
5. **Kata serapan**: Beberapa kata serapan mungkin perlu pelafalan khusus yang tidak tercakup aturan standar
6. **Rencana ke depan**: Pertimbangkan integrasi audio MP3 rekaman manusia untuk entri kunci di masa depan
