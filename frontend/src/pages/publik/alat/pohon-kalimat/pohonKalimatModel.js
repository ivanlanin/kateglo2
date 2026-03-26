/**
 * @fileoverview Model data, builder, dan konversi pohon untuk Pohon Kalimat.
 */

export const JENIS_FRASA = [
  { kode: 'FN',    label: 'Frasa Nominal' },
  { kode: 'FV',    label: 'Frasa Verbal' },
  { kode: 'FAdj',  label: 'Frasa Adjektival' },
  { kode: 'FAdv',  label: 'Frasa Adverbial' },
  { kode: 'FNum',  label: 'Frasa Numeralia' },
  { kode: 'FPrep', label: 'Frasa Preposisional' },
  { kode: 'V',     label: 'Verba' },
  { kode: 'N',     label: 'Nomina' },
  { kode: 'Adj',   label: 'Adjektiva' },
  { kode: 'Adv',   label: 'Adverbia' },
  { kode: 'Pron',  label: 'Pronomina' },
  { kode: '—',     label: 'Langsung (tanpa frasa)' },
];

export const PERAN = [
  { kode: 'S',      label: 'Subjek' },
  { kode: 'P',      label: 'Predikat' },
  { kode: 'O',      label: 'Objek' },
  { kode: 'Pel',    label: 'Pelengkap' },
  { kode: 'Ket',    label: 'Keterangan' },
  { kode: 'KetOps', label: '(Keterangan)' },
  { kode: 'Konj',   label: 'Konjungsi' },
];

export const TIPE_KLAUSA = [
  'Klausa',
  'Klausa Utama',
  'Klausa Subordinatif',
  'Klausa Relatif',
  'Klausa Pembandingan',
  'Pewatas',
];

export const WARNA_PERAN = {
  S: '#2563eb',
  P: '#16a34a',
  O: '#dc2626',
  Pel: '#ea580c',
  Ket: '#7c3aed',
  KetOps: '#7c3aed',
  Konj: '#6b7280',
};

const WARNA_NETRAL = '#111827';
const WARNA_FRASA = '#6b7280';
const WARNA_KONJ = '#6b7280';

let counter = 0;

function newId(prefix = 'n') {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function buatKonstituen(overrides = {}) {
  return {
    id: newId('k'),
    peran: 'S',
    jenisFrasa: 'FN',
    teks: '',
    realisasi: 'frasa',
    klausaAnak: null,
    ...overrides,
  };
}

export function buatKlausa(label = 'Klausa') {
  return {
    id: newId('kl'),
    label,
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
    klausaTersisip: null,
    segitiga: false,
    teksSegitiga: '',
  };
}

export function buatKlausaAnak(label = 'Klausa Subordinatif') {
  return {
    id: newId('ka'),
    label,
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
    klausaTersisip: null,
    segitiga: false,
    teksSegitiga: '',
  };
}

export function buatKlausaTersisip() {
  return {
    konjungsi: '',
    klausa: buatKlausa('Klausa'),
  };
}

export function buatStateTunggal() {
  return {
    jenis: 'tunggal',
    klausaUtama: false,
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
  };
}

export function buatStateMajemuk() {
  return {
    jenis: 'majemuk',
    segmen: [
      { tipe: 'klausa', ...buatKlausa('Kl₁') },
      { tipe: 'konjungsi', id: newId('konj'), teks: '' },
      { tipe: 'klausa', ...buatKlausa('Kl₂') },
    ],
  };
}

function warnaPeran(kode, berwarna) {
  if (!berwarna) return WARNA_NETRAL;
  return WARNA_PERAN[kode] ?? WARNA_NETRAL;
}

function konstituenKeNode(konstituen, berwarna) {
  if (konstituen.realisasi === 'klausa' && konstituen.klausaAnak) {
    return {
      id: konstituen.id,
      label: konstituen.peran,
      warna: warnaPeran(konstituen.peran, berwarna),
      anak: [klausaKeNode(konstituen.klausaAnak, berwarna)],
    };
  }

  const langsung = konstituen.jenisFrasa === '—' || konstituen.peran === 'Konj';
  const teksAnak = konstituen.teks.trim()
    ? [{ id: `${konstituen.id}-teks`, label: konstituen.teks.trim(), warna: WARNA_NETRAL, anak: [] }]
    : [];

  if (langsung) {
    return {
      id: konstituen.id,
      label: konstituen.peran,
      warna: warnaPeran(konstituen.peran, berwarna),
      anak: teksAnak,
    };
  }

  const frasaNode = {
    id: `${konstituen.id}-frasa`,
    label: konstituen.jenisFrasa,
    warna: berwarna ? WARNA_FRASA : WARNA_NETRAL,
    anak: teksAnak,
  };

  return {
    id: konstituen.id,
    label: konstituen.peran,
    warna: warnaPeran(konstituen.peran, berwarna),
    anak: [frasaNode],
  };
}

function klausaKeNode(klausa, berwarna) {
  if (klausa.segitiga) {
    return {
      id: klausa.id,
      label: klausa.label,
      warna: WARNA_NETRAL,
      anak: [],
      segitiga: true,
      teksSegitiga: klausa.teksSegitiga || '…',
    };
  }

  const anak = klausa.konstituen.map((k) => konstituenKeNode(k, berwarna));

  if (klausa.klausaTersisip) {
    const { konjungsi, klausa: subklausa } = klausa.klausaTersisip;
    anak.push({
      id: `${klausa.id}-tersisip-konj`,
      label: konjungsi.trim() || '…',
      warna: berwarna ? WARNA_KONJ : WARNA_NETRAL,
      anak: [],
    });
    anak.push(klausaKeNode(subklausa, berwarna));
  }

  return {
    id: klausa.id,
    label: klausa.label,
    warna: WARNA_NETRAL,
    anak,
  };
}

export function buatPohon(state, berwarna = true) {
  if (state.jenis === 'tunggal') {
    const konstituenNodes = state.konstituen.map((k) => konstituenKeNode(k, berwarna));
    if (state.klausaUtama) {
      return {
        id: 'root',
        label: 'Kalimat',
        warna: WARNA_NETRAL,
        anak: [{
          id: 'klausa-utama',
          label: 'Klausa Utama',
          warna: WARNA_NETRAL,
          anak: konstituenNodes,
        }],
      };
    }
    return {
      id: 'root',
      label: 'Kalimat',
      warna: WARNA_NETRAL,
      anak: konstituenNodes,
    };
  }

  const anak = state.segmen.map((segmen) => {
    if (segmen.tipe === 'klausa') return klausaKeNode(segmen, berwarna);
    return {
      id: segmen.id,
      label: segmen.teks.trim() || '…',
      warna: berwarna ? WARNA_KONJ : WARNA_NETRAL,
      anak: [],
    };
  });

  return {
    id: 'root',
    label: 'Kalimat',
    warna: WARNA_NETRAL,
    anak,
  };
}

export const CONTOH = [
  {
    judul: 'Kalimat tunggal — tiga unsur',
    state: {
      jenis: 'tunggal',
      klausaUtama: false,
      konstituen: [
        { id: 'c1-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila', realisasi: 'frasa', klausaAnak: null },
        { id: 'c1-k2', peran: 'P', jenisFrasa: 'FV', teks: 'merupakan', realisasi: 'frasa', klausaAnak: null },
        { id: 'c1-k3', peran: 'Pel', jenisFrasa: 'FN', teks: 'dasar negara kita', realisasi: 'frasa', klausaAnak: null },
      ],
    },
  },
  {
    judul: 'Kalimat tunggal — dengan keterangan',
    state: {
      jenis: 'tunggal',
      klausaUtama: false,
      konstituen: [
        { id: 'c2-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Dia', realisasi: 'frasa', klausaAnak: null },
        { id: 'c2-k2', peran: 'P', jenisFrasa: 'FV', teks: 'sedang belajar', realisasi: 'frasa', klausaAnak: null },
        { id: 'c2-k3', peran: 'O', jenisFrasa: 'FN', teks: 'matematika', realisasi: 'frasa', klausaAnak: null },
        { id: 'c2-k4', peran: 'KetOps', jenisFrasa: 'FN', teks: 'sekarang', realisasi: 'frasa', klausaAnak: null },
      ],
    },
  },
  {
    judul: 'Majemuk koordinatif — segitiga',
    state: {
      jenis: 'majemuk',
      segmen: [
        {
          tipe: 'klausa', id: 'c3-kl1', label: 'Kl₁',
          segitiga: true, teksSegitiga: 'Andi sedang belajar',
          konstituen: [
            { id: 'c3-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Andi sedang belajar', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: null,
        },
        { tipe: 'konjungsi', id: 'c3-konj1', teks: 'tetapi' },
        {
          tipe: 'klausa', id: 'c3-kl2', label: 'Kl₂',
          segitiga: true, teksSegitiga: 'adiknya hanya menonton TV',
          konstituen: [
            { id: 'c3-k2', peran: 'S', jenisFrasa: 'FN', teks: 'adiknya hanya menonton TV', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: null,
        },
      ],
    },
  },
  {
    judul: 'Majemuk — dengan sub-klausa',
    state: {
      jenis: 'majemuk',
      segmen: [
        {
          tipe: 'klausa', id: 'c4-kl1', label: 'Kl₁',
          segitiga: false, teksSegitiga: '',
          konstituen: [
            { id: 'c4-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Dia', realisasi: 'frasa', klausaAnak: null },
            { id: 'c4-k2', peran: 'P', jenisFrasa: 'FV', teks: 'pergi', realisasi: 'frasa', klausaAnak: null },
            { id: 'c4-k3', peran: 'Ket', jenisFrasa: 'FPrep', teks: 'ke sekolah', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: null,
        },
        { tipe: 'konjungsi', id: 'c4-konj1', teks: 'dan' },
        {
          tipe: 'klausa', id: 'c4-kl2', label: 'Kl₂',
          segitiga: false, teksSegitiga: '',
          konstituen: [
            { id: 'c4-k4', peran: 'S', jenisFrasa: 'FN', teks: 'adiknya', realisasi: 'frasa', klausaAnak: null },
            { id: 'c4-k5', peran: 'P', jenisFrasa: 'FV', teks: 'menangis', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: {
            konjungsi: 'karena',
            klausa: {
              id: 'c4-kl3', label: 'Klausa', segitiga: false, teksSegitiga: '',
              konstituen: [
                { id: 'c4-k6', peran: 'S', jenisFrasa: 'FN', teks: 'ia', realisasi: 'frasa', klausaAnak: null },
                { id: 'c4-k7', peran: 'P', jenisFrasa: 'FV', teks: 'merindukan ibunya', realisasi: 'frasa', klausaAnak: null },
              ],
              klausaTersisip: null,
            },
          },
        },
      ],
    },
  },
  {
    judul: 'Bertingkat — O sebagai klausa subordinatif',
    state: {
      jenis: 'tunggal',
      klausaUtama: true,
      konstituen: [
        { id: 'c5-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Embo', realisasi: 'frasa', klausaAnak: null },
        { id: 'c5-k2', peran: 'P', jenisFrasa: 'FV', teks: 'mengatakan', realisasi: 'frasa', klausaAnak: null },
        {
          id: 'c5-k3', peran: 'O', jenisFrasa: 'FN', teks: '', realisasi: 'klausa',
          klausaAnak: {
            id: 'c5-ka1', label: 'Klausa Subordinatif', segitiga: false, teksSegitiga: '',
            klausaTersisip: null,
            konstituen: [
              { id: 'c5-sk1', peran: 'Konj', jenisFrasa: '—', teks: 'bahwa', realisasi: 'frasa', klausaAnak: null },
              { id: 'c5-sk2', peran: 'S', jenisFrasa: 'FN', teks: 'Rini', realisasi: 'frasa', klausaAnak: null },
              { id: 'c5-sk3', peran: 'P', jenisFrasa: 'FV', teks: 'mencintai', realisasi: 'frasa', klausaAnak: null },
              { id: 'c5-sk4', peran: 'O', jenisFrasa: 'FN', teks: 'pemuda itu', realisasi: 'frasa', klausaAnak: null },
              { id: 'c5-sk5', peran: 'Ket', jenisFrasa: '—', teks: 'sepenuh hati', realisasi: 'frasa', klausaAnak: null },
            ],
          },
        },
      ],
    },
  },
];
