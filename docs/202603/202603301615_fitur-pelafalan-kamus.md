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
| /k/ | [k] | Akhir kata tetap /k/ (transkripsi lebar; TBBBI §3.2.4.3: variasi bebas [k] ~ [k̚] ~ [ʔ]) | TBBBI §3.2.4.3 |

#### Contoh Keluaran
| Kata | Pemenggalan | IPA | Catatan |
|------|-------------|-----|---------|
| simpang | sim.pang | /sim.paŋ/ | /i/ di penultima tetap [i] |
| banting | ban.ting | /ban.tɪŋ/ | /i/ di suku tutup terakhir → [ɪ] |
| tunda | tun.da | /tun.da/ | /u/ di penultima tetap [u] |
| warung | wa.rung | /wa.rʊŋ/ | /u/ di suku tutup terakhir → [ʊ] |
| rokok | ro.kok | /rɔ.kɔk/ | /o/ → [ɔ] + harmoni mundur |
| tokoh | to.koh | /tɔ.kɔh/ | /o/ → [ɔ] + harmoni mundur |
| toko | to.ko | /to.ko/ | suku buka, tidak ada lowering |
| nenek | ne.nek | /nɛ.nɛk/ | /e/ → [ɛ] + harmoni mundur (setelah restore e-taling) |
| sore | so.re | /so.re/ | suku buka, tidak ada lowering |
| batik | ba.tik | /ba.tɪk/ | /i/ → [ɪ] di suku tutup terakhir |
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

## Keterbatasan Web Speech API

Web Speech API (`SpeechSynthesisUtterance`) menerima **teks biasa**, bukan notasi fonetis. Browser TTS engine menentukan sendiri cara membaca setiap huruf. Konsekuensinya:

- **E-taling vs e-pepet tidak akurat** — TTS engine membaca "kecoh" dengan e-pepet meskipun data IPA menunjukkan e-taling `/ke.tʃɔh/`. Ini terjadi karena TTS engine tidak menerima input IPA.
- **SSML `<phoneme>` tidak didukung** — W3C menetapkan `<phoneme alphabet="ipa" ph="...">` di spesifikasi SSML, tapi tidak ada browser yang mengimplementasikannya di Web Speech API.
- **Kualitas bervariasi** — bergantung pada browser, OS, dan voice yang tersedia.

**Percobaan eSpeak-NG (31 Maret 2026):**
- eSpeak-NG (open-source, formant-based TTS) dicoba sebagai alternatif karena mendukung input fonem langsung.
- Hasil: pelafalan fonetis akurat, tapi **kualitas suara robotik** (tidak natural) — tidak cocok untuk produksi.
- Keputusan: eSpeak-NG di-uninstall; tidak dilanjutkan.

**Kesimpulan:** Web Speech API tetap dipakai sebagai fallback (gratis, natural, instant), dengan catatan pelafalan e tidak selalu akurat. Untuk akurasi fonetis, diperlukan cloud neural TTS yang mendukung SSML — lihat rencana di bawah.

## Rencana: Google Cloud Text-to-Speech

### Mengapa Google Cloud TTS

| Kriteria | Web Speech API | Google Cloud TTS |
|----------|---------------|------------------|
| Kualitas suara | Natural (bergantung OS) | Sangat natural (WaveNet/Neural2) |
| Input IPA | ❌ Tidak didukung | ✅ SSML `<phoneme alphabet="ipa">` |
| Biaya | Gratis | ~$16 per 1 juta karakter |
| Offline | ✅ | ❌ (perlu internet saat generate) |
| Voice Indonesia | Terbatas | `id-ID-Wavenet-A/B/C/D` (4 voice) |

### Strategi: Pre-generate + Static Hosting

Untuk menghindari biaya berulang dan latensi runtime, audio akan di-**pre-generate sekali** sebagai file MP3 statis:

1. **Generate lokal** — script Node.js memanggil Google Cloud TTS API dengan SSML `<phoneme>` untuk setiap entri
2. **Simpan sebagai MP3** — file kecil (~2–5 KB per kata), disimpan dengan nama `{entri_id}.mp3`
3. **Upload ke CDN** — Cloudflare R2, Backblaze B2, atau object storage serupa
4. **Frontend** — cek apakah audio tersedia di CDN; jika ya putar `<audio>`, jika tidak fallback ke Web Speech API

**Estimasi biaya generate sekali:**
- 65.585 entri × rata-rata 6 karakter = ~400.000 karakter
- WaveNet: $16 / 1M char → **~$6–7 sekali bayar**
- File audio bisa disimpan permanen, tidak perlu generate ulang

**Estimasi ukuran total:**
- 65.585 file × ~3 KB = **~200 MB** (cocok untuk object storage/CDN)

### Cara Mendaftar & Mengaktifkan Google Cloud TTS

#### 1. Buat Akun Google Cloud
- Buka https://console.cloud.google.com/
- Login dengan akun Google
- Google menyediakan **$300 free credit** selama 90 hari untuk akun baru

#### 2. Buat Project
- Di Console, klik **Select a project** → **New Project**
- Nama project: misalnya `kateglo-tts`
- Klik **Create**

#### 3. Aktifkan Cloud Text-to-Speech API
- Buka https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
- Atau: cari "Text-to-Speech" di API Library
- Klik **Enable**

#### 4. Buat Service Account + Key
- Buka **IAM & Admin** → **Service Accounts**
- Klik **Create Service Account**
- Nama: `kateglo-tts-generator`
- Role: tidak perlu (akses API sudah cukup)
- Klik **Done**
- Klik service account yang baru dibuat → **Keys** → **Add Key** → **Create new key** → **JSON**
- Simpan file JSON key ke `backend/.env.gcp-tts.json` (jangan commit — tambahkan ke `.gitignore`)

#### 5. Aktifkan Billing
- Buka **Billing** → link project ke akun billing
- Free tier: 1 juta karakter WaveNet gratis per bulan (standard), atau gunakan $300 free credit

#### 6. Install Client Library
```bash
cd backend
npm install @google-cloud/text-to-speech
```

### Contoh SSML dengan IPA

```xml
<speak>
  <phoneme alphabet="ipa" ph="ke.tʃɔh">kecoh</phoneme>
</speak>
```

### Contoh Script Generate (Draft)

```javascript
// backend/scripts/analisis/generate_audio_tts.js (draft)
const tts = require('@google-cloud/text-to-speech');
const fs = require('fs');
const db = require('../../db');

const client = new tts.TextToSpeechClient({
  keyFilename: '.env.gcp-tts.json',
});

async function generateAudio(entri, lafal) {
  const ssml = `<speak><phoneme alphabet="ipa" ph="${lafal}">${entri}</phoneme></speak>`;
  const [response] = await client.synthesizeSpeech({
    input: { ssml },
    voice: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A' },
    audioConfig: { audioEncoding: 'MP3' },
  });
  return response.audioContent; // Buffer MP3
}
```

### Langkah Selanjutnya

1. Daftar Google Cloud + aktifkan TTS API
2. Buat script pilot — generate 10 kata ujicoba (termasuk kata dengan e-taling)
3. Dengarkan hasil — pastikan SSML `<phoneme>` diinterpretasi benar
4. Jika kualitas memadai, buat script batch untuk seluruh 65k entri
5. Upload ke object storage / CDN
6. Update frontend: cek audio CDN dulu, fallback ke Web Speech API

## Catatan & Keterbatasan Lain

1. **Huruf 'e'**: Generator default ke schwa (ə). 8.367 kata dengan e-taling dipulihkan dari KBBI4 SQLite lama. Sisa entri dengan 'e' taling perlu koreksi manual oleh redaksi
2. **Aturan alofon kontekstual**: /i/→[ɪ] dan /u/→[ʊ] hanya diterapkan di suku tutup terakhir (TBBBI). Kata serapan Indo-Eropa cenderung tetap [i]/[u] walau posisi sama (e.g. politik [politik]) — tidak dapat dideteksi otomatis
3. **Harmoni vokal**: /e/→[ɛ] dan /o/→[ɔ] dengan harmoni mundur hanya ke suku buka sebelumnya. Harmoni berhenti di suku tutup (sesuai TBBBI)
4. **Kata serapan**: Beberapa kata serapan mungkin perlu pelafalan khusus yang tidak tercakup aturan standar
