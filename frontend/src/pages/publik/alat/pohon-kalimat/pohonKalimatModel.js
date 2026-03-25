/**
 * @fileoverview Model data, builder, dan konversi pohon untuk Pohon Kalimat.
 */

export const JENIS_FRASA = [
  { kode: 'FN', label: 'Frasa Nominal' },
  { kode: 'FV', label: 'Frasa Verbal' },
  { kode: 'FAdj', label: 'Frasa Adjektival' },
  { kode: 'FAdv', label: 'Frasa Adverbial' },
  { kode: 'FNum', label: 'Frasa Numeralia' },
  { kode: 'FPrep', label: 'Frasa Preposisional' },
];

export const PERAN = [
  { kode: 'S', label: 'Subjek' },
  { kode: 'P', label: 'Predikat' },
  { kode: 'Pel', label: 'Pelengkap' },
  { kode: 'Ket', label: 'Keterangan' },
  { kode: 'KetOps', label: '(Keterangan)' },
];

export const WARNA_PERAN = {
  S: '#2563eb',
  P: '#16a34a',
  Pel: '#ea580c',
  Ket: '#7c3aed',
  KetOps: '#7c3aed',
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
    ...overrides,
  };
}

export function buatKlausa(label = 'Kl') {
  return {
    id: newId('kl'),
    label,
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
    klausaTersisip: null,
  };
}

export function buatKlausaTersisip() {
  return {
    konjungsi: '',
    klausa: buatKlausa('Kl'),
  };
}

export function buatStateTunggal() {
  return {
    jenis: 'tunggal',
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

function labelPeran(kode) {
  return PERAN.find((item) => item.kode === kode)?.label ?? kode;
}

function labelFrasa(kode) {
  return JENIS_FRASA.find((item) => item.kode === kode)?.label ?? kode;
}

function warnaPeran(kode, berwarna) {
  if (!berwarna) return WARNA_NETRAL;
  return WARNA_PERAN[kode] ?? WARNA_NETRAL;
}

function konstituenKeNode(konstituen, berwarna) {
  const teksAnak = konstituen.teks.trim()
    ? [{ id: `${konstituen.id}-teks`, label: konstituen.teks.trim(), warna: WARNA_NETRAL, anak: [] }]
    : [];

  const frasaNode = {
    id: `${konstituen.id}-frasa`,
    label: labelFrasa(konstituen.jenisFrasa),
    warna: berwarna ? WARNA_FRASA : WARNA_NETRAL,
    anak: teksAnak,
  };

  return {
    id: konstituen.id,
    label: labelPeran(konstituen.peran),
    warna: warnaPeran(konstituen.peran, berwarna),
    anak: [frasaNode],
  };
}

function klausaKeNode(klausa, berwarna) {
  const anak = klausa.konstituen.map((konstituen) => konstituenKeNode(konstituen, berwarna));

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
    return {
      id: 'root',
      label: 'Kalimat',
      warna: WARNA_NETRAL,
      anak: state.konstituen.map((konstituen) => konstituenKeNode(konstituen, berwarna)),
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
    label: 'K',
    warna: WARNA_NETRAL,
    anak,
  };
}

export const CONTOH = [
  {
    judul: 'Kalimat tunggal — tiga unsur',
    state: {
      jenis: 'tunggal',
      konstituen: [
        { id: 'c1-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila' },
        { id: 'c1-k2', peran: 'P', jenisFrasa: 'FV', teks: 'merupakan' },
        { id: 'c1-k3', peran: 'Pel', jenisFrasa: 'FN', teks: 'dasar negara kita' },
      ],
    },
  },
  {
    judul: 'Kalimat tunggal — dengan keterangan',
    state: {
      jenis: 'tunggal',
      konstituen: [
        { id: 'c2-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Dia' },
        { id: 'c2-k2', peran: 'P', jenisFrasa: 'FV', teks: 'sedang belajar' },
        { id: 'c2-k3', peran: 'Pel', jenisFrasa: 'FN', teks: 'matematika' },
        { id: 'c2-k4', peran: 'KetOps', jenisFrasa: 'FN', teks: 'sekarang' },
      ],
    },
  },
  {
    judul: 'Kalimat majemuk — dengan sub-klausa',
    state: {
      jenis: 'majemuk',
      segmen: [
        {
          tipe: 'klausa',
          id: 'c3-kl1',
          label: 'Kl₁',
          konstituen: [
            { id: 'c3-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Dia' },
            { id: 'c3-k2', peran: 'P', jenisFrasa: 'FV', teks: 'pergi' },
            { id: 'c3-k3', peran: 'Ket', jenisFrasa: 'FPrep', teks: 'ke sekolah' },
          ],
          klausaTersisip: null,
        },
        { tipe: 'konjungsi', id: 'c3-konj1', teks: 'dan' },
        {
          tipe: 'klausa',
          id: 'c3-kl2',
          label: 'Kl₂',
          konstituen: [
            { id: 'c3-k4', peran: 'S', jenisFrasa: 'FN', teks: 'adiknya' },
            { id: 'c3-k5', peran: 'P', jenisFrasa: 'FV', teks: 'menangis' },
          ],
          klausaTersisip: {
            konjungsi: 'karena',
            klausa: {
              id: 'c3-kl3',
              label: 'Kl₃',
              konstituen: [
                { id: 'c3-k6', peran: 'S', jenisFrasa: 'FN', teks: 'ia' },
                { id: 'c3-k7', peran: 'P', jenisFrasa: 'FV', teks: 'merindukan ibunya' },
              ],
              klausaTersisip: null,
            },
          },
        },
      ],
    },
  },
];
