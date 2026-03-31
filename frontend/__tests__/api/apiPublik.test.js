/**
 * @fileoverview Test API publik frontend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/api/klien', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import klien from '../../src/api/klien';
import {
  ambilKategoriKamus,
  ambilEntriPerKategori,
  cariKamus,
  ambilDetailKamus,
  ambilEntriAcakKamus,
  ambilKomentarKamus,
  simpanKomentarKamus,
  cariTesaurus,
  ambilContohTesaurus,
  ambilContohMakna,
  cariMakna,
  cariRima,
  ambilContohRima,
  ambilPencarianPopuler,
  ambilKataHariIni,
  ambilRondeKuisKata,
  ambilStatusKuisKata,
  submitRekapKuisKata,
  ambilKlasemenKuisKata,
  ambilPuzzleSusunKata,
  ambilHarianSusunKata,
  ambilBebasSusunKata,
  submitSkorSusunKata,
  simpanProgresSusunKata,
  submitSkorSusunKataBebas,
  ambilKlasemenSusunKata,
  ambilKlasemenSusunKataBebas,
  validasiKataSusunKata,
  autocomplete,
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDetailGlosarium,
  ambilDaftarSumber,
  ambilSemuaTagar,
  cariEntriPerTagar,
} from '../../src/api/apiPublik';

describe('apiPublik', () => {
  beforeEach(() => {
    klien.get.mockReset();
    klien.post.mockReset();
  });

  it('cariKamus mengirim params query + limit', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariKamus('kata', { limit: 10 });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/cari/kata', { params: { limit: 10 } });
  });

  it('ambilKategoriKamus dan ambilEntriPerKategori memanggil endpoint kategori', async () => {
    klien.get.mockResolvedValue({ data: { abjad: [] } });
    await ambilKategoriKamus();
    await ambilEntriPerKategori('kelas kata', 'n-1', { limit: 9 });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/kamus/kategori');
    expect(klien.get).toHaveBeenNthCalledWith(
      2,
      '/api/publik/kamus/kategori/kelas%20kata/n-1',
      { params: { limit: 9 } }
    );
  });

  it('ambilEntriPerKategori mendukung cursor, direction, dan lastPage', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await ambilEntriPerKategori('ragam', 'cak', {
      limit: 15,
      cursor: 'abc123',
      direction: 'prev',
      lastPage: true,
    });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/kategori/ragam/cak', {
      params: { limit: 15, cursor: 'abc123', direction: 'prev', lastPage: 1 },
    });
  });

  it('ambilDetailKamus melakukan encode slug', async () => {
    klien.get.mockResolvedValue({ data: { frasa: 'anak' } });
    await ambilDetailKamus('anak ibu');
    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/detail/anak%20ibu', {
      params: {},
    });
  });

  it('ambilEntriAcakKamus memanggil endpoint entri acak', async () => {
    klien.get.mockResolvedValue({ data: { url: '/kamus/detail/acak' } });

    await ambilEntriAcakKamus();

    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/acak');
  });

  it('ambilDetailKamus mendukung paging glosarium pada endpoint detail', async () => {
    klien.get.mockResolvedValue({ data: { indeks: 'anak ibu' } });

    await ambilDetailKamus('anak ibu', {
      glosariumLimit: 20,
      glosariumCursor: 'abc123',
      glosariumDirection: 'prev',
      sumberPelacakan: 'susun-kata',
    });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/detail/anak%20ibu', {
      params: {
        limit: 20,
        cursor: 'abc123',
        direction: 'prev',
        sumber: 'susun-kata',
      },
    });
  });

  it('ambilDetailKamus menormalkan paging glosarium saat nilai tidak valid', async () => {
    klien.get.mockResolvedValue({ data: { indeks: 'anak ibu' } });

    await ambilDetailKamus('anak ibu', {
      glosariumLimit: '0',
      glosariumCursor: '',
      glosariumDirection: 'next',
    });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/detail/anak%20ibu', {
      params: {
        limit: 20,
      },
    });
  });

  it('ambilDetailKamus melempar error terformat saat 404', async () => {
    klien.get.mockRejectedValue({
      response: {
        status: 404,
        data: { saran: ['kata', 'kita'] },
      },
    });

    await expect(ambilDetailKamus('tidak ada')).rejects.toMatchObject({
      message: 'Entri tidak ditemukan',
      saran: ['kata', 'kita'],
    });
  });

  it('ambilDetailKamus memberi saran kosong saat 404 tanpa payload saran', async () => {
    klien.get.mockRejectedValue({
      response: {
        status: 404,
        data: {},
      },
    });

    await expect(ambilDetailKamus('tidak ada')).rejects.toMatchObject({
      message: 'Entri tidak ditemukan',
      saran: [],
    });
  });

  it('ambilDetailKamus meneruskan error non-404 apa adanya', async () => {
    const err = new Error('Jaringan bermasalah');
    err.response = { status: 500 };
    klien.get.mockRejectedValue(err);

    await expect(ambilDetailKamus('kata')).rejects.toBe(err);
  });

  it('cariGlosarium memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [], total: 0 } });
    await cariGlosarium('istilah');
    expect(klien.get).toHaveBeenCalledWith('/api/publik/glosarium/cari/istilah', {
      params: { limit: 100 },
    });
  });

  it('cariTesaurus memanggil endpoint sesuai kata', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariTesaurus('anak ibu', { limit: 50, cursor: 'cur-1', direction: 'prev', lastPage: true });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/tesaurus/cari/anak%20ibu', {
      params: { limit: 50, cursor: 'cur-1', direction: 'prev', lastPage: 1 },
    });
  });

  it('ambilContohMakna dan cariMakna memanggil endpoint makna', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await ambilContohMakna();
    await cariMakna('air', { limit: 30, cursor: 'm-1', direction: 'prev', lastPage: true });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/makna/contoh');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/makna/cari/air', {
      params: { limit: 30, cursor: 'm-1', direction: 'prev', lastPage: 1 },
    });
  });

  it('ambilContohTesaurus dan ambilContohRima memanggil endpoint contoh', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await ambilContohTesaurus();
    await ambilContohRima();

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/tesaurus/contoh');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/rima/contoh');
  });

  it('ambilPencarianPopuler memanggil endpoint populer dengan tanggal aman', async () => {
    klien.get.mockResolvedValue({ data: { data: {} } });

    await ambilPencarianPopuler({ tanggal: '2026-03-02' });
    await ambilPencarianPopuler({ tanggal: 'invalid' });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/pencarian/populer', {
      params: { tanggal: '2026-03-02' },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/pencarian/populer', {
      params: { tanggal: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
    });
  });

  it('ambilPencarianPopuler mempertahankan tanggal valid apa adanya', async () => {
    klien.get.mockResolvedValue({ data: { data: {} } });

    await ambilPencarianPopuler({ tanggal: '2026-03-21' });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/pencarian/populer', {
      params: { tanggal: '2026-03-21' },
    });
  });

  it('ambilPencarianPopuler tanpa parameter memakai fallback tanggal lokal', async () => {
    klien.get.mockResolvedValue({ data: { data: {} } });

    await ambilPencarianPopuler();

    expect(klien.get).toHaveBeenCalledWith('/api/publik/pencarian/populer', {
      params: { tanggal: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
    });
  });

  it('ambilKataHariIni mengirim tanggal hanya saat valid', async () => {
    klien.get.mockResolvedValue({ data: { indeks: 'aktif' } });

    await ambilKataHariIni({ tanggal: '2026-03-31' });
    await ambilKataHariIni({ tanggal: 'invalid' });
    await ambilKataHariIni();

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/kamus/kata-hari-ini', {
      params: { tanggal: '2026-03-31' },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/kamus/kata-hari-ini', {
      params: {},
    });
    expect(klien.get).toHaveBeenNthCalledWith(3, '/api/publik/kamus/kata-hari-ini', {
      params: {},
    });
  });

  it('ambilRondeKuisKata mengirim riwayat hanya saat tersedia', async () => {
    klien.get.mockResolvedValue({ data: { ronde: [] } });

    await ambilRondeKuisKata();
    await ambilRondeKuisKata({ riwayat: [{ mode: 'kamus', kunciSoal: 'kata' }] });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/gim/kuis-kata/ronde', {
      params: {},
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/gim/kuis-kata/ronde', {
      params: { riwayat: JSON.stringify([{ mode: 'kamus', kunciSoal: 'kata' }]) },
    });
  });

  it('ambilStatusKuisKata memanggil endpoint status harian', async () => {
    klien.get.mockResolvedValue({ data: { success: true, data: null } });

    await ambilStatusKuisKata();

    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/status');
  });

  it('submitRekapKuisKata dan ambilKlasemenKuisKata menormalkan payload kuis kata', async () => {
    klien.post.mockResolvedValue({ data: { ok: true } });
    klien.get.mockResolvedValue({ data: { data: [] } });

    await submitRekapKuisKata({
      jumlahBenar: 999,
      jumlahPertanyaan: -2,
      durasiDetik: '999999',
    });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/submit', {
      jumlahBenar: 100,
      jumlahPertanyaan: 0,
      durasiDetik: 86400,
    });

    await submitRekapKuisKata();
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/submit', {
      jumlahBenar: 0,
      jumlahPertanyaan: 5,
      durasiDetik: 0,
    });

    await submitRekapKuisKata({
      jumlahBenar: 'abc',
      jumlahPertanyaan: 'bukan-angka',
      durasiDetik: -4,
    });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/submit', {
      jumlahBenar: 0,
      jumlahPertanyaan: 0,
      durasiDetik: 0,
    });

    await ambilKlasemenKuisKata({ limit: 70 });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/klasemen', {
      params: { limit: 50 },
    });

    await ambilKlasemenKuisKata({ limit: 0 });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/klasemen', {
      params: { limit: 10 },
    });

    await ambilKlasemenKuisKata({ limit: '4' });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/kuis-kata/klasemen', {
      params: { limit: 4 },
    });
  });

  it('cariRima mengirim semua cursor dan direction ketika diperlukan', async () => {
    klien.get.mockResolvedValue({ data: { rima_akhir: {}, rima_awal: {} } });

    await cariRima('kata', {
      limit: 77,
      cursorAkhir: 'akhir-1',
      directionAkhir: 'prev',
      cursorAwal: 'awal-1',
      directionAwal: 'prev',
    });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/rima/cari/kata', {
      params: {
        limit: 77,
        cursor_akhir: 'akhir-1',
        dir_akhir: 'prev',
        cursor_awal: 'awal-1',
        dir_awal: 'prev',
      },
    });
  });

  it('cariRima default tidak mengirim direction/cursor saat next tanpa cursor', async () => {
    klien.get.mockResolvedValue({ data: { rima_akhir: {}, rima_awal: {} } });

    await cariRima('kata');

    expect(klien.get).toHaveBeenCalledWith('/api/publik/rima/cari/kata', {
      params: { limit: 50 },
    });
  });

  it('ambilPuzzleSusunKata memanggil endpoint harian dengan panjang aman', async () => {
    klien.get.mockResolvedValue({ data: { panjang: 5, target: 'kata', kamus: [] } });

    await ambilPuzzleSusunKata({ panjang: 20 });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/harian', {
      params: { panjang: 8 },
    });
  });

  it('ambilHarianSusunKata, submitSkorSusunKata, dan ambilKlasemenSusunKata menormalkan payload', async () => {
    klien.get.mockResolvedValue({ data: { success: true } });
    klien.post.mockResolvedValue({ data: { success: true } });

    await ambilHarianSusunKata({ panjang: 'abc' });
    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/gim/susun-kata/harian', {
      params: { panjang: 5 },
    });

    await submitSkorSusunKata({
      panjang: 20,
      percobaan: 0,
      detik: 999999,
      menang: 1,
      tebakan: '  KARTU  ',
    });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/susun-kata/harian/submit', {
      panjang: 8,
      percobaan: 6,
      detik: 86400,
      menang: true,
      tebakan: 'kartu',
    });

    await ambilKlasemenSusunKata({ panjang: 3, limit: 999 });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/gim/susun-kata/harian/klasemen', {
      params: { panjang: 4, limit: 50 },
    });

    await submitSkorSusunKata({ panjang: -2, percobaan: -3, detik: -9, menang: 0, tebakan: '  ' });
    expect(klien.post).toHaveBeenNthCalledWith(2, '/api/publik/gim/susun-kata/harian/submit', {
      panjang: 4,
      percobaan: 1,
      detik: 0,
      menang: false,
      tebakan: '',
    });

    await ambilKlasemenSusunKata({ panjang: -99, limit: -1 });
    expect(klien.get).toHaveBeenNthCalledWith(3, '/api/publik/gim/susun-kata/harian/klasemen', {
      params: { panjang: 4, limit: 1 },
    });
  });

  it('validasiKataSusunKata memanggil endpoint validasi dengan kata ter-normalisasi', async () => {
    klien.get.mockResolvedValue({ data: { kata: 'kartu', panjang: 5, valid: true } });

    await validasiKataSusunKata(' KARTU ', { panjang: 9 });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/validasi/kartu', {
      params: { panjang: 8 },
    });
  });

  it('normalisasi susun kata memakai fallback default untuk input non-numerik/kosong', async () => {
    klien.get.mockResolvedValue({ data: { success: true } });
    klien.post.mockResolvedValue({ data: { success: true } });

    await ambilPuzzleSusunKata({ panjang: 'abc' });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/harian', {
      params: { panjang: 5 },
    });

    await submitSkorSusunKata({ panjang: 'abc', percobaan: 'xyz', detik: 'def', menang: '', tebakan: null });
    expect(klien.post).toHaveBeenLastCalledWith('/api/publik/gim/susun-kata/harian/submit', {
      panjang: 5,
      percobaan: 6,
      detik: 0,
      menang: false,
      tebakan: '',
    });

    await ambilKlasemenSusunKata({ panjang: 'abc', limit: 'zzz' });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/harian/klasemen', {
      params: { panjang: 5, limit: 10 },
    });

    await validasiKataSusunKata('', { panjang: 'abc' });
    expect(klien.get).toHaveBeenLastCalledWith('/api/publik/gim/susun-kata/validasi/', {
      params: { panjang: 5 },
    });
  });

  it('ambilKomentarKamus dan simpanKomentarKamus memanggil endpoint komentar', async () => {
    klien.get.mockResolvedValue({ data: { success: true } });
    klien.post.mockResolvedValue({ data: { success: true } });

    await ambilKomentarKamus('kata dasar');
    await simpanKomentarKamus('kata dasar', 'komentar uji');

    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/komentar/kata%20dasar');
    expect(klien.post).toHaveBeenCalledWith('/api/publik/kamus/komentar/kata%20dasar', {
      komentar: 'komentar uji',
    });
  });

  it('cariTesaurus memakai nilai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await cariTesaurus('aktif');

    expect(klien.get).toHaveBeenCalledWith('/api/publik/tesaurus/cari/aktif', {
      params: { limit: 100 },
    });
  });

  it('autocomplete mengembalikan array kosong untuk kata kosong', async () => {
    const hasil = await autocomplete('kamus', '   ');
    expect(hasil).toEqual([]);
    expect(klien.get).not.toHaveBeenCalled();
  });

  it('autocomplete memanggil endpoint untuk 1 karakter', async () => {
    klien.get.mockResolvedValue({ data: { data: ['a'] } });

    const hasil = await autocomplete('kamus', 'a');

    expect(klien.get).toHaveBeenCalledWith(
      '/api/publik/kamus/autocomplete/a',
      expect.objectContaining({ params: expect.objectContaining({ _ac: expect.any(Number) }) })
    );
    expect(hasil).toEqual([{ value: 'a' }]);
  });

  it('autocomplete menormalkan item string dan object', async () => {
    klien.get.mockResolvedValue({
      data: {
        data: ['anak', { value: 'aneka', asing: 'varied' }],
      },
    });

    const hasil = await autocomplete('kamus', 'an');

    expect(klien.get).toHaveBeenCalledWith(
      '/api/publik/kamus/autocomplete/an',
      expect.objectContaining({ params: expect.objectContaining({ _ac: expect.any(Number) }) })
    );
    expect(hasil).toEqual([{ value: 'anak' }, { value: 'aneka', asing: 'varied' }]);
  });

  it('autocomplete memfilter item kosong, falsy, object tanpa value, dan object tanpa asing', async () => {
    klien.get.mockResolvedValue({
      data: {
        data: [
          '  ',             // string yang trim jadi kosong → null
          null,             // falsy → null
          42,               // non-object non-string → null
          { foo: 'bar' },   // object tanpa value field yg valid → null
          { value: 'kata' },// object dengan value tapi tanpa asing
        ],
      },
    });

    const hasil = await autocomplete('kamus', 'x');

    expect(hasil).toEqual([{ value: 'kata' }]);
  });

  it('autocomplete mendukung fallback field value entri/lema/indeks/indonesia/term dan foreign/original', async () => {
    klien.get.mockResolvedValue({
      data: {
        data: [
          { entri: 'entri-1', foreign: 'foreign-1' },
          { lema: 'lema-2', original: 'original-2' },
          { indeks: 'indeks-3' },
          { indonesia: 'indonesia-4' },
          { term: 'term-5' },
        ],
      },
    });

    const hasil = await autocomplete('kamus', 'x');

    expect(hasil).toEqual([
      { value: 'entri-1', asing: 'foreign-1' },
      { value: 'lema-2', asing: 'original-2' },
      { value: 'indeks-3' },
      { value: 'indonesia-4' },
      { value: 'term-5' },
    ]);
  });

  it('autocomplete dengan kata null/undefined memakai fallback string kosong', async () => {
    const hasil1 = await autocomplete('kamus', null);
    const hasil2 = await autocomplete('kamus', undefined);
    expect(hasil1).toEqual([]);
    expect(hasil2).toEqual([]);
    expect(klien.get).not.toHaveBeenCalled();
  });

  it('mode susun kata bebas dan progres menormalkan payload', async () => {
    klien.get.mockResolvedValue({ data: { success: true } });
    klien.post.mockResolvedValue({ data: { success: true } });

    await ambilBebasSusunKata({ panjang: 9 });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/bebas', {
      params: { panjang: 6 },
    });

    await ambilBebasSusunKata({ panjang: null });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/bebas', {
      params: {},
    });

    await simpanProgresSusunKata({ panjang: 12, tebakan: '  KATA  ' });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/susun-kata/harian/progres', {
      panjang: 8,
      tebakan: 'kata',
    });

    await simpanProgresSusunKata({ panjang: '', tebakan: null });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/susun-kata/harian/progres', {
      panjang: 5,
      tebakan: '',
    });

    await submitSkorSusunKataBebas({
      tanggal: '2026-03-04',
      panjang: 2,
      kata: '  LEMA  ',
      percobaan: 0,
      detik: 999999,
      menang: 1,
      tebakan: '  UJI  ',
    });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/susun-kata/bebas/submit', {
      tanggal: '2026-03-04',
      panjang: 4,
      kata: 'lema',
      percobaan: 6,
      detik: 86400,
      menang: true,
      tebakan: 'uji',
    });

    await submitSkorSusunKataBebas({
      tanggal: null,
      panjang: '',
      kata: null,
      percobaan: '',
      detik: '',
      menang: 0,
      tebakan: null,
    });
    expect(klien.post).toHaveBeenCalledWith('/api/publik/gim/susun-kata/bebas/submit', {
      tanggal: null,
      panjang: 5,
      kata: '',
      percobaan: 6,
      detik: 0,
      menang: false,
      tebakan: '',
    });

    await ambilKlasemenSusunKataBebas({ limit: 1000 });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/bebas/klasemen', {
      params: { limit: 50 },
    });

    await ambilKlasemenSusunKataBebas({ limit: '' });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/gim/susun-kata/bebas/klasemen', {
      params: { limit: 10 },
    });
  });

  it('endpoint tagar publik memanggil URL dan cursor params dengan benar', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await ambilSemuaTagar();
    expect(klien.get).toHaveBeenCalledWith('/api/publik/tagar');

    await cariEntriPerTagar('prefiks me', {
      limit: 17,
      cursor: 'tg-1',
      direction: 'prev',
      lastPage: true,
    });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/tagar/prefiks%20me', {
      params: {
        limit: 17,
        cursor: 'tg-1',
        direction: 'prev',
        lastPage: 1,
      },
    });
  });

  it('autocomplete menangani response tanpa data array (fallback [])', async () => {
    klien.get.mockResolvedValue({ data: { data: 'bukan-array' } });

    const hasil = await autocomplete('kamus', 'tes');

    expect(hasil).toEqual([]);
  });

  it('ambilGlosariumPerBidang dan ambilGlosariumPerSumber memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await ambilGlosariumPerBidang('biologi');
    await ambilGlosariumPerSumber('kbbi');

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/glosarium/bidang/biologi', {
      params: { limit: 100 },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/glosarium/sumber/kbbi', {
      params: { limit: 100 },
    });
  });

  it('ambilDetailGlosarium mengirim semua parameter detail jika tersedia', async () => {
    klien.get.mockResolvedValue({ data: { persis: [] } });

    await ambilDetailGlosarium('zero sum', {
      limit: 10,
      mengandungCursor: 'meng-1',
      miripCursor: 'mir-1',
    });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/glosarium/detail/zero%20sum', {
      params: {
        limit: 10,
        mengandungCursor: 'meng-1',
        miripCursor: 'mir-1',
      },
    });
  });

  it('ambilDetailGlosarium mengirim params kosong saat opsi tidak valid/kosong', async () => {
    klien.get.mockResolvedValue({ data: { persis: [] } });

    await ambilDetailGlosarium('zero sum', {
      limit: 0,
      mengandungCursor: '',
      miripCursor: null,
    });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/glosarium/detail/zero%20sum', {
      params: {},
    });
  });

  it('cariKamus/cariGlosarium mengirim direction hanya saat bukan next dan cursor tersedia', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await cariKamus('uji', { limit: 5, direction: 'next', cursor: null, lastPage: false });
    await cariGlosarium('uji', { limit: 7, cursor: 'cur-2', direction: 'prev' });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/kamus/cari/uji', {
      params: { limit: 5 },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/glosarium/cari/uji', {
      params: { limit: 7, cursor: 'cur-2', direction: 'prev' },
    });
  });

  it('ambilDaftarBidang dan ambilDaftarSumber memanggil endpoint daftar', async () => {
    klien.get.mockResolvedValue({ data: [] });
    await ambilDaftarBidang();
    await ambilDaftarSumber();
    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/glosarium/bidang');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/glosarium/sumber');
  });

});
