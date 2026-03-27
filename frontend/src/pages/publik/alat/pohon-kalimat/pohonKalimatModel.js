/**
 * @fileoverview Model data, builder, dan konversi pohon ke nodus untuk Pohon Kalimat.
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
  { kode: 'Konj',   label: 'Konjungsi' },
];

export const TIPE_KLAUSA = [
  'Klausa Utama',
  'Klausa Subordinatif',
];

export const WARNA_PERAN = {
  S: '#2563eb',
  P: '#16a34a',
  O: '#dc2626',
  Pel: '#ea580c',
  Ket: '#7c3aed',
  Konj: '#6b7280',
};

const WARNA_NETRAL = '#111827';
const WARNA_FRASA = '#6b7280';

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

export function buatKlausa(label = 'Klausa Utama') {
  return {
    id: newId('kl'),
    label,
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
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
  };
}

export function buatStateAwal() {
  return {
    segmen: [
      { tipe: 'klausa', ...buatKlausa('Klausa Utama') },
    ],
  };
}

/** @deprecated Gunakan buatStateAwal() */
export function buatStateTunggal() {
  return buatStateAwal();
}

/** @deprecated Gunakan buatStateAwal() lalu tambahKlausa */
export function buatStateMajemuk() {
  return {
    segmen: [
      { tipe: 'klausa', ...buatKlausa('Klausa Utama') },
      { tipe: 'konjungsi', id: newId('konj'), teks: '' },
      { tipe: 'klausa', ...buatKlausa('Klausa Utama') },
    ],
  };
}

function warnaPeran(kode, berwarna) {
  if (!berwarna) return WARNA_NETRAL;
  return WARNA_PERAN[kode] ?? WARNA_NETRAL;
}

function buatNodusKonjungsi(id, teks, berwarna) {
  if (!teks.trim()) {
    return { id, label: 'Konj', warna: warnaPeran('Konj', berwarna), anak: [] };
  }
  const teksNodus = { id: `${id}-teks`, label: teks.trim(), warna: WARNA_NETRAL, anak: [] };
  const sp2 = { id: `${id}-sp2`, label: '', spacer: true, warna: WARNA_NETRAL, anak: [teksNodus] };
  const sp1 = { id: `${id}-sp1`, label: '', spacer: true, warna: WARNA_NETRAL, anak: [sp2] };
  return { id, label: 'Konj', warna: warnaPeran('Konj', berwarna), anak: [sp1] };
}

function konstituenKeNodus(konstituen, berwarna) {
  if (konstituen.realisasi === 'klausa' && konstituen.klausaAnak) {
    return {
      id: konstituen.id,
      label: konstituen.peran,
      warna: warnaPeran(konstituen.peran, berwarna),
      anak: [klausaKeNodus(konstituen.klausaAnak, berwarna)],
    };
  }

  // Konj inside a clause: 1 spacer level before the text
  if (konstituen.peran === 'Konj') {
    if (!konstituen.teks.trim()) {
      return { id: konstituen.id, label: 'Konj', warna: warnaPeran('Konj', berwarna), anak: [] };
    }
    const teksNodus = { id: `${konstituen.id}-teks`, label: konstituen.teks.trim(), warna: WARNA_NETRAL, anak: [] };
    const sp = { id: `${konstituen.id}-sp`, label: '', spacer: true, warna: WARNA_NETRAL, anak: [teksNodus] };
    return { id: konstituen.id, label: 'Konj', warna: warnaPeran('Konj', berwarna), anak: [sp] };
  }

  const langsung = konstituen.jenisFrasa === '—';
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

  const frasaNodus = {
    id: `${konstituen.id}-frasa`,
    label: konstituen.jenisFrasa,
    warna: berwarna ? WARNA_FRASA : WARNA_NETRAL,
    anak: teksAnak,
  };

  return {
    id: konstituen.id,
    label: konstituen.peran,
    warna: warnaPeran(konstituen.peran, berwarna),
    anak: [frasaNodus],
  };
}

function klausaKeNodus(klausa, berwarna) {
  const anak = klausa.konstituen.map((k) => konstituenKeNodus(k, berwarna));

  return {
    id: klausa.id,
    label: klausa.label,
    warna: WARNA_NETRAL,
    anak,
  };
}

export function buatPohon(state, berwarna = true) {
  // Legacy tunggal format support
  if (state.jenis === 'tunggal') {
    const konstituenNodus = state.konstituen.map((k) => konstituenKeNodus(k, berwarna));
    if (state.klausaUtama) {
      return {
        id: 'root',
        label: 'Kalimat',
        warna: WARNA_NETRAL,
        anak: [{
          id: 'klausa-utama',
          label: 'Klausa Utama',
          warna: WARNA_NETRAL,
          anak: konstituenNodus,
        }],
      };
    }
    return {
      id: 'root',
      label: 'Kalimat',
      warna: WARNA_NETRAL,
      anak: konstituenNodus,
    };
  }

  const klausaSegmen = state.segmen.filter((s) => s.tipe === 'klausa');

  // Single klausa → label utama selalu 'Kalimat' (Klausa Utama tidak ditampilkan)
  if (klausaSegmen.length === 1) {
    const kl = klausaSegmen[0];
    const anak = kl.konstituen.map((k) => konstituenKeNodus(k, berwarna));
    return {
      id: 'root',
      label: 'Kalimat',
      warna: WARNA_NETRAL,
      anak,
    };
  }

  const anak = state.segmen.map((segmen) => {
    if (segmen.tipe === 'klausa') return klausaKeNodus(segmen, berwarna);
    return buatNodusKonjungsi(segmen.id, segmen.teks, berwarna);
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
    judul: 'Kalimat tunggal',
    state: {
      segmen: [
        {
          tipe: 'klausa', id: 'c1-kl1', label: 'Klausa Utama',
          konstituen: [
            { id: 'c1-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Anak itu', realisasi: 'frasa', klausaAnak: null },
            { id: 'c1-k2', peran: 'P', jenisFrasa: 'V', teks: 'melempar', realisasi: 'frasa', klausaAnak: null },
            { id: 'c1-k3', peran: 'O', jenisFrasa: 'N', teks: 'bola', realisasi: 'frasa', klausaAnak: null },
            { id: 'c1-k4', peran: 'Ket', jenisFrasa: 'FPrep', teks: 'ke lapangan', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: null,
        },
      ],
    },
  },
  {
    judul: 'Majemuk koordinatif',
    state: {
      segmen: [
        {
          tipe: 'klausa', id: 'c2-kl1', label: 'Klausa Utama',
          konstituen: [
            { id: 'c2-k1', peran: 'S', jenisFrasa: 'FN', teks: 'Pengurus organisasi', realisasi: 'frasa', klausaAnak: null },
            { id: 'c2-k2', peran: 'P', jenisFrasa: 'V', teks: 'mengunjungi', realisasi: 'frasa', klausaAnak: null },
            { id: 'c2-k3', peran: 'O', jenisFrasa: 'FN', teks: 'panti asuhan', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: null,
        },
        { tipe: 'konjungsi', id: 'c2-konj1', teks: 'dan' },
        {
          tipe: 'klausa', id: 'c2-kl2', label: 'Klausa Utama',
          konstituen: [
            { id: 'c2-k4', peran: 'S', jenisFrasa: 'Pron', teks: 'mereka', realisasi: 'frasa', klausaAnak: null },
            { id: 'c2-k5', peran: 'P', jenisFrasa: 'V', teks: 'memberi', realisasi: 'frasa', klausaAnak: null },
            { id: 'c2-k6', peran: 'O', jenisFrasa: 'N', teks: 'penghuninya', realisasi: 'frasa', klausaAnak: null },
            { id: 'c2-k7', peran: 'Pel', jenisFrasa: 'N', teks: 'hadiah', realisasi: 'frasa', klausaAnak: null },
          ],
          klausaTersisip: null,
        },
      ],
    },
  },
  {
    judul: 'Majemuk subordinatif',
    state: {
      segmen: [
        {
          tipe: 'klausa', id: 'c3-kl1', label: 'Klausa Utama',
          konstituen: [
            { id: 'c3-k1', peran: 'S', jenisFrasa: 'N', teks: 'Embo', realisasi: 'frasa', klausaAnak: null },
            { id: 'c3-k2', peran: 'P', jenisFrasa: 'V', teks: 'mengatakan', realisasi: 'frasa', klausaAnak: null },
            {
              id: 'c3-k3', peran: 'O', jenisFrasa: 'FN', teks: '', realisasi: 'klausa',
              klausaAnak: {
                id: 'c3-ka1', label: 'Klausa Subordinatif',
                konstituen: [
                  { id: 'c3-sk1', peran: 'Konj', jenisFrasa: '—', teks: 'bahwa', realisasi: 'frasa', klausaAnak: null },
                  { id: 'c3-sk2', peran: 'S', jenisFrasa: 'N', teks: 'Rini', realisasi: 'frasa', klausaAnak: null },
                  { id: 'c3-sk3', peran: 'P', jenisFrasa: 'V', teks: 'mencintai', realisasi: 'frasa', klausaAnak: null },
                  { id: 'c3-sk4', peran: 'O', jenisFrasa: 'FN', teks: 'pemuda itu', realisasi: 'frasa', klausaAnak: null },
                  { id: 'c3-sk5', peran: 'Ket', jenisFrasa: 'FAdv', teks: 'sepenuh hati', realisasi: 'frasa', klausaAnak: null },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    judul: 'Berklausa perbandingan',
    state: {
      segmen: [
        {
          tipe: 'klausa', id: 'c5-kl1', label: 'Klausa Utama',
          konstituen: [
            { id: 'c5-k1', peran: 'S', jenisFrasa: 'N', teks: 'Dia', realisasi: 'frasa', klausaAnak: null },
            { id: 'c5-k2', peran: 'P', jenisFrasa: 'V', teks: 'bekerja', realisasi: 'frasa', klausaAnak: null },
            { id: 'c5-k3', peran: 'Ket', jenisFrasa: 'FAdj', teks: 'lebih lama', realisasi: 'frasa', klausaAnak: null },
            {
              id: 'c5-k4', peran: 'Ket', jenisFrasa: 'FN', teks: '', realisasi: 'klausa',
              klausaAnak: {
                id: 'c5-ka1', label: 'Klausa Subordinatif',
                konstituen: [
                  { id: 'c5-sk1', peran: 'Konj', jenisFrasa: '—', teks: 'daripada', realisasi: 'frasa', klausaAnak: null },
                  { id: 'c5-sk2', peran: 'S', jenisFrasa: 'N', teks: 'istrinya', realisasi: 'frasa', klausaAnak: null },
                  { id: 'c5-sk3', peran: 'P', jenisFrasa: 'V', teks: 'Ø', realisasi: 'frasa', klausaAnak: null },
                ],
              },
            },
          ],
        },
      ],
    },
  },
];
