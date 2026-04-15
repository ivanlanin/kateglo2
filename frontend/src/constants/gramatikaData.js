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
              {
                judul: 'Nomina Turunan',
                slug: 'nomina-turunan',
                turunan: [
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
          },
          {
            judul: 'Frasa Nominal Vokatif',
            slug: 'frasa-nominal-vokatif',
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
          { judul: 'Simpulan', slug: 'simpulan-konsep-tunggal-jamak-dan-generik' },
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
          { judul: 'Verba Perakit', slug: 'verba-perakit' },
        ],
      },
      {
        judul: 'Bentuk Verba',
        slug: 'bentuk-verba',
        turunan: [
          {
            judul: 'Verba Dasar',
            slug: 'verba-dasar',
            turunan: [
              { judul: 'Verba Dasar Bebas', slug: 'verba-dasar-bebas' },
              { judul: 'Verba Dasar Terikat', slug: 'verba-dasar-terikat' },
            ],
          },
          {
            judul: 'Verba Turunan',
            slug: 'verba-turunan',
            turunan: [
              { judul: 'Verba Hasil Pengonversian', slug: 'verba-hasil-pengonversian' },
              { judul: 'Verba Turunan melalui Pengafiksan', slug: 'verba-turunan-melalui-pengafiksan' },
              { judul: 'Verba Turunan melalui Pengulangan', slug: 'verba-turunan-melalui-pengulangan' },
              { judul: 'Verba Turunan melalui Pemajemukan', slug: 'verba-turunan-melalui-pemajemukan' },
            ],
          },
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
              {
                judul: 'Verba Transitif dengan Sufiks -kan',
                slug: 'verba-transitif-dengan-sufiks-kan',
                turunan: [
                  { judul: 'Pangkal Verba + -kan', slug: 'pangkal-verba-sufiks-kan' },
                  { judul: 'Pangkal Adjektiva + -kan', slug: 'pangkal-adjektiva-sufiks-kan' },
                  { judul: 'Pangkal Nomina + -kan', slug: 'pangkal-nomina-sufiks-kan' },
                ],
              },
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
              {
                judul: 'Verba Taktransitif dengan Prefiks ber-',
                slug: 'verba-taktransitif-dengan-prefiks-ber',
                turunan: [
                  { judul: 'Pengafiksan Verba ber- dengan Pangkal Verba', slug: 'pengafiksan-verba-ber-dengan-pangkal-verba' },
                  { judul: 'Pengafiksan Verba ber- dengan Pangkal Adjektiva', slug: 'pengafiksan-verba-ber-dengan-pangkal-adjektiva' },
                  { judul: 'Pengafiksan Verba ber- dengan Pangkal Nomina', slug: 'pengafiksan-verba-ber-dengan-pangkal-nomina' },
                  { judul: 'Pengafiksan Verba ber- dengan Pangkal Numeralia', slug: 'pengafiksan-verba-ber-dengan-pangkal-numeralia' },
                  { judul: 'Pengafiksan Verba ber- dengan Pangkal Berbagai Frasa', slug: 'pengafiksan-verba-ber-dengan-pangkal-berbagai-frasa' },
                ],
              },
              { judul: 'Verba Taktransitif dengan Konfiks ber-...-an', slug: 'verba-taktransitif-dengan-konfiks-ber-an' },
              {
                judul: 'Verba Taktransitif dengan Prefiks meng-',
                slug: 'verba-taktransitif-dengan-prefiks-meng',
                turunan: [
                  { judul: 'Pangkal Verba', slug: 'pangkal-verba-prefiks-meng' },
                  { judul: 'Pangkal Adjektiva', slug: 'pangkal-adjektiva-prefiks-meng' },
                  {
                    judul: 'Pangkal Nomina',
                    slug: 'pangkal-nomina-prefiks-meng',
                    turunan: [
                      { judul: 'Nomina Berfitur Suara atau Bunyi', slug: 'nomina-berfitur-suara-atau-bunyi' },
                      { judul: 'Nomina Berfitur Tempatan', slug: 'nomina-berfitur-tempatan' },
                      { judul: 'Nomina Berfitur Bangun atau Wujud', slug: 'nomina-berfitur-bangun-atau-wujud' },
                      { judul: 'Nomina Berfitur Barang Konsumsi', slug: 'nomina-berfitur-barang-konsumsi' },
                      { judul: 'Nomina Berfitur Hasil Bumi', slug: 'nomina-berfitur-hasil-bumi' },
                    ],
                  },
                  { judul: 'Pangkal Numeralia', slug: 'pangkal-numeralia-prefiks-meng' },
                ],
              },
              { judul: 'Verba Taktransitif dengan Prefiks ter-', slug: 'verba-taktransitif-dengan-prefiks-ter' },
              {
                judul: 'Verba Taktransitif dengan Prefiks se-',
                slug: 'verba-taktransitif-dengan-prefiks-se',
                turunan: [
                  { judul: 'Bentuk se- Pembentuk Klausa Subordinatif Adverbial', slug: 'bentuk-se-pembentuk-klausa-subordinatif-adverbial' },
                  { judul: 'Bentuk se- Berciri Nominal', slug: 'bentuk-se-berciri-nominal' },
                ],
              },
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
          {
            judul: 'Jenis Frasa Verbal',
            slug: 'jenis-frasa-verbal',
            turunan: [
              {
                judul: 'Frasa Endosentrik Atributif',
                slug: 'frasa-endosentrik-atributif',
                turunan: [
                  { judul: 'Pewatas Depan', slug: 'pewatas-depan' },
                  { judul: 'Pewatas Belakang', slug: 'pewatas-belakang' },
                ],
              },
              { judul: 'Frasa Endosentrik Koordinatif', slug: 'frasa-endosentrik-koordinatif' },
            ],
          },
          {
            judul: 'Fungsi Verba dan Frasa Verbal',
            slug: 'fungsi-verba-dan-frasa-verbal',
            turunan: [
              { judul: 'Verba dan Frasa Verbal sebagai Predikat', slug: 'verba-dan-frasa-verbal-sebagai-predikat' },
              { judul: 'Verba dan Frasa Verbal sebagai Pelengkap', slug: 'verba-dan-frasa-verbal-sebagai-pelengkap' },
              { judul: 'Verba dan Frasa Verbal sebagai Keterangan', slug: 'verba-dan-frasa-verbal-sebagai-keterangan' },
              { judul: 'Verba yang Bersifat Atributif', slug: 'verba-yang-bersifat-atributif' },
              { judul: 'Verba yang Bersifat Apositif', slug: 'verba-yang-bersifat-apositif' },
            ],
          },
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
      {
        judul: 'Perilaku Sintaksis Adjektiva',
        slug: 'perilaku-sintaksis-adjektiva',
        turunan: [
          { judul: 'Fungsi Atributif', slug: 'fungsi-atributif' },
          { judul: 'Fungsi Predikatif', slug: 'fungsi-predikatif' },
          { judul: 'Fungsi Adverbial atau Keterangan', slug: 'fungsi-adverbial-atau-keterangan' },
        ],
      },
      {
        judul: 'Pertarafan Adjektiva',
        slug: 'pertarafan-adjektiva',
        turunan: [
          {
            judul: 'Tingkat Kualitas',
            slug: 'tingkat-kualitas',
            turunan: [
              { judul: 'Tingkat Positif', slug: 'tingkat-positif' },
              { judul: 'Tingkat Intensif', slug: 'tingkat-intensif' },
              { judul: 'Tingkat Elatif', slug: 'tingkat-elatif' },
              { judul: 'Tingkat Eksesif', slug: 'tingkat-eksesif' },
              { judul: 'Tingkat Augmentatif', slug: 'tingkat-augmentatif' },
              { judul: 'Tingkat Atenuatif', slug: 'tingkat-atenuatif' },
            ],
          },
          {
            judul: 'Tingkat Pembandingan',
            slug: 'tingkat-pembandingan',
            turunan: [
              { judul: 'Tingkat Ekuatif', slug: 'tingkat-ekuatif' },
              { judul: 'Tingkat Komparatif', slug: 'tingkat-komparatif' },
              { judul: 'Tingkat Superlatif', slug: 'tingkat-superlatif' },
            ],
          },
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
              {
                judul: 'Adjektiva Berimbuhan',
                slug: 'adjektiva-berimbuhan',
                turunan: [
                  { judul: 'Adjektiva Berprefiks', slug: 'adjektiva-berprefiks' },
                  { judul: 'Adjektiva Berinfiks', slug: 'adjektiva-berinfiks' },
                  { judul: 'Adjektiva Bersufiks', slug: 'adjektiva-bersufiks' },
                  { judul: 'Adjektiva Berkonfiks', slug: 'adjektiva-berkonfiks' },
                ],
              },
              { judul: 'Adjektiva Berulang', slug: 'adjektiva-berulang' },
              {
                judul: 'Adjektiva Majemuk',
                slug: 'adjektiva-majemuk',
                turunan: [
                  { judul: 'Gabungan Morfem Terikat dengan Morfem Bebas', slug: 'gabungan-morfem-terikat-dengan-morfem-bebas' },
                  {
                    judul: 'Gabungan Morfem Bebas dengan Morfem Bebas',
                    slug: 'gabungan-morfem-bebas-dengan-morfem-bebas',
                    turunan: [
                      { judul: 'Pola Adjektiva + Adjektiva', slug: 'pola-adjektiva-adjektiva' },
                      { judul: 'Pola Adjektiva + Nomina', slug: 'pola-adjektiva-nomina' },
                      { judul: 'Pola Adjektiva + Verba', slug: 'pola-adjektiva-verba' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        judul: 'Frasa Adjektival',
        slug: 'frasa-adjektival',
        turunan: [
          { judul: 'Frasa Adjektival dengan Pemarkah Negasi', slug: 'frasa-adjektival-dengan-pemarkah-negasi' },
          { judul: 'Frasa Adjektival dengan Pemarkah Keaspekan', slug: 'frasa-adjektival-dengan-pemarkah-keaspekan' },
          { judul: 'Frasa Adjektival dengan Pemarkah Modalitas', slug: 'frasa-adjektival-dengan-pemarkah-modalitas' },
          { judul: 'Frasa Adjektival dengan Pemarkah Kualitas', slug: 'frasa-adjektival-dengan-pemarkah-kualitas' },
          { judul: 'Frasa Adjektival dengan Pemarkah Pembandingan', slug: 'frasa-adjektival-dengan-pemarkah-pembandingan' },
        ],
      },
      {
        judul: 'Adjektiva dan Kelas Kata Lain',
        slug: 'adjektiva-dan-kelas-kata-lain',
        turunan: [
          { judul: 'Adjektiva Deverbal', slug: 'adjektiva-deverbal' },
          {
            judul: 'Adjektiva Denominal',
            slug: 'adjektiva-denominal',
            turunan: [
              { judul: 'Adjektiva Bentuk pe(r)- atau peng-', slug: 'adjektiva-bentuk-per-atau-peng' },
              { judul: 'Adjektiva Bentuk ke-...-an dengan Reduplikasi', slug: 'adjektiva-bentuk-ke-an-dengan-reduplikasi' },
            ],
          },
        ],
      },
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
          {
            judul: 'Adverbia Tunggal',
            slug: 'adverbia-tunggal',
            turunan: [
              { judul: 'Adverbia Berupa Kata Dasar', slug: 'adverbia-berupa-kata-dasar' },
              { judul: 'Adverbia Berupa Kata Berafiks', slug: 'adverbia-berupa-kata-berafiks' },
              { judul: 'Adverbia Berupa Kata Ulang', slug: 'adverbia-berupa-kata-ulang' },
            ],
          },
          {
            judul: 'Adverbia Gabungan',
            slug: 'adverbia-gabungan',
            turunan: [
              { judul: 'Adverbia Gabungan yang Berdampingan', slug: 'adverbia-gabungan-yang-berdampingan' },
              { judul: 'Adverbia Gabungan yang Tidak Berdampingan', slug: 'adverbia-gabungan-yang-tidak-berdampingan' },
            ],
          },
        ],
      },
      { judul: 'Bentuk Adverbial', slug: 'bentuk-adverbial' },
      {
        judul: 'Adverbia dan Kelas Kata Lain',
        slug: 'adverbia-dan-kelas-kata-lain',
        turunan: [
          { judul: 'Adverbia Deverbal', slug: 'adverbia-deverbal' },
          { judul: 'Adverbia Deadjektival', slug: 'adverbia-deadjektival' },
          { judul: 'Adverbia Denominal', slug: 'adverbia-denominal' },
          { judul: 'Adverbia Denumeral', slug: 'adverbia-denumeral' },
        ],
      },
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
          {
            judul: 'Pronomina Persona',
            slug: 'pronomina-persona',
            turunan: [
              { judul: 'Pronomina Persona Pertama', slug: 'pronomina-persona-pertama' },
              { judul: 'Pronomina Persona Kedua', slug: 'pronomina-persona-kedua' },
              { judul: 'Pronomina Persona Ketiga', slug: 'pronomina-persona-ketiga' },
            ],
          },
          {
            judul: 'Nomina Penyapa dan Pengacu sebagai Pengganti Pronomina Persona',
            slug: 'nomina-penyapa-dan-pengacu-sebagai-pengganti-pronomina-persona',
          },
          {
            judul: 'Pronomina Penunjuk',
            slug: 'pronomina-penunjuk',
            turunan: [
              { judul: 'Pronomina Penunjuk Umum', slug: 'pronomina-penunjuk-umum' },
              { judul: 'Pronomina Penunjuk Tempat', slug: 'pronomina-penunjuk-tempat' },
              { judul: 'Pronomina Penunjuk Ihwal', slug: 'pronomina-penunjuk-ihwal' },
            ],
          },
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
      {
        judul: 'Artikula',
        slug: 'artikula',
        turunan: [
          { judul: 'Artikula yang Bersifat Gelar', slug: 'artikula-yang-bersifat-gelar' },
          { judul: 'Artikula yang Mengacu pada Makna Kelompok', slug: 'artikula-yang-mengacu-pada-makna-kelompok' },
          { judul: 'Artikula yang Menominalkan', slug: 'artikula-yang-menominalkan' },
        ],
      },
      {
        judul: 'Partikel Penegas',
        slug: 'partikel-penegas',
        turunan: [
          { judul: 'Partikel -kah', slug: 'partikel-kah' },
          { judul: 'Partikel -lah', slug: 'partikel-lah' },
          { judul: 'Partikel -tah', slug: 'partikel-tah' },
          { judul: 'Partikel pun', slug: 'partikel-pun' },
        ],
      },
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
          {
            judul: 'Keserasian Antarunsur',
            slug: 'keserasian-antarunsur',
            turunan: [
              { judul: 'Keserasian Makna', slug: 'keserasian-makna' },
              { judul: 'Keserasian Bentuk', slug: 'keserasian-bentuk' },
            ],
          },
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
          {
            judul: 'Peran',
            slug: 'peran',
            turunan: [
              { judul: 'Pelaku', slug: 'pelaku' },
              { judul: 'Agen', slug: 'agen' },
              { judul: 'Sasaran', slug: 'sasaran' },
              { judul: 'Pengalam', slug: 'pengalam' },
              { judul: 'Peruntung', slug: 'peruntung' },
              { judul: 'Penerima', slug: 'penerima' },
              { judul: 'Penyebab', slug: 'penyebab' },
              { judul: 'Tema', slug: 'tema' },
              { judul: 'Tetara', slug: 'tetara' },
              { judul: 'Hasil', slug: 'hasil' },
              { judul: 'Lokasi', slug: 'lokasi' },
              { judul: 'Alat', slug: 'alat' },
              { judul: 'Tujuan', slug: 'tujuan' },
              { judul: 'Sumber (Bahan)', slug: 'sumber-bahan' },
            ],
          },
        ],
      },
      {
        judul: 'Kalimat Dasar',
        slug: 'kalimat-dasar',
        turunan: [
          {
            judul: 'Batasan Kalimat Dasar',
            slug: 'batasan-kalimat-dasar',
            turunan: [
              { judul: 'Pola Kalimat Dasar', slug: 'pola-kalimat-dasar' },
              { judul: 'Konstituen Kalimat Dasar', slug: 'konstituen-kalimat-dasar' },
            ],
          },
          {
            judul: 'Perluasan Kalimat Dasar',
            slug: 'perluasan-kalimat-dasar',
            turunan: [
              { judul: 'Aposisi', slug: 'aposisi' },
              { judul: 'Suplementasi', slug: 'suplementasi' },
            ],
          },
        ],
      },
      {
        judul: 'Jenis Kalimat',
        slug: 'jenis-kalimat',
        turunan: [
          {
            judul: 'Kalimat Berdasarkan Jumlah Klausanya',
            slug: 'kalimat-berdasarkan-jumlah-klausanya',
            turunan: [
              { judul: 'Kalimat Simpleks', slug: 'kalimat-simpleks' },
              { judul: 'Kalimat Kompleks', slug: 'kalimat-kompleks' },
              { judul: 'Kalimat Majemuk', slug: 'kalimat-majemuk' },
              { judul: 'Kalimat Majemuk Kompleks', slug: 'kalimat-majemuk-kompleks' },
            ],
          },
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
              {
                judul: 'Kalimat Imperatif',
                slug: 'kalimat-imperatif',
                turunan: [
                  { judul: 'Kalimat Imperatif Taktransitif', slug: 'kalimat-imperatif-taktransitif' },
                  { judul: 'Kalimat Imperatif Transitif', slug: 'kalimat-imperatif-transitif' },
                  { judul: 'Kalimat Imperatif Halus', slug: 'kalimat-imperatif-halus' },
                  { judul: 'Kalimat Imperatif Permintaan', slug: 'kalimat-imperatif-permintaan' },
                  { judul: 'Kalimat Imperatif Ajakan dan Harapan', slug: 'kalimat-imperatif-ajakan-dan-harapan' },
                  { judul: 'Kalimat Imperatif Larangan', slug: 'kalimat-imperatif-larangan' },
                  { judul: 'Kalimat Imperatif Peringatan', slug: 'kalimat-imperatif-peringatan' },
                  { judul: 'Kalimat Imperatif Pembiaran', slug: 'kalimat-imperatif-pembiaran' },
                ],
              },
              { judul: 'Kalimat Interogatif', slug: 'kalimat-interogatif' },
              { judul: 'Kalimat Eksklamatif', slug: 'kalimat-eksklamatif' },
            ],
          },
          {
            judul: 'Kalimat Berdasarkan Kelengkapan Unsur',
            slug: 'kalimat-berdasarkan-kelengkapan-unsur',
            turunan: [
              { judul: 'Kalimat Lengkap', slug: 'kalimat-lengkap' },
              { judul: 'Kalimat Taklengkap', slug: 'kalimat-taklengkap' },
            ],
          },
          {
            judul: 'Kalimat dan Kemasan Informasi',
            slug: 'kalimat-dan-kemasan-informasi',
            turunan: [
              { judul: 'Inversi', slug: 'inversi' },
              { judul: 'Pengedepanan', slug: 'pengedepanan' },
              { judul: 'Pengebelakangan', slug: 'pengebelakangan' },
              { judul: 'Dislokasi Kiri', slug: 'dislokasi-kiri' },
              { judul: 'Dislokasi Kanan', slug: 'dislokasi-kanan' },
              { judul: 'Ekstraposisi', slug: 'ekstraposisi' },
              { judul: 'Pembelahan', slug: 'pembelahan' },
            ],
          },
        ],
      },
      {
        judul: 'Pengingkaran',
        slug: 'pengingkaran',
        turunan: [
          { judul: 'Pengingkaran Kalimat', slug: 'pengingkaran-kalimat' },
          { judul: 'Pengingkaran Bagian Kalimat', slug: 'pengingkaran-bagian-kalimat' },
        ],
      },
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
              {
                judul: 'Hubungan Waktu',
                slug: 'hubungan-waktu',
                turunan: [
                  { judul: 'Waktu Batas Permulaan', slug: 'waktu-batas-permulaan' },
                  { judul: 'Waktu Bersamaan', slug: 'waktu-bersamaan' },
                  { judul: 'Waktu Berurutan', slug: 'waktu-berurutan' },
                  { judul: 'Waktu Batas Akhir Terjadinya Peristiwa atau Keadaan', slug: 'waktu-batas-akhir-terjadinya-peristiwa-atau-keadaan' },
                ],
              },
              { judul: 'Hubungan Syarat', slug: 'hubungan-syarat' },
              { judul: 'Hubungan Pengandaian', slug: 'hubungan-pengandaian' },
              { judul: 'Hubungan Tujuan', slug: 'hubungan-tujuan' },
              { judul: 'Hubungan Konsesif', slug: 'hubungan-konsesif' },
              {
                judul: 'Hubungan Pembandingan',
                slug: 'hubungan-pembandingan',
                turunan: [
                  { judul: 'Hubungan Ekuatif', slug: 'hubungan-ekuatif' },
                  { judul: 'Hubungan Komparatif', slug: 'hubungan-komparatif' },
                ],
              },
              { judul: 'Hubungan Penyebaban', slug: 'hubungan-penyebaban' },
              { judul: 'Hubungan Hasil', slug: 'hubungan-hasil' },
              { judul: 'Hubungan Cara', slug: 'hubungan-cara' },
              { judul: 'Hubungan Alat', slug: 'hubungan-alat' },
              { judul: 'Hubungan Komplementasi', slug: 'hubungan-komplementasi' },
              {
                judul: 'Hubungan Atributif',
                slug: 'hubungan-atributif',
                turunan: [
                  { judul: 'Hubungan Atributif Restriktif', slug: 'hubungan-atributif-restriktif' },
                  { judul: 'Hubungan Atributif Takrestriktif', slug: 'hubungan-atributif-takrestriktif' },
                ],
              },
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

const daftarHalamanReferensiGramatika = [
  {
    judul: 'Daftar Isi',
    slug: 'daftar-isi',
    dokumen: 'daftar/daftar-isi.md',
    tipe: 'daftar',
    judulBab: 'Gramatika',
    ringkasan: 'Susunan lengkap bab dan subbab Gramatika Kateglo.',
    deskripsi: 'Susunan lengkap bab dan subbab Gramatika Kateglo yang diselaraskan dengan daftar isi TBBBI IV (2017).',
  },
  {
    judul: 'Daftar Istilah',
    slug: 'daftar-istilah',
    dokumen: 'daftar/daftar-istilah.md',
    tipe: 'daftar',
    judulBab: 'Gramatika',
    ringkasan: 'Istilah-istilah pokok gramatika yang ditautkan ke halaman terkait.',
    deskripsi: 'Istilah-istilah pokok dalam Gramatika Kateglo yang diselaraskan dengan daftar istilah TBBBI IV (2017).',
  },
  {
    judul: 'Daftar Bagan',
    slug: 'daftar-bagan',
    dokumen: 'daftar/daftar-bagan.md',
    tipe: 'daftar',
    judulBab: 'Gramatika',
    ringkasan: 'Daftar seluruh bagan yang muncul di dokumen gramatika publik.',
    deskripsi: 'Daftar seluruh bagan yang terdeteksi pada file markdown Gramatika Kateglo.',
  },
  {
    judul: 'Daftar Tabel',
    slug: 'daftar-tabel',
    dokumen: 'daftar/daftar-tabel.md',
    tipe: 'daftar',
    judulBab: 'Gramatika',
    ringkasan: 'Daftar seluruh tabel yang muncul di dokumen gramatika publik.',
    deskripsi: 'Daftar seluruh tabel yang terdeteksi pada file markdown Gramatika Kateglo.',
  },
];

const offsetHalamanPdfGramatikaByBabBuku = {
  1: 24,
  2: 24,
  3: 24,
  4: 24,
  5: 24,
  6: 23,
  7: 23,
  8: 23,
  9: 23,
  10: 22,
};

function buatAnchorHalamanGramatika(slug, nomorBabBuku, nomorBagianBuku, halamanBuku) {
  const offsetPdf = offsetHalamanPdfGramatikaByBabBuku[nomorBabBuku];
  const halamanPdf = Number.isFinite(halamanBuku) && Number.isFinite(offsetPdf)
    ? halamanBuku + offsetPdf
    : null;

  return {
    slug,
    nomorBabBuku,
    nomorBagianBuku,
    halamanBuku,
    halamanBukuLabel: halamanBuku == null ? null : String(halamanBuku),
    halamanPdf,
    halamanPdfLabel: halamanPdf == null ? null : String(halamanPdf),
  };
}

const daftarAnchorHalamanGramatikaTambahan = [
  // Bab I
  ['kedudukan-bahasa-indonesia', 1, '1.1', 1],
  ['ragam-bahasa', 1, '1.2', 3],
  ['diglosia', 1, '1.3', 9],
  ['pembakuan-bahasa', 1, '1.4', 10],
  ['bahasa-baku', 1, '1.5', 12],
  ['fungsi-bahasa-baku', 1, '1.6', 13],
  ['bahasa-yang-baik-dan-benar', 1, '1.7', 19],
  ['hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing', 1, '1.8', 20],

  // Bab II
  ['deskripsi-dan-teori', 2, '2.1', 23],
  ['pengertian-tata-bahasa', 2, '2.2', 25],
  ['fonologi', 2, '2.2.1', 25],
  ['morfologi', 2, '2.2.2', 27],
  ['sintaksis', 2, '2.2.3', 28],
  ['struktur-konstituen', 2, '2.2.3.1', 29],
  ['kategori-sintaksis', 2, '2.2.3.2', 31],
  ['konstruksi-tata-bahasa-dan-fungsinya', 2, '2.2.3.3', 33],
  ['semantik-pragmatik-dan-relasi-makna', 2, '2.3', 37],
  ['kondisi-kebenaran-dan-perikutan', 2, '2.3.1', 37],
  ['proposisi-kalimat', 2, '2.3.1.1', 38],
  ['perikutan', 2, '2.3.1.2', 39],
  ['proposisi-tertutup-dan-proposisi-terbuka', 2, '2.3.1.3', 39],
  ['aspek-takberkondisi-benar-makna-kalimat', 2, '2.3.2', 40],
  ['makna-ilokusi-dan-isi-proposisi', 2, '2.3.2.1', 40],
  ['implikatur-konvensional', 2, '2.3.2.2', 40],
  ['pragmatik-dan-implikatur-percakapan', 2, '2.3.3', 41],
  ['pengacuan-dan-deiksis', 2, '2.3.4', 42],
  ['pengacuan', 2, '2.3.4.1', 42],
  ['deiksis', 2, '2.3.4.2', 43],

  // Bab III
  ['batasan-dan-ciri-bunyi-bahasa', 3, '3.1', 45],
  ['vokal', 3, '3.1.1', 48],
  ['konsonan', 3, '3.1.2', 49],
  ['diftong', 3, '3.1.3', 50],
  ['gugus-konsonan', 3, '3.1.4', 51],
  ['fonem-dan-grafem', 3, '3.1.5', 51],
  ['fonem-segmental-dan-suprasegmental', 3, '3.1.6', 53],
  ['suku-kata', 3, '3.1.7', 54],
  ['vokal-dan-konsonan', 3, '3.2', 55],
  ['vokal-dan-alofon-vokal', 3, '3.2.1', 55],
  ['diftong-dan-deret-vokal', 3, '3.2.2', 62],
  ['cara-penulisan-vokal', 3, '3.2.3', 64],
  ['konsonan-dan-alofon-konsonan', 3, '3.2.4', 66],
  ['gugus-dan-deret-konsonan', 3, '3.2.5', 78],
  ['struktur-suku-kata-dan-kata', 3, '3.3', 81],
  ['pemenggalan-kata', 3, '3.4', 82],
  ['ciri-suprasegmental', 3, '3.5', 84],
  ['tekanan-dan-aksen', 3, '3.5.1', 84],
  ['intonasi-dan-ritme', 3, '3.5.2', 87],

  // Bab IV
  ['batasan-dan-ciri-verba', 4, '4.1', 95],
  ['fitur-semantis-verba', 4, '4.1.1', 95],
  ['perilaku-sintaktis-verba', 4, '4.1.2', 98],
  ['verba-transitif-berobjek', 4, '4.1.2.1', 98],
  ['verba-transitif-berobjek-dan-berpelengkap', 4, '4.1.2.2', 99],
  ['verba-semitransitif', 4, '4.1.2.3', 100],
  ['verba-taktransitif-takberpelengkap', 4, '4.1.2.4', 101],
  ['verba-taktransitif-berpelengkap', 4, '4.1.2.5', 101],
  ['verba-taktransitif-berpelengkap-nomina-dengan-preposisi-tetap', 4, '4.1.2.6', 103],
  ['bentuk-verba', 4, '4.1.3', 107],
  ['verba-dasar', 4, '4.1.3.1', 108],
  ['verba-turunan', 4, '4.1.3.2', 110],
  ['morfofonemik-dalam-pengafiksan-verba', 4, '4.1.3.3', 118],
  ['verba-transitif', 4, '4.2', 129],
  ['penurunan-verba-transitif-dengan-konversi', 4, '4.2.1', 129],
  ['penurunan-verba-transitif-dengan-pengafiksan', 4, '4.2.2', 130],
  ['verba-transitif-dengan-prefiks-infleksi-meng', 4, '4.2.2.1', 131],
  ['verba-transitif-dengan-prefiks-infleksi-di', 4, '4.2.2.2', 132],
  ['verba-transitif-dengan-prefiks-infleksi-ter', 4, '4.2.2.3', 132],
  ['verba-transitif-dengan-prefiks-per', 4, '4.2.2.4', 135],
  ['verba-transitif-dengan-sufiks-kan', 4, '4.2.2.5', 136],
  ['verba-transitif-dengan-sufiks-i', 4, '4.2.2.6', 141],
  ['verba-taktransitif', 4, '4.3', 147],
  ['penurunan-verba-taktransitif-dengan-pengafiksan', 4, '4.3.1', 147],
  ['verba-taktransitif-dengan-prefiks-ber', 4, '4.3.1.1', 147],
  ['verba-taktransitif-dengan-konfiks-ber-an', 4, '4.3.1.2', 155],
  ['verba-taktransitif-dengan-prefiks-meng', 4, '4.3.1.3', 156],
  ['verba-taktransitif-dengan-prefiks-ter', 4, '4.3.1.4', 160],
  ['verba-taktransitif-dengan-prefiks-se', 4, '4.3.1.5', 162],
  ['verba-taktransitif-dengan-infiks', 4, '4.3.1.6', 163],
  ['verba-taktransitif-dengan-konfiks-ke-an', 4, '4.3.1.7', 164],
  ['penurunan-verba-taktransitif-dengan-reduplikasi', 4, '4.3.2', 168],
  ['verba-reduplikasi', 4, '4.4', 172],
  ['verba-majemuk', 4, '4.5', 176],
  ['verba-majemuk-dasar', 4, '4.5.1', 177],
  ['verba-majemuk-berafiks', 4, '4.5.2', 178],
  ['verba-majemuk-berulang', 4, '4.5.3', 180],
  ['frasa-verbal', 4, '4.6', 183],
  ['batasan-frasa-verbal', 4, '4.6.1', 183],
  ['jenis-frasa-verbal', 4, '4.6.2', 184],
  ['frasa-endosentrik-atributif', 4, '4.6.2.1', 184],
  ['frasa-endosentrik-koordinatif', 4, '4.6.2.2', 188],
  ['fungsi-verba-dan-frasa-verbal', 4, '4.6.3', 189],
  ['verba-dan-frasa-verbal-sebagai-predikat', 4, '4.6.3.1', 189],
  ['verba-dan-frasa-verbal-sebagai-pelengkap', 4, '4.6.3.2', 190],
  ['verba-dan-frasa-verbal-sebagai-keterangan', 4, '4.6.3.3', 190],
  ['verba-yang-bersifat-atributif', 4, '4.6.3.4', 191],
  ['verba-yang-bersifat-apositif', 4, '4.6.3.5', 192],

  // Bab V
  ['batasan-dan-ciri-adjektiva', 5, '5.1', 193],
  ['ciri-semantis-adjektiva', 5, '5.2', 194],
  ['adjektiva-pemeri-sifat', 5, '5.2.1', 196],
  ['adjektiva-ukuran', 5, '5.2.2', 196],
  ['adjektiva-warna', 5, '5.2.3', 197],
  ['adjektiva-bentuk', 5, '5.2.4', 199],
  ['adjektiva-waktu', 5, '5.2.5', 200],
  ['adjektiva-jarak', 5, '5.2.6', 201],
  ['adjektiva-sikap-batin', 5, '5.2.7', 201],
  ['adjektiva-cerapan', 5, '5.2.8', 202],
  ['perilaku-sintaksis-adjektiva', 5, '5.3', 203],
  ['fungsi-atributif', 5, '5.3.1', 203],
  ['fungsi-predikatif', 5, '5.3.2', 204],
  ['fungsi-adverbial-atau-keterangan', 5, '5.3.3', 205],
  ['pertarafan-adjektiva', 5, '5.4', 207],
  ['tingkat-kualitas', 5, '5.4.1', 207],
  ['tingkat-positif', 5, '5.4.1.1', 207],
  ['tingkat-intensif', 5, '5.4.1.2', 208],
  ['tingkat-elatif', 5, '5.4.1.3', 209],
  ['tingkat-eksesif', 5, '5.4.1.4', 210],
  ['tingkat-augmentatif', 5, '5.4.1.5', 211],
  ['tingkat-atenuatif', 5, '5.4.1.6', 211],
  ['tingkat-pembandingan', 5, '5.4.2', 211],
  ['tingkat-ekuatif', 5, '5.4.2.1', 212],
  ['tingkat-komparatif', 5, '5.4.2.2', 214],
  ['tingkat-superlatif', 5, '5.4.2.3', 216],
  ['bentuk-adjektiva', 5, '5.5', 218],
  ['adjektiva-dasar', 5, '5.5.1', 218],
  ['adjektiva-turunan', 5, '5.5.2', 218],
  ['adjektiva-berimbuhan', 5, '5.5.2.1', 218],
  ['adjektiva-berulang', 5, '5.5.3', 221],
  ['adjektiva-majemuk', 5, '5.5.4', 222],
  ['gabungan-morfem-terikat-dengan-morfem-bebas', 5, '5.5.4.1', 222],
  ['gabungan-morfem-bebas-dengan-morfem-bebas', 5, '5.5.4.2', 223],
  ['frasa-adjektival', 5, '5.6', 227],
  ['frasa-adjektival-dengan-pemarkah-negasi', 5, '5.6.1', 227],
  ['frasa-adjektival-dengan-pemarkah-keaspekan', 5, '5.6.2', 228],
  ['frasa-adjektival-dengan-pemarkah-modalitas', 5, '5.6.3', 229],
  ['frasa-adjektival-dengan-pemarkah-kualitas', 5, '5.6.4', 229],
  ['frasa-adjektival-dengan-pemarkah-pembandingan', 5, '5.6.5', 229],
  ['adjektiva-dan-kelas-kata-lain', 5, '5.7', 230],
  ['adjektiva-deverbal', 5, '5.7.1', 230],
  ['adjektiva-denominal', 5, '5.7.2', 232],
  ['adjektiva-bentuk-per-atau-peng', 5, '5.7.2.1', 232],
  ['adjektiva-bentuk-ke-an-dengan-reduplikasi', 5, '5.7.2.2', 233],

  // Bab VI
  ['batasan-dan-ciri-adverbia', 6, '6.1', 235],
  ['perilaku-semantis-adverbia', 6, '6.2', 239],
  ['adverbia-kualitatif', 6, '6.2.1', 239],
  ['adverbia-kuantitatif', 6, '6.2.2', 239],
  ['adverbia-limitatif', 6, '6.2.3', 239],
  ['adverbia-frekuentatif', 6, '6.2.4', 240],
  ['adverbia-kewaktuan', 6, '6.2.5', 240],
  ['adverbia-kecaraan', 6, '6.2.6', 241],
  ['adverbia-kontrastif', 6, '6.2.7', 241],
  ['adverbia-keniscayaan', 6, '6.2.8', 241],
  ['perilaku-sintaksis-adverbia', 6, '6.3', 242],
  ['adverbia-sebelum-kata-yang-diterangkan', 6, '6.3.1', 242],
  ['adverbia-sesudah-kata-yang-diterangkan', 6, '6.3.2', 242],
  ['adverbia-sebelum-atau-sesudah-kata-yang-diterangkan', 6, '6.3.3', 243],
  ['adverbia-sebelum-dan-sesudah-kata-yang-diterangkan', 6, '6.3.4', 243],
  ['adverbia-pembuka-wacana', 6, '6.3.5', 244],
  ['adverbia-intraklausal-dan-ekstraklausal', 6, '6.3.6', 246],
  ['bentuk-adverbia', 6, '6.4', 248],
  ['adverbia-tunggal', 6, '6.4.1', 248],
  ['adverbia-berupa-kata-dasar', 6, '6.4.1.1', 248],
  ['adverbia-berupa-kata-berafiks', 6, '6.4.1.2', 249],
  ['adverbia-berupa-kata-ulang', 6, '6.4.1.3', 250],
  ['adverbia-gabungan', 6, '6.4.2', 253],
  ['adverbia-gabungan-yang-berdampingan', 6, '6.4.2.1', 253],
  ['adverbia-gabungan-yang-tidak-berdampingan', 6, '6.4.2.2', 254],
  ['bentuk-adverbial', 6, '6.5', 255],
  ['adverbia-dan-kelas-kata-lain', 6, '6.6', 256],
  ['adverbia-deverbal', 6, '6.6.1', 257],
  ['adverbia-deadjektival', 6, '6.6.2', 257],
  ['adverbia-denominal', 6, '6.6.3', 257],
  ['adverbia-denumeral', 6, '6.6.4', 258],

  // Bab VIII
  ['batasan-dan-ciri-kata-tugas', 8, '8.1', 373],
  ['preposisi', 8, '8.2.1', 374],
  ['bentuk-preposisi', 8, '8.2.1.1', 375],
  ['peran-semantis-preposisi', 8, '8.2.1.2', 382],
  ['peran-sintaktis-preposisi', 8, '8.2.1.3', 385],
  ['konjungsi', 8, '8.2.2', 387],
  ['konjungsi-koordinatif', 8, '8.2.2.1', 388],
  ['konjungsi-korelatif', 8, '8.2.2.2', 391],
  ['konjungsi-subordinatif', 8, '8.2.2.3', 392],
  ['konjungsi-antarkalimat', 8, '8.2.2.4', 395],
  ['interjeksi', 8, '8.2.3', 398],
  ['artikula', 8, '8.2.4', 400],
  ['artikula-yang-bersifat-gelar', 8, '8.2.4.1', 401],
  ['artikula-yang-mengacu-pada-makna-kelompok', 8, '8.2.4.2', 401],
  ['artikula-yang-menominalkan', 8, '8.2.4.3', 402],
  ['partikel-penegas', 8, '8.2.5', 403],
  ['partikel-kah', 8, '8.2.5.1', 404],
  ['partikel-lah', 8, '8.2.5.2', 405],
  ['partikel-tah', 8, '8.2.5.3', 406],
  ['partikel-pun', 8, '8.2.5.4', 406],

  // Bab IX
  ['batasan-dan-ciri-kalimat', 9, '9.1', 407],
  ['unsur-kalimat', 9, '9.2', 408],
  ['kalimat-klausa-dan-frasa', 9, '9.2.1', 410],
  ['unsur-wajib-dan-unsur-takwajib', 9, '9.2.2', 411],
  ['keserasian-antarunsur', 9, '9.2.3', 413],
  ['keserasian-makna', 9, '9.2.3.1', 413],
  ['keserasian-bentuk', 9, '9.2.3.2', 415],
  ['kategori-fungsi-dan-peran', 9, '9.3', 416],
  ['kategori', 9, '9.3.1', 417],
  ['fungsi-sintaktis', 9, '9.3.2', 418],
  ['predikat', 9, '9.3.2.1', 419],
  ['subjek', 9, '9.3.2.2', 420],
  ['objek', 9, '9.3.2.3', 421],
  ['pelengkap', 9, '9.3.2.4', 422],
  ['keterangan', 9, '9.3.2.5', 424],
  ['peran', 9, '9.3.3', 438],
  ['pelaku', 9, '9.3.3.1', 438],
  ['agen', 9, '9.3.3.2', 439],
  ['sasaran', 9, '9.3.3.3', 439],
  ['pengalam', 9, '9.3.3.4', 440],
  ['peruntung', 9, '9.3.3.5', 440],
  ['penerima', 9, '9.3.3.6', 440],
  ['penyebab', 9, '9.3.3.7', 441],
  ['tema', 9, '9.3.3.8', 441],
  ['tetara', 9, '9.3.3.9', 441],
  ['hasil', 9, '9.3.3.10', 442],
  ['lokasi', 9, '9.3.3.11', 442],
  ['alat', 9, '9.3.3.12', 442],
  ['tujuan', 9, '9.3.3.13', 442],
  ['sumber-bahan', 9, '9.3.3.14', 443],
  ['kalimat-dasar', 9, '9.4', 443],
  ['batasan-kalimat-dasar', 9, '9.4.1', 443],
  ['pola-kalimat-dasar', 9, '9.4.1.1', 443],
  ['konstituen-kalimat-dasar', 9, '9.4.1.2', 446],
  ['perluasan-kalimat-dasar', 9, '9.4.2', 448],
  ['aposisi', 9, '9.4.2.1', 449],
  ['suplementasi', 9, '9.4.2.2', 453],
  ['jenis-kalimat', 9, '9.5', 454],
  ['kalimat-berdasarkan-jumlah-klausanya', 9, '9.5.1', 454],
  ['kalimat-simpleks', 9, '9.5.1.1', 455],
  ['kalimat-kompleks', 9, '9.5.1.2', 455],
  ['kalimat-majemuk', 9, '9.5.1.3', 456],
  ['kalimat-majemuk-kompleks', 9, '9.5.1.4', 457],
  ['kalimat-berdasarkan-predikat', 9, '9.5.2', 460],
  ['kalimat-berpredikat-verbal', 9, '9.5.2.1', 460],
  ['kalimat-adjektival', 9, '9.5.2.2', 474],
  ['kalimat-nominal', 9, '9.5.2.3', 475],
  ['kalimat-numeral', 9, '9.5.2.4', 477],
  ['kalimat-frasa-preposisional', 9, '9.5.2.5', 478],
  ['kalimat-berdasarkan-klasifikasi-sintaktis', 9, '9.5.3', 478],
  ['kalimat-deklaratif', 9, '9.5.3.1', 479],
  ['kalimat-imperatif', 9, '9.5.3.2', 480],
  ['kalimat-interogatif', 9, '9.5.3.3', 486],
  ['kalimat-eksklamatif', 9, '9.5.3.4', 492],
  ['kalimat-berdasarkan-kelengkapan-unsur', 9, '9.5.4', 493],
  ['kalimat-lengkap', 9, '9.5.4.1', 493],
  ['kalimat-taklengkap', 9, '9.5.4.2', 494],
  ['kalimat-dan-kemasan-informasi', 9, '9.5.5', 495],
  ['inversi', 9, '9.5.5.1', 496],
  ['pengedepanan', 9, '9.5.5.2', 498],
  ['pengebelakangan', 9, '9.5.5.3', 500],
  ['dislokasi-kiri', 9, '9.5.5.4', 501],
  ['dislokasi-kanan', 9, '9.5.5.5', 502],
  ['ekstraposisi', 9, '9.5.5.6', 503],
  ['pembelahan', 9, '9.5.5.7', 504],
  ['pengingkaran', 9, '9.6', 505],
  ['pengingkaran-kalimat', 9, '9.6.1.1', 506],
  ['pengingkaran-bagian-kalimat', 9, '9.6.1.2', 509],

  // Bab X
  ['hubungan-koordinatif', 10, '10.1', 513],
  ['ciri-ciri-sintaktis-hubungan-koordinatif', 10, '10.1.1', 515],
  ['ciri-ciri-semantis-hubungan-koordinatif', 10, '10.1.2', 518],
  ['hubungan-semantis-antarklausa-dalam-kalimat-majemuk', 10, '10.1.3', 519],
  ['hubungan-penjumlahan', 10, '10.1.3.1', 520],
  ['hubungan-perlawanan', 10, '10.1.3.2', 523],
  ['hubungan-pemilihan', 10, '10.1.3.3', 525],
  ['hubungan-subordinatif', 10, '10.2', 526],
  ['ciri-ciri-sintaktis-hubungan-subordinatif', 10, '10.2.1', 531],
  ['ciri-ciri-semantis-hubungan-subordinatif', 10, '10.2.2', 534],
  ['hubungan-semantis-antarklausa-dalam-kalimat-kompleks', 10, '10.2.3', 534],
  ['hubungan-waktu', 10, '10.2.3.1', 535],
  ['hubungan-syarat', 10, '10.2.3.2', 538],
  ['hubungan-pengandaian', 10, '10.2.3.3', 538],
  ['hubungan-tujuan', 10, '10.2.3.4', 539],
  ['hubungan-konsesif', 10, '10.2.3.5', 539],
  ['hubungan-pembandingan', 10, '10.2.3.6', 540],
  ['hubungan-penyebaban', 10, '10.2.3.7', 542],
  ['hubungan-hasil', 10, '10.2.3.8', 543],
  ['hubungan-cara', 10, '10.2.3.9', 543],
  ['hubungan-alat', 10, '10.2.3.10', 543],
  ['hubungan-komplementasi', 10, '10.2.3.11', 544],
  ['hubungan-atributif', 10, '10.2.3.12', 546],
  ['hubungan-optatif', 10, '10.2.4', 548],
  ['pelesapan', 10, '10.3', 548],
].map(([slug, nomorBabBuku, nomorBagianBuku, halamanBuku]) => (
  buatAnchorHalamanGramatika(slug, nomorBabBuku, nomorBagianBuku, halamanBuku)
));

const daftarAnchorHalamanGramatika = [
  {
    slug: 'daftar-isi',
    nomorBabBuku: null,
    nomorBagianBuku: null,
    halamanBuku: null,
    halamanBukuLabel: 'xiv',
    halamanPdf: 15,
    halamanPdfLabel: '15',
  },
  {
    slug: 'pendahuluan',
    nomorBabBuku: 1,
    nomorBagianBuku: '1',
    halamanBuku: 1,
    halamanBukuLabel: '1',
    halamanPdf: 25,
    halamanPdfLabel: '25',
  },
  {
    slug: 'tata-bahasa',
    nomorBabBuku: 2,
    nomorBagianBuku: '2',
    halamanBuku: 23,
    halamanBukuLabel: '23',
    halamanPdf: 47,
    halamanPdfLabel: '47',
  },
  {
    slug: 'bunyi-bahasa',
    nomorBabBuku: 3,
    nomorBagianBuku: '3',
    halamanBuku: 45,
    halamanBukuLabel: '45',
    halamanPdf: 69,
    halamanPdfLabel: '69',
  },
  {
    slug: 'verba',
    nomorBabBuku: 4,
    nomorBagianBuku: '4',
    halamanBuku: 95,
    halamanBukuLabel: '95',
    halamanPdf: 119,
    halamanPdfLabel: '119',
  },
  {
    slug: 'adjektiva',
    nomorBabBuku: 5,
    nomorBagianBuku: '5',
    halamanBuku: 193,
    halamanBukuLabel: '193',
    halamanPdf: 217,
    halamanPdfLabel: '217',
  },
  {
    slug: 'adverbia',
    nomorBabBuku: 6,
    nomorBagianBuku: '6',
    halamanBuku: 235,
    halamanBukuLabel: '235',
    halamanPdf: 258,
    halamanPdfLabel: '258',
  },
  {
    slug: 'nomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1',
    halamanBuku: 259,
    halamanBukuLabel: '259',
    halamanPdf: 282,
    halamanPdfLabel: '282',
  },
  {
    slug: 'batasan-dan-ciri-nomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.1',
    halamanBuku: 259,
    halamanBukuLabel: '259',
    halamanPdf: 282,
    halamanPdfLabel: '282',
  },
  {
    slug: 'perilaku-semantis-nomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.2',
    halamanBuku: 261,
    halamanBukuLabel: '261',
    halamanPdf: 284,
    halamanPdfLabel: '284',
  },
  {
    slug: 'perilaku-sintaksis-nomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.3',
    halamanBuku: 263,
    halamanBukuLabel: '263',
    halamanPdf: 286,
    halamanPdfLabel: '286',
  },
  {
    slug: 'jenis-nomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.4',
    halamanBuku: 264,
    halamanBukuLabel: '264',
    halamanPdf: 287,
    halamanPdfLabel: '287',
  },
  {
    slug: 'nomina-berdasarkan-acuan',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.4.1',
    halamanBuku: 264,
    halamanBukuLabel: '264',
    halamanPdf: 287,
    halamanPdfLabel: '287',
  },
  {
    slug: 'nomina-berdasarkan-bentuk-morfologis',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.4.2',
    halamanBuku: 272,
    halamanBukuLabel: '272',
    halamanPdf: 295,
    halamanPdfLabel: '295',
  },
  {
    slug: 'frasa-nominal',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.5',
    halamanBuku: 310,
    halamanBukuLabel: '310',
    halamanPdf: 333,
    halamanPdfLabel: '333',
  },
  {
    slug: 'penentu',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.5.1',
    halamanBuku: 310,
    halamanBukuLabel: '310',
    halamanPdf: 333,
    halamanPdfLabel: '333',
  },
  {
    slug: 'penggolong-dan-partitif',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.5.2',
    halamanBuku: 313,
    halamanBukuLabel: '313',
    halamanPdf: 336,
    halamanPdfLabel: '336',
  },
  {
    slug: 'perluasan-nomina-ke-kiri',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.5.3',
    halamanBuku: 317,
    halamanBukuLabel: '317',
    halamanPdf: 340,
    halamanPdfLabel: '340',
  },
  {
    slug: 'perluasan-nomina-ke-kanan',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.5.4',
    halamanBuku: 318,
    halamanBukuLabel: '318',
    halamanPdf: 341,
    halamanPdfLabel: '341',
  },
  {
    slug: 'susunan-kata-pada-frasa-nominal',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.5.5',
    halamanBuku: 326,
    halamanBukuLabel: '326',
    halamanPdf: 349,
    halamanPdfLabel: '349',
  },
  {
    slug: 'frasa-nominal-vokatif',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.1.6',
    halamanBuku: 328,
    halamanBukuLabel: '328',
    halamanPdf: 351,
    halamanPdfLabel: '351',
  },
  {
    slug: 'pronomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2',
    halamanBuku: 329,
    halamanBukuLabel: '329',
    halamanPdf: 352,
    halamanPdfLabel: '352',
  },
  {
    slug: 'batasan-dan-ciri-pronomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.1',
    halamanBuku: 329,
    halamanBukuLabel: '329',
    halamanPdf: 352,
    halamanPdfLabel: '352',
  },
  {
    slug: 'jenis-pronomina',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2',
    halamanBuku: 330,
    halamanBukuLabel: '330',
    halamanPdf: 353,
    halamanPdfLabel: '353',
  },
  {
    slug: 'pronomina-persona',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2.1',
    halamanBuku: 330,
    halamanBukuLabel: '330',
    halamanPdf: 353,
    halamanPdfLabel: '353',
  },
  {
    slug: 'nomina-penyapa-dan-pengacu-sebagai-pengganti-pronomina-persona',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2.2',
    halamanBuku: 340,
    halamanBukuLabel: '340',
    halamanPdf: 363,
    halamanPdfLabel: '363',
  },
  {
    slug: 'pronomina-penunjuk',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2.3',
    halamanBuku: 342,
    halamanBukuLabel: '342',
    halamanPdf: 365,
    halamanPdfLabel: '365',
  },
  {
    slug: 'pronomina-tanya',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2.4',
    halamanBuku: 344,
    halamanBukuLabel: '344',
    halamanPdf: 367,
    halamanPdfLabel: '367',
  },
  {
    slug: 'pronomina-taktentu',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2.5',
    halamanBuku: 355,
    halamanBukuLabel: '355',
    halamanPdf: 378,
    halamanPdfLabel: '378',
  },
  {
    slug: 'pronomina-jumlah',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.2.6',
    halamanBuku: 356,
    halamanBukuLabel: '356',
    halamanPdf: 379,
    halamanPdfLabel: '379',
  },
  {
    slug: 'frasa-pronominal',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.2.3',
    halamanBuku: 356,
    halamanBukuLabel: '356',
    halamanPdf: 379,
    halamanPdfLabel: '379',
  },
  {
    slug: 'numeralia',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3',
    halamanBuku: 357,
    halamanBukuLabel: '357',
    halamanPdf: 380,
    halamanPdfLabel: '380',
  },
  {
    slug: 'numeralia-pokok',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1',
    halamanBuku: 357,
    halamanBukuLabel: '357',
    halamanPdf: 380,
    halamanPdfLabel: '380',
  },
  {
    slug: 'numeralia-pokok-tentu',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1.1',
    halamanBuku: 358,
    halamanBukuLabel: '358',
    halamanPdf: 381,
    halamanPdfLabel: '381',
  },
  {
    slug: 'numeralia-pokok-kolektif',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1.2',
    halamanBuku: 361,
    halamanBukuLabel: '361',
    halamanPdf: 384,
    halamanPdfLabel: '384',
  },
  {
    slug: 'numeralia-pokok-distributif',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1.3',
    halamanBuku: 362,
    halamanBukuLabel: '362',
    halamanPdf: 385,
    halamanPdfLabel: '385',
  },
  {
    slug: 'numeralia-pokok-taktentu',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1.4',
    halamanBuku: 362,
    halamanBukuLabel: '362',
    halamanPdf: 385,
    halamanPdfLabel: '385',
  },
  {
    slug: 'numeralia-pokok-klitika',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1.5',
    halamanBuku: 364,
    halamanBukuLabel: '364',
    halamanPdf: 387,
    halamanPdfLabel: '387',
  },
  {
    slug: 'numeralia-pecahan',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.1.6',
    halamanBuku: 364,
    halamanBukuLabel: '364',
    halamanPdf: 387,
    halamanPdfLabel: '387',
  },
  {
    slug: 'numeralia-tingkat',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.2',
    halamanBuku: 365,
    halamanBukuLabel: '365',
    halamanPdf: 388,
    halamanPdfLabel: '388',
  },
  {
    slug: 'frasa-numeral',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.3.3',
    halamanBuku: 366,
    halamanBukuLabel: '366',
    halamanPdf: 389,
    halamanPdfLabel: '389',
  },
  {
    slug: 'konsep-tunggal-jamak-dan-generik',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.4',
    halamanBuku: 366,
    halamanBukuLabel: '366',
    halamanPdf: 389,
    halamanPdfLabel: '389',
  },
  {
    slug: 'bentuk-perulangan-an',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.4.1',
    halamanBuku: 367,
    halamanBukuLabel: '367',
    halamanPdf: 390,
    halamanPdfLabel: '390',
  },
  {
    slug: 'kata-para',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.4.2',
    halamanBuku: 367,
    halamanBukuLabel: '367',
    halamanPdf: 390,
    halamanPdfLabel: '390',
  },
  {
    slug: 'kata-kaum',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.4.3',
    halamanBuku: 368,
    halamanBukuLabel: '368',
    halamanPdf: 391,
    halamanPdfLabel: '391',
  },
  {
    slug: 'kata-umat',
    nomorBabBuku: 7,
    nomorBagianBuku: '7.4.4',
    halamanBuku: 369,
    halamanBukuLabel: '369',
    halamanPdf: 392,
    halamanPdfLabel: '392',
  },
  {
    slug: 'kata-tugas',
    nomorBabBuku: 8,
    nomorBagianBuku: '8',
    halamanBuku: 373,
    halamanBukuLabel: '373',
    halamanPdf: 396,
    halamanPdfLabel: '396',
  },
  {
    slug: 'kalimat',
    nomorBabBuku: 9,
    nomorBagianBuku: '9',
    halamanBuku: 407,
    halamanBukuLabel: '407',
    halamanPdf: 430,
    halamanPdfLabel: '430',
  },
  {
    slug: 'hubungan-antarklausa',
    nomorBabBuku: 10,
    nomorBagianBuku: '10',
    halamanBuku: 513,
    halamanBukuLabel: '513',
    halamanPdf: 535,
    halamanPdfLabel: '535',
  },
  ...daftarAnchorHalamanGramatikaTambahan,
];

const petaAnchorHalamanGramatikaBySlug = daftarAnchorHalamanGramatika.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const daftarItemGramatikaSemua = [...daftarItemGramatika, ...daftarHalamanReferensiGramatika];

daftarItemGramatikaSemua.forEach((item) => {
  const anchor = petaAnchorHalamanGramatikaBySlug[item.slug];
  if (!anchor) return;

  Object.assign(item, {
    nomorBabBuku: anchor.nomorBabBuku,
    nomorBagianBuku: anchor.nomorBagianBuku,
    halamanBuku: anchor.halamanBuku,
    halamanBukuLabel: anchor.halamanBukuLabel,
    halamanPdf: anchor.halamanPdf,
    halamanPdfLabel: anchor.halamanPdfLabel,
  });
});

const petaItemGramatikaBySlug = daftarItemGramatikaSemua.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const daftarAutocompleteGramatika = daftarItemGramatikaSemua.map((item) => ({
  value: item.judul,
  slug: item.slug,
}));

const petaAutocompleteGramatika = daftarAutocompleteGramatika.reduce((acc, item) => {
  acc[item.slug] = item.value;
  return acc;
}, {});

const petaAnchorHalamanGramatikaByNomorBagianBuku = daftarAnchorHalamanGramatika.reduce((acc, item) => {
  const nomorBagian = String(item.nomorBagianBuku || '').trim();
  if (!nomorBagian) return acc;
  acc[nomorBagian] = item;
  return acc;
}, {});

function formatJudulGramatikaDariSlug(slug = '') {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');
}

function ambilAnchorHalamanGramatika(slug = '') {
  return petaAnchorHalamanGramatikaBySlug[String(slug || '').trim()] || null;
}

function cariItemGramatikaDariNomorBagianBuku(nomorBagianBuku = '') {
  const nomorBagian = String(nomorBagianBuku || '').trim();
  if (!nomorBagian) return null;

  const anchor = petaAnchorHalamanGramatikaByNomorBagianBuku[nomorBagian];
  if (!anchor) return null;

  return petaItemGramatikaBySlug[anchor.slug] || null;
}

function cariItemGramatikaTerdekatDariHalamanBuku(halamanBuku = null) {
  const target = Number(halamanBuku);
  if (!Number.isFinite(target)) return null;

  const anchorTerdekat = daftarAnchorHalamanGramatika
    .filter((item) => Number.isFinite(item.halamanBuku) && item.halamanBuku <= target)
    .sort((a, b) => b.halamanBuku - a.halamanBuku)[0];

  if (!anchorTerdekat) return null;
  return petaItemGramatikaBySlug[anchorTerdekat.slug] || null;
}

export {
  daftarIsiGramatika,
  daftarItemGramatika,
  daftarHalamanReferensiGramatika,
  daftarAnchorHalamanGramatika,
  petaAnchorHalamanGramatikaBySlug,
  petaAnchorHalamanGramatikaByNomorBagianBuku,
  petaItemGramatikaBySlug,
  daftarAutocompleteGramatika,
  petaAutocompleteGramatika,
  formatJudulGramatikaDariSlug,
  ambilAnchorHalamanGramatika,
  cariItemGramatikaDariNomorBagianBuku,
  cariItemGramatikaTerdekatDariHalamanBuku,
};

export const __private = {
  buatAnchorHalamanGramatika,
};
