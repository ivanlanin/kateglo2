/**
 * @fileoverview Sumber data tunggal daftar isi Gramatika dan turunan utilitasnya
 */

const daftarIsiGramatika = [
  {
    judul: 'Pendahuluan',
    slug: 'pendahuluan',
    items: [
      { judul: 'Kedudukan Bahasa Indonesia', slug: 'kedudukan-bahasa-indonesia' },
      {
        judul: 'Ragam Bahasa',
        slug: 'ragam-bahasa',
        turunan: [
          {
            judul: 'Ragam Menurut Golongan Penutur',
            slug: 'ragam-menurut-golongan-penutur',
          },
          {
            judul: 'Ragam Menurut Jenis Pemakaian',
            slug: 'ragam-menurut-jenis-pemakaian',
          },
        ],
      },
      { judul: 'Diglosia', slug: 'diglosia' },
      { judul: 'Pembakuan Bahasa', slug: 'pembakuan-bahasa' },
      { judul: 'Bahasa Baku', slug: 'bahasa-baku' },
      { judul: 'Fungsi Bahasa Baku', slug: 'fungsi-bahasa-baku' },
      { judul: 'Bahasa yang Baik dan Benar', slug: 'bahasa-yang-baik-dan-benar' },
      {
        judul: 'Hubungan Bahasa Indonesia dengan Bahasa Daerah dan Bahasa Asing',
        slug: 'hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing',
      },
    ],
  },
  {
    judul: 'Tata Bahasa',
    slug: 'tata-bahasa',
    items: [
      { judul: 'Deskripsi dan Teori', slug: 'deskripsi-dan-teori' },
      {
        judul: 'Pengertian Tata Bahasa',
        slug: 'pengertian-tata-bahasa',
        turunan: [
          { judul: 'Fonologi', slug: 'fonologi' },
          { judul: 'Morfologi', slug: 'morfologi' },
          {
            judul: 'Sintaksis',
            slug: 'sintaksis',
            turunan: [
              { judul: 'Struktur Konstituen', slug: 'struktur-konstituen' },
              {
                judul: 'Kategori Sintaksis',
                slug: 'kategori-sintaksis',
                turunan: [
                  { judul: 'Kategori Leksikal', slug: 'kategori-leksikal' },
                  { judul: 'Kategori Frasa', slug: 'kategori-frasa' },
                ],
              },
              {
                judul: 'Konstruksi Tata Bahasa dan Fungsinya',
                slug: 'konstruksi-tata-bahasa-dan-fungsinya',
                turunan: [
                  { judul: 'Inti (Hulu) dan Noninti (Terikat)', slug: 'inti-dan-noninti' },
                  { judul: 'Jenis-Jenis Noninti', slug: 'jenis-jenis-noninti' },
                  { judul: 'Konstruksi Tanpa Inti', slug: 'konstruksi-tanpa-inti' },
                  { judul: 'Representasi Fungsi dengan Diagram', slug: 'representasi-fungsi-dengan-diagram' },
                  { judul: 'Cabang Tunggal', slug: 'cabang-tunggal' },
                  { judul: 'Model Diagram', slug: 'model-diagram' },
                ],
              },
            ],
          },
        ],
      },
      {
        judul: 'Semantik, Pragmatik, dan Relasi Makna',
        slug: 'semantik-pragmatik-dan-relasi-makna',
        turunan: [
          {
            judul: 'Kondisi Kebenaran dan Perikutan',
            slug: 'kondisi-kebenaran-dan-perikutan',
            turunan: [
              { judul: 'Proposisi Kalimat', slug: 'proposisi-kalimat' },
              { judul: 'Perikutan', slug: 'perikutan' },
              { judul: 'Proposisi Tertutup dan Proposisi Terbuka', slug: 'proposisi-tertutup-dan-proposisi-terbuka' },
            ],
          },
          {
            judul: 'Aspek Takberkondisi Benar Makna Kalimat',
            slug: 'aspek-takberkondisi-benar-makna-kalimat',
            turunan: [
              { judul: 'Makna Ilokusi dan Isi Proposisi', slug: 'makna-ilokusi-dan-isi-proposisi' },
              { judul: 'Implikatur Konvensional', slug: 'implikatur-konvensional' },
            ],
          },
          { judul: 'Pragmatik dan Implikatur Percakapan', slug: 'pragmatik-dan-implikatur-percakapan' },
          {
            judul: 'Pengacuan dan Deiksis',
            slug: 'pengacuan-dan-deiksis',
            turunan: [
              { judul: 'Pengacuan', slug: 'pengacuan' },
              { judul: 'Deiksis', slug: 'deiksis' },
            ],
          },
        ],
      },
    ],
  },
  {
    judul: 'Bunyi Bahasa',
    slug: 'bunyi-bahasa',
    items: [
      {
        judul: 'Batasan dan Ciri Bunyi Bahasa',
        slug: 'batasan-dan-ciri-bunyi-bahasa',
        turunan: [
          { judul: 'Vokal', slug: 'vokal' },
          { judul: 'Konsonan', slug: 'konsonan' },
          { judul: 'Diftong', slug: 'diftong' },
          { judul: 'Gugus Konsonan', slug: 'gugus-konsonan' },
          { judul: 'Fonem dan Grafem', slug: 'fonem-dan-grafem' },
          { judul: 'Fonem Segmental dan Suprasegmental', slug: 'fonem-segmental-dan-suprasegmental' },
          { judul: 'Suku Kata', slug: 'suku-kata' },
        ],
      },
      {
        judul: 'Vokal dan Konsonan',
        slug: 'vokal-dan-konsonan',
        turunan: [
          {
            judul: 'Vokal dan Alofon Vokal',
            slug: 'vokal-dan-alofon-vokal',
            turunan: [
              { judul: 'Vokal /i/', slug: 'vokal-i' },
              { judul: 'Vokal /u/', slug: 'vokal-u' },
              { judul: 'Vokal /e/', slug: 'vokal-e' },
              { judul: 'Vokal /o/', slug: 'vokal-o' },
              { judul: 'Vokal /ə/', slug: 'vokal-pepet' },
              { judul: 'Vokal /a/', slug: 'vokal-a' },
            ],
          },
          { judul: 'Diftong dan Deret Vokal', slug: 'diftong-dan-deret-vokal' },
          { judul: 'Cara Penulisan Vokal', slug: 'cara-penulisan-vokal' },
          {
            judul: 'Konsonan dan Alofon Konsonan',
            slug: 'konsonan-dan-alofon-konsonan',
            turunan: [
              { judul: 'Konsonan /b/ dan /p/', slug: 'konsonan-b-dan-p' },
              { judul: 'Konsonan /d/ dan /t/', slug: 'konsonan-d-dan-t' },
              { judul: 'Konsonan /g/ dan /k/', slug: 'konsonan-g-dan-k' },
              { judul: 'Konsonan /j/ dan /c/', slug: 'konsonan-j-dan-c' },
              { judul: 'Konsonan /f/', slug: 'konsonan-f' },
              { judul: 'Konsonan /s/ dan /z/', slug: 'konsonan-s-dan-z' },
              { judul: 'Konsonan /ʃ/', slug: 'konsonan-sy' },
              { judul: 'Konsonan /x/', slug: 'konsonan-kh' },
              { judul: 'Konsonan /h/', slug: 'konsonan-h' },
              { judul: 'Konsonan /m/', slug: 'konsonan-m' },
              { judul: 'Konsonan /n/', slug: 'konsonan-n' },
              { judul: 'Konsonan /ɲ/', slug: 'konsonan-ny' },
              { judul: 'Konsonan /ŋ/', slug: 'konsonan-ng' },
              { judul: 'Konsonan /r/', slug: 'konsonan-r' },
              { judul: 'Konsonan /l/', slug: 'konsonan-l' },
              { judul: 'Konsonan /w/', slug: 'konsonan-w' },
              { judul: 'Konsonan /y/', slug: 'konsonan-y' },
            ],
          },
          { judul: 'Gugus dan Deret Konsonan', slug: 'gugus-dan-deret-konsonan' },
        ],
      },
      { judul: 'Struktur Suku Kata dan Kata', slug: 'struktur-suku-kata-dan-kata' },
      { judul: 'Pemenggalan Kata', slug: 'pemenggalan-kata' },
      {
        judul: 'Ciri Suprasegmental',
        slug: 'ciri-suprasegmental',
        turunan: [
          { judul: 'Tekanan dan Aksen', slug: 'tekanan-dan-aksen' },
          { judul: 'Intonasi dan Ritme', slug: 'intonasi-dan-ritme' },
        ],
      },
    ],
  },
  {
    judul: 'Nomina',
    slug: 'nomina',
    items: [
      { judul: 'Batasan dan Ciri Nomina', slug: 'batasan-dan-ciri-nomina' },
      { judul: 'Perilaku Semantis Nomina', slug: 'perilaku-semantis-nomina' },
      { judul: 'Perilaku Sintaksis Nomina', slug: 'perilaku-sintaksis-nomina' },
      {
        judul: 'Jenis Nomina',
        slug: 'jenis-nomina',
        turunan: [
          {
            judul: 'Nomina Berdasarkan Acuan',
            slug: 'nomina-berdasarkan-acuan',
            turunan: [
              { judul: 'Nama Jenis', slug: 'nama-jenis' },
              { judul: 'Nama Diri', slug: 'nama-diri' },
            ],
          },
          {
            judul: 'Nomina Berdasarkan Bentuk Morfologis',
            slug: 'nomina-berdasarkan-bentuk-morfologis',
            turunan: [
              {
                judul: 'Nomina Dasar',
                slug: 'nomina-dasar',
                turunan: [
                  { judul: 'Nomina Dasar Umum', slug: 'nomina-dasar-umum' },
                  { judul: 'Nomina Dasar Khusus', slug: 'nomina-dasar-khusus' },
                ],
              },
              { judul: 'Penurunan Nomina dengan Konversi', slug: 'penurunan-nomina-dengan-konversi' },
              {
                judul: 'Penurunan Nomina melalui Pengafiksan',
                slug: 'penurunan-nomina-melalui-pengafiksan',
                turunan: [
                  { judul: 'Penurunan Nomina dengan ke-', slug: 'penurunan-nomina-dengan-ke' },
                  { judul: 'Penurunan Nomina dengan per-', slug: 'penurunan-nomina-dengan-per' },
                  { judul: 'Penurunan Nomina dengan peng-', slug: 'penurunan-nomina-dengan-peng' },
                  { judul: 'Penurunan Nomina dengan -an', slug: 'penurunan-nomina-dengan-an' },
                  { judul: 'Penurunan Nomina dengan peng-...-an', slug: 'penurunan-nomina-dengan-peng-an' },
                  { judul: 'Penurunan Nomina dengan per-...-an', slug: 'penurunan-nomina-dengan-per-an' },
                  { judul: 'Penurunan Nomina dengan ke-...-an', slug: 'penurunan-nomina-dengan-ke-an' },
                  { judul: 'Penurunan Nomina dengan Sisipan', slug: 'penurunan-nomina-dengan-sisipan' },
                  { judul: 'Penurunan Nomina dengan -wan/-wati', slug: 'penurunan-nomina-dengan-wan-wati' },
                  { judul: 'Penurunan Nomina dengan -a dan -i', slug: 'penurunan-nomina-dengan-a-dan-i' },
                  { judul: 'Penurunan Nomina dengan -isme, -(is)asi, -logi, dan -tas', slug: 'penurunan-nomina-dengan-isme-isasi-logi-dan-tas' },
                  { judul: 'Penurunan Nomina dengan se-', slug: 'penurunan-nomina-dengan-se' },
                ],
              },
              {
                judul: 'Penurunan Nomina melalui Perulangan',
                slug: 'penurunan-nomina-melalui-perulangan',
                turunan: [
                  { judul: 'Perulangan Utuh', slug: 'perulangan-utuh' },
                  { judul: 'Perulangan Salin Suara', slug: 'perulangan-salin-suara' },
                  { judul: 'Perulangan Sebagian', slug: 'perulangan-sebagian' },
                  { judul: 'Perulangan Disertai Pengafiksan', slug: 'perulangan-disertai-pengafiksan' },
                  { judul: 'Perulangan Sinonim', slug: 'perulangan-sinonim' },
                ],
              },
              {
                judul: 'Penurunan Nomina melalui Pemajemukan',
                slug: 'penurunan-nomina-melalui-pemajemukan',
                turunan: [
                  { judul: 'Nomina Majemuk Berdasarkan Bentuk Morfologisnya', slug: 'nomina-majemuk-berdasarkan-bentuk-morfologisnya' },
                  { judul: 'Nomina Majemuk Berdasarkan Hubungan Komponennya', slug: 'nomina-majemuk-berdasarkan-hubungan-komponennya' },
                ],
              },
            ],
          },
        ],
      },
      {
        judul: 'Frasa Nominal',
        slug: 'frasa-nominal',
        turunan: [
          {
            judul: 'Penentu',
            slug: 'penentu',
            turunan: [
              { judul: 'Numeralia Tentu dan Taktentu', slug: 'numeralia-tentu-dan-taktentu' },
              { judul: 'Penunjuk atau Demonstrativa', slug: 'penunjuk-atau-demonstrativa' },
              { judul: 'Penanda Ketakrifan', slug: 'penanda-ketakrifan' },
              { judul: 'Pronomina dan Nomina Pemilik', slug: 'pronomina-dan-nomina-pemilik' },
            ],
          },
          { judul: 'Penggolong dan Partitif', slug: 'penggolong-dan-partitif' },
          { judul: 'Perluasan Nomina ke Kiri', slug: 'perluasan-nomina-ke-kiri' },
          {
            judul: 'Perluasan Nomina ke Kanan',
            slug: 'perluasan-nomina-ke-kanan',
            turunan: [
              { judul: 'Nomina Pewatas', slug: 'nomina-pewatas' },
              { judul: 'Adjektiva Pewatas', slug: 'adjektiva-pewatas' },
              { judul: 'Verba Pewatas', slug: 'verba-pewatas' },
              { judul: 'Frasa Preposisional sebagai Pewatas', slug: 'frasa-preposisional-sebagai-pewatas' },
              { judul: 'Klausa sebagai Pewatas', slug: 'klausa-sebagai-pewatas' },
              { judul: 'Apositif sebagai Pewatas', slug: 'apositif-sebagai-pewatas' },
              { judul: 'Frasa Nominal Majemuk', slug: 'frasa-nominal-majemuk' },
            ],
          },
          {
            judul: 'Susunan Kata pada Frasa Nominal',
            slug: 'susunan-kata-pada-frasa-nominal',
            turunan: [
              { judul: 'Pola Kanonik Frasa Nominal', slug: 'pola-kanonik-frasa-nominal' },
            ],
          },
          {
            judul: 'Frasa Nominal Vokatif',
            slug: 'frasa-nominal-vokatif',
            turunan: [
              { judul: 'Bentuk Vokatif yang Lazim', slug: 'bentuk-vokatif-yang-lazim' },
              { judul: 'Keakraban dan Pemendekan', slug: 'keakraban-dan-pemendekan' },
              { judul: 'Vokatif dan Ungkapan Penyapa', slug: 'vokatif-dan-ungkapan-penyapa' },
            ],
          },
        ],
      },
      {
        judul: 'Konsep Tunggal, Jamak, dan Generik',
        slug: 'konsep-tunggal-jamak-dan-generik',
        turunan: [
          { judul: 'Bentuk Perulangan + -an', slug: 'bentuk-perulangan-an' },
          { judul: 'Kata para', slug: 'kata-para' },
          { judul: 'Kata kaum', slug: 'kata-kaum' },
          { judul: 'Kata umat', slug: 'kata-umat' },
          { judul: 'Hubungan Jumlah dan Pengacuan', slug: 'hubungan-jumlah-dan-pengacuan' },
          { judul: 'Simpulan', slug: 'konsep-tunggal-jamak-dan-generik-simpulan' },
        ],
      },
    ],
  },
  {
    judul: 'Verba',
    slug: 'verba',
    items: [
      { judul: 'Batasan dan Ciri Verba', slug: 'batasan-dan-ciri-verba' },
      { judul: 'Fitur Semantis Verba', slug: 'fitur-semantis-verba' },
      {
        judul: 'Perilaku Sintaktis Verba',
        slug: 'perilaku-sintaktis-verba',
        turunan: [
          { judul: 'Verba Transitif Berobjek', slug: 'verba-transitif-berobjek' },
          { judul: 'Verba Transitif Berobjek dan Berpelengkap', slug: 'verba-transitif-berobjek-dan-berpelengkap' },
          { judul: 'Verba Semitransitif', slug: 'verba-semitransitif' },
          { judul: 'Verba Taktransitif Takberpelengkap', slug: 'verba-taktransitif-takberpelengkap' },
          { judul: 'Verba Taktransitif Berpelengkap', slug: 'verba-taktransitif-berpelengkap' },
          { judul: 'Verba Taktransitif Berpelengkap Nomina dengan Preposisi Tetap', slug: 'verba-taktransitif-berpelengkap-nomina-dengan-preposisi-tetap' },
        ],
      },
      {
        judul: 'Bentuk Verba',
        slug: 'bentuk-verba',
        turunan: [
          { judul: 'Verba Dasar', slug: 'verba-dasar' },
          { judul: 'Verba Turunan', slug: 'verba-turunan' },
          {
            judul: 'Morfofonemik dalam Pengafiksan Verba',
            slug: 'morfofonemik-dalam-pengafiksan-verba',
            turunan: [
              { judul: 'Morfofonemik Prefiks ber-', slug: 'morfofonemik-prefiks-ber' },
              { judul: 'Morfofonemik Prefiks per-', slug: 'morfofonemik-prefiks-per' },
              { judul: 'Morfofonemik Prefiks meng-', slug: 'morfofonemik-prefiks-meng' },
              { judul: 'Morfofonemik Prefiks di-', slug: 'morfofonemik-prefiks-di' },
              { judul: 'Morfofonemik Prefiks ter-', slug: 'morfofonemik-prefiks-ter' },
              { judul: 'Morfofonemik Sufiks -kan', slug: 'morfofonemik-sufiks-kan' },
              { judul: 'Morfofonemik Sufiks -i', slug: 'morfofonemik-sufiks-i' },
              { judul: 'Morfofonemik Sufiks -an', slug: 'morfofonemik-sufiks-an' },
            ],
          },
        ],
      },
      {
        judul: 'Verba Transitif',
        slug: 'verba-transitif',
        turunan: [
          { judul: 'Penurunan Verba Transitif dengan Konversi', slug: 'penurunan-verba-transitif-dengan-konversi' },
          {
            judul: 'Penurunan Verba Transitif dengan Pengafiksan',
            slug: 'penurunan-verba-transitif-dengan-pengafiksan',
            turunan: [
              { judul: 'Verba Transitif dengan Prefiks Infleksi meng-', slug: 'verba-transitif-dengan-prefiks-infleksi-meng' },
              { judul: 'Verba Transitif dengan Prefiks Infleksi di-', slug: 'verba-transitif-dengan-prefiks-infleksi-di' },
              { judul: 'Verba Transitif dengan Prefiks Infleksi ter-', slug: 'verba-transitif-dengan-prefiks-infleksi-ter' },
              { judul: 'Verba Transitif dengan Prefiks per-', slug: 'verba-transitif-dengan-prefiks-per' },
              { judul: 'Verba Transitif dengan Sufiks -kan', slug: 'verba-transitif-dengan-sufiks-kan' },
              { judul: 'Verba Transitif dengan Sufiks -i', slug: 'verba-transitif-dengan-sufiks-i' },
            ],
          },
        ],
      },
      {
        judul: 'Verba Taktransitif',
        slug: 'verba-taktransitif',
        turunan: [
          {
            judul: 'Penurunan Verba Taktransitif dengan Pengafiksan',
            slug: 'penurunan-verba-taktransitif-dengan-pengafiksan',
            turunan: [
              { judul: 'Verba Taktransitif dengan Prefiks ber-', slug: 'verba-taktransitif-dengan-prefiks-ber' },
              { judul: 'Verba Taktransitif dengan Konfiks ber-...-an', slug: 'verba-taktransitif-dengan-konfiks-ber-an' },
              { judul: 'Verba Taktransitif dengan Prefiks meng-', slug: 'verba-taktransitif-dengan-prefiks-meng' },
              { judul: 'Verba Taktransitif dengan Prefiks ter-', slug: 'verba-taktransitif-dengan-prefiks-ter' },
              { judul: 'Verba Taktransitif dengan Prefiks se-', slug: 'verba-taktransitif-dengan-prefiks-se' },
              { judul: 'Verba Taktransitif dengan Infiks', slug: 'verba-taktransitif-dengan-infiks' },
              { judul: 'Verba Taktransitif dengan Konfiks ke-...-an', slug: 'verba-taktransitif-dengan-konfiks-ke-an' },
            ],
          },
          { judul: 'Penurunan Verba Taktransitif dengan Reduplikasi', slug: 'penurunan-verba-taktransitif-dengan-reduplikasi' },
        ],
      },
      { judul: 'Verba Hasil Reduplikasi', slug: 'verba-reduplikasi' },
      {
        judul: 'Verba Majemuk',
        slug: 'verba-majemuk',
        turunan: [
          { judul: 'Verba Majemuk Dasar', slug: 'verba-majemuk-dasar' },
          { judul: 'Verba Majemuk Berafiks', slug: 'verba-majemuk-berafiks' },
          { judul: 'Verba Majemuk Berulang', slug: 'verba-majemuk-berulang' },
          { judul: 'Verba Majemuk Subordinatif dan Koordinatif', slug: 'verba-majemuk-subordinatif-dan-koordinatif' },
          { judul: 'Verba Majemuk Idiom', slug: 'verba-majemuk-idiom' },
        ],
      },
      {
        judul: 'Frasa Verbal',
        slug: 'frasa-verbal',
        turunan: [
          { judul: 'Batasan Frasa Verbal', slug: 'batasan-frasa-verbal' },
          { judul: 'Jenis Frasa Verbal', slug: 'jenis-frasa-verbal' },
          { judul: 'Fungsi Verba dan Frasa Verbal', slug: 'fungsi-verba-dan-frasa-verbal' },
        ],
      },
    ],
  },
  {
    judul: 'Adjektiva',
    slug: 'adjektiva',
    items: [
      { judul: 'Batasan dan Ciri Adjektiva', slug: 'batasan-dan-ciri-adjektiva' },
      {
        judul: 'Jenis Adjektiva Berdasarkan Ciri Semantis',
        slug: 'ciri-semantis-adjektiva',
        turunan: [
          { judul: 'Adjektiva Pemeri Sifat', slug: 'adjektiva-pemeri-sifat' },
          { judul: 'Adjektiva Ukuran', slug: 'adjektiva-ukuran' },
          { judul: 'Adjektiva Warna', slug: 'adjektiva-warna' },
          { judul: 'Adjektiva Bentuk', slug: 'adjektiva-bentuk' },
          { judul: 'Adjektiva Waktu', slug: 'adjektiva-waktu' },
          { judul: 'Adjektiva Jarak', slug: 'adjektiva-jarak' },
          { judul: 'Adjektiva Sikap Batin', slug: 'adjektiva-sikap-batin' },
          { judul: 'Adjektiva Cerapan', slug: 'adjektiva-cerapan' },
        ],
      },
      { judul: 'Perilaku Sintaksis Adjektiva', slug: 'perilaku-sintaksis-adjektiva' },
      {
        judul: 'Pertarafan Adjektiva',
        slug: 'pertarafan-adjektiva',
        turunan: [
          { judul: 'Tingkat Kualitas', slug: 'tingkat-kualitas' },
          { judul: 'Tingkat Pembandingan', slug: 'tingkat-pembandingan' },
        ],
      },
      {
        judul: 'Bentuk Adjektiva',
        slug: 'bentuk-adjektiva',
        turunan: [
          { judul: 'Adjektiva Dasar', slug: 'adjektiva-dasar' },
          {
            judul: 'Adjektiva Turunan',
            slug: 'adjektiva-turunan',
            turunan: [
              { judul: 'Adjektiva Berimbuhan', slug: 'adjektiva-berimbuhan' },
              { judul: 'Adjektiva Berulang', slug: 'adjektiva-berulang' },
              { judul: 'Adjektiva Majemuk', slug: 'adjektiva-majemuk' },
            ],
          },
        ],
      },
      { judul: 'Frasa Adjektival', slug: 'frasa-adjektival' },
      { judul: 'Adjektiva dan Kelas Kata Lain', slug: 'adjektiva-dan-kelas-kata-lain' },
    ],
  },
  {
    judul: 'Adverbia',
    slug: 'adverbia',
    items: [
      { judul: 'Batasan dan Ciri Adverbia', slug: 'batasan-dan-ciri-adverbia' },
      {
        judul: 'Perilaku Semantis Adverbia',
        slug: 'perilaku-semantis-adverbia',
        turunan: [
          { judul: 'Adverbia Kualitatif', slug: 'adverbia-kualitatif' },
          { judul: 'Adverbia Kuantitatif', slug: 'adverbia-kuantitatif' },
          { judul: 'Adverbia Limitatif', slug: 'adverbia-limitatif' },
          { judul: 'Adverbia Frekuentatif', slug: 'adverbia-frekuentatif' },
          { judul: 'Adverbia Kewaktuan', slug: 'adverbia-kewaktuan' },
          { judul: 'Adverbia Kecaraan', slug: 'adverbia-kecaraan' },
          { judul: 'Adverbia Kontrastif', slug: 'adverbia-kontrastif' },
          { judul: 'Adverbia Keniscayaan', slug: 'adverbia-keniscayaan' },
        ],
      },
      {
        judul: 'Perilaku Sintaksis Adverbia',
        slug: 'perilaku-sintaksis-adverbia',
        turunan: [
          { judul: 'Adverbia Sebelum Kata yang Diterangkan', slug: 'adverbia-sebelum-kata-yang-diterangkan' },
          { judul: 'Adverbia Sesudah Kata yang Diterangkan', slug: 'adverbia-sesudah-kata-yang-diterangkan' },
          { judul: 'Adverbia Sebelum atau Sesudah Kata yang Diterangkan', slug: 'adverbia-sebelum-atau-sesudah-kata-yang-diterangkan' },
          { judul: 'Adverbia Sebelum dan Sesudah Kata yang Diterangkan', slug: 'adverbia-sebelum-dan-sesudah-kata-yang-diterangkan' },
          { judul: 'Adverbia Pembuka Wacana', slug: 'adverbia-pembuka-wacana' },
          { judul: 'Adverbia Intraklausal dan Ekstraklausal', slug: 'adverbia-intraklausal-dan-ekstraklausal' },
        ],
      },
      {
        judul: 'Bentuk Adverbia',
        slug: 'bentuk-adverbia',
        turunan: [
          { judul: 'Adverbia Tunggal', slug: 'adverbia-tunggal' },
          { judul: 'Adverbia Gabungan', slug: 'adverbia-gabungan' },
        ],
      },
      { judul: 'Bentuk Adverbial', slug: 'bentuk-adverbial' },
      { judul: 'Adverbia dan Kelas Kata Lain', slug: 'adverbia-dan-kelas-kata-lain' },
    ],
  },
  {
    judul: 'Pronomina',
    slug: 'pronomina',
    items: [
      { judul: 'Batasan dan Ciri Pronomina', slug: 'batasan-dan-ciri-pronomina' },
      {
        judul: 'Jenis Pronomina',
        slug: 'jenis-pronomina',
        turunan: [
          { judul: 'Pronomina Persona', slug: 'pronomina-persona' },
          { judul: 'Pronomina Penunjuk', slug: 'pronomina-penunjuk' },
          {
            judul: 'Pronomina Tanya',
            slug: 'pronomina-tanya',
            turunan: [
              { judul: 'Apa dan Siapa', slug: 'apa-dan-siapa' },
              { judul: 'Mana', slug: 'mana' },
              { judul: 'Mengapa dan Kenapa', slug: 'mengapa-dan-kenapa' },
              { judul: 'Kapan, Bila(mana), dan (Apa)bila', slug: 'kapan-bilamana-dan-apabila' },
              { judul: 'Bagaimana', slug: 'bagaimana' },
              { judul: 'Berapa', slug: 'berapa' },
              { judul: 'Gabungan Preposisi dengan Kata Tanya', slug: 'gabungan-preposisi-dengan-kata-tanya' },
              { judul: 'Gabungan Kata Tanya dengan Kata Saja dan Implikasi Kejamakan', slug: 'gabungan-kata-tanya-dengan-kata-saja-dan-implikasi-kejamakan' },
              { judul: 'Gabungan Kata Tanya dengan Kata Saja dan Implikasi Ketaktentuan', slug: 'gabungan-kata-tanya-dengan-kata-saja-dan-implikasi-ketaktentuan' },
              { judul: 'Reduplikasi Apa, Siapa, dan Mana', slug: 'reduplikasi-apa-siapa-dan-mana' },
            ],
          },
          { judul: 'Pronomina Taktentu', slug: 'pronomina-taktentu' },
          { judul: 'Pronomina Jumlah', slug: 'pronomina-jumlah' },
        ],
      },
      { judul: 'Frasa Pronominal', slug: 'frasa-pronominal' },
    ],
  },
  {
    judul: 'Numeralia',
    slug: 'numeralia',
    items: [
      { judul: 'Batasan dan Ciri Numeralia', slug: 'batasan-dan-ciri-numeralia' },
      {
        judul: 'Jenis Numeralia',
        slug: 'jenis-numeralia',
        turunan: [
          {
            judul: 'Numeralia Pokok',
            slug: 'numeralia-pokok',
            turunan: [
              { judul: 'Numeralia Pokok Tentu', slug: 'numeralia-pokok-tentu' },
              { judul: 'Numeralia Pokok Kolektif', slug: 'numeralia-pokok-kolektif' },
              { judul: 'Numeralia Pokok Distributif', slug: 'numeralia-pokok-distributif' },
              { judul: 'Numeralia Pokok Taktentu', slug: 'numeralia-pokok-taktentu' },
              { judul: 'Numeralia Pokok Klitika', slug: 'numeralia-pokok-klitika' },
              { judul: 'Numeralia Pecahan', slug: 'numeralia-pecahan' },
            ],
          },
          { judul: 'Numeralia Tingkat', slug: 'numeralia-tingkat' },
        ],
      },
      { judul: 'Frasa Numeral', slug: 'frasa-numeral' },
    ],
  },
  {
    judul: 'Kata Tugas',
    slug: 'kata-tugas',
    items: [
      { judul: 'Batasan dan Ciri Kata Tugas', slug: 'batasan-dan-ciri-kata-tugas' },
      {
        judul: 'Preposisi',
        slug: 'preposisi',
        turunan: [
          {
            judul: 'Bentuk Preposisi',
            slug: 'bentuk-preposisi',
            turunan: [
              {
                judul: 'Preposisi Tunggal',
                slug: 'preposisi-tunggal',
                turunan: [
                  { judul: 'Kata Dasar', slug: 'preposisi-kata-dasar' },
                  { judul: 'Kata Berafiks', slug: 'preposisi-kata-berafiks' },
                ],
              },
              {
                judul: 'Preposisi Gabungan',
                slug: 'preposisi-gabungan',
                turunan: [
                  { judul: 'Berdampingan', slug: 'preposisi-berdampingan' },
                  { judul: 'Berkorelasi', slug: 'preposisi-berkorelasi' },
                  { judul: 'Preposisi dan Nomina Lokatif', slug: 'preposisi-dan-nomina-lokatif' },
                ],
              },
            ],
          },
          { judul: 'Peran Semantis Preposisi', slug: 'peran-semantis-preposisi' },
          { judul: 'Peran Sintaktis Preposisi', slug: 'peran-sintaktis-preposisi' },
        ],
      },
      {
        judul: 'Konjungsi',
        slug: 'konjungsi',
        turunan: [
          { judul: 'Konjungsi Koordinatif', slug: 'konjungsi-koordinatif' },
          { judul: 'Konjungsi Korelatif', slug: 'konjungsi-korelatif' },
          { judul: 'Konjungsi Subordinatif', slug: 'konjungsi-subordinatif' },
          { judul: 'Konjungsi Antarkalimat', slug: 'konjungsi-antarkalimat' },
          { judul: 'Simpulan', slug: 'simpulan-konjungsi' },
        ],
      },
      { judul: 'Interjeksi', slug: 'interjeksi' },
      { judul: 'Artikula', slug: 'artikula' },
      { judul: 'Partikel Penegas', slug: 'partikel-penegas' },
    ],
  },
  {
    judul: 'Kalimat',
    slug: 'kalimat',
    items: [
      { judul: 'Batasan dan Ciri Kalimat', slug: 'batasan-dan-ciri-kalimat' },
      {
        judul: 'Unsur Kalimat',
        slug: 'unsur-kalimat',
        turunan: [
          { judul: 'Kalimat, Klausa, dan Frasa', slug: 'kalimat-klausa-dan-frasa' },
          { judul: 'Unsur Wajib dan Unsur Takwajib', slug: 'unsur-wajib-dan-unsur-takwajib' },
          { judul: 'Keserasian Antarunsur', slug: 'keserasian-antarunsur' },
        ],
      },
      {
        judul: 'Kategori, Fungsi, dan Peran',
        slug: 'kategori-fungsi-dan-peran',
        turunan: [
          { judul: 'Kategori', slug: 'kategori' },
          {
            judul: 'Fungsi Sintaktis',
            slug: 'fungsi-sintaktis',
            turunan: [
              { judul: 'Predikat', slug: 'predikat' },
              { judul: 'Subjek', slug: 'subjek' },
              { judul: 'Objek', slug: 'objek' },
              { judul: 'Pelengkap', slug: 'pelengkap' },
              {
                judul: 'Keterangan',
                slug: 'keterangan',
                turunan: [
                  { judul: 'Keterangan Tempat', slug: 'keterangan-tempat' },
                  { judul: 'Keterangan Waktu', slug: 'keterangan-waktu' },
                  { judul: 'Keterangan Alat', slug: 'keterangan-alat' },
                  { judul: 'Keterangan Tujuan', slug: 'keterangan-tujuan' },
                  { judul: 'Keterangan Cara', slug: 'keterangan-cara' },
                  { judul: 'Keterangan Penyerta', slug: 'keterangan-penyerta' },
                  { judul: 'Keterangan Pembandingan', slug: 'keterangan-pembandingan' },
                  { judul: 'Keterangan Kesalingan', slug: 'keterangan-kesalingan' },
                  { judul: 'Keterangan Sebab', slug: 'keterangan-sebab' },
                  { judul: 'Keterangan Akibat', slug: 'keterangan-akibat' },
                  { judul: 'Keterangan Kuantitas', slug: 'keterangan-kuantitas' },
                  { judul: 'Keterangan Kualitas', slug: 'keterangan-kualitas' },
                  { judul: 'Keterangan Sudut Pandang', slug: 'keterangan-sudut-pandang' },
                ],
              },
            ],
          },
          { judul: 'Peran', slug: 'peran' },
        ],
      },
      {
        judul: 'Kalimat Dasar',
        slug: 'kalimat-dasar',
        turunan: [
          { judul: 'Batasan Kalimat Dasar', slug: 'batasan-kalimat-dasar' },
          { judul: 'Perluasan Kalimat Dasar', slug: 'perluasan-kalimat-dasar' },
        ],
      },
      {
        judul: 'Jenis Kalimat',
        slug: 'jenis-kalimat',
        turunan: [
          { judul: 'Kalimat Berdasarkan Jumlah Klausanya', slug: 'kalimat-berdasarkan-jumlah-klausanya' },
          {
            judul: 'Kalimat Berdasarkan Predikat',
            slug: 'kalimat-berdasarkan-predikat',
            turunan: [
              {
                judul: 'Kalimat Berpredikat Verbal',
                slug: 'kalimat-berpredikat-verbal',
                turunan: [
                  { judul: 'Kalimat Taktransitif', slug: 'kalimat-taktransitif' },
                  { judul: 'Kalimat Transitif', slug: 'kalimat-transitif' },
                  { judul: 'Kalimat Pasif', slug: 'kalimat-pasif' },
                ],
              },
              { judul: 'Kalimat Adjektival', slug: 'kalimat-adjektival' },
              { judul: 'Kalimat Nominal', slug: 'kalimat-nominal' },
              { judul: 'Kalimat Numeral', slug: 'kalimat-numeral' },
              { judul: 'Kalimat Frasa Preposisional', slug: 'kalimat-frasa-preposisional' },
            ],
          },
          {
            judul: 'Kalimat Berdasarkan Klasifikasi Sintaktis',
            slug: 'kalimat-berdasarkan-klasifikasi-sintaktis',
            turunan: [
              { judul: 'Kalimat Deklaratif', slug: 'kalimat-deklaratif' },
              { judul: 'Kalimat Imperatif', slug: 'kalimat-imperatif' },
              { judul: 'Kalimat Interogatif', slug: 'kalimat-interogatif' },
              { judul: 'Kalimat Eksklamatif', slug: 'kalimat-eksklamatif' },
            ],
          },
          { judul: 'Kalimat Berdasarkan Kelengkapan Unsur', slug: 'kalimat-berdasarkan-kelengkapan-unsur' },
          { judul: 'Kalimat dan Kemasan Informasi', slug: 'kalimat-dan-kemasan-informasi' },
        ],
      },
      { judul: 'Pengingkaran', slug: 'pengingkaran' },
    ],
  },
  {
    judul: 'Hubungan Antarklausa',
    slug: 'hubungan-antarklausa',
    items: [
      {
        judul: 'Hubungan Koordinatif',
        slug: 'hubungan-koordinatif',
        turunan: [
          { judul: 'Ciri-Ciri Sintaktis Hubungan Koordinatif', slug: 'ciri-ciri-sintaktis-hubungan-koordinatif' },
          { judul: 'Ciri-Ciri Semantis Hubungan Koordinatif', slug: 'ciri-ciri-semantis-hubungan-koordinatif' },
          {
            judul: 'Hubungan Semantis Antarklausa dalam Kalimat Majemuk',
            slug: 'hubungan-semantis-antarklausa-dalam-kalimat-majemuk',
            turunan: [
              {
                judul: 'Hubungan Penjumlahan',
                slug: 'hubungan-penjumlahan',
                turunan: [
                  { judul: 'Hubungan Penjumlahan yang Menyatakan Sebab-Akibat', slug: 'hubungan-penjumlahan-yang-menyatakan-sebab-akibat' },
                  { judul: 'Hubungan Penjumlahan yang Menyatakan Waktu', slug: 'hubungan-penjumlahan-yang-menyatakan-waktu' },
                  { judul: 'Hubungan Penjumlahan yang Menyatakan Pertentangan', slug: 'hubungan-penjumlahan-yang-menyatakan-pertentangan' },
                  { judul: 'Hubungan Penjumlahan yang Menyatakan Perluasan', slug: 'hubungan-penjumlahan-yang-menyatakan-perluasan' },
                ],
              },
              {
                judul: 'Hubungan Perlawanan',
                slug: 'hubungan-perlawanan',
                turunan: [
                  { judul: 'Hubungan Perlawanan yang Menyatakan Penguatan', slug: 'hubungan-perlawanan-yang-menyatakan-penguatan' },
                  { judul: 'Hubungan Perlawanan yang Menyatakan Implikasi', slug: 'hubungan-perlawanan-yang-menyatakan-implikasi' },
                  { judul: 'Hubungan Perlawanan yang Menyatakan Perluasan', slug: 'hubungan-perlawanan-yang-menyatakan-perluasan' },
                ],
              },
              { judul: 'Hubungan Pemilihan', slug: 'hubungan-pemilihan' },
            ],
          },
        ],
      },
      {
        judul: 'Hubungan Subordinatif',
        slug: 'hubungan-subordinatif',
        turunan: [
          { judul: 'Ciri-Ciri Sintaktis Hubungan Subordinatif', slug: 'ciri-ciri-sintaktis-hubungan-subordinatif' },
          { judul: 'Ciri-Ciri Semantis Hubungan Subordinatif', slug: 'ciri-ciri-semantis-hubungan-subordinatif' },
          {
            judul: 'Hubungan Semantis Antarklausa dalam Kalimat Kompleks',
            slug: 'hubungan-semantis-antarklausa-dalam-kalimat-kompleks',
            turunan: [
              { judul: 'Hubungan Waktu', slug: 'hubungan-waktu' },
              { judul: 'Hubungan Syarat', slug: 'hubungan-syarat' },
              { judul: 'Hubungan Pengandaian', slug: 'hubungan-pengandaian' },
              { judul: 'Hubungan Tujuan', slug: 'hubungan-tujuan' },
              { judul: 'Hubungan Konsesif', slug: 'hubungan-konsesif' },
              { judul: 'Hubungan Pembandingan', slug: 'hubungan-pembandingan' },
              { judul: 'Hubungan Penyebaban', slug: 'hubungan-penyebaban' },
              { judul: 'Hubungan Hasil', slug: 'hubungan-hasil' },
              { judul: 'Hubungan Cara', slug: 'hubungan-cara' },
              { judul: 'Hubungan Alat', slug: 'hubungan-alat' },
              { judul: 'Hubungan Komplementasi', slug: 'hubungan-komplementasi' },
              { judul: 'Hubungan Atributif', slug: 'hubungan-atributif' },
            ],
          },
          { judul: 'Hubungan Optatif', slug: 'hubungan-optatif' },
        ],
      },
      { judul: 'Pelesapan', slug: 'pelesapan' },
    ],
  },
];

function flattenItemGramatika(bab, item, ancestors = []) {
  const visibleParent = ancestors[0] || null;
  const directParent = ancestors[ancestors.length - 1] || null;
  const currentItem = {
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: item.judul,
    slug: item.slug,
    dokumen: `${bab.slug}/${item.slug}.md`,
    tipe: ancestors.length ? 'subitem' : 'item',
    ...(visibleParent ? {
      parentSlug: visibleParent.slug,
      parentJudul: visibleParent.judul,
    } : {}),
    ...(directParent ? {
      directParentSlug: directParent.slug,
      directParentJudul: directParent.judul,
    } : {}),
    ...(ancestors.length ? {
      ancestorTrail: ancestors.map((ancestor) => ({
        slug: ancestor.slug,
        judul: ancestor.judul,
      })),
    } : {}),
  };

  return [
    currentItem,
    ...((item.turunan || []).flatMap((turunan) => flattenItemGramatika(bab, turunan, [...ancestors, item]))),
  ];
}

const daftarItemGramatika = daftarIsiGramatika.flatMap((bab) => [
  {
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: bab.judul,
    slug: bab.slug,
    dokumen: `${bab.slug}/${bab.slug}.md`,
    tipe: 'bab',
  },
  ...bab.items.flatMap((item) => flattenItemGramatika(bab, item)),
]);

const petaItemGramatikaBySlug = daftarItemGramatika.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const daftarAutocompleteGramatika = daftarItemGramatika.map((item) => ({
  value: item.judul,
  slug: item.slug,
}));

const petaAutocompleteGramatika = daftarAutocompleteGramatika.reduce((acc, item) => {
  acc[item.slug] = item.value;
  return acc;
}, {});

function formatJudulGramatikaDariSlug(slug = '') {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');
}

export {
  daftarIsiGramatika,
  daftarItemGramatika,
  petaItemGramatikaBySlug,
  daftarAutocompleteGramatika,
  petaAutocompleteGramatika,
  formatJudulGramatikaDariSlug,
};
