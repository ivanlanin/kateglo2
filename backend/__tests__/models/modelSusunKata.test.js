/**
 * @fileoverview Test model Susun Kata
 * @tested_in backend/models/modelSusunKata.js
 */

jest.mock('../../models/modelEntri', () => ({
  ambilKamusSusunKata: jest.fn(),
  cekKataSusunKataValid: jest.fn(),
  ambilArtiSusunKataByIndeks: jest.fn(),
}));

const db = require('../../db');
const ModelEntri = require('../../models/modelEntri');
const ModelSusunKata = require('../../models/modelSusunKata');
const { __private } = ModelSusunKata;

describe('ModelSusunKata', () => {
  beforeEach(() => {
    db.query.mockReset();
    ModelEntri.ambilKamusSusunKata.mockReset();
    ModelEntri.cekKataSusunKataValid.mockReset();
    ModelEntri.ambilArtiSusunKataByIndeks.mockReset();
  });

  it('helper parsePanjang, parsePenggunaId, dan hitungSkor mencakup semua cabang', () => {
    expect(ModelSusunKata.parsePanjang('abc')).toBe(5);
    expect(ModelSusunKata.parsePanjang('2')).toBe(4);
    expect(ModelSusunKata.parsePanjang('9')).toBe(8);
    expect(ModelSusunKata.parsePanjang('7')).toBe(7);

    expect(ModelSusunKata.parsePenggunaId('abc')).toBeNull();
    expect(ModelSusunKata.parsePenggunaId('0')).toBeNull();
    expect(ModelSusunKata.parsePenggunaId('7')).toBe(7);

    expect(ModelSusunKata.hitungSkor({ percobaan: 2, menang: true })).toBe(9);
    expect(ModelSusunKata.hitungSkor({ percobaan: 99, menang: true })).toBe(5);
    expect(ModelSusunKata.hitungSkor({ percobaan: 0, menang: true })).toBe(5);
    expect(ModelSusunKata.hitungSkor({ percobaan: 3, menang: false })).toBe(0);
  });

  it('helper private internal mencakup cabang parse/hash/gcd/index', () => {
    expect(__private.parseTanggal(undefined)).toBeNull();
    expect(__private.parseTanggal('2026-03-02')).toBe('2026-03-02');

    expect(__private.parsePanjang(undefined, 6)).toBe(6);
    expect(__private.parsePanjang(undefined)).toBe(5);
    expect(__private.parsePanjang('9', 6)).toBe(8);
    expect(__private.parsePanjang('3', 6)).toBe(4);
    expect(ModelSusunKata.parsePanjangBebas('9')).toBe(6);
    expect(ModelSusunKata.parsePanjangBebas('3')).toBe(4);
    expect(ModelSusunKata.parsePanjangBebas('abc')).toBe(5);
    expect(ModelSusunKata.parsePanjangBebas('abc', 'x')).toBe(5);
    expect(ModelSusunKata.parsePanjangBebas('abc', 6)).toBe(6);

    expect(__private.parsePenggunaId(undefined)).toBeNull();
    expect(__private.parsePenggunaId('-1')).toBeNull();
    expect(__private.parsePenggunaId('1')).toBe(1);

    expect(__private.hitungOffsetHari('invalid')).toBe(0);
    expect(__private.hitungOffsetHari('2026-01-02')).toBe(1);

    expect(__private.gcd(0, 0)).toBe(0);
    expect(__private.gcd(10, 4)).toBe(2);
    expect(typeof __private.hash32(undefined)).toBe('number');
    expect(typeof __private.hash32('abc')).toBe('number');

    expect(__private.parseDaftarTebakan('a;abcde;ABCDE;ab1de', { panjang: 5, maksimum: 6 })).toEqual(['abcde', 'abcde']);
    expect(__private.parseDaftarTebakan('abcde;fghij;klmno;pqrst;uvwxy;zzzzz;aaaaa', { panjang: 5, maksimum: 6 })).toHaveLength(6);
    expect(__private.parseDaftarTebakan('abcde;fghij', { panjang: 5, maksimum: 0 })).toEqual([]);
    expect(__private.parseDaftarTebakan('abcde;fghij')).toEqual(['abcde', 'fghij']);
    expect(__private.parsePanjangHarian()).toBe(5);
    expect(__private.acakDariArray([])).toBeNull();
    expect(__private.acakDariArray(null)).toBeNull();
    expect(__private.tambahHari('invalid', 2)).toBeNull();
    expect(__private.tambahHari('2026-03-02', 2)).toBe('2026-03-04');

    expect(__private.pilihIndexKata({ panjang: 5, offsetHari: 0, totalKamus: 1 })).toBe(0);
    const index = __private.pilihIndexKata({ panjang: 4, offsetHari: -3, totalKamus: 4 });
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(4);
  });

  it('ambilProgresPenggunaHarian validasi id dan mengembalikan baris', async () => {
    await expect(ModelSusunKata.ambilProgresPenggunaHarian({ susunKataId: 'x', penggunaId: 1 })).resolves.toBeNull();
    await expect(ModelSusunKata.ambilProgresPenggunaHarian({ susunKataId: 1, penggunaId: 0 })).resolves.toBeNull();

    db.query.mockResolvedValueOnce({ rows: [{ id: 7, selesai: false }] });
    await expect(ModelSusunKata.ambilProgresPenggunaHarian({ susunKataId: 11, penggunaId: 9 })).resolves.toEqual({ id: 7, selesai: false });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilProgresPenggunaHarian({ susunKataId: 11, penggunaId: 9 })).resolves.toBeNull();
  });

  it('simpanProgresPenggunaHarian validasi id, sanitasi tebakan, dan null jika update gagal', async () => {
    await expect(ModelSusunKata.simpanProgresPenggunaHarian({ susunKataId: 'x', penggunaId: 9, tebakan: 'abcde' })).resolves.toBeNull();

    db.query.mockResolvedValueOnce({ rows: [{ id: 10, tebakan: 'abcde;fghij', percobaan: 2, selesai: false }] });
    await expect(ModelSusunKata.simpanProgresPenggunaHarian({
      susunKataId: 10,
      penggunaId: 9,
      tebakan: 'ab1de;abcde;fghij;ABCDE;zz',
    })).resolves.toEqual({ id: 10, tebakan: 'abcde;fghij', percobaan: 2, selesai: false });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.simpanProgresPenggunaHarian({ susunKataId: 10, penggunaId: 9, tebakan: '' })).resolves.toBeNull();
  });

  it('ambilPuzzleBebas mengembalikan null saat kamus kosong dan data saat kamus tersedia', async () => {
    ModelEntri.ambilKamusSusunKata
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    await expect(ModelSusunKata.ambilPuzzleBebas({})).resolves.toBeNull();

    ModelEntri.ambilKamusSusunKata.mockResolvedValueOnce(['kartu']);
    ModelEntri.ambilArtiSusunKataByIndeks.mockResolvedValueOnce('alat tulis');
    const result = await ModelSusunKata.ambilPuzzleBebas({ panjang: 5 });
    expect(result).toEqual({
      tanggal: null,
      panjang: 5,
      total: 1,
      target: 'kartu',
      arti: 'alat tulis',
      kamus: ['kartu'],
    });

    ModelEntri.ambilKamusSusunKata
      .mockResolvedValueOnce([''])
      .mockResolvedValueOnce(['baru']);
    ModelEntri.ambilArtiSusunKataByIndeks.mockResolvedValueOnce('arti baru');
    await expect(ModelSusunKata.ambilPuzzleBebas({})).resolves.toEqual(expect.objectContaining({ target: 'baru', arti: 'arti baru' }));
  });

  it('simpanSkorBebas menormalisasi payload dan mengembalikan null saat tanpa baris', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, tanggal: '2026-03-02', panjang: 5, kata: 'kartu', pengguna_id: 9, percobaan: 6, tebakan: 'a', detik: 86400, menang: true, created_at: 'x' }],
    });
    await expect(ModelSusunKata.simpanSkorBebas({
      tanggal: 'invalid',
      panjang: 9,
      kata: ' KARTU ',
      penggunaId: '9',
      percobaan: 99,
      tebakan: ' A ',
      detik: 999999,
      menang: '1',
    })).resolves.toEqual(expect.objectContaining({ id: 1, kata: 'kartu' }));

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.simpanSkorBebas({ panjang: 5, kata: 'kartu', penggunaId: 9 })).resolves.toBeNull();

    db.query.mockResolvedValueOnce({ rows: [{ id: 2, tanggal: '2026-03-03' }] });
    await expect(ModelSusunKata.simpanSkorBebas({ tanggal: '2026-03-03', panjang: 5, kata: 'kartu', penggunaId: 9 })).resolves.toEqual({ id: 2, tanggal: '2026-03-03' });

    db.query.mockResolvedValueOnce({ rows: [{ id: 3, kata: '' }] });
    await expect(ModelSusunKata.simpanSkorBebas({ tanggal: null, panjang: 5, kata: null, penggunaId: 9 })).resolves.toEqual({ id: 3, kata: '' });
    expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [null, 5, '', 9, 6, '', 0, false]);
  });

  it('ambilKlasemenBebas memetakan data dan default saat null', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ pengguna_id: '9', nama: 'A', tanggal: '2026-03-02', total_main: '4', rata_poin: '7.5', rata_detik: '11.2', terakhir_main: 'x' }],
    });
    const result = await ModelSusunKata.ambilKlasemenBebas({ limit: 999, tanggal: 'invalid' });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM susun_kata_bebas sb'), [50, null]);
    expect(result[0]).toEqual({
      pengguna_id: 9,
      nama: 'A',
      tanggal: '2026-03-02',
      total_main: 4,
      rata_poin: 7.5,
      rata_detik: 11.2,
      terakhir_main: 'x',
    });

    db.query.mockResolvedValueOnce({ rows: [{ pengguna_id: null, nama: null, tanggal: null, total_main: null, rata_poin: null, rata_detik: null, terakhir_main: null }] });
    const fallback = await ModelSusunKata.ambilKlasemenBebas({ limit: 'abc' });
    expect(fallback[0]).toEqual({
      pengguna_id: 0,
      nama: null,
      tanggal: null,
      total_main: 0,
      rata_poin: 0,
      rata_detik: 0,
      terakhir_main: null,
    });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilKlasemenBebas({ tanggal: '2026-03-03', limit: 5 })).resolves.toEqual([]);
    expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [5, '2026-03-03']);

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilKlasemenBebas({})).resolves.toEqual([]);
    expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [10, null]);
  });

  it('hitungPesertaHarian dan hitungPesertaBebasHarian mengembalikan total dengan fallback 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '9' }] });
    await expect(ModelSusunKata.hitungPesertaHarian({ tanggal: '2026-03-05' })).resolves.toBe(9);
    expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('FROM susun_kata sk'), ['2026-03-05']);

    db.query.mockResolvedValueOnce({ rows: [{ total: null }] });
    await expect(ModelSusunKata.hitungPesertaHarian({ tanggal: 'invalid' })).resolves.toBe(0);
    expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [null]);

    db.query.mockResolvedValueOnce({ rows: [{ total: '4' }] });
    await expect(ModelSusunKata.hitungPesertaBebasHarian({ tanggal: '2026-03-05' })).resolves.toBe(4);
    expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('FROM susun_kata_bebas sb'), ['2026-03-05']);

    db.query.mockResolvedValueOnce({ rows: [{ total: null }] });
    await expect(ModelSusunKata.hitungPesertaBebasHarian({ tanggal: 'invalid' })).resolves.toBe(0);
    expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [null]);

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.hitungPesertaHarian()).resolves.toBe(0);

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.hitungPesertaBebasHarian()).resolves.toBe(0);
  });

  it('ambilTanggalHariIniJakarta mengembalikan tanggal atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ tanggal: '2026-03-02' }] });
    await expect(ModelSusunKata.ambilTanggalHariIniJakarta()).resolves.toBe('2026-03-02');

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilTanggalHariIniJakarta()).resolves.toBeNull();
  });

  it('ambilHarian validasi tanggal dan mengembalikan baris pertama', async () => {
    await expect(ModelSusunKata.ambilHarian({ tanggal: 'invalid', panjang: 5 })).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();

    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kata: 'kartu' }] });
    await expect(ModelSusunKata.ambilHarian({ tanggal: '2026-03-02', panjang: 5 })).resolves.toEqual({ id: 1, kata: 'kartu' });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM susun_kata'), ['2026-03-02', 5]);

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilHarian({ tanggal: '2026-03-02', panjang: 5 })).resolves.toBeNull();
  });

  it('daftarHarianAdmin menyusun filter dinamis dan memetakan tipe numerik', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: '10',
        tanggal: '2026-03-02',
        panjang: '5',
        kata: 'kartun',
        keterangan: 'tes',
        created_at: '2026-03-02T00:00:00.000Z',
        updated_at: '2026-03-02T00:00:00.000Z',
        pemenang: 'Andi',
        jumlah_peserta: '7',
        total_main: '10',
        total_menang: '6',
        persen_menang: '60.00',
      }],
    });

    const result = await ModelSusunKata.daftarHarianAdmin({ tanggal: '2026-03-02', panjang: '6', limit: 7000 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE sk.tanggal = $1::date AND sk.panjang = $2'),
      ['2026-03-02', 5, 1000]
    );
    expect(result[0]).toEqual(expect.objectContaining({
      id: 10,
      panjang: 5,
      pemenang: 'Andi',
      jumlahPeserta: 7,
      totalMain: 10,
      totalMenang: 6,
      persenMenang: 60,
    }));
  });

  it('daftarHarianAdmin tanpa filter memakai limit default aman', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await ModelSusunKata.daftarHarianAdmin({ tanggal: '', panjang: '', limit: 'abc' });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE sk.panjang = $1'), [5, 200]);

    db.query.mockResolvedValueOnce({
      rows: [{
        id: null,
        tanggal: null,
        panjang: null,
        kata: null,
        keterangan: null,
        created_at: null,
        updated_at: null,
        pemenang: null,
        jumlah_peserta: null,
        total_main: null,
        total_menang: null,
        persen_menang: null,
      }],
    });
    const resultDefault = await ModelSusunKata.daftarHarianAdmin({});
    expect(resultDefault[0]).toEqual({
      id: 0,
      tanggal: null,
      panjang: 0,
      kata: null,
      keterangan: null,
      created_at: null,
      updated_at: null,
      pemenang: null,
      jumlahPeserta: 0,
      totalMain: 0,
      totalMenang: 0,
      persenMenang: 0,
    });
  });

  it('buatHarianOtomatis menangani tanggal invalid, kamus kosong, insert sukses, dan fallback konflik', async () => {
    await expect(ModelSusunKata.buatHarianOtomatis({ tanggal: 'invalid', panjang: 5 })).resolves.toBeNull();

    ModelEntri.ambilKamusSusunKata.mockResolvedValueOnce([]);
    await expect(ModelSusunKata.buatHarianOtomatis({ tanggal: '2026-03-02', panjang: 5 })).resolves.toBeNull();

    ModelEntri.ambilKamusSusunKata.mockResolvedValueOnce(['kartu', 'katun']);
    db.query.mockResolvedValueOnce({ rows: [{ id: 3, kata: 'kartu' }] });
    const inserted = await ModelSusunKata.buatHarianOtomatis({ tanggal: '2026-03-02', panjang: 5 });
    expect(inserted).toEqual({ id: 3, kata: 'kartu' });

    ModelEntri.ambilKamusSusunKata.mockResolvedValueOnce(['kartu']);
    db.query.mockResolvedValueOnce({ rows: [] });
    const spyAmbilHarian = jest.spyOn(ModelSusunKata, 'ambilHarian').mockResolvedValueOnce({ id: 4, kata: 'kartu' });
    const fallback = await ModelSusunKata.buatHarianOtomatis({ tanggal: '2026-03-03', panjang: 5 });
    expect(spyAmbilHarian).toHaveBeenCalledWith({ tanggal: '2026-03-03', panjang: 5 });
    expect(fallback).toEqual({ id: 4, kata: 'kartu' });
    spyAmbilHarian.mockRestore();

    ModelEntri.ambilKamusSusunKata.mockResolvedValueOnce([undefined]);
    db.query.mockResolvedValueOnce({ rows: [{ id: 6, kata: '' }] });
    const kataKosong = await ModelSusunKata.buatHarianOtomatis({ tanggal: '2026-03-04', panjang: 5 });
    expect(kataKosong).toEqual({ id: 6, kata: '' });
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO susun_kata'),
      ['2026-03-04', 5, '']
    );
  });

  it('buatHarianOtomatis tetap memilih indeks valid saat step awal tidak relatif prima', async () => {
    ModelEntri.ambilKamusSusunKata.mockResolvedValueOnce(['aaaa', 'bbbb', 'cccc', 'dddd']);
    db.query.mockResolvedValueOnce({ rows: [{ id: 15, kata: 'bbbb' }] });

    const result = await ModelSusunKata.buatHarianOtomatis({ tanggal: '2026-03-02', panjang: 4 });

    expect(result).toEqual({ id: 15, kata: 'bbbb' });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO susun_kata'),
      ['2026-03-02', 5, expect.any(String)]
    );
  });

  it('buatHarianRentang membuat hingga 30 hari dari tanggal acuan', async () => {
    const spy = jest.spyOn(ModelSusunKata, 'ambilAtauBuatHarian')
      .mockResolvedValue({ id: 1, kata: 'kartu' });

    const hasil = await ModelSusunKata.buatHarianRentang({ tanggalMulai: '2026-03-02', totalHari: 30 });

    expect(hasil).toHaveLength(30);
    expect(spy).toHaveBeenCalledTimes(30);
    expect(spy).toHaveBeenNthCalledWith(1, { tanggal: '2026-03-02', panjang: 5 });
    expect(spy).toHaveBeenNthCalledWith(30, { tanggal: '2026-03-31', panjang: 5 });

    spy.mockRestore();
  });

  it('buatHarianRentang tidak menambahkan item null', async () => {
    const spy = jest.spyOn(ModelSusunKata, 'ambilAtauBuatHarian')
      .mockResolvedValueOnce({ id: 1, kata: 'kartu' })
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 2, kata: 'katun' });

    const hasil = await ModelSusunKata.buatHarianRentang({ tanggalMulai: '2026-03-02', totalHari: 3 });

    expect(hasil).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });

  it('buatHarianRentang memakai totalHari default saat tidak dikirim', async () => {
    const spy = jest.spyOn(ModelSusunKata, 'ambilAtauBuatHarian').mockResolvedValue({ id: 3, kata: 'kartu' });
    const hasil = await ModelSusunKata.buatHarianRentang({ tanggalMulai: '2026-03-02' });
    expect(hasil).toHaveLength(30);
    spy.mockRestore();
  });

  it('buatHarianRentang mengembalikan kosong saat tanggal invalid dan clamp total hari minimum', async () => {
    await expect(ModelSusunKata.buatHarianRentang({ tanggalMulai: 'invalid', totalHari: 30 })).resolves.toEqual([]);

    const spy = jest.spyOn(ModelSusunKata, 'ambilAtauBuatHarian').mockResolvedValue({ id: 1, kata: 'kartu' });
    const result = await ModelSusunKata.buatHarianRentang({ tanggalMulai: '2026-03-02', totalHari: 0 });
    expect(result).toHaveLength(30);
    spy.mockRestore();
  });

  it('ambilAtauBuatHarian mengembalikan existing atau membuat baru', async () => {
    const spyAmbil = jest.spyOn(ModelSusunKata, 'ambilHarian').mockResolvedValueOnce({ id: 9, kata: 'kata' });
    const spyBuat = jest.spyOn(ModelSusunKata, 'buatHarianOtomatis').mockResolvedValueOnce({ id: 10, kata: 'baru' });

    await expect(ModelSusunKata.ambilAtauBuatHarian({ tanggal: '2026-03-02', panjang: 5 })).resolves.toEqual({ id: 9, kata: 'kata' });

    spyAmbil.mockResolvedValueOnce(null);
    await expect(ModelSusunKata.ambilAtauBuatHarian({ tanggal: '2026-03-03', panjang: 5 })).resolves.toEqual({ id: 10, kata: 'baru' });

    spyAmbil.mockRestore();
    spyBuat.mockRestore();
  });

  it('simpanHarianAdmin memvalidasi input dan menyimpan data', async () => {
    await expect(ModelSusunKata.simpanHarianAdmin({ tanggal: 'x', panjang: 5, kata: 'kartu', penggunaId: 1 })).rejects.toThrow('Tanggal tidak valid');
    await expect(ModelSusunKata.simpanHarianAdmin({ tanggal: '2026-03-02', panjang: 5, kata: undefined, penggunaId: 1 })).rejects.toThrow('Kata hanya boleh huruf a-z');
    await expect(ModelSusunKata.simpanHarianAdmin({ tanggal: '2026-03-02', panjang: 5, kata: 'kar1u', penggunaId: 1 })).rejects.toThrow('Kata hanya boleh huruf a-z');
    await expect(ModelSusunKata.simpanHarianAdmin({ tanggal: '2026-03-02', panjang: 6, kata: 'kartuu', penggunaId: 1 })).rejects.toThrow('Kata harus 5 huruf');

    ModelEntri.cekKataSusunKataValid.mockResolvedValueOnce(false);
    await expect(ModelSusunKata.simpanHarianAdmin({ tanggal: '2026-03-02', panjang: 5, kata: 'kartu', penggunaId: 1 })).rejects.toThrow('Kata tidak ditemukan pada kamus Susun Kata');

    ModelEntri.cekKataSusunKataValid.mockResolvedValueOnce(true);
    db.query.mockResolvedValueOnce({ rows: [{ id: 12, kata: 'kartu', keterangan: null }] });

    await expect(ModelSusunKata.simpanHarianAdmin({
      tanggal: '2026-03-02',
      panjang: '5',
      kata: ' KARTU ',
      penggunaId: 'abc',
      keterangan: '   ',
    })).resolves.toEqual({ id: 12, kata: 'kartu', keterangan: null });

    expect(ModelEntri.cekKataSusunKataValid).toHaveBeenCalledWith('kartu', { panjang: 5 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (tanggal, panjang)'),
      ['2026-03-02', 5, 'kartu', null]
    );

    ModelEntri.cekKataSusunKataValid.mockResolvedValueOnce(true);
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.simpanHarianAdmin({ tanggal: '2026-03-02', panjang: 5, kata: 'kartu', penggunaId: 1 })).resolves.toBeNull();
  });

  it('ambilSkorPenggunaHarian validasi id dan mengembalikan baris', async () => {
    await expect(ModelSusunKata.ambilSkorPenggunaHarian({ susunKataId: 'x', penggunaId: 1 })).resolves.toBeNull();
    await expect(ModelSusunKata.ambilSkorPenggunaHarian({ susunKataId: 1, penggunaId: 0 })).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();

    db.query.mockResolvedValueOnce({ rows: [{ id: 1, menang: true }] });
    await expect(ModelSusunKata.ambilSkorPenggunaHarian({ susunKataId: '11', penggunaId: '7' })).resolves.toEqual({ id: 1, menang: true });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilSkorPenggunaHarian({ susunKataId: '11', penggunaId: '7' })).resolves.toBeNull();
  });

  it('simpanSkorHarian melakukan normalisasi nilai', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5, menang: true }] });

    const result = await ModelSusunKata.simpanSkorHarian({
      susunKataId: '3',
      penggunaId: '7',
      percobaan: 99,
      detik: -5,
      tebakan: ' Ka; Ta ',
      menang: '1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE susun_kata_skor'),
      [3, 7, 6, 0, 'ka; ta', true]
    );
    expect(result).toEqual({ id: 5, menang: true });

    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.simpanSkorHarian({
      susunKataId: '3',
      penggunaId: '7',
      percobaan: 'abc',
      detik: 'abc',
      tebakan: null,
      menang: 0,
    })).resolves.toBeNull();
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE susun_kata_skor'),
      [3, 7, 6, 0, '', false]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO susun_kata_skor'),
      [3, 7, 6, 0, '', false]
    );

    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 8, menang: false }] });
    await ModelSusunKata.simpanSkorHarian({ susunKataId: '3', penggunaId: '7', percobaan: 2, detik: 999999, tebakan: '', menang: false });
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('UPDATE susun_kata_skor'), [3, 7, 2, 86400, '', false]);
    expect(db.query).toHaveBeenNthCalledWith(5, expect.stringContaining('INSERT INTO susun_kata_skor'), [3, 7, 2, 86400, '', false]);
  });

  it('ambilKlasemenHarian dan ambilPesertaHarian menangani id invalid dan mapping hasil', async () => {
    await expect(ModelSusunKata.ambilKlasemenHarian({ susunKataId: 'abc', limit: 9 })).resolves.toEqual([]);
    await expect(ModelSusunKata.ambilPesertaHarian({ susunKataId: 'abc', limit: 9 })).resolves.toEqual([]);

    db.query.mockResolvedValueOnce({
      rows: [{ pengguna_id: '4', nama: 'A', percobaan: '2', detik: '30', menang: 1, skor: '9', created_at: 'x' }],
    });
    const klasemen = await ModelSusunKata.ambilKlasemenHarian({ susunKataId: '8', limit: 999 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('ORDER BY skor DESC'), [8, 50]);
    expect(klasemen[0]).toEqual({ pengguna_id: 4, nama: 'A', percobaan: 2, detik: 30, menang: true, skor: 9, created_at: 'x' });

    db.query.mockResolvedValueOnce({
      rows: [{ pengguna_id: '5', nama: 'B', percobaan: '3', detik: '40', menang: 0, skor: null, created_at: 'y' }],
    });
    const peserta = await ModelSusunKata.ambilPesertaHarian({ susunKataId: '8', limit: 'abc' });
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY skor DESC'), [8, 200]);
    expect(peserta[0]).toEqual({ pengguna_id: 5, nama: 'B', percobaan: 3, detik: 40, menang: false, skor: 0, created_at: 'y' });

    db.query.mockResolvedValueOnce({
      rows: [{ pengguna_id: null, nama: null, percobaan: null, detik: null, menang: null, skor: null, created_at: null }],
    });
    const klasemenFallback = await ModelSusunKata.ambilKlasemenHarian({ susunKataId: '8', limit: 'abc' });
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('ORDER BY skor DESC'), [8, 10]);
    expect(klasemenFallback[0]).toEqual({
      pengguna_id: 0,
      nama: null,
      percobaan: 0,
      detik: 0,
      menang: false,
      skor: 0,
      created_at: null,
    });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.ambilPesertaHarian({ susunKataId: '8', limit: 999999 })).resolves.toEqual([]);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('ORDER BY skor DESC'), [8, 1000]);

    db.query.mockResolvedValueOnce({
      rows: [{ pengguna_id: null, nama: null, percobaan: null, detik: null, menang: null, skor: null, created_at: null }],
    });
    const pesertaFallback = await ModelSusunKata.ambilPesertaHarian({ susunKataId: '8' });
    expect(db.query).toHaveBeenNthCalledWith(5, expect.stringContaining('ORDER BY skor DESC'), [8, 200]);
    expect(pesertaFallback[0]).toEqual({
      pengguna_id: 0,
      nama: null,
      percobaan: 0,
      detik: 0,
      menang: false,
      skor: 0,
      created_at: null,
    });

    db.query.mockResolvedValueOnce({ rows: [] });
    await ModelSusunKata.ambilKlasemenHarian({ susunKataId: '8' });
    expect(db.query).toHaveBeenNthCalledWith(6, expect.stringContaining('ORDER BY skor DESC'), [8, 10]);
  });

  it('daftarRekapBebasAdmin memetakan hasil rekap dengan aman', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        tanggal: '2026-03-03',
        pemenang: 'Andi',
        jumlah_peserta: '8',
        total_main: '20',
        total_menang: '11',
        persen_menang: '55.00',
      }],
    });

    const result = await ModelSusunKata.daftarRekapBebasAdmin({ tanggal: '2026-03-03', limit: 5000 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM susun_kata_bebas sb'),
      ['2026-03-03', 1000]
    );
    expect(result[0]).toEqual({
      tanggal: '2026-03-03',
      pemenang: 'Andi',
      jumlah_peserta: 8,
      total_main: 20,
      total_menang: 11,
      persen_menang: 55,
    });
  });

  it('daftarRekapBebasAdmin memakai fallback saat data kosong atau input invalid', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSusunKata.daftarRekapBebasAdmin({ tanggal: '2026/03/03', limit: 'abc' })).resolves.toEqual([]);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [null, 200]);

    db.query.mockResolvedValueOnce({
      rows: [{
        tanggal: null,
        pemenang: null,
        jumlah_peserta: null,
        total_main: null,
        total_menang: null,
        persen_menang: null,
      }],
    });
    const fallback = await ModelSusunKata.daftarRekapBebasAdmin({});
    expect(fallback[0]).toEqual({
      tanggal: null,
      pemenang: null,
      jumlah_peserta: 0,
      total_main: 0,
      total_menang: 0,
      persen_menang: 0,
    });
  });
});
