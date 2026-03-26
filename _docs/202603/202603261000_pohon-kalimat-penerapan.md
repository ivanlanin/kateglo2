# Penerapan Pohon Kalimat — Rencana & Catatan Implementasi

**Tanggal**: 2026-03-26
**Status**: Sedang dikerjakan

## Ringkasan Perubahan

Melengkapi alat Pohon Kalimat agar mendukung struktur pohon seperti pada gambar referensi dari buku tata bahasa Indonesia. Perubahan mencakup 4 file:

1. `frontend/src/pages/publik/alat/pohon-kalimat/pohonKalimatModel.js`
2. `frontend/src/pages/publik/alat/pohon-kalimat/PohonKalimatDiagram.jsx`
3. `frontend/src/pages/publik/alat/PohonKalimat.jsx`
4. `frontend/src/styles/alat.css`

---

## 1. Model Data (`pohonKalimatModel.js`)

### PERAN — tambah O dan Konj

```js
export const PERAN = [
  { kode: 'S',      label: 'Subjek' },
  { kode: 'P',      label: 'Predikat' },
  { kode: 'O',      label: 'Objek' },          // BARU
  { kode: 'Pel',    label: 'Pelengkap' },
  { kode: 'Ket',    label: 'Keterangan' },
  { kode: 'KetOps', label: '(Keterangan)' },
  { kode: 'Konj',   label: 'Konjungsi' },       // BARU
];
```

### JENIS_FRASA — tambah V, N, Adj, Adv, Pron, dan '—' (langsung)

```js
export const JENIS_FRASA = [
  { kode: 'FN',    label: 'Frasa Nominal' },
  { kode: 'FV',    label: 'Frasa Verbal' },
  { kode: 'FAdj',  label: 'Frasa Adjektival' },
  { kode: 'FAdv',  label: 'Frasa Adverbial' },
  { kode: 'FNum',  label: 'Frasa Numeralia' },
  { kode: 'FPrep', label: 'Frasa Preposisional' },
  { kode: 'V',     label: 'Verba' },            // BARU
  { kode: 'N',     label: 'Nomina' },           // BARU
  { kode: 'Adj',   label: 'Adjektiva' },        // BARU
  { kode: 'Adv',   label: 'Adverbia' },         // BARU
  { kode: 'Pron',  label: 'Pronomina' },        // BARU
  { kode: '—',     label: 'Langsung (tanpa frasa)' }, // BARU
];
```

### TIPE_KLAUSA — konstanta baru untuk pilihan label klausa

```js
export const TIPE_KLAUSA = [
  'Klausa',
  'Klausa Utama',
  'Klausa Subordinatif',
  'Klausa Relatif',
  'Klausa Pembandingan',
  'Pewatas',
];
```

### WARNA_PERAN — tambah O (merah)

```js
export const WARNA_PERAN = {
  S: '#2563eb',
  P: '#16a34a',
  O: '#dc2626',      // BARU
  Pel: '#ea580c',
  Ket: '#7c3aed',
  KetOps: '#7c3aed',
  Konj: '#6b7280',   // BARU
};
```

### buatKonstituen — tambah `realisasi` dan `klausaAnak`

```js
export function buatKonstituen(overrides = {}) {
  return {
    id: newId('k'),
    peran: 'S',
    jenisFrasa: 'FN',
    teks: '',
    realisasi: 'frasa',   // BARU: 'frasa' | 'klausa'
    klausaAnak: null,     // BARU: klausa object jika realisasi='klausa'
    ...overrides,
  };
}
```

### buatKlausa — tambah `segitiga` dan `teksSegitiga`

```js
export function buatKlausa(label = 'Klausa') {
  return {
    id: newId('kl'),
    label,
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
    klausaTersisip: null,
    segitiga: false,      // BARU: tampilkan sebagai segitiga
    teksSegitiga: '',     // BARU: teks di dasar segitiga
  };
}
```

### buatKlausaAnak — fungsi baru

```js
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
```

### buatStateTunggal — tambah `klausaUtama`

```js
export function buatStateTunggal() {
  return {
    jenis: 'tunggal',
    klausaUtama: false,    // BARU: bungkus konstituen dalam node "Klausa Utama"
    konstituen: [
      buatKonstituen({ peran: 'S', jenisFrasa: 'FN' }),
      buatKonstituen({ peran: 'P', jenisFrasa: 'FV' }),
    ],
  };
}
```

### konstituenKeNode — gunakan kode langsung; dukung realisasi='klausa' dan jenisFrasa='—'

```js
function konstituenKeNode(konstituen, berwarna) {
  // Konstituen direalisasikan oleh klausa (bukan frasa)
  if (konstituen.realisasi === 'klausa' && konstituen.klausaAnak) {
    return {
      id: konstituen.id,
      label: konstituen.peran,           // kode langsung, mis. 'O'
      warna: warnaPeran(konstituen.peran, berwarna),
      anak: [klausaKeNode(konstituen.klausaAnak, berwarna)],
    };
  }

  // jenisFrasa='—' atau peran='Konj': langsung ke teks tanpa node frasa
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

  // Normal: peran → jenisFrasa → teks
  const frasaNode = {
    id: `${konstituen.id}-frasa`,
    label: konstituen.jenisFrasa,        // kode langsung, mis. 'FN'
    warna: berwarna ? WARNA_FRASA : WARNA_NETRAL,
    anak: teksAnak,
  };

  return {
    id: konstituen.id,
    label: konstituen.peran,             // kode langsung, mis. 'S'
    warna: warnaPeran(konstituen.peran, berwarna),
    anak: [frasaNode],
  };
}
```

### klausaKeNode — dukung segitiga

```js
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
  // ... sisa logika existing (dengan klausaTersisip)
}
```

### buatPohon — dukung klausaUtama wrapper dan label 'Kalimat' untuk majemuk

```js
export function buatPohon(state, berwarna = true) {
  if (state.jenis === 'tunggal') {
    const konstituenNodes = state.konstituen.map((k) => konstituenKeNode(k, berwarna));
    if (state.klausaUtama) {
      return {
        id: 'root', label: 'Kalimat', warna: WARNA_NETRAL,
        anak: [{ id: 'klausa-utama', label: 'Klausa Utama', warna: WARNA_NETRAL, anak: konstituenNodes }],
      };
    }
    return { id: 'root', label: 'Kalimat', warna: WARNA_NETRAL, anak: konstituenNodes };
  }

  // majemuk: sama seperti sebelumnya tapi label root 'Kalimat' (bukan 'K')
  const anak = state.segmen.map((seg) => {
    if (seg.tipe === 'klausa') return klausaKeNode(seg, berwarna);
    return { id: seg.id, label: seg.teks.trim() || '…', warna: berwarna ? WARNA_KONJ : WARNA_NETRAL, anak: [] };
  });
  return { id: 'root', label: 'Kalimat', warna: WARNA_NETRAL, anak };
}
```

### CONTOH — perbarui dan tambah

Contoh baru yang ditambahkan:
1. **"Majemuk koordinatif — segitiga"**: dua klausa koordinatif ditampilkan sebagai segitiga
2. **"Bertingkat — O sebagai klausa subordinatif"**: `klausaUtama: true`, O diisi `klausaAnak` bertipe 'Klausa Subordinatif'

---

## 2. Diagram SVG (`PohonKalimatDiagram.jsx`)

### Konstanta baru

```js
const TRIANGLE_H = 36;    // tinggi segitiga
const LEGEND_FONT = 10;   // ukuran font legenda
const LEGEND_LINE_H = 16; // jarak antarbaris legenda
const LEGEND_PAD = 20;    // padding atas legenda
const LEGEND_MIN_W = 520; // lebar minimum SVG agar legenda muat
```

### lebarSubpohon — dukung segitiga

```js
function lebarSubpohon(node) {
  if (node.segitiga) {
    return Math.max(lebarNode(node.label), lebarNode(node.teksSegitiga || '') + 20);
  }
  // ... existing
}
```

### Hitung dimensi SVG — sertakan segitiga dan legenda

```js
// Setelah hitungLayout:
const maxYBrut = daftarNode.reduce((max, node) => {
  if (node.segitiga) return Math.max(max, node.y + TRIANGLE_H + FONT_SIZE * 2);
  return Math.max(max, node.y);
}, 0);

const treeSvgH = maxYBrut + PAD_Y + FONT_SIZE;
const legendH = LEGEND_PAD + LEGEND_LINE_H * 3 + 10;
const svgH = treeSvgH + legendH;
const svgW = Math.max(maxX + PAD_X + NODE_MIN_W / 2, LEGEND_MIN_W);
```

### Render edge — untuk simpul segitiga, sambung ke apex

```jsx
{daftarEdge.map((edge, index) => {
  const keY = edge.ke.segitiga
    ? edge.ke.y + FONT_SIZE * 0.6   // apex segitiga (titik puncak)
    : edge.ke.y - FONT_SIZE * 0.8;  // atas teks normal
  return <line key={index} x1={edge.dari.x} y1={edge.dari.y + FONT_SIZE * 0.6} x2={edge.ke.x} y2={keY} .../>;
})}
```

### Render node — bentuk segitiga untuk node.segitiga

```jsx
{daftarNode.map((node) => {
  if (node.segitiga) {
    const bw = Math.max(80, lebarNode(node.teksSegitiga || '') + 24);
    const ay = node.y + FONT_SIZE * 0.6;
    const by = ay + TRIANGLE_H;
    return (
      <g key={node.id}>
        <text x={node.x} y={node.y} ...>{node.label}</text>
        <polygon points={`${node.x},${ay} ${node.x - bw/2},${by} ${node.x + bw/2},${by}`}
          fill="none" stroke="#d1d5db" strokeWidth="1" />
        <text x={node.x} y={by + FONT_SIZE * 1.4} ...>{node.teksSegitiga}</text>
      </g>
    );
  }
  return <text key={node.id} ...>{node.label}</text>;
})}
```

### Legenda di dalam SVG

Tiga baris teks, dipisahkan garis horizontal, ditempatkan di `y = treeSvgH + LEGEND_PAD`:

```
Baris 1: S = Subjek · P = Predikat · O = Objek · Pel = Pelengkap · Ket = Keterangan · Konj = Konjungsi
Baris 2: FN = Frasa Nominal · FV = Frasa Verbal · FAdj = Frasa Adjektival · FAdv = Frasa Adverbial · FNum = Frasa Numeralia · FPrep = Frasa Preposisional
Baris 3: V = Verba · N = Nomina · Adj = Adjektiva · Adv = Adverbia · Pron = Pronomina
```

---

## 3. Halaman UI (`PohonKalimat.jsx`)

### Komponen baru: `BlokKlausaAnak`

Props: `{ klausa, onChange, onUbahKonstituen, onTambahKonstituen, onHapusKonstituen }`

Menampilkan editor mini untuk `klausaAnak`:
- Dropdown label (TIPE_KLAUSA)
- Checkbox segitiga
- Input teksSegitiga (hanya jika segitiga)
- Daftar `BarisKonstituen` (tanpa rekursi realisasi='klausa')

### Perubahan `BarisKonstituen`

Tambahkan toggle "Frasa | Klausa" untuk `realisasi`:
- Jika `realisasi='frasa'`: tampilkan selects + input (seperti sekarang)
- Jika `realisasi='klausa'`: tampilkan `BlokKlausaAnak` inline

Props baru: `onToggleRealisasi, onKlausaAnakChange, onKlausaAnakUbahKonstituen, onKlausaAnakTambahKonstituen, onKlausaAnakHapusKonstituen`

### Perubahan `BlokKlausa` (untuk majemuk)

Tambahkan di bagian header klausa:
- Dropdown label klausa (TIPE_KLAUSA pilihan)
- Tombol toggle segitiga
- Input teksSegitiga (hanya jika segitiga)

Props baru: `onUbahLabel, onToggleSegitiga, onUbahTeksSegitiga, onToggleRealisasiKonstituen, onKlausaAnakChange, ...`

### Perubahan tunggal mode

Tambahkan toggle "Tampilkan Klausa Utama" di atas daftar konstituen.

### Handler state baru (tunggal)

```js
// Helper
function updateKlausaAnak(konstituen, id, updater) {
  return konstituen.map(k => k.id !== id ? k : { ...k, klausaAnak: updater(k.klausaAnak) });
}

const toggleKlausaUtama = () => setState(prev => ({ ...prev, klausaUtama: !prev.klausaUtama }));

const toggleRealisasiKonstituen = (id) => setState(prev => ({
  ...prev,
  konstituen: prev.konstituen.map(k => {
    if (k.id !== id) return k;
    return k.realisasi === 'klausa'
      ? { ...k, realisasi: 'frasa', klausaAnak: null }
      : { ...k, realisasi: 'klausa', klausaAnak: buatKlausaAnak() };
  })
}));

const ubahKlausaAnakProp = (konstituenId, field, value) => setState(prev => ({
  ...prev,
  konstituen: updateKlausaAnak(prev.konstituen, konstituenId, ka => ({ ...ka, [field]: value }))
}));

const ubahKonstituenKlausaAnak = (konstituenId, subId, field, val) => setState(prev => ({
  ...prev,
  konstituen: updateKlausaAnak(prev.konstituen, konstituenId, ka => ({
    ...ka,
    konstituen: ka.konstituen.map(sk => sk.id === subId ? { ...sk, [field]: val } : sk)
  }))
}));

const tambahKonstituenKlausaAnak = (konstituenId) => setState(prev => ({
  ...prev,
  konstituen: updateKlausaAnak(prev.konstituen, konstituenId, ka => ({
    ...ka,
    konstituen: [...ka.konstituen, buatKonstituen()]
  }))
}));

const hapusKonstituenKlausaAnak = (konstituenId, subId) => setState(prev => ({
  ...prev,
  konstituen: updateKlausaAnak(prev.konstituen, konstituenId, ka => ({
    ...ka,
    konstituen: ka.konstituen.filter(sk => sk.id !== subId)
  }))
}));
```

### Handler state baru (majemuk)

```js
// Helper
function updateSegmenKlausa(segmen, klausaId, updater) {
  return segmen.map(s => s.id !== klausaId || s.tipe !== 'klausa' ? s : updater(s));
}

const ubahLabelKlausaMajemuk = (klausaId, label) => setState(prev => ({
  ...prev, segmen: updateSegmenKlausa(prev.segmen, klausaId, kl => ({ ...kl, label }))
}));

const toggleSegitigaKlausaMajemuk = (klausaId) => setState(prev => ({
  ...prev, segmen: updateSegmenKlausa(prev.segmen, klausaId, kl => ({ ...kl, segitiga: !kl.segitiga }))
}));

const ubahTeksSegitigaKlausaMajemuk = (klausaId, teks) => setState(prev => ({
  ...prev, segmen: updateSegmenKlausa(prev.segmen, klausaId, kl => ({ ...kl, teksSegitiga: teks }))
}));

const toggleRealisasiKonstituenMajemuk = (klausaId, konstituenId) => setState(prev => ({
  ...prev,
  segmen: updateSegmenKlausa(prev.segmen, klausaId, kl => ({
    ...kl,
    konstituen: kl.konstituen.map(k => {
      if (k.id !== konstituenId) return k;
      return k.realisasi === 'klausa'
        ? { ...k, realisasi: 'frasa', klausaAnak: null }
        : { ...k, realisasi: 'klausa', klausaAnak: buatKlausaAnak() };
    })
  }))
}));

// + handler untuk ubahKlausaAnakProp, ubahKonstituenKlausaAnak, tambah/hapusKonstituenKlausaAnak
// dalam konteks majemuk (path: segmen[klausaId].konstituen[konstituenId].klausaAnak)
```

---

## 4. CSS (`alat.css`)

Kelas baru yang dibutuhkan:

```css
/* Toggle realisasi frasa/klausa */
.pohon-realisasi-toggle { /* inline-flex, rounded-full, border */ }
.pohon-realisasi-btn { /* cursor-pointer, px-3, py-1, text-xs */ }
.pohon-realisasi-btn-active { /* bg-blue-700, text-white */ }

/* Blok klausa anak (inline dalam konstituen) */
.pohon-klausa-anak-blok { /* rounded-xl, border amber/orange, bg amber-50 */ }

/* Baris meta klausa (label + segitiga toggle) */
.pohon-klausa-meta { /* flex, items-center, gap-2, mb-2 */ }

/* Toggle segitiga */
.pohon-segitiga-toggle { /* inline-flex, items-center, gap-1, text-xs */ }
```

---

## Catatan Penting

- **Singkatan di diagram**: Di `konstituenKeNode` dan `klausaKeNode`, gunakan `kode` langsung (bukan `label`) untuk label node pohon. Ini membuat diagram lebih sempit.
- **Legenda**: Di dalam SVG (bukan HTML), sehingga ikut terbawa saat export.
- **Rekursi**: `realisasi='klausa'` hanya didukung 1 level dalam (klausaAnak tidak bisa punya klausaAnak lagi di UI). Untuk nesting lebih dalam, gunakan klausaTersisip.
- **Majemuk root label**: Diubah dari `'K'` menjadi `'Kalimat'` agar konsisten dengan gambar referensi.
- **Test**: Test yang ada tidak perlu diubah (tidak ada perubahan breaking pada nama button/aria-label yang diuji).
