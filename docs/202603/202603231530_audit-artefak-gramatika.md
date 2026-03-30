matika-artefak.js                                                                                                   # Audit Artefak Gramatika

Dibuat: 2026-03-23T11:16:37.339Z

Artefak yang diaudit:

- Subbab: nomor pada `id:` frontmatter dan heading bernomor seperti `## ... (7.2.2.2)`, dinormalisasi ke nomor bab. 
- Contoh: nomor contoh berbentuk `(xx)` pada awal baris; varian huruf seperti `(72a)` dihitung ke basis nomor `72`. 
- Diagram bernomor seperti `Diagram (3)` diperlakukan sebagai bentuk penyajian contoh dan dihitung ke nomor contoh t
erkait.                                                                                                             - Tabel: caption `Tabel ...`, termasuk yang muncul sebagai alt image atau baris miring/tebal.
- Bagan: caption `Bagan ...`, termasuk yang muncul sebagai alt image atau baris miring/tebal.
- Diagram tidak diaudit sebagai artefak tersendiri; diagram diperlakukan sebagai bentuk penyajian contoh.
- Duplikat representasional dalam file yang sama (misalnya alt gambar + caption, atau frontmatter + heading) dipisah
kan dari duplikat yang perlu ditelaah.                                                                              
## Ringkasan

| Bab | Subbab | Contoh | Tabel | Bagan | Gap? | Duplikat? |
|---|---:|---:|---:|---:|---|---|
| Bab I Pendahuluan | 10 | 0 | 0 | 0 | Tidak | Tidak |
| Bab II Tata Bahasa | 28 | 32 | 0 | 0 | Tidak | Tidak |
| Bab III Bunyi Bahasa | 19 | 44 | 5 | 2 | Tidak | Tidak |
| Bab IV Verba | 72 | 415 | 2 | 3 | Tidak | Tidak |
| Bab V Adjektiva | 45 | 114 | 1 | 0 | Tidak | Tidak |
| Bab VI Adverbia | 31 | 65 | 0 | 0 | Tidak | Tidak |
| Bab VII Nomina, Pronomina, dan Numeralia | 85 | 340 | 2 | 0 | Tidak | Tidak |
| Bab VIII Kata Tugas | 29 | 98 | 1 | 2 | Tidak | Tidak |
| Bab IX Kalimat | 86 | 425 | 5 | 2 | Tidak | Tidak |
| Bab X Hubungan Antarklausa | 40 | 206 | 0 | 2 | Tidak | Tidak |

## Detail per Bab

## Bab I Pendahuluan

- Folder: `pendahuluan`
- Jumlah subbab: 10
- Jumlah contoh: 0
- Jumlah tabel: 0
- Jumlah bagan: 0
- Rentang subbab: 1.1, 1.2, 1.2.1, 1.2.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
- Rentang contoh: -
- Tabel: -
- Bagan: -
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): -
- Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): -
- Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/pendahuluan/bahasa-baku.md`
- `frontend/public/gramatika/pendahuluan/bahasa-yang-baik-dan-benar.md`
- `frontend/public/gramatika/pendahuluan/diglosia.md`
- `frontend/public/gramatika/pendahuluan/fungsi-bahasa-baku.md`
- `frontend/public/gramatika/pendahuluan/hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing.md`        
- `frontend/public/gramatika/pendahuluan/kedudukan-bahasa-indonesia.md`
- `frontend/public/gramatika/pendahuluan/pembakuan-bahasa.md`
- `frontend/public/gramatika/pendahuluan/pendahuluan.md`
- `frontend/public/gramatika/pendahuluan/ragam-bahasa.md`
- `frontend/public/gramatika/pendahuluan/ragam-menurut-golongan-penutur.md`
- `frontend/public/gramatika/pendahuluan/ragam-menurut-jenis-pemakaian.md`

## Bab II Tata Bahasa

- Folder: `tata-bahasa`
- Jumlah subbab: 28
- Jumlah contoh: 32
- Jumlah tabel: 0
- Jumlah bagan: 0
- Rentang subbab: 2.1, 2.2, 2.2.1, 2.2.2, 2.2.3, 2.2.3.1, 2.2.3.2, 2.2.3.2.1, 2.2.3.2.2, 2.2.3.3, 2.2.3.3.1, 2.2.3.3
.2, ... (+16)                                                                                                       - Rentang contoh: 1-32
- Tabel: -
- Bagan: -
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): 12 x2 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-baha
sa/sintaksis.md, 13 x2 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-bahasa/sintaksis.md, 15 x2 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-bahasa/sintaksis.md, 16 x2 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-bahasa/sintaksis.md, 3 x2 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-bahasa/morfologi.md, 4 x3 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-bahasa/sintaksis.md, 8 x2 [diagram-image-alt/diagram-inline] @ frontend/public/gramatika/tata-bahasa/sintaksis.md                                                                                                                  - Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): -
- Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/tata-bahasa/aspek-takberkondisi-benar-makna-kalimat.md`
- `frontend/public/gramatika/tata-bahasa/deskripsi-dan-teori.md`
- `frontend/public/gramatika/tata-bahasa/fonologi.md`
- `frontend/public/gramatika/tata-bahasa/kondisi-kebenaran-dan-perikutan.md`
- `frontend/public/gramatika/tata-bahasa/morfologi.md`
- `frontend/public/gramatika/tata-bahasa/pengacuan-dan-deiksis.md`
- `frontend/public/gramatika/tata-bahasa/pengertian-tata-bahasa.md`
- `frontend/public/gramatika/tata-bahasa/pragmatik-dan-implikatur-percakapan.md`
- `frontend/public/gramatika/tata-bahasa/semantik-pragmatik-dan-relasi-makna.md`
- `frontend/public/gramatika/tata-bahasa/sintaksis.md`
- `frontend/public/gramatika/tata-bahasa/tata-bahasa.md`

## Bab III Bunyi Bahasa

- Folder: `bunyi-bahasa`
- Jumlah subbab: 19
- Jumlah contoh: 44
- Jumlah tabel: 5
- Jumlah bagan: 2
- Rentang subbab: 3.1, 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.1.7, 3.2, 3.2.1, 3.2.2, 3.2.3, ... (+7)
- Rentang contoh: 1-44
- Tabel: 3.1, 3.2, 3.3, 3.4, 3.5
- Bagan: 3.1, 3.2
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): -
- Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): 3.1 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/bunyi-bahasa/ba
tasan-dan-ciri-bunyi-bahasa.md, 3.2 x2 [image-alt/plain-caption] @ frontend/public/gramatika/bunyi-bahasa/vokal-dan-alofon-vokal.md                                                                                                     - Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/bunyi-bahasa/batasan-dan-ciri-bunyi-bahasa.md`
- `frontend/public/gramatika/bunyi-bahasa/bunyi-bahasa.md`
- `frontend/public/gramatika/bunyi-bahasa/cara-penulisan-vokal.md`
- `frontend/public/gramatika/bunyi-bahasa/ciri-suprasegmental.md`
- `frontend/public/gramatika/bunyi-bahasa/diftong-dan-deret-vokal.md`
- `frontend/public/gramatika/bunyi-bahasa/diftong.md`
- `frontend/public/gramatika/bunyi-bahasa/fonem-dan-grafem.md`
- `frontend/public/gramatika/bunyi-bahasa/fonem-segmental-dan-suprasegmental.md`
- `frontend/public/gramatika/bunyi-bahasa/gugus-dan-deret-konsonan.md`
- `frontend/public/gramatika/bunyi-bahasa/gugus-konsonan.md`
- `frontend/public/gramatika/bunyi-bahasa/intonasi-dan-ritme.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan-dan-alofon-konsonan.md`
- `frontend/public/gramatika/bunyi-bahasa/konsonan.md`
- `frontend/public/gramatika/bunyi-bahasa/pemenggalan-kata.md`
- `frontend/public/gramatika/bunyi-bahasa/struktur-suku-kata-dan-kata.md`
- `frontend/public/gramatika/bunyi-bahasa/suku-kata.md`
- `frontend/public/gramatika/bunyi-bahasa/tekanan-dan-aksen.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-dan-alofon-vokal.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal-dan-konsonan.md`
- `frontend/public/gramatika/bunyi-bahasa/vokal.md`

## Bab IV Verba

- Folder: `verba`
- Jumlah subbab: 72
- Jumlah contoh: 415
- Jumlah tabel: 2
- Jumlah bagan: 3
- Rentang subbab: 4.1, 4.1.1, 4.1.2, 4.1.2.1, 4.1.2.2, 4.1.2.3, 4.1.2.4, 4.1.2.5, 4.1.2.6, 4.1.3, 4.1.3.1, 4.1.3.1.1
, ... (+60)                                                                                                         - Rentang contoh: 1-415
- Tabel: 4.1, 4.2
- Bagan: 4.1, 4.2, 4.3
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): 16 x2 [direct] @ frontend/public/gramatika/verba/verba-transitif-berobjek.md, 
17 x2 [direct] @ frontend/public/gramatika/verba/verba-transitif-berobjek.md, 18 x2 [direct] @ frontend/public/gramatika/verba/verba-transitif-berobjek.md, 19 x2 [direct] @ frontend/public/gramatika/verba/verba-transitif-berobjek.md, 20 x2 [direct] @ frontend/public/gramatika/verba/verba-transitif-berobjek.md, 39 x2 [direct] @ frontend/public/gramatika/verba/verba-taktransitif-berpelengkap.md, 40 x2 [direct] @ frontend/public/gramatika/verba/verba-taktransitif-berpelengkap.md, 41 x2 [direct] @ frontend/public/gramatika/verba/verba-taktransitif-berpelengkap.md, 43 x2 [direct] @ frontend/public/gramatika/verba/verba-taktransitif-berpelengkap.md                                              - Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): 4.2 x2 [image-alt/plain-caption] @ frontend/public/gramatika/verba/verba-turuna
n.md                                                                                                                - Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/verba/batasan-dan-ciri-verba.md`
- `frontend/public/gramatika/verba/batasan-frasa-verbal.md`
- `frontend/public/gramatika/verba/bentuk-verba.md`
- `frontend/public/gramatika/verba/fitur-semantis-verba.md`
- `frontend/public/gramatika/verba/frasa-verbal.md`
- `frontend/public/gramatika/verba/fungsi-verba-dan-frasa-verbal.md`
- `frontend/public/gramatika/verba/jenis-frasa-verbal.md`
- `frontend/public/gramatika/verba/morfofonemik-dalam-pengafiksan-verba.md`
- `frontend/public/gramatika/verba/morfofonemik-prefiks-ber.md`
- `frontend/public/gramatika/verba/morfofonemik-prefiks-di.md`
- `frontend/public/gramatika/verba/morfofonemik-prefiks-meng.md`
- `frontend/public/gramatika/verba/morfofonemik-prefiks-per.md`
- `frontend/public/gramatika/verba/morfofonemik-prefiks-ter.md`
- `frontend/public/gramatika/verba/morfofonemik-sufiks-an.md`
- `frontend/public/gramatika/verba/morfofonemik-sufiks-i.md`
- `frontend/public/gramatika/verba/morfofonemik-sufiks-kan.md`
- `frontend/public/gramatika/verba/penurunan-verba-taktransitif-dengan-pengafiksan.md`
- `frontend/public/gramatika/verba/penurunan-verba-taktransitif-dengan-reduplikasi.md`
- `frontend/public/gramatika/verba/penurunan-verba-transitif-dengan-konversi.md`
- `frontend/public/gramatika/verba/penurunan-verba-transitif-dengan-pengafiksan.md`
- `frontend/public/gramatika/verba/perilaku-sintaktis-verba.md`
- `frontend/public/gramatika/verba/verba-dasar.md`
- `frontend/public/gramatika/verba/verba-majemuk-berafiks.md`
- `frontend/public/gramatika/verba/verba-majemuk-berulang.md`
- `frontend/public/gramatika/verba/verba-majemuk-dasar.md`
- `frontend/public/gramatika/verba/verba-majemuk-idiom.md`
- `frontend/public/gramatika/verba/verba-majemuk-subordinatif-dan-koordinatif.md`
- `frontend/public/gramatika/verba/verba-majemuk.md`
- `frontend/public/gramatika/verba/verba-reduplikasi.md`
- `frontend/public/gramatika/verba/verba-semitransitif.md`
- `frontend/public/gramatika/verba/verba-taktransitif-berpelengkap-nomina-dengan-preposisi-tetap.md`
- `frontend/public/gramatika/verba/verba-taktransitif-berpelengkap.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-infiks.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-konfiks-ber-an.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-konfiks-ke-an.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-ber.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-meng.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-se.md`
- `frontend/public/gramatika/verba/verba-taktransitif-dengan-prefiks-ter.md`
- `frontend/public/gramatika/verba/verba-taktransitif-takberpelengkap.md`
- `frontend/public/gramatika/verba/verba-taktransitif.md`
- `frontend/public/gramatika/verba/verba-transitif-berobjek-dan-berpelengkap.md`
- `frontend/public/gramatika/verba/verba-transitif-berobjek.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-prefiks-infleksi-di.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-prefiks-infleksi-meng.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-prefiks-infleksi-ter.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-prefiks-per.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-sufiks-i.md`
- `frontend/public/gramatika/verba/verba-transitif-dengan-sufiks-kan.md`
- `frontend/public/gramatika/verba/verba-transitif.md`
- `frontend/public/gramatika/verba/verba-turunan.md`
- `frontend/public/gramatika/verba/verba.md`

## Bab V Adjektiva

- Folder: `adjektiva`
- Jumlah subbab: 45
- Jumlah contoh: 114
- Jumlah tabel: 1
- Jumlah bagan: 0
- Rentang subbab: 5.1, 5.2, 5.2.1, 5.2.2, 5.2.3, 5.2.4, 5.2.5, 5.2.6, 5.2.7, 5.2.8, 5.3, 5.3.1, ... (+33)
- Rentang contoh: 1-114
- Tabel: 5.1
- Bagan: -
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): -
- Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): -
- Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/adjektiva/adjektiva-bentuk.md`
- `frontend/public/gramatika/adjektiva/adjektiva-berimbuhan.md`
- `frontend/public/gramatika/adjektiva/adjektiva-berulang.md`
- `frontend/public/gramatika/adjektiva/adjektiva-cerapan.md`
- `frontend/public/gramatika/adjektiva/adjektiva-dan-kelas-kata-lain.md`
- `frontend/public/gramatika/adjektiva/adjektiva-dasar.md`
- `frontend/public/gramatika/adjektiva/adjektiva-jarak.md`
- `frontend/public/gramatika/adjektiva/adjektiva-majemuk.md`
- `frontend/public/gramatika/adjektiva/adjektiva-pemeri-sifat.md`
- `frontend/public/gramatika/adjektiva/adjektiva-sikap-batin.md`
- `frontend/public/gramatika/adjektiva/adjektiva-turunan.md`
- `frontend/public/gramatika/adjektiva/adjektiva-ukuran.md`
- `frontend/public/gramatika/adjektiva/adjektiva-waktu.md`
- `frontend/public/gramatika/adjektiva/adjektiva-warna.md`
- `frontend/public/gramatika/adjektiva/adjektiva.md`
- `frontend/public/gramatika/adjektiva/batasan-dan-ciri-adjektiva.md`
- `frontend/public/gramatika/adjektiva/bentuk-adjektiva.md`
- `frontend/public/gramatika/adjektiva/ciri-semantis-adjektiva.md`
- `frontend/public/gramatika/adjektiva/frasa-adjektival.md`
- `frontend/public/gramatika/adjektiva/perilaku-sintaksis-adjektiva.md`
- `frontend/public/gramatika/adjektiva/pertarafan-adjektiva.md`
- `frontend/public/gramatika/adjektiva/tingkat-kualitas.md`
- `frontend/public/gramatika/adjektiva/tingkat-pembandingan.md`

## Bab VI Adverbia

- Folder: `adverbia`
- Jumlah subbab: 31
- Jumlah contoh: 65
- Jumlah tabel: 0
- Jumlah bagan: 0
- Rentang subbab: 6.1, 6.2, 6.2.1, 6.2.2, 6.2.3, 6.2.4, 6.2.5, 6.2.6, 6.2.7, 6.2.8, 6.3, 6.3.1, ... (+19)
- Rentang contoh: 1-65
- Tabel: -
- Bagan: -
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): -
- Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): -
- Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/adverbia/adverbia-dan-kelas-kata-lain.md`
- `frontend/public/gramatika/adverbia/adverbia-frekuentatif.md`
- `frontend/public/gramatika/adverbia/adverbia-gabungan.md`
- `frontend/public/gramatika/adverbia/adverbia-intraklausal-dan-ekstraklausal.md`
- `frontend/public/gramatika/adverbia/adverbia-kecaraan.md`
- `frontend/public/gramatika/adverbia/adverbia-keniscayaan.md`
- `frontend/public/gramatika/adverbia/adverbia-kewaktuan.md`
- `frontend/public/gramatika/adverbia/adverbia-kontrastif.md`
- `frontend/public/gramatika/adverbia/adverbia-kualitatif.md`
- `frontend/public/gramatika/adverbia/adverbia-kuantitatif.md`
- `frontend/public/gramatika/adverbia/adverbia-limitatif.md`
- `frontend/public/gramatika/adverbia/adverbia-pembuka-wacana.md`
- `frontend/public/gramatika/adverbia/adverbia-sebelum-atau-sesudah-kata-yang-diterangkan.md`
- `frontend/public/gramatika/adverbia/adverbia-sebelum-dan-sesudah-kata-yang-diterangkan.md`
- `frontend/public/gramatika/adverbia/adverbia-sebelum-kata-yang-diterangkan.md`
- `frontend/public/gramatika/adverbia/adverbia-sesudah-kata-yang-diterangkan.md`
- `frontend/public/gramatika/adverbia/adverbia-tunggal.md`
- `frontend/public/gramatika/adverbia/adverbia.md`
- `frontend/public/gramatika/adverbia/batasan-dan-ciri-adverbia.md`
- `frontend/public/gramatika/adverbia/bentuk-adverbia.md`
- `frontend/public/gramatika/adverbia/bentuk-adverbial.md`
- `frontend/public/gramatika/adverbia/perilaku-semantis-adverbia.md`
- `frontend/public/gramatika/adverbia/perilaku-sintaksis-adverbia.md`

## Bab VII Nomina, Pronomina, dan Numeralia

- Folder: `nomina`, `pronomina`, `numeralia`
- Jumlah subbab: 85
- Jumlah contoh: 340
- Jumlah tabel: 2
- Jumlah bagan: 0
- Rentang subbab: 7.1, 7.1.1, 7.1.2, 7.1.3, 7.1.4, 7.1.4.1, 7.1.4.1.1, 7.1.4.1.2, 7.1.4.2, 7.1.4.2.1, 7.1.4.2.2.1, 7
.1.4.2.2.2, ... (+73)                                                                                               - Rentang contoh: 1-340
- Tabel: 7.1, 7.2
- Bagan: -
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): 10 x3 [direct] @ frontend/public/gramatika/nomina/perilaku-semantis-nomina.md,
 112 x6 [direct] @ frontend/public/gramatika/nomina/penentu.md, 113 x3 [direct] @ frontend/public/gramatika/nomina/penentu.md, 114 x4 [direct] @ frontend/public/gramatika/nomina/penentu.md, 116 x5 [direct] @ frontend/public/gramatika/nomina/penentu.md, 117 x3 [direct] @ frontend/public/gramatika/nomina/penentu.md, 118 x4 [direct] @ frontend/public/gramatika/nomina/penggolong-dan-partitif.md, 119 x2 [direct] @ frontend/public/gramatika/nomina/penggolong-dan-partitif.md, 12 x3 [direct] @ frontend/public/gramatika/nomina/perilaku-semantis-nomina.md, 120 x2 [direct] @ frontend/public/gramatika/nomina/penggolong-dan-partitif.md, 121 x2 [direct] @ frontend/public/gramatika/nomina/penggolong-dan-partitif.md, 122 x2 [direct] @ frontend/public/gramatika/nomina/penggolong-dan-partitif.md, ... (+89)             - Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): -
- Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/nomina/batasan-dan-ciri-nomina.md`
- `frontend/public/gramatika/nomina/frasa-nominal-vokatif.md`
- `frontend/public/gramatika/nomina/frasa-nominal.md`
- `frontend/public/gramatika/nomina/jenis-nomina.md`
- `frontend/public/gramatika/nomina/konsep-tunggal-jamak-dan-generik.md`
- `frontend/public/gramatika/nomina/nomina-berdasarkan-acuan.md`
- `frontend/public/gramatika/nomina/nomina-berdasarkan-bentuk-morfologis.md`
- `frontend/public/gramatika/nomina/nomina-dasar.md`
- `frontend/public/gramatika/nomina/nomina.md`
- `frontend/public/gramatika/nomina/penentu.md`
- `frontend/public/gramatika/nomina/penggolong-dan-partitif.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-a-dan-i.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-an.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-isme-isasi-logi-dan-tas.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-ke-an.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-ke.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-konversi.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-peng-an.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-peng.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-per-an.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-per.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-se.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-sisipan.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-dengan-wan-wati.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-melalui-pemajemukan.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-melalui-pengafiksan.md`
- `frontend/public/gramatika/nomina/penurunan-nomina-melalui-perulangan.md`
- `frontend/public/gramatika/nomina/perilaku-semantis-nomina.md`
- `frontend/public/gramatika/nomina/perilaku-sintaksis-nomina.md`
- `frontend/public/gramatika/nomina/perluasan-nomina-ke-kanan.md`
- `frontend/public/gramatika/nomina/perluasan-nomina-ke-kiri.md`
- `frontend/public/gramatika/nomina/susunan-kata-pada-frasa-nominal.md`
- `frontend/public/gramatika/pronomina/apa-dan-siapa.md`
- `frontend/public/gramatika/pronomina/bagaimana.md`
- `frontend/public/gramatika/pronomina/batasan-dan-ciri-pronomina.md`
- `frontend/public/gramatika/pronomina/berapa.md`
- `frontend/public/gramatika/pronomina/frasa-pronominal.md`
- `frontend/public/gramatika/pronomina/gabungan-kata-tanya-dengan-kata-saja-dan-implikasi-kejamakan.md`
- `frontend/public/gramatika/pronomina/gabungan-kata-tanya-dengan-kata-saja-dan-implikasi-ketaktentuan.md`
- `frontend/public/gramatika/pronomina/gabungan-preposisi-dengan-kata-tanya.md`
- `frontend/public/gramatika/pronomina/jenis-pronomina.md`
- `frontend/public/gramatika/pronomina/kapan-bilamana-dan-apabila.md`
- `frontend/public/gramatika/pronomina/mana.md`
- `frontend/public/gramatika/pronomina/mengapa-dan-kenapa.md`
- `frontend/public/gramatika/pronomina/pronomina-jumlah.md`
- `frontend/public/gramatika/pronomina/pronomina-penunjuk.md`
- `frontend/public/gramatika/pronomina/pronomina-persona.md`
- `frontend/public/gramatika/pronomina/pronomina-taktentu.md`
- `frontend/public/gramatika/pronomina/pronomina-tanya.md`
- `frontend/public/gramatika/pronomina/pronomina.md`
- `frontend/public/gramatika/pronomina/reduplikasi-apa-siapa-dan-mana.md`
- `frontend/public/gramatika/numeralia/batasan-dan-ciri-numeralia.md`
- `frontend/public/gramatika/numeralia/frasa-numeral.md`
- `frontend/public/gramatika/numeralia/jenis-numeralia.md`
- `frontend/public/gramatika/numeralia/numeralia-pecahan.md`
- `frontend/public/gramatika/numeralia/numeralia-pokok-distributif.md`
- `frontend/public/gramatika/numeralia/numeralia-pokok-klitika.md`
- `frontend/public/gramatika/numeralia/numeralia-pokok-kolektif.md`
- `frontend/public/gramatika/numeralia/numeralia-pokok-taktentu.md`
- `frontend/public/gramatika/numeralia/numeralia-pokok-tentu.md`
- `frontend/public/gramatika/numeralia/numeralia-pokok.md`
- `frontend/public/gramatika/numeralia/numeralia-tingkat.md`
- `frontend/public/gramatika/numeralia/numeralia.md`

## Bab VIII Kata Tugas

- Folder: `kata-tugas`
- Jumlah subbab: 29
- Jumlah contoh: 98
- Jumlah tabel: 1
- Jumlah bagan: 2
- Rentang subbab: 8.1, 8.2, 8.2.1, 8.2.1.1, 8.2.1.1.1, 8.2.1.1.1.1, 8.2.1.1.1.2, 8.2.1.1.2, 8.2.1.1.2.1, 8.2.1.1.2.2
, 8.2.1.1.2.3, 8.2.1.2, ... (+17)                                                                                   - Rentang contoh: 1-98
- Tabel: 8.1
- Bagan: 8.1, 8.2
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): -
- Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): 8.1 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/kata-tugas/prep
osisi-dan-nomina-lokatif.md, 8.2 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/kata-tugas/preposisi-dan-nomina-lokatif.md                                                                                                 - Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/kata-tugas/artikula.md`
- `frontend/public/gramatika/kata-tugas/batasan-dan-ciri-kata-tugas.md`
- `frontend/public/gramatika/kata-tugas/bentuk-preposisi.md`
- `frontend/public/gramatika/kata-tugas/interjeksi.md`
- `frontend/public/gramatika/kata-tugas/kata-tugas.md`
- `frontend/public/gramatika/kata-tugas/konjungsi-antarkalimat.md`
- `frontend/public/gramatika/kata-tugas/konjungsi-koordinatif.md`
- `frontend/public/gramatika/kata-tugas/konjungsi-korelatif.md`
- `frontend/public/gramatika/kata-tugas/konjungsi-subordinatif.md`
- `frontend/public/gramatika/kata-tugas/konjungsi.md`
- `frontend/public/gramatika/kata-tugas/partikel-penegas.md`
- `frontend/public/gramatika/kata-tugas/peran-semantis-preposisi.md`
- `frontend/public/gramatika/kata-tugas/peran-sintaktis-preposisi.md`
- `frontend/public/gramatika/kata-tugas/preposisi-berdampingan.md`
- `frontend/public/gramatika/kata-tugas/preposisi-berkorelasi.md`
- `frontend/public/gramatika/kata-tugas/preposisi-dan-nomina-lokatif.md`
- `frontend/public/gramatika/kata-tugas/preposisi-gabungan.md`
- `frontend/public/gramatika/kata-tugas/preposisi-kata-berafiks.md`
- `frontend/public/gramatika/kata-tugas/preposisi-kata-dasar.md`
- `frontend/public/gramatika/kata-tugas/preposisi-tunggal.md`
- `frontend/public/gramatika/kata-tugas/preposisi.md`
- `frontend/public/gramatika/kata-tugas/simpulan.md`

## Bab IX Kalimat

- Folder: `kalimat`
- Jumlah subbab: 86
- Jumlah contoh: 425
- Jumlah tabel: 5
- Jumlah bagan: 2
- Rentang subbab: 9.1, 9.2, 9.2.1, 9.2.2, 9.2.3, 9.2.3.1, 9.2.3.2, 9.3, 9.3.1, 9.3.2, 9.3.2.1, 9.3.2.2, ... (+74)   
- Rentang contoh: 1-425
- Tabel: 9.1, 9.2, 9.3, 9.4, 9.5
- Bagan: 9.1, 9.2
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): 111 x2 [direct] @ frontend/public/gramatika/kalimat/keterangan-cara.md, 112 x2
 [direct] @ frontend/public/gramatika/kalimat/keterangan-cara.md, 113 x2 [direct] @ frontend/public/gramatika/kalimat/keterangan-cara.md, 15 x3 [direct] @ frontend/public/gramatika/kalimat/unsur-wajib-dan-unsur-takwajib.md, 168 x3 [direct] @ frontend/public/gramatika/kalimat/batasan-kalimat-dasar.md, 328 x2 [direct] @ frontend/public/gramatika/kalimat/kalimat-interogatif.md, 329 x2 [direct] @ frontend/public/gramatika/kalimat/kalimat-interogatif.md, 330 x2 [direct] @ frontend/public/gramatika/kalimat/kalimat-interogatif.md, 331 x2 [direct] @ frontend/public/gramatika/kalimat/kalimat-interogatif.md, 343 x2 [direct] @ frontend/public/gramatika/kalimat/kalimat-interogatif.md, 344 x2 [direct] @ frontend/public/gramatika/kalimat/kalimat-interogatif.md                                                        - Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): 9.1 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/kalimat/kategor
i-fungsi-dan-peran.md, 9.4 x2 [image-alt/plain-caption] @ frontend/public/gramatika/kalimat/batasan-kalimat-dasar.md- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): 9.1 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/kalimat/unsur-w
ajib-dan-unsur-takwajib.md, 9.2 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/kalimat/perluasan-kalimat-dasar.md                                                                                                          - Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/kalimat/batasan-dan-ciri-kalimat.md`
- `frontend/public/gramatika/kalimat/batasan-kalimat-dasar.md`
- `frontend/public/gramatika/kalimat/fungsi-sintaktis.md`
- `frontend/public/gramatika/kalimat/jenis-kalimat.md`
- `frontend/public/gramatika/kalimat/kalimat-adjektival.md`
- `frontend/public/gramatika/kalimat/kalimat-berdasarkan-jumlah-klausanya.md`
- `frontend/public/gramatika/kalimat/kalimat-berdasarkan-kelengkapan-unsur.md`
- `frontend/public/gramatika/kalimat/kalimat-berdasarkan-klasifikasi-sintaktis.md`
- `frontend/public/gramatika/kalimat/kalimat-berdasarkan-predikat.md`
- `frontend/public/gramatika/kalimat/kalimat-berpredikat-verbal.md`
- `frontend/public/gramatika/kalimat/kalimat-dan-kemasan-informasi.md`
- `frontend/public/gramatika/kalimat/kalimat-dasar.md`
- `frontend/public/gramatika/kalimat/kalimat-deklaratif.md`
- `frontend/public/gramatika/kalimat/kalimat-eksklamatif.md`
- `frontend/public/gramatika/kalimat/kalimat-frasa-preposisional.md`
- `frontend/public/gramatika/kalimat/kalimat-imperatif.md`
- `frontend/public/gramatika/kalimat/kalimat-interogatif.md`
- `frontend/public/gramatika/kalimat/kalimat-klausa-dan-frasa.md`
- `frontend/public/gramatika/kalimat/kalimat-nominal.md`
- `frontend/public/gramatika/kalimat/kalimat-numeral.md`
- `frontend/public/gramatika/kalimat/kalimat-pasif.md`
- `frontend/public/gramatika/kalimat/kalimat-taktransitif.md`
- `frontend/public/gramatika/kalimat/kalimat-transitif.md`
- `frontend/public/gramatika/kalimat/kalimat.md`
- `frontend/public/gramatika/kalimat/kategori-fungsi-dan-peran.md`
- `frontend/public/gramatika/kalimat/kategori.md`
- `frontend/public/gramatika/kalimat/keserasian-antarunsur.md`
- `frontend/public/gramatika/kalimat/keterangan-akibat.md`
- `frontend/public/gramatika/kalimat/keterangan-alat.md`
- `frontend/public/gramatika/kalimat/keterangan-cara.md`
- `frontend/public/gramatika/kalimat/keterangan-kesalingan.md`
- `frontend/public/gramatika/kalimat/keterangan-kualitas.md`
- `frontend/public/gramatika/kalimat/keterangan-kuantitas.md`
- `frontend/public/gramatika/kalimat/keterangan-pembandingan.md`
- `frontend/public/gramatika/kalimat/keterangan-penyerta.md`
- `frontend/public/gramatika/kalimat/keterangan-sebab.md`
- `frontend/public/gramatika/kalimat/keterangan-sudut-pandang.md`
- `frontend/public/gramatika/kalimat/keterangan-tempat.md`
- `frontend/public/gramatika/kalimat/keterangan-tujuan.md`
- `frontend/public/gramatika/kalimat/keterangan-waktu.md`
- `frontend/public/gramatika/kalimat/keterangan.md`
- `frontend/public/gramatika/kalimat/objek.md`
- `frontend/public/gramatika/kalimat/pelengkap.md`
- `frontend/public/gramatika/kalimat/pengingkaran.md`
- `frontend/public/gramatika/kalimat/peran.md`
- `frontend/public/gramatika/kalimat/perluasan-kalimat-dasar.md`
- `frontend/public/gramatika/kalimat/predikat.md`
- `frontend/public/gramatika/kalimat/subjek.md`
- `frontend/public/gramatika/kalimat/unsur-kalimat.md`
- `frontend/public/gramatika/kalimat/unsur-wajib-dan-unsur-takwajib.md`

## Bab X Hubungan Antarklausa

- Folder: `hubungan-antarklausa`
- Jumlah subbab: 40
- Jumlah contoh: 206
- Jumlah tabel: 0
- Jumlah bagan: 2
- Rentang subbab: 10.1, 10.1.1, 10.1.2, 10.1.3, 10.1.3.1, 10.1.3.1.1, 10.1.3.1.2, 10.1.3.1.3, 10.1.3.1.4, 10.1.3.2, 
10.1.3.2.1, 10.1.3.2.2, ... (+28)                                                                                   - Rentang contoh: 1-206
- Tabel: -
- Bagan: 10.1, 10.2
- Gap subbab: -
- Gap contoh: -
- Gap tabel: -
- Gap bagan: -
- Duplikat subbab (representasional): -
- Duplikat subbab (perlu telaah): -
- Duplikat contoh (representasional): 121 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/hubungan-kons
esif.md, 15 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-koordinatif.md, 16 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-koordinatif.md, 17 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-koordinatif.md, 75 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-subordinatif.md, 76 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-subordinatif.md, 77 x2 [direct] @ frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-subordinatif.md                                - Duplikat contoh (perlu telaah): -
- Duplikat tabel (representasional): -
- Duplikat tabel (perlu telaah): -
- Duplikat bagan (representasional): 10.1 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/hubungan-antar
klausa/hubungan-koordinatif.md, 10.2 x2 [emphasis-caption/image-alt] @ frontend/public/gramatika/hubungan-antarklausa/hubungan-subordinatif.md                                                                                          - Duplikat bagan (perlu telaah): -

File sumber:

- `frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-semantis-hubungan-koordinatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-semantis-hubungan-subordinatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-koordinatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/ciri-ciri-sintaktis-hubungan-subordinatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-alat.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-antarklausa.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-atributif.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-cara.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-hasil.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-komplementasi.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-konsesif.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-koordinatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-optatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-pembandingan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-pemilihan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-pengandaian.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-penjumlahan-yang-menyatakan-perluasan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-penjumlahan-yang-menyatakan-pertentangan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-penjumlahan-yang-menyatakan-sebab-akibat.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-penjumlahan-yang-menyatakan-waktu.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-penjumlahan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-penyebaban.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-perlawanan-yang-menyatakan-implikasi.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-perlawanan-yang-menyatakan-penguatan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-perlawanan-yang-menyatakan-perluasan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-perlawanan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-semantis-antarklausa-dalam-kalimat-kompleks.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-semantis-antarklausa-dalam-kalimat-majemuk.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-subordinatif.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-syarat.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-tujuan.md`
- `frontend/public/gramatika/hubungan-antarklausa/hubungan-waktu.md`
- `frontend/public/gramatika/hubungan-antarklausa/pelesapan.md`

