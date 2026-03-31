# Rencana Pengembangan Kateglo 2.0

Tanggal: 14 Maret 2026
Terakhir dimutakhirkan: 31 Maret 2026

## Ringkasan

Dokumen ini berisi analisis perbandingan fitur Kateglo dengan 10 kamus publik besar dunia dan 10 kamus slang, beserta rencana pengembangan ke depan.

---

## 1. Analisis Menu Publik Saat Ini

### Menu Navigasi Utama Kateglo (9 item per 31 Maret 2026)

| No | Menu | Rute | Fungsi |
|----|------|------|--------|
| 1 | Kamus | `/kamus` | Kamus bahasa Indonesia — jelajah abjad, kelas kata, bentuk, tagar |
| 2 | Tesaurus | `/tesaurus` | Sinonim, antonim |
| 3 | Glosarium | `/glosarium` | Istilah teknis bilingual per bidang |
| 4 | Makna | `/makna` | Kamus terbalik (cari berdasarkan definisi) |
| 5 | Rima | `/rima` | Pencari rima akhir & aliterasi |
| 6 | Gramatika | `/gramatika` | Tata bahasa TBBBI (ditambahkan Maret 2026) |
| 7 | Ejaan | `/ejaan` | Panduan ejaan (EYD) |
| 8 | Alat | `/alat` | Penghitung huruf, penganalisis teks, pohon kalimat |
| 9 | Gim | `/gim` | Kuis kata, susun kata |

### Masalah
- **9 item menu terlalu banyak** untuk navigasi utama — standar industri kamus besar: 4–6 item. (Bertambah dari 8 sejak Gramatika ditambahkan Maret 2026.)
- **Makna** dan **Rima** adalah fitur pencarian khusus, bukan produk berdiri sendiri.
- **Gramatika** dan **Ejaan** bersifat referensi statis, bukan fitur kamus inti.
- **Alat** dan **Gim** bernilai tinggi tapi bukan fungsi utama kamus.

---

## 2. Benchmark: Menu Utama Kamus Besar Dunia

### 2.1 Oxford English Dictionary (OED)
**Situs:** https://www.oed.com 
**Tipe:** Kamus historis bahasa Inggris terbesar (520.779 entri, 888.251 makna). Berbayar (£100/tahun), akses gratis via perpustakaan. Edisi ke-3 sedang dikerjakan (target 2037).

| Menu Utama | Konten |
|------------|--------|
| (Search) | Pencarian entri + kutipan historis |
| Dictionary | Jelajah kamus + advanced search |
| Thesaurus | 821.712 entri tesaurus |
| About / History | Sejarah OED, metodologi, tim editor |

**Fitur khas:**
- Kutipan historis kronologis untuk setiap makna
- Timeline penggunaan kata
- Pembaruan kuartalan dengan kata baru
- 3.927.862 kutipan dari berbagai sumber

---

### 2.2 Merriam-Webster
**Situs:** https://www.merriam-webster.com
**Tipe:** Kamus bahasa Inggris Amerika terpopuler. Gratis + premium (MWU). Sejak 1828.

| Menu Utama | Konten |
|------------|--------|
| (Search Bar) | Pencarian sentral — Dictionary & Thesaurus tergabung |
| Games & Quizzes | Reunion, Quordle, Blossom, kuis kosakata, dll. (10+ gim) |
| Word of the Day | Kata harian + langganan email |
| Grammar | Panduan tata bahasa dan pemakaian kata |
| Wordplay | Artikel ringan tentang bahasa (idiom, sejarah kata, dll.) |
| Slang | Kosakata slang terkini |
| Word Finder | Alat bantu permainan kata (Scrabble helper, dll.) |

**Fitur tambahan:**
- Thesaurus, Rhymes (bagian pencarian)
- Time Traveler (kata berdasarkan tahun kelahiran)
- Browse by letter (A-Z) — Dictionary, Thesaurus, Example Sentences
- Medical / Legal / Kid's Dictionary (kamus spesialis)
- Podcast, Video, Newsletter
- Popular searches / Top Lookups Right Now
- Word of the Year

---

### 2.3 Cambridge Dictionary
**Situs:** https://dictionary.cambridge.org
**Tipe:** Kamus learner + native. Gratis. Multi-bahasa (30+ bahasa terjemahan). Penerbit Cambridge University Press.

| Menu Utama | Konten |
|------------|--------|
| Dictionary | Kamus English (+ Learner's, Essential) |
| Translate | Terjemahan bilingual (30+ pasangan bahasa) |
| Grammar | Panduan tata bahasa Inggris lengkap |
| Thesaurus | Sinonim & antonim |
| +Plus | Daftar kata pribadi, kuis, fitur akun |
| Games | Word Scramble, dll. |

**Fitur tambahan:**
- AI Assistant (baru)
- Pronunciation guide dengan audio
- Word of the Day
- New Words (blog kata baru)
- Topic Dictionaries (per topik: Animals, Health, dll.)
- Popular searches (top 10 real-time)
- Word of the Year

---

### 2.4 Oxford Learner's Dictionaries
**Situs:** https://www.oxfordlearnersdictionaries.com
**Tipe:** Kamus pelajar (OALD). Gratis + premium. Oxford University Press.

| Menu Utama | Konten |
|------------|--------|
| Dictionaries | OALD, Academic English, Collocations |
| Grammar | Panduan + latihan interaktif (Practical English Usage) |
| Word Lists | Oxford 3000/5000 berdasarkan CEFR |
| Resources | Blog, podcast, teaching tools |

**Fitur tambahan:**
- Topic Dictionaries (hierarki topik: subtopik per CEFR level)
- Word of the Day
- Pronunciation guide + iSpeaker (latihan pelafalan)
- Spread the Word (artikel kata baru)
- Collocations Dictionary

---

### 2.5 Collins Dictionary
**Situs:** https://www.collinsdictionary.com
**Tipe:** Kamus bahasa Inggris + 13 bahasa lain. Gratis. HarperCollins Publishers.

| Menu Utama | Konten |
|------------|--------|
| (Language tabs) | English, French, German, Italian, Spanish, dll. |
| Translator | Terjemahan mesin |
| Games | Quick Word Challenge (kuis sinonim cepat) |
| Schools | Kamus aman untuk anak-anak (tanpa iklan) |
| Blog | Artikel tentang perbedaan kata, tips bahasa |
| Resources | Grammar Patterns, Easy Learning Grammar, Scrabble |

**Fitur tambahan:**
- AI Assistant (beta)
- Audio + video pronunciation (British & American)
- Trending words dengan persentase perubahan pencarian
- Conjugation tables
- Word lists by theme
- Famous quotations
- Images for thousands of entries
- Newsletter

---

### 2.6 Macmillan Dictionary ⚠️ (Ditutup 2023)
**Situs:** https://www.macmillandictionary.com (sudah tidak aktif, redirect ke halaman bantuan)
**Tipe:** Kamus pelajar tingkat lanjut (MEDAL). Online 2009–2023. Macmillan Education.

**Fitur yang dulu ada (untuk referensi):**
- Thesaurus terintegrasi di setiap entri
- Open Dictionary (kontribusi pengguna untuk kata baru)
- Blog harian tentang isu bahasa
- Frekuensi kata (7.500 kata paling sering ditandai merah, 3 tingkat frekuensi)
- Metaphor boxes (kerangka metafor konseptual)
- Collocation boxes

**Pelajaran:** Kamus online besar pun bisa tutup — pentingnya keberlanjutan dan komunitas.

---

### 2.7 Longman Dictionary of Contemporary English (LDOCE)
**Situs:** https://www.ldoceonline.com
**Tipe:** Kamus pelajar + bilingual (Spanyol, Jepang, Korea). Gratis. Pearson.

| Menu Utama | Konten |
|------------|--------|
| (Search Bar) | Pencarian sentral |
| (Language tabs) | English, English-Spanish, English-Japanese, English-Korean |

**Fitur tambahan:**
- Word of the Day
- Topic browsing (Hot Topics: Grammar, Hospital, School, History, dll.)
- Pictures of the Day (visual vocabulary)
- Exercises & Quizzes
- Corpus information (Longman Corpus)

---

### 2.8 Dictionary.com
**Situs:** https://www.dictionary.com
**Tipe:** Kamus online populer berbasis Random House. Gratis + iklan. Terbesar di AS dari sisi traffic.

**Fitur utama (berdasarkan riset umum):**
- Dictionary + Thesaurus (tab terpisah)
- Word of the Day
- Word Games (Wordle-like, crossword)
- Grammar articles
- Slang dictionary
- Word Finder / Unscrambler
- Trending words
- Writing tips

---

### 2.9 Wiktionary
**Situs:** https://en.wiktionary.org
**Tipe:** Kamus wiki kolaboratif. Gratis. Wikimedia Foundation. 9,9 juta entri dari 4.500+ bahasa.

| Menu Utama | Konten |
|------------|--------|
| (Search) | Pencarian entri |
| Browse | All languages, List of topics, Random word, New entries |
| Appendices | Daftar lampiran (istilah, singkatan, dll.) |
| Thesaurus | Tesaurus per bahasa |
| Rhymes | Rima per bahasa |
| Frequency lists | Daftar frekuensi kata |
| Phrasebooks | Buku frasa per bahasa |

**Fitur khas:**
- Word of the Day + Foreign Word of the Day
- Setiap entri berisi: definisi, etimologi, pengucapan (IPA), terjemahan, sinonim, antonim
- Kolaboratif — siapa saja bisa mengedit
- Multi-bahasa dalam satu platform
- Lisensi terbuka (Creative Commons)

---

### 2.10 WordNet (Princeton)
**Situs:** https://wordnet.princeton.edu
**Tipe:** Database leksikal untuk NLP/linguistik komputasional. Gratis & open source. Sudah tidak dikembangkan aktif, dilanjutkan oleh Open English WordNet (OEWN).

**Fitur khas:**
- 117.000 synset (himpunan sinonim) yang saling terhubung
- Relasi semantik: hypernym/hyponym (IS-A), meronym/holonym (PART-OF), antonym
- Hierarchi kata benda sampai root node {entity}
- Cross-POS relations (kata kerja ↔ kata benda ↔ kata sifat)
- Tersedia untuk download + API

**Relevansi untuk Kateglo:**
- Model relasi semantik WordNet (hypernym, hyponym, meronym, holonym) adalah inspirasi langsung untuk fitur tesaurus lanjutan yang sudah direncanakan di Kateglo.
- Struktur synset bisa menjadi referensi untuk mengelompokkan sinonim Indonesia.

---

### 2.11 Wordnik
**Situs:** https://www.wordnik.com
**Tipe:** Kamus online nirlaba (501(c)(3)). Gratis. Fokus pada kata-kata dari semua sumber.

| Menu Utama | Konten |
|------------|--------|
| (Search Bar) | Pencarian sentral |
| Word of the Day | Kata harian |
| Random Word | Kata acak |
| Advanced Search | Pencarian lanjutan |

**Fitur tambahan:**
- Adopt a word (donasi)
- Community word lists
- API developer (gratis)
- Definisi dari berbagai sumber (multi-source)

---

## 3. Benchmark: Kamus Slang Dunia

Selain kamus standar, ekosistem kamus slang memberikan perspektif yang berbeda — fokus pada bahasa informal, kontribusi komunitas, dan konten yang terus berubah. Berikut analisis 10 situs kamus slang.

### 3.1 Urban Dictionary
**Situs:** https://www.urbandictionary.com
**Tipe:** Kamus slang crowdsourced terbesar. Gratis. Didirikan 1999 oleh Aaron Peckham. 12 juta+ definisi.

| Fitur | Deskripsi |
|-------|-----------|
| Pencarian | Pencarian sentral — auto-complete |
| Word of the Day | Kata slang harian |
| Random Word | Kata acak |
| Define a Word | Siapa saja bisa menambahkan definisi |
| Voting | Thumbs up/down per definisi (kualitas komunitas) |
| Store | Merchandise (mug, kaos) berdasarkan kata |
| Audio | Pengucapan dikirim pengguna |

**Catatan penting:**
- Setiap kata bisa punya banyak definisi dari pengguna berbeda, diurutkan berdasarkan vote
- Volunteer editors menyetujui/menolak entri baru
- Digunakan di pengadilan AS dan Kanada sebagai referensi slang
- Aplikasi mobile dihapus dari App Store & Google Play (2024)
- Konten sering kontroversial — tidak dimoderasi ketat

**Pelajaran untuk Kateglo:** Model kontribusi publik + voting adalah inspirasi untuk fitur KADI (Kamus Deskriptif). Sistem voting sederhana bisa meningkatkan kualitas kontribusi.

---

### 3.2 Green's Dictionary of Slang (GDoS)
**Situs:** https://greensdictofslang.com (bukan green.co.uk yang adalah perusahaan energi)
**Tipe:** Kamus historis slang bahasa Inggris. Gratis online sejak 2016. 125.000 entri, mencakup 500 tahun (sejak ~1500). Oleh leksikografer Jonathon Green.

| Menu Utama | Konten |
|------------|--------|
| Home | Beranda, Word of the Week |
| Browse | Jelajah A–Z |
| Search | Pencarian + Advanced Search |
| Bibliography | Daftar sumber kutipan |
| About | Tentang kamus |

**Fitur khas:**
- Word of the Week (bukan harian)
- Timelines of Slang (visualisasi historis)
- Setiap entri dengan kutipan historis kronologis (seperti OED tapi untuk slang)
- Pemenang Dartmouth Medal 2012 (American Library Association)
- Disebut "OED-nya slang" oleh para kritikus

**Pelajaran untuk Kateglo:** Pendekatan historis-kronologis terhadap slang. Model yang sangat relevan jika Kateglo ingin mendokumentasikan slang Indonesia secara serius.

---

### 3.3 NoSlang.com
**Situs:** https://www.noslang.com
**Tipe:** Kamus slang internet & teks (SMS, chat). Gratis. Bagian dari jaringan AllSlang.

| Fitur | Deskripsi |
|-------|-----------|
| Slang Translator | Terjemahkan teks berisi slang ke bahasa standar |
| Reverse Translator | Ubah teks standar menjadi slang |
| Slang Dictionary | Jelajah kamus slang A–Z |
| Articles & Quizzes | Artikel tentang slang + kuis |
| Drug Slang | Kamus slang narkoba khusus |
| Add Slang | Kontribusi pengguna |

**Fitur tambahan:**
- Slangle — gim tebak slang seperti Wordle
- Gen Alpha Slang, Dating App Terms, Twitter Slang (kategori khusus)
- Trending Today (slang yang sedang dicari)
- Most Popular Slang
- Rejected Slang Terms (transparansi moderasi)
- British Slang (tautan ke TranslateBritish.com)

**Pelajaran untuk Kateglo:** Fitur "Slang Translator" (terjemahkan teks informal ke formal) sangat menarik — bisa diadaptasi untuk bahasa Indonesia (bahasa gaul → bahasa baku).

---

### 3.4 SlangDefine.org
**Situs:** https://www.slangdefine.org
**Tipe:** Kamus slang bahasa Inggris. Gratis. Mengklaim sebagai "the LARGEST dictionary of English Slang."

| Menu Utama | Konten |
|------------|--------|
| Home | Beranda + pencarian |
| Slangs | Jelajah kata slang (browse) |
| Top 100 | 100 slang terpopuler |

**Fitur tambahan:**
- Audio pronunciation per entri
- Contoh kalimat
- Kontribusi pengguna ("Add your Slang Expression")
- Social sharing (Reddit, Twitter, Facebook, Pinterest, Pocket)

---

### 3.5 Online Slang Dictionary
**Situs:** https://onlineslangdictionary.com
**Tipe:** Kamus slang bahasa Inggris berbasis komunitas. Gratis. Dibuat oleh Walter Rader.

**Fitur utama (berdasarkan riset umum — situs sulit diakses):**
- Definisi slang dengan contoh kalimat
- Thesaurus of slang (cari sinonim slang)
- Vulgarity ratings (tingkat kekaburan/vulgaritas)
- Usage statistics (statistik penggunaan)
- Kontribusi pengguna

---

### 3.6 Dictionary.com — Seksi Slang
**Situs:** https://www.dictionary.com/e/slang
**Tipe:** Sub-bagian slang dari Dictionary.com (bukan situs berdiri sendiri). Gratis.

**Fitur utama:**
- Artikel editorial tentang asal-usul dan makna slang
- Daftar slang per generasi (Gen Z, Gen Alpha)
- Word of the Year (2025: "6-7" — slang Gen Alpha dari TikTok)
- Terintegrasi dengan kamus utama Dictionary.com

---

### 3.7 Merriam-Webster — Seksi Slang
**Situs:** https://www.merriam-webster.com/slang
**Tipe:** Sub-bagian slang dari Merriam-Webster (bukan situs terpisah). Menu utama MW.

**Fitur utama:**
- Kosakata slang yang sudah masuk kamus resmi MW
- Artikel editorial tentang slang baru
- Sejarah kata slang yang menjadi formal

**Catatan:** MW secara rutin menambahkan slang ke kamus resmi (contoh: "doomscroll," "rizz," "sus").

---

### 3.8 Speaking Latino — Slang Dictionary
**Situs:** https://www.speakinglatino.com/slang-dictionary/
**Tipe:** Kamus slang Spanyol per negara. Bukan kamus tradisional — lebih merupakan sumber belajar untuk guru bahasa Spanyol. Oleh Jared & Diana Romey.

**Fitur khas:**
- Slang per negara: Argentina, Bolivia, Chile, Kolombia, Kosta Rika, Kuba, Republik Dominika, Ekuador, El Salvador, Guatemala, Honduras, Meksiko, Nikaragua, Peru, Puerto Riko, Spanyol, Venezuela
- Lesson plans untuk guru
- Cheat sheets per dialek

**Relevansi untuk Kateglo:** Model "slang per daerah" sangat relevan untuk Indonesia — bisa mendokumentasikan slang Betawi, Surabaya, Bandung, Makassar, dll.

---

### 3.9 InternetSlang.com
**Situs:** https://www.internetslang.com
**Status:** ⚠️ Situs tidak dapat diakses (HTTP 504). Tampaknya down atau tidak aktif.
**Tipe:** Dulu kamus akronim dan singkatan internet. Masih direferensikan di Wikipedia.

---

### 3.10 slang-dictionary.org ⚠️ (Domain Dikompromikan)
**Situs:** https://www.slang-dictionary.org
**Status:** ❌ Domain sudah dibajak/dikompromikan — sekarang mengarah ke situs judi online ("PULAUJUDI"). **Bukan sumber yang valid.**

---

### Pola Umum Kamus Slang

| Fitur | UrbanDict | GDoS | NoSlang | SlangDef | OSD | Dict.com | MW |
|-------|:---------:|:----:|:-------:|:--------:|:---:|:--------:|:--:|
| Kontribusi publik | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Voting/ranking | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Word of Day/Week | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Audio pengucapan | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Contoh kalimat | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Kutipan historis | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Translator (teks) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gim/kuis | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Slang per daerah | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Trending/populer | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Terintegrasi kamus standar | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

**Insight utama untuk Kateglo:**
1. **Kontribusi publik + voting** = model terbaik untuk mendokumentasikan bahasa informal (Urban Dictionary, sejak 1999).
2. **Translator slang→baku** = fitur unik NoSlang yang bisa diadaptasi untuk bahasa gaul Indonesia.
3. **Slang per daerah** = sangat cocok untuk Indonesia — bahasa gaul Betawi, Suroboyoan, Sundanese, dll.
4. **Integrasi dengan kamus utama** = Dictionary.com & MW menunjukkan bahwa slang dan kamus standar berpadu; Kateglo bisa menyematkan label "informal/gaul" di entri kamus utama.
5. **Pendekatan historis** = GDoS menunjukkan nilai dokumentasi kronologis slang; relevan untuk KADI.

---

## 4. Pola Umum Kamus Besar

Dari benchmark di atas, ada pola yang konsisten:

### Menu Utama (Inti): Maksimal 4–6 item
1. **Pencarian sentral** — selalu ada di navbar, bukan halaman terpisah
2. **Kamus/Dictionary** — produk inti
3. **Tesaurus/Thesaurus** — produk pendamping utama
4. **Tata Bahasa/Grammar** — panduan bahasa
5. **Gim/Games** — engagement & retensi
6. **Plus/Lainnya** — fitur tambahan (catch-all)

### Fitur yang Ada di Kamus Standar (Matriks Perbandingan)

Legenda: ✅ = ada, ⚠️ = parsial, ❌ = tidak ada, — = tidak relevan/tidak diketahui

| Fitur | OED | MW | Cam | OxL | Col | LDOCE | Dict | Wikt | WNet | Wdnk | **Ktglo** |
|-------|:---:|:--:|:---:|:---:|:---:|:-----:|:----:|:----:|:----:|:----:|:---------:|
| Pencarian sentral | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kamus (definisi) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tesaurus | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | ✅ | — | ✅ |
| Kata Hari Ini | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Gim & Kuis | — | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | — | — | ✅ |
| Tata Bahasa/Ejaan | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ✅ |
| Jelajah A–Z | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | ✅ |
| Pencarian Populer | — | ✅ | ✅ | — | ✅ | — | ✅ | — | — | — | ✅ |
| Pengucapan/Audio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | — | — | ✅ |
| Contoh Kalimat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Etimologi | ✅ | ✅ | — | — | ✅ | — | ✅ | ✅ | — | ✅ | ✅ |
| Topik/Glosarium | — | ⚠️ | ✅ | ✅ | — | ✅ | — | ✅ | — | — | ✅ |
| Rima | — | ✅ | — | — | — | — | — | ✅ | — | — | ✅ |
| Kamus Terbalik | — | — | — | — | — | — | — | — | — | — | **✅** |
| Alat Bahasa | — | ✅ | — | — | ✅ | — | ✅ | — | — | — | ✅ |
| Blog/Editorial | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⚠️ | — | ✅ | ❌ |
| Terjemahan | — | — | ✅ | — | ✅ | ✅ | — | ✅ | — | — | ❌ |
| Daftar Kata | — | — | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ | ❌ |
| Relasi Semantik | — | — | — | — | — | — | — | ⚠️ | **✅** | — | ⚠️ |
| Frekuensi Kata | — | — | ⚠️ | ✅ | — | ✅ | — | ✅ | — | — | ❌ |
| Kontribusi Publik | — | — | — | — | — | — | — | ✅ | — | ✅ | ⚠️ |
| Mobile App | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ⚠️ |
| API Publik | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ | ✅ | ❌ |

**Keterangan singkatan:** OED = Oxford English Dictionary, MW = Merriam-Webster, Cam = Cambridge, OxL = Oxford Learner's, Col = Collins, LDOCE = Longman, Dict = Dictionary.com, Wikt = Wiktionary, WNet = WordNet, Wdnk = Wordnik, Ktglo = Kateglo

---

## 5. Rekomendasi Reorganisasi Menu

### Prinsip
1. **Menu utama ≤ 5 item** — lebih dari itu, pengguna kewalahan.
2. **Fitur pencarian khusus** (Makna, Rima) masuk sub-fitur, bukan menu utama.
3. **Alat** dan **Gim** digabung atau salah satu jadi sub-menu.
4. **Gramatika** dan **Ejaan** digabung atau keduanya masuk sub-menu — jarang diakses dibanding kamus/tesaurus.

_Catatan (31 Maret 2026): Menu saat ini 9 item — bertambah 1 sejak Gramatika ditambahkan pada 19 Maret 2026. Reorganisasi menjadi lebih mendesak._

### Struktur Menu Baru yang Diusulkan

```
┌─────────────────────────────────────────────────────┐
│  🔍 [Kotak Cari]    Kamus  Tesaurus  Glosarium  ⋯  │
└─────────────────────────────────────────────────────┘
```

| No | Menu | Isi | Catatan |
|----|------|-----|---------|
| 1 | **Kamus** | Kamus utama, jelajah A–Z, kelas kata, tagar | Tetap |
| 2 | **Tesaurus** | Sinonim, antonim | Tetap |
| 3 | **Glosarium** | Istilah teknis bilingual | Tetap |
| 4 | **Gim** | Kuis Kata, Susun Kata, gim baru | Tetap (tetap jadi menu karena engagement) |
| 5 | **Lainnya** (⋯) | Submenu dropdown: | Baru — catch-all |
| | | — Makna (kamus terbalik) | Pindah dari menu utama |
| | | — Rima | Pindah dari menu utama |
| | | — Gramatika (tata bahasa TBBBI) | Pindah dari menu utama |
| | | — Ejaan (panduan EYD) | Pindah dari menu utama |
| | | — Alat (penghitung huruf, dsb.) | Pindah dari menu utama |
| | | — Sumber (bibliografi) | Sudah ada, bukan menu |
| | | — Kata Hari Ini ⭐ | **Baru** |
| | | — Tentang Kateglo | **Baru** |

**Alternatif:** Gim bisa juga masuk ke Lainnya jika ingin menu utama hanya 4 item:

```
Kamus | Tesaurus | Glosarium | Lainnya ⋯
```

---

## 6. Fitur yang Perlu Ditambah

Berdasarkan gap analysis dengan kamus besar dunia, diurutkan berdasarkan **dampak × usaha**:

### Prioritas Tinggi (Dampak besar, usaha terkendali)

#### 6.1 Kata Hari Ini (Word of the Day) ✅ SELESAI
- **Apa:** Menampilkan satu kata menarik setiap hari dengan definisi, contoh, dan etimologi.
- **Kenapa:** Fitur ini ada di **semua** kamus besar. Meningkatkan engagement harian, SEO, dan bisa jadi konten media sosial.
- **Implementasi:**
  - ~~Pilih otomatis dari entri yang punya definisi lengkap + etimologi + contoh.~~ ✅
  - ~~Tampilkan di beranda (mengganti/melengkapi bagian populer).~~ ✅ Tampil di beranda di bawah pencarian.
  - ~~Endpoint API: `GET /api/publik/kata-hari-ini`~~ ✅ Tersedia di `GET /api/publik/kamus/kata-hari-ini`
  - ~~Simpan riwayat agar tidak berulang.~~ ✅ Tabel `kata_hari_ini` di database.
  - Manajemen via redaksi: `GET/POST/PUT/DELETE /api/redaksi/kata-hari-ini` ✅
  - **Belum selesai:** Halaman arsip/riwayat publik untuk melihat kata-kata sebelumnya.
  - Opsional: widget untuk embed di situs lain.

#### 6.2 Reorganisasi Menu (seperti bagian 5)
- **Apa:** Streamline navigasi dari 9 → 4–5 item. (Sekarang 9 menu setelah Gramatika ditambahkan.)
- **Kenapa:** UX lebih bersih, pengguna tidak kewalahan.
- **Implementasi:** Perubahan frontend saja (NavbarPublik + MenuUtama).

#### 6.3 Halaman "Tentang Kateglo" ✅ SELESAI
- **Apa:** Halaman statis yang menjelaskan misi, sumber data, tim, dan cara berkontribusi.
- **Kenapa:** Semua kamus besar punya halaman ini. Penting untuk kredibilitas dan SEO.
- **Implementasi:** ~~Halaman markdown statis, mirip Ejaan.~~ → Diimplementasikan sebagai halaman [Ihwal](/ihwal) (26 Maret 2026).

### Prioritas Sedang (Dampak besar, usaha lebih besar)

#### 6.4 Konten Editorial / Blog Bahasa
- **Apa:** Artikel pendek tentang bahasa Indonesia — asal-usul kata, kesalahan umum, kata baru, idiom menarik.
- **Kenapa:** Merriam-Webster (Wordplay, Grammar), Cambridge (Blog), Oxford (Spread the Word) semua punya konten editorial. Meningkatkan SEO, engagement, dan waktu di situs.
- **Implementasi:**
  - Format markdown di `frontend/public/artikel/` atau CMS sederhana.
  - Halaman daftar artikel + halaman baca artikel.
  - Kategori: Asal Kata, Kesalahan Umum, Kata Baru, Bahasa Daerah.
  - Bisa dimulai dari konten Ejaan yang sudah ada.

#### 6.5 Contoh Kalimat yang Lebih Menonjol
- **Apa:** Menampilkan contoh kalimat penggunaan kata secara lebih prominan di halaman detail kamus.
- **Kenapa:** Cambridge dan Merriam-Webster bahkan punya browse contoh kalimat terpisah. Contoh kalimat adalah salah satu informasi paling dicari pengguna kamus.
- **Implementasi:**
  - Sudah ada data `contoh` di database.
  - Perbaiki tampilan agar lebih menonjol di detail kamus.
  - Opsional: sumber contoh dari korpus (KADI).

#### 6.6 Peningkatan Halaman Detail Kamus
- **Apa:** Memperkaya halaman detail dengan section yang lebih terstruktur.
- **Kenapa:** Halaman detail adalah halaman terpenting — di sinilah pengguna menghabiskan waktu.
- **Elemen yang bisa ditambah:**
  - Kotak "Tahukah Anda?" (fakta menarik tentang kata).
  - Tautan ke tesaurus, rima, dan makna langsung dari detail.
  - Frekuensi penggunaan kata (jika ada data korpus).
  - Kata terkait (dari tagar yang sama).

#### 6.7 KADI: Usul Kata (sudah direncanakan)
- `/usul-kata` — halaman publik untuk kontribusi pengguna
- Pipeline normalisasi dan migrasi kandidat ke entri utama

### Prioritas Rendah (Bagus tapi bisa nanti)

#### 6.8 API Publik untuk Pengembang
- **Apa:** API terdokumentasi yang bisa dipakai pengembang luar.
- **Kenapa:** Merriam-Webster dan Cambridge punya Dictionary API berbayar. Wordnik punya API gratis.
- **Implementasi:** API sudah ada (backend), tinggal dokumentasi + rate limiting + API key.

#### 6.9 Newsletter / Langganan Email
- **Apa:** Kirim Kata Hari Ini + artikel mingguan via email.
- **Kenapa:** Merriam-Webster sangat sukses dengan newsletter harian.
- **Implementasi:** Integrasi dengan layanan email (Mailchimp/Resend). Mulai setelah Kata Hari Ini jalan.

#### 6.10 Pengucapan Audio ✅ SELESAI
- **Apa:** Tombol play audio pengucapan kata.
- **Kenapa:** Fitur standar di semua kamus besar. Data lafal sudah ada di Kateglo.
- **Implementasi:** ~~Text-to-speech API atau rekaman manual. Bisa pakai Web Speech API sebagai awal.~~ → Diimplementasikan menggunakan Web Speech API (`TombolLafal`). Tersedia di halaman detail kamus dan widget Kata Hari Ini di beranda. Menampilkan notasi IPA jika tersedia (31 Maret 2026).

#### 6.11 Daftar Kata Pribadi (Personal Word Lists)
- **Apa:** Pengguna yang login bisa menyimpan kata ke daftar pribadi.
- **Kenapa:** Cambridge Dictionary +Plus punya fitur ini. Meningkatkan retensi pengguna.
- **Implementasi:** Butuh sistem akun pengguna publik (saat ini hanya admin).

#### 6.12 Kamus Tematik (Topic Dictionary)
- **Apa:** Jelajah kosakata berdasarkan topik (Hewan, Kesehatan, Olahraga, dll.)
- **Kenapa:** Oxford dan Cambridge punya Topic Dictionary. Cara berbeda untuk menjelajah kosakata selain A–Z.
- **Implementasi:** Bisa dibangun dari data bidang (`discipline`) + tagar yang sudah ada.

#### 6.13 Lebih Banyak Gim
- **Gim baru yang bisa dikembangkan:**
  - **Tebak Kata** — seperti Hangman tapi dengan petunjuk definisi.
  - **Pasangkan Sinonim** — match sinonim dari tesaurus.
  - **Isi Titik-titik** — lengkapi kalimat (data dari contoh kalimat).
  - **Teka-teki Silang** — crossword mini harian.
- **Kenapa:** Merriam-Webster punya 10+ gim. Gim adalah driver engagement #1.

---

## 6A. Fitur Baru yang Telah Dikembangkan (Tidak dalam Rencana Awal)

Fitur-fitur berikut dikembangkan setelah dokumen ini ditulis (14 Maret 2026) dan tidak ada dalam rencana awal:

| Fitur | Tanggal | Deskripsi |
|-------|---------|-----------|
| **Gramatika TBBBI** | 19–25 Mar 2026 | Tata bahasa Indonesia lengkap berdasarkan TBBBI: 14 subbab, daftar istilah (3.220 glosarium Kamus Linguistik), daftar tabel, daftar gambar, kotak pencarian, panel lipat |
| **Pohon Kalimat** | 27 Mar 2026 | Alat analisis struktur kalimat visual di `/alat/pohon-kalimat` |
| **Katalog Fitur** | 26 Mar 2026 | Sistem metadata terpusat (`katalogFiturData.json`) untuk alat dan gim — mendukung UI, SSR, dan sitemap |
| **Open Graph dinamis** | 21 Mar 2026 | Gambar pratayang OG yang dihasilkan secara dinamis per halaman |
| **Glosarium Linguistik** | 25 Mar 2026 | 3.220 entri glosarium dari Kamus Linguistik |
| **Skor Kumulatif Kuis Kata** | 31 Mar 2026 | Skor kumulatif dan jumlah ronde harian di Kuis Kata |
| **Soal Susun Kata Unik** | 30 Mar 2026 | Menjamin soal susun kata harian tidak berulang |

---

## 7. Roadmap Usulan

### Fase 1: Quick Wins — Status per 31 Maret 2026
- [ ] Reorganisasi menu (9 → 5 item, dropdown Lainnya) — **belum dimulai**
- [x] ~~Halaman "Tentang Kateglo"~~ — **selesai** (halaman Ihwal, 26 Maret 2026)
- [x] ~~Kata Hari Ini — fitur dasar~~ — **selesai** (DB + API publik/redaksi + tampilan di beranda, 31 Maret 2026)

### Fase 2: Konten & Detail
- [ ] Kata Hari Ini — riwayat + halaman arsip — **belum dimulai** (backend & beranda sudah ada, perlu halaman arsip tersendiri)
- [ ] Peningkatan halaman detail kamus (section terstruktur, tautan silang) — **sebagian** (lafal/IPA sudah ditambahkan)
- [ ] Contoh kalimat lebih menonjol — **belum dimulai**
- [ ] KADI: halaman publik usul kata — **belum dimulai** (backend redaksi sudah ada)

### Fase 3: Engagement
- [ ] Konten editorial / blog bahasa (mulai 1 artikel/minggu) — **belum dimulai**
- [ ] 1–2 gim baru (Tebak Kata, Pasangkan Sinonim) — **belum dimulai**
- [ ] Kamus Tematik (dari data bidang + tagar) — **belum dimulai**

### Fase 4: Platform
- [ ] API publik terdokumentasi — **belum dimulai**
- [x] ~~Pengucapan audio (Web Speech API)~~ — **selesai** (TombolLafal + notasi IPA di detail kamus & beranda KTI, 31 Maret 2026)
- [ ] Newsletter (Kata Hari Ini + ringkasan mingguan) — **belum dimulai**
- [ ] Daftar kata pribadi (butuh akun publik) — **belum dimulai**

---

## 8. Keunggulan Unik Kateglo (Differentiator)

Fitur yang **tidak dimiliki** kamus besar lain dan harus dipertahankan/diperkuat:

| Fitur | Keunikan |
|-------|----------|
| **Kamus Terbalik (Makna)** | Cari kata dari definisi — sangat langka di kamus manapun |
| **Glosarium Bilingual** | Istilah teknis per bidang dengan padanan asing — spesifik Indonesia |
| **Rima** | Pencari rima untuk bahasa Indonesia — unik |
| **KADI** | Kamus Deskriptif berbasis korpus + kontribusi publik — inovatif |
| **Pemenggalan Suku Kata** | Data pemenggalan suku kata — jarang ada |
| **Tagar Morfologis** | Jelajah kata berdasarkan imbuhan — sangat berguna untuk pelajar |
| **Gramatika TBBBI** | Tata bahasa Indonesia lengkap berdasarkan TBBBI — baru ditambahkan Maret 2026 |
| **Pohon Kalimat** | Alat analisis struktur kalimat visual — unik untuk bahasa Indonesia |

Fitur-fitur ini adalah **keunggulan kompetitif** Kateglo dan harus tetap mudah diakses walaupun dipindah dari menu utama ke sub-menu.

---

## 9. Catatan Desain

### Prinsip Navigasi
- **Pencarian adalah raja** — kotak cari selalu terlihat, mendukung semua domain (kamus, tesaurus, glosarium, makna, rima) dari satu tempat.
- **Progressive disclosure** — tampilkan yang penting dulu, fitur lanjutan di submenu.
- **Mobile first** — menu hamburger hanya menampilkan 4–5 item utama, bukan 8.

### Inspirasi Layout
- **Beranda:** Hero search + Kata Hari Ini ✅ + Populer + Kuis cepat.
- **Detail Kamus:** Definisi → Contoh → Tesaurus → Etimologi → Rima → Kata Terkait (semua di satu halaman, navigasi section).
- **Glosarium:** Tetap terpisah karena audiens berbeda (penerjemah, profesional).
