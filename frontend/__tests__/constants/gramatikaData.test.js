import { describe, expect, it } from 'vitest';
import {
  __private,
  daftarIsiGramatika,
  daftarItemGramatika,
  daftarAnchorHalamanGramatika,
  petaItemGramatikaBySlug,
  petaAnchorHalamanGramatikaByNomorBagianBuku,
  daftarAutocompleteGramatika,
  petaAutocompleteGramatika,
  formatJudulGramatikaDariSlug,
  ambilAnchorHalamanGramatika,
  cariItemGramatikaDariNomorBagianBuku,
  cariItemGramatikaTerdekatDariHalamanBuku,
} from '../../src/constants/gramatikaData';

describe('constants/gramatikaData', () => {
  it('membentuk daftar item, peta slug, dan autocomplete secara konsisten', () => {
    expect(Array.isArray(daftarIsiGramatika)).toBe(true);
    expect(Array.isArray(daftarItemGramatika)).toBe(true);
    expect(Array.isArray(daftarAutocompleteGramatika)).toBe(true);

    const itemPertama = daftarItemGramatika[0];
    expect(itemPertama).toBeDefined();
    expect(petaItemGramatikaBySlug[itemPertama.slug]).toEqual(itemPertama);

    const autoPertama = daftarAutocompleteGramatika[0];
    expect(autoPertama).toBeDefined();
    expect(petaAutocompleteGramatika[autoPertama.slug]).toBe(autoPertama.value);
  });

  it('formatJudulGramatikaDariSlug menangani slug normal, kosong, dan separator ganda', () => {
    expect(formatJudulGramatikaDariSlug('frasa-nominal')).toBe('Frasa Nominal');
    expect(formatJudulGramatikaDariSlug('')).toBe('');
    expect(formatJudulGramatikaDariSlug('--')).toBe('');
  });

  it('menambahkan anchor halaman buku/PDF ke slug gramatika yang sudah dipetakan', () => {
    expect(Array.isArray(daftarAnchorHalamanGramatika)).toBe(true);
    expect(ambilAnchorHalamanGramatika('daftar-isi')).toMatchObject({
      nomorBabBuku: null,
      nomorBagianBuku: null,
      halamanBuku: null,
      halamanBukuLabel: 'xiv',
      halamanPdf: 15,
    });
    expect(petaItemGramatikaBySlug.kalimat).toMatchObject({
      nomorBabBuku: 9,
      nomorBagianBuku: '9',
      halamanBuku: 407,
      halamanPdf: 430,
    });
    expect(petaItemGramatikaBySlug['konstruksi-tata-bahasa-dan-fungsinya']).toMatchObject({
      nomorBabBuku: 2,
      nomorBagianBuku: '2.2.3.3',
      halamanBuku: 33,
      halamanPdf: 57,
    });

    expect(__private.buatAnchorHalamanGramatika('slug-uji', 1, '1.1', null)).toEqual({
      slug: 'slug-uji',
      nomorBabBuku: 1,
      nomorBagianBuku: '1.1',
      halamanBuku: null,
      halamanBukuLabel: null,
      halamanPdf: null,
      halamanPdfLabel: null,
    });
  });

  it('memetakan Bab VII buku ke tiga subfolder publik dan menempatkan 7.4 di nomina', () => {
    expect(petaItemGramatikaBySlug.nomina).toMatchObject({
      babSlug: 'nomina',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.1',
    });
    expect(petaItemGramatikaBySlug.pronomina).toMatchObject({
      babSlug: 'pronomina',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.2',
    });
    expect(petaItemGramatikaBySlug.numeralia).toMatchObject({
      babSlug: 'numeralia',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.3',
    });
    expect(petaItemGramatikaBySlug['konsep-tunggal-jamak-dan-generik']).toMatchObject({
      babSlug: 'nomina',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.4',
      halamanBuku: 366,
      halamanPdf: 389,
    });
  });

  it('menambahkan anchor halaman untuk subbab-subbab utama di Bab VII', () => {
    expect(petaItemGramatikaBySlug['perluasan-nomina-ke-kanan']).toMatchObject({
      babSlug: 'nomina',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.1.5.4',
      halamanBuku: 318,
      halamanPdf: 341,
    });
    expect(petaItemGramatikaBySlug['pronomina-tanya']).toMatchObject({
      babSlug: 'pronomina',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.2.2.4',
      halamanBuku: 344,
      halamanPdf: 367,
    });
    expect(petaItemGramatikaBySlug['numeralia-tingkat']).toMatchObject({
      babSlug: 'numeralia',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.3.2',
      halamanBuku: 365,
      halamanPdf: 388,
    });
    expect(petaItemGramatikaBySlug['kata-para']).toMatchObject({
      babSlug: 'nomina',
      nomorBabBuku: 7,
      nomorBagianBuku: '7.4.2',
      halamanBuku: 367,
      halamanPdf: 390,
    });
  });

  it('mencari item gramatika secara eksak dari nomor bagian buku', () => {
    expect(petaAnchorHalamanGramatikaByNomorBagianBuku['7.2.2.4']).toMatchObject({
      slug: 'pronomina-tanya',
      halamanBuku: 344,
      halamanPdf: 367,
    });
    expect(cariItemGramatikaDariNomorBagianBuku('7.2.2.4')?.slug).toBe('pronomina-tanya');
    expect(cariItemGramatikaDariNomorBagianBuku(' 7.4.2 ')?.slug).toBe('kata-para');
    expect(cariItemGramatikaDariNomorBagianBuku('7.3.3')?.slug).toBe('frasa-numeral');
    expect(cariItemGramatikaDariNomorBagianBuku('2.2.3.3')?.slug).toBe('konstruksi-tata-bahasa-dan-fungsinya');
    expect(cariItemGramatikaDariNomorBagianBuku('10.2.3.12')?.slug).toBe('hubungan-atributif');
    expect(cariItemGramatikaDariNomorBagianBuku('7.9')).toBeNull();
    expect(cariItemGramatikaDariNomorBagianBuku('')).toBeNull();

    expect(ambilAnchorHalamanGramatika()).toBeNull();
    expect(ambilAnchorHalamanGramatika(' slug-tidak-ada ')).toBeNull();

    const itemAsli = petaItemGramatikaBySlug['kata-para'];
    delete petaItemGramatikaBySlug['kata-para'];
    expect(cariItemGramatikaDariNomorBagianBuku('7.4.2')).toBeNull();
    petaItemGramatikaBySlug['kata-para'] = itemAsli;
  });

  it('mencari item gramatika terdekat dari nomor halaman buku', () => {
    expect(cariItemGramatikaTerdekatDariHalamanBuku(410)?.slug).toBe('kalimat-klausa-dan-frasa');
    expect(cariItemGramatikaTerdekatDariHalamanBuku(370)?.slug).toBe('kata-umat');
    expect(cariItemGramatikaTerdekatDariHalamanBuku(366)?.slug).toBe('frasa-numeral');
    expect(cariItemGramatikaTerdekatDariHalamanBuku(10)?.slug).toBe('pembakuan-bahasa');
    expect(cariItemGramatikaTerdekatDariHalamanBuku('abc')).toBeNull();
    expect(cariItemGramatikaTerdekatDariHalamanBuku(0)).toBeNull();

    const itemTerdekatAsli = petaItemGramatikaBySlug['pembakuan-bahasa'];
    delete petaItemGramatikaBySlug['pembakuan-bahasa'];
    expect(cariItemGramatikaTerdekatDariHalamanBuku(10)).toBeNull();
    petaItemGramatikaBySlug['pembakuan-bahasa'] = itemTerdekatAsli;
  });
});