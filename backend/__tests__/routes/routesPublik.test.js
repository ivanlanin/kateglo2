/**
 * @fileoverview Test routes backend
 * @tested_in backend/routes/
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../models/modelGlosarium', () => ({
  autocomplete: jest.fn(),
  cari: jest.fn(),
  cariCursor: jest.fn(),
  ambilDetailAsing: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarBahasa: jest.fn(),
  ambilDaftarSumber: jest.fn(),
  resolveSlugSumber: jest.fn(),
}));

jest.mock('../../models/modelLabel', () => ({
  ambilSemuaKategori: jest.fn(),
  cariEntriPerLabel: jest.fn(),
  cariEntriPerLabelCursor: jest.fn(),
}));

jest.mock('../../models/modelEntri', () => {
  const saranEntri = jest.fn();
  return {
    autocomplete: jest.fn(),
    saranEntri,
    contohAcak: jest.fn(),
    contohAcakRima: jest.fn(),
    ambilKamusSusunKata: jest.fn(),
    cekKataSusunKataValid: jest.fn(),
    ambilArtiSusunKataByIndeks: jest.fn(),
    cariMakna: jest.fn(),
    cariRima: jest.fn(),
  };
});

jest.mock('../../models/modelSusunKata', () => ({
  parsePanjang: jest.fn((value) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 5;
    return Math.min(Math.max(parsed, 4), 8);
  }),
  parsePenggunaId: jest.fn((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }),
  hitungSkor: jest.fn(({ percobaan, menang }) => (menang ? Math.max(11 - percobaan, 1) : 0)),
  ambilTanggalHariIniJakarta: jest.fn(),
  ambilAtauBuatHarian: jest.fn(),
  ambilSkorPenggunaHarian: jest.fn(),
  simpanSkorHarian: jest.fn(),
  ambilKlasemenHarian: jest.fn(),
}));

jest.mock('../../models/modelKomentar', () => ({
  hitungKomentarAktif: jest.fn(),
  ambilKomentarTerbaca: jest.fn(),
  upsertKomentarPengguna: jest.fn(),
}));

jest.mock('../../models/modelPencarian', () => ({
  catatPencarian: jest.fn(),
  ambilKataTerpopuler: jest.fn(),
  ambilFrasaPopulerPerDomain: jest.fn(),
}));

jest.mock('../../models/modelTesaurus', () => ({
  contohAcak: jest.fn(),
  autocomplete: jest.fn(),
}));

jest.mock('../../models/modelPengguna', () => ({
  ambilDenganId: jest.fn(),
  ambilPeranUntukAuth: jest.fn(),
  ambilIzin: jest.fn(),
}));

jest.mock('../../services/layananKamusPublik', () => ({
  cariKamus: jest.fn(),
  ambilDetailKamus: jest.fn(),
}));

jest.mock('../../services/layananGlosariumPublik', () => ({
  ambilDetailGlosarium: jest.fn(),
}));

jest.mock('../../services/layananTesaurusPublik', () => ({
  cariTesaurus: jest.fn(),
  ambilDetailTesaurus: jest.fn(),
}));

const ModelGlosarium = require('../../models/modelGlosarium');
const ModelLabel = require('../../models/modelLabel');
const ModelEntri = require('../../models/modelEntri');
const ModelSusunKata = require('../../models/modelSusunKata');
const ModelKomentar = require('../../models/modelKomentar');
const ModelPencarian = require('../../models/modelPencarian');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelPengguna = require('../../models/modelPengguna');
const layananKamusPublik = require('../../services/layananKamusPublik');
const layananGlosariumPublik = require('../../services/layananGlosariumPublik');
const layananTesaurusPublik = require('../../services/layananTesaurusPublik');
const rootRouter = require('../../routes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', rootRouter);
  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
  });
  return app;
}

describe('routes backend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelEntri.saranEntri.mockResolvedValue([]);
    ModelKomentar.hitungKomentarAktif.mockResolvedValue(0);
    ModelPencarian.catatPencarian.mockResolvedValue(true);
    ModelPencarian.ambilKataTerpopuler.mockResolvedValue([]);
    ModelPencarian.ambilFrasaPopulerPerDomain.mockResolvedValue([
      { domain: 1, domain_nama: 'kamus', tanggal: '2026-03-02', kata: 'air', jumlah: 10 },
      { domain: 2, domain_nama: 'tesaurus', tanggal: '2026-03-01', kata: 'kata', jumlah: 9 },
      { domain: 3, domain_nama: 'glosarium', tanggal: '2026-03-02', kata: 'istilah', jumlah: 8 },
      { domain: 4, domain_nama: 'makna', tanggal: '2026-03-02', kata: 'arti', jumlah: 7 },
      { domain: 5, domain_nama: 'rima', tanggal: '2026-02-28', kata: 'sajak', jumlah: 6 },
    ]);
    ModelSusunKata.ambilTanggalHariIniJakarta.mockResolvedValue('2026-03-01');
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValue({ id: 10, kata: 'kata' });
    ModelSusunKata.ambilSkorPenggunaHarian.mockResolvedValue(null);
    ModelSusunKata.simpanSkorHarian.mockResolvedValue({
      id: 1,
      susun_kata_id: 10,
      pengguna_id: 7,
      percobaan: 3,
      waktu_detik: 42,
      menang: true,
    });
    ModelSusunKata.ambilKlasemenHarian.mockResolvedValue([]);
    ModelPengguna.ambilDenganId.mockResolvedValue(null);
    ModelPengguna.ambilPeranUntukAuth.mockResolvedValue({ kode: 'pengguna', akses_redaksi: false });
    ModelPengguna.ambilIzin.mockResolvedValue([]);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/publik/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/publik/health mengembalikan status ok', async () => {
    const response = await request(createApp()).get('/api/publik/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/redaksi/health mengembalikan status ok dengan token admin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-admin',
        email: 'admin@example.com',
        name: 'Admin',
        picture: 'https://img.example/admin.png',
        provider: 'google',
        peran: 'admin',
        izin: ['kelola_pengguna'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/redaksi/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/redaksi/health mengembalikan status ok dengan token admin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-admin',
        email: 'admin@example.com',
        name: 'Admin',
        picture: 'https://img.example/admin.png',
        provider: 'google',
        peran: 'admin',
        izin: ['kelola_pengguna'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/redaksi/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/redaksi/health mengembalikan 401 tanpa token', async () => {
    const response = await request(createApp()).get('/api/redaksi/health');

    expect(response.status).toBe(401);
  });

  it('GET /api/redaksi/health mengembalikan 403 untuk non-admin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
        izin: ['lihat_lema'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/redaksi/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/kategori mengembalikan data kategori', async () => {
    ModelLabel.ambilSemuaKategori.mockResolvedValue({ ragam: [{ kode: 'cak', nama: 'cak' }] });
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([]);
    ModelGlosarium.ambilDaftarBahasa.mockResolvedValue([]);

    const response = await request(createApp()).get('/api/publik/kamus/kategori');

    expect(response.status).toBe(200);
    expect(response.body.ragam).toHaveLength(1);
  });

  it('GET /api/publik/kamus/kategori meneruskan error ke middleware', async () => {
    ModelLabel.ambilSemuaKategori.mockRejectedValue(new Error('kategori gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/kategori');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('kategori gagal');
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode memanggil model label', async () => {
    ModelLabel.cariEntriPerLabelCursor.mockResolvedValue({ data: [], total: 0, label: null });

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/umum%20sekali?limit=999&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelLabel.cariEntriPerLabelCursor).toHaveBeenCalledWith('ragam', 'umum sekali', {
      limit: 200,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
      hitungTotal: true,
    });
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode meneruskan error', async () => {
    ModelLabel.cariEntriPerLabelCursor.mockRejectedValue(new Error('label gagal'));

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/cak');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('label gagal');
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode mendukung lastPage cursor', async () => {
    ModelLabel.cariEntriPerLabelCursor.mockResolvedValue({ data: [], total: 0, label: null });

    const response = await request(createApp())
      .get('/api/publik/kamus/kategori/ragam/umum?lastPage=1');

    expect(response.status).toBe(200);
    expect(ModelLabel.cariEntriPerLabelCursor).toHaveBeenCalledWith('ragam', 'umum', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
      hitungTotal: true,
    });
  });

  it('GET /api/publik/kamus/autocomplete/:kata mengembalikan data', async () => {
    ModelEntri.autocomplete.mockResolvedValue(['kata']);

    const response = await request(createApp()).get('/api/publik/kamus/autocomplete/kat');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['kata'] });
  });

  it('GET /api/publik/kamus/autocomplete/:kata meneruskan error', async () => {
    ModelEntri.autocomplete.mockRejectedValue(new Error('ac gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/autocomplete/kat');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('ac gagal');
  });

  it('GET /api/publik/pencarian/populer mengembalikan satu frasa teratas per domain berdasarkan tanggal', async () => {
    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=2026-01-15');

    expect(response.status).toBe(200);
    expect(ModelPencarian.ambilFrasaPopulerPerDomain).toHaveBeenCalledWith({ tanggalReferensi: '2026-01-15' });
    expect(response.body).toEqual({
      tanggal: '2026-01-15',
      tanggalData: '2026-03-02',
      data: {
        kamus: 'air',
        tesaurus: 'kata',
        glosarium: 'istilah',
        makna: 'arti',
        rima: 'sajak',
      },
    });
  });

  it('GET /api/publik/pencarian/populer memakai fallback tanggal hari ini jika query tanggal tidak valid', async () => {
    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=tidak-valid');

    expect(response.status).toBe(200);
    expect(ModelPencarian.ambilFrasaPopulerPerDomain).toHaveBeenCalledWith({ tanggalReferensi: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
    expect(response.headers['cache-control']).toContain('public');
  });

  it('GET /api/publik/pencarian/populer tetap mengembalikan tanggalData saat model mengirim Date object', async () => {
    ModelPencarian.ambilFrasaPopulerPerDomain.mockResolvedValueOnce([
      { domain: 1, domain_nama: 'kamus', tanggal: new Date('2026-03-02T00:00:00Z'), kata: 'air', jumlah: 10 },
      { domain: 2, domain_nama: 'tesaurus', tanggal: new Date('2026-03-01T00:00:00Z'), kata: 'kata', jumlah: 9 },
    ]);

    const response = await request(createApp()).get('/api/publik/pencarian/populer?tanggal=2026-01-16');

    expect(response.status).toBe(200);
    expect(response.body.tanggalData).toBe('2026-03-02');
    expect(response.body.data.kamus).toBe('air');
    expect(response.body.data.tesaurus).toBe('kata');
  });

  it('GET /api/publik/makna/contoh mengembalikan data contoh acak', async () => {
    ModelEntri.contohAcak.mockResolvedValue(['kata', 'frasa']);

    const response = await request(createApp()).get('/api/publik/makna/contoh');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['kata', 'frasa'] });
    expect(ModelEntri.contohAcak).toHaveBeenCalledWith(5);
  });

  it('GET /api/publik/makna/contoh meneruskan error', async () => {
    ModelEntri.contohAcak.mockRejectedValue(new Error('contoh gagal'));

    const response = await request(createApp()).get('/api/publik/makna/contoh');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('contoh gagal');
  });

  it('GET /api/publik/gim/susun-kata/puzzle mengembalikan puzzle Susun Kata', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValue({ id: 11, kata: 'kata' });
    ModelEntri.ambilArtiSusunKataByIndeks.mockResolvedValue('bagian bahasa');

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/puzzle?panjang=5');

    expect(response.status).toBe(200);
    expect(ModelSusunKata.ambilAtauBuatHarian).toHaveBeenCalledWith({ tanggal: '2026-03-01', panjang: 5 });
    expect(ModelEntri.ambilArtiSusunKataByIndeks).toHaveBeenCalledWith('kata');
    expect(response.body).toMatchObject({
      panjang: 5,
      total: 1,
      target: 'kata',
      arti: 'bagian bahasa',
      kamus: ['kata'],
    });
  });

  it('GET /api/publik/gim/susun-kata/puzzle mengembalikan 404 saat kamus kosong', async () => {
    ModelSusunKata.ambilAtauBuatHarian.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/puzzle?panjang=6');

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('6 huruf');
  });

  it('GET /api/publik/gim/susun-kata/validasi/:kata mengembalikan status valid kata', async () => {
    ModelEntri.cekKataSusunKataValid.mockResolvedValue(true);

    const response = await request(createApp()).get('/api/publik/gim/susun-kata/validasi/KARTU?panjang=5');

    expect(response.status).toBe(200);
    expect(ModelEntri.cekKataSusunKataValid).toHaveBeenCalledWith('kartu', { panjang: 5 });
    expect(response.body).toEqual({ kata: 'kartu', panjang: 5, valid: true });
  });

  it('GET /api/publik/makna/cari/:kata validasi query kosong', async () => {
    const response = await request(createApp()).get('/api/publik/makna/cari/%20%20%20');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Query tidak boleh kosong');
    expect(ModelEntri.cariMakna).not.toHaveBeenCalled();
  });

  it('GET /api/publik/makna/cari/:kata meneruskan cursor pagination ke model', async () => {
    ModelEntri.cariMakna.mockResolvedValue({
      data: [{ id: 1, entri: 'kata' }],
      total: 2,
      hasPrev: true,
      hasNext: false,
      prevCursor: 'prev123',
      nextCursor: null,
    });

    const response = await request(createApp())
      .get('/api/publik/makna/cari/kata?limit=999&cursor=abc&direction=prev&lastPage=1');

    expect(response.status).toBe(200);
    expect(ModelEntri.cariMakna).toHaveBeenCalledWith('kata', {
      limit: 100,
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
    });
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('kata', { domain: 4 });
    expect(response.body.pageInfo).toEqual({
      hasPrev: true,
      hasNext: false,
      prevCursor: 'prev123',
      nextCursor: null,
    });
  });

  it('GET /api/publik/makna/cari/:kata mengembalikan nextCursor ketika tersedia', async () => {
    ModelEntri.cariMakna.mockResolvedValue({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: true,
      prevCursor: '',
      nextCursor: 'next123',
    });

    const response = await request(createApp()).get('/api/publik/makna/cari/kata');

    expect(response.status).toBe(200);
    expect(response.body.pageInfo.prevCursor).toBeNull();
    expect(response.body.pageInfo.nextCursor).toBe('next123');
  });

  it('GET /api/publik/makna/cari/:kata meneruskan error model', async () => {
    ModelEntri.cariMakna.mockRejectedValue(new Error('makna gagal'));

    const response = await request(createApp()).get('/api/publik/makna/cari/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('makna gagal');
  });

  it('GET /api/publik/rima/autocomplete/:kata mengembalikan data autocomplete', async () => {
    ModelEntri.autocomplete.mockResolvedValue(['kata', 'katarak']);

    const response = await request(createApp()).get('/api/publik/rima/autocomplete/kat');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['kata', 'katarak'] });
    expect(ModelEntri.autocomplete).toHaveBeenCalledWith('kat', 8);
  });

  it('GET /api/publik/rima/contoh mengembalikan data contoh acak rima', async () => {
    ModelEntri.contohAcakRima.mockResolvedValue(['sajak', 'ajak']);

    const response = await request(createApp()).get('/api/publik/rima/contoh');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['sajak', 'ajak'] });
    expect(ModelEntri.contohAcakRima).toHaveBeenCalledWith(5);
  });

  it('GET /api/publik/rima/contoh meneruskan error', async () => {
    ModelEntri.contohAcakRima.mockRejectedValue(new Error('contoh rima gagal'));

    const response = await request(createApp()).get('/api/publik/rima/contoh');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('contoh rima gagal');
  });

  it('GET /api/publik/rima/autocomplete/:kata mengembalikan data kosong saat query kosong', async () => {
    const response = await request(createApp()).get('/api/publik/rima/autocomplete/%20%20');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
    expect(ModelEntri.autocomplete).not.toHaveBeenCalled();
  });

  it('GET /api/publik/rima/autocomplete/:kata meneruskan error', async () => {
    ModelEntri.autocomplete.mockRejectedValue(new Error('rima ac gagal'));

    const response = await request(createApp()).get('/api/publik/rima/autocomplete/kat');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('rima ac gagal');
  });

  it('GET /api/publik/rima/cari/:kata validasi query kosong', async () => {
    const response = await request(createApp()).get('/api/publik/rima/cari/%20%20%20');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Query tidak boleh kosong');
    expect(ModelEntri.cariRima).not.toHaveBeenCalled();
  });

  it('GET /api/publik/rima/cari/:kata meneruskan opsi cursor ke model', async () => {
    ModelEntri.cariRima.mockResolvedValue({
      indeks: 'kata',
      pemenggalan: null,
      rima_akhir: { pola: 'ta', data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      rima_awal: { pola: 'ka', data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
    });

    const response = await request(createApp())
      .get('/api/publik/rima/cari/kata?limit=999&cursor_akhir=ca&dir_akhir=prev&cursor_awal=cb&dir_awal=prev');

    expect(response.status).toBe(200);
    expect(ModelEntri.cariRima).toHaveBeenCalledWith('kata', {
      limit: 200,
      cursorAkhir: 'ca',
      directionAkhir: 'prev',
      cursorAwal: 'cb',
      directionAwal: 'prev',
    });
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('kata', { domain: 5 });
    expect(response.body.indeks).toBe('kata');
  });

  it('GET /api/publik/rima/cari/:kata meneruskan error model', async () => {
    ModelEntri.cariRima.mockRejectedValue(new Error('rima gagal'));

    const response = await request(createApp()).get('/api/publik/rima/cari/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('rima gagal');
  });

  it('GET /api/publik/kamus/cari/:kata mengembalikan hasil dan clamp paginasi', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({
      data: [{ lema: 'kata' }],
      total: 1,
    });

    const response = await request(createApp()).get('/api/publik/kamus/cari/kata?limit=999&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', {
      limit: 200,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('kata', { domain: 1 });
    expect(response.body.total).toBe(1);
  });

  it('GET /api/publik/kamus/terpopuler mengembalikan data default all-time', async () => {
    ModelPencarian.ambilKataTerpopuler.mockResolvedValue([
      { kata: 'kata', jumlah: 12 },
    ]);

    const response = await request(createApp()).get('/api/publik/kamus/terpopuler');

    expect(response.status).toBe(200);
    expect(ModelPencarian.ambilKataTerpopuler).toHaveBeenCalledWith({
      periode: 'all',
      limit: 10,
    });
    expect(response.body).toEqual({
      periode: 'all',
      limit: 10,
      data: [{ kata: 'kata', jumlah: 12 }],
    });
  });

  it('GET /api/publik/kamus/terpopuler mendukung periode 7hari dan clamp limit', async () => {
    ModelPencarian.ambilKataTerpopuler.mockResolvedValue([]);

    const response = await request(createApp()).get('/api/publik/kamus/terpopuler?periode=7hari&limit=999');

    expect(response.status).toBe(200);
    expect(ModelPencarian.ambilKataTerpopuler).toHaveBeenCalledWith({
      periode: '7hari',
      limit: 100,
    });
  });

  it('GET /api/publik/kamus/terpopuler meneruskan error model', async () => {
    ModelPencarian.ambilKataTerpopuler.mockRejectedValue(new Error('terpopuler gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/terpopuler');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('terpopuler gagal');
  });

  it('GET /api/publik/kamus/cari/:kata mengembalikan saran saat total 0', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({
      data: [],
      total: 0,
    });
    ModelEntri.saranEntri.mockResolvedValue(['kata', 'kita']);

    const response = await request(createApp()).get('/api/publik/kamus/cari/tidak%20ada');

    expect(response.status).toBe(200);
    expect(ModelEntri.saranEntri).toHaveBeenCalledWith('tidak ada');
    expect(response.body.saran).toEqual(['kata', 'kita']);
  });

  it('GET /api/publik/kamus/cari/:kata meneruskan error', async () => {
    layananKamusPublik.cariKamus.mockRejectedValue(new Error('cari kamus gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/cari/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cari kamus gagal');
  });

  it('GET /api/publik/kamus/detail/:indeks mengembalikan 404 saat data null', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);
    ModelEntri.saranEntri.mockResolvedValue(['kata']);

    const response = await request(createApp()).get('/api/publik/kamus/detail/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
    expect(response.body.saran).toEqual(['kata']);
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('tidak-ada', { domain: 1 });
  });

  it('GET /api/publik/kamus/detail/:entri mengembalikan data saat ditemukan', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ indeks: 'kata', entri: [{ id: 1, entri: 'kata' }] });

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata');

    expect(response.status).toBe(200);
    expect(response.body.indeks).toBe('kata');
    expect(response.body.entri).toHaveLength(1);
    expect(layananKamusPublik.ambilDetailKamus).toHaveBeenCalledWith('kata', {
      glosariumLimit: 20,
      glosariumCursor: null,
      glosariumDirection: 'next',
      includeEtimologiNonaktif: false,
    });
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('kata', { domain: 1 });
  });

  it('GET /api/publik/kamus/detail/:entri tidak mencatat pelacakan saat sumber susun-kata', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ indeks: 'kata', entri: [{ id: 1, entri: 'kata' }] });

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata?sumber=susun-kata');

    expect(response.status).toBe(200);
    expect(ModelPencarian.catatPencarian).not.toHaveBeenCalled();
  });

  it('GET /api/publik/kamus/detail/:entri meneruskan paging glosarium cursor', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ indeks: 'kata', entri: [{ id: 1, entri: 'kata' }] });

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata?limit=55&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.ambilDetailKamus).toHaveBeenCalledWith('kata', {
      glosariumLimit: 55,
      glosariumCursor: 'abc',
      glosariumDirection: 'prev',
      includeEtimologiNonaktif: false,
    });
  });

  it('GET /api/publik/kamus/detail/:entri mengirim flag admin untuk etimologi nonaktif', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-admin',
        pid: 1,
        email: 'admin@example.com',
        name: 'Admin',
        provider: 'google',
        peran: 'admin',
      },
      process.env.JWT_SECRET
    );
    layananKamusPublik.ambilDetailKamus.mockResolvedValue({ indeks: 'kata', entri: [{ id: 1, entri: 'kata' }] });

    const response = await request(createApp())
      .get('/api/publik/kamus/detail/kata')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(layananKamusPublik.ambilDetailKamus).toHaveBeenCalledWith('kata', {
      glosariumLimit: 20,
      glosariumCursor: null,
      glosariumDirection: 'next',
      includeEtimologiNonaktif: true,
    });
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/detail/:entri meneruskan error', async () => {
    layananKamusPublik.ambilDetailKamus.mockRejectedValue(new Error('detail kamus gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/detail/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail kamus gagal');
  });

  it('GET /api/publik/kamus/komentar/:indeks mengembalikan teaser jika belum login', async () => {
    ModelKomentar.hitungKomentarAktif.mockResolvedValue(2);

    const response = await request(createApp()).get('/api/publik/kamus/komentar/kata');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.loggedIn).toBe(false);
    expect(response.body.data.activeCount).toBe(2);
    expect(ModelKomentar.ambilKomentarTerbaca).not.toHaveBeenCalled();
  });

  it('GET /api/publik/kamus/komentar/:indeks mengembalikan komentar terbaca jika login', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 9,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    ModelKomentar.hitungKomentarAktif.mockResolvedValue(1);
    ModelKomentar.ambilKomentarTerbaca.mockResolvedValue([{ id: 7, komentar: 'uji', aktif: false }]);

    const response = await request(createApp())
      .get('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.loggedIn).toBe(true);
    expect(response.body.data.komentar).toHaveLength(1);
    expect(ModelKomentar.ambilKomentarTerbaca).toHaveBeenCalledWith('kata', 9);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/komentar/:indeks meneruskan error model', async () => {
    ModelKomentar.hitungKomentarAktif.mockRejectedValue(new Error('komentar publik gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/komentar/kata');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('komentar publik gagal');
  });

  it('POST /api/publik/kamus/komentar/:indeks menyimpan komentar pengguna login', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 11,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );
    ModelKomentar.upsertKomentarPengguna.mockResolvedValue({ id: 1, indeks: 'kata', komentar: 'isi' });

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(ModelKomentar.upsertKomentarPengguna).toHaveBeenCalledWith({ indeks: 'kata', penggunaId: 11, komentar: 'isi' });
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/tesaurus/autocomplete/:kata mengembalikan data', async () => {
    ModelTesaurus.autocomplete.mockResolvedValue(['aktif']);

    const response = await request(createApp()).get('/api/publik/tesaurus/autocomplete/akt');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['aktif'] });
  });

  it('GET /api/publik/tesaurus/contoh mengembalikan data contoh acak', async () => {
    ModelTesaurus.contohAcak.mockResolvedValue(['aktif', 'dinamis']);

    const response = await request(createApp()).get('/api/publik/tesaurus/contoh');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: ['aktif', 'dinamis'] });
    expect(ModelTesaurus.contohAcak).toHaveBeenCalledWith(5);
  });

  it('GET /api/publik/tesaurus/contoh meneruskan error', async () => {
    ModelTesaurus.contohAcak.mockRejectedValue(new Error('contoh tesaurus gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/contoh');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('contoh tesaurus gagal');
  });

  it('GET /api/publik/tesaurus/autocomplete/:kata meneruskan error', async () => {
    ModelTesaurus.autocomplete.mockRejectedValue(new Error('tesaurus ac gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/autocomplete/akt');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('tesaurus ac gagal');
  });

  it('GET /api/publik/tesaurus/cari/:kata mengembalikan hasil', async () => {
    layananTesaurusPublik.cariTesaurus.mockResolvedValue({ data: [{ indeks: 'aktif' }], total: 1 });

    const response = await request(createApp()).get('/api/publik/tesaurus/cari/aktif?limit=0&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(layananTesaurusPublik.cariTesaurus).toHaveBeenCalledWith('aktif', {
      limit: 100,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('aktif', { domain: 2 });
    expect(response.body.total).toBe(1);
  });

  it('GET /api/publik/tesaurus/cari/:kata meneruskan error', async () => {
    layananTesaurusPublik.cariTesaurus.mockRejectedValue(new Error('cari tesaurus gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/cari/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('cari tesaurus gagal');
  });

  it('GET /api/publik/tesaurus/:kata mengembalikan 404 saat data null', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/publik/tesaurus/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tidak Ditemukan');
    expect(ModelPencarian.catatPencarian).not.toHaveBeenCalled();
  });

  it('GET /api/publik/tesaurus/:kata mengembalikan data saat ditemukan', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockResolvedValue({ indeks: 'aktif', sinonim: ['giat'] });

    const response = await request(createApp()).get('/api/publik/tesaurus/aktif');

    expect(response.status).toBe(200);
    expect(response.body.indeks).toBe('aktif');
    expect(ModelPencarian.catatPencarian).not.toHaveBeenCalled();
  });

  it('GET /api/publik/tesaurus/:kata meneruskan error', async () => {
    layananTesaurusPublik.ambilDetailTesaurus.mockRejectedValue(new Error('detail tesaurus gagal'));

    const response = await request(createApp()).get('/api/publik/tesaurus/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail tesaurus gagal');
  });

  it('GET /api/publik/glosarium/autocomplete/:kata mengembalikan data', async () => {
    ModelGlosarium.autocomplete.mockResolvedValue([{ value: 'term' }]);

    const response = await request(createApp()).get('/api/publik/glosarium/autocomplete/te');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ value: 'term' }] });
  });

  it('GET /api/publik/glosarium/detail/:asing validasi parameter kosong', async () => {
    const response = await request(createApp()).get('/api/publik/glosarium/detail/%20%20');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Parameter asing diperlukan');
    expect(layananGlosariumPublik.ambilDetailGlosarium).not.toHaveBeenCalled();
  });

  it('handler detail glosarium memakai fallback param kosong saat req.params.asing undefined', async () => {
    const glosariumRouter = require('../../routes/publik/glosarium');
    const layer = glosariumRouter.stack.find((item) => item.route && item.route.path === '/detail/:asing');
    const handler = layer.route.stack[1].handle;

    const req = { params: {}, query: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Parameter asing diperlukan' });
    expect(next).not.toHaveBeenCalled();
  });

  it('GET /api/publik/glosarium/detail/:asing memanggil model dengan cursor pagination section', async () => {
    layananGlosariumPublik.ambilDetailGlosarium.mockResolvedValue({
      persis: [],
      mengandung: [],
      mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      mengandungTotal: 0,
      mirip: [],
      miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      miripTotal: 0,
    });

    const response = await request(createApp())
      .get('/api/publik/glosarium/detail/zero%20sum?limit=999&mengandungCursor=abc&miripCursor=xyz');

    expect(response.status).toBe(200);
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('zero sum', { domain: 3 });
    expect(layananGlosariumPublik.ambilDetailGlosarium).toHaveBeenCalledWith('zero sum', {
      limit: 100,
      mengandungCursor: 'abc',
      miripCursor: 'xyz',
    });
  });

  it('GET /api/publik/glosarium/detail/:asing mengirim cursor null jika query cursor tidak ada', async () => {
    layananGlosariumPublik.ambilDetailGlosarium.mockResolvedValue({
      persis: [],
      mengandung: [],
      mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      mengandungTotal: 0,
      mirip: [],
      miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      miripTotal: 0,
    });

    const response = await request(createApp()).get('/api/publik/glosarium/detail/term');

    expect(response.status).toBe(200);
    expect(layananGlosariumPublik.ambilDetailGlosarium).toHaveBeenCalledWith('term', {
      limit: 20,
      mengandungCursor: null,
      miripCursor: null,
    });
  });

  it('GET /api/publik/glosarium/detail/:asing mengubah cursor string kosong menjadi null', async () => {
    layananGlosariumPublik.ambilDetailGlosarium.mockResolvedValue({
      persis: [],
      mengandung: [],
      mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      mengandungTotal: 0,
      mirip: [],
      miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      miripTotal: 0,
    });

    const response = await request(createApp())
      .get('/api/publik/glosarium/detail/term?mengandungCursor=%20%20&miripCursor=%20%20');

    expect(response.status).toBe(200);
    expect(layananGlosariumPublik.ambilDetailGlosarium).toHaveBeenCalledWith('term', {
      limit: 20,
      mengandungCursor: null,
      miripCursor: null,
    });
  });

  it('GET /api/publik/glosarium/detail/:asing meneruskan error', async () => {
    layananGlosariumPublik.ambilDetailGlosarium.mockRejectedValue(new Error('detail glosarium gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/detail/aktif');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('detail glosarium gagal');
  });

  it('GET /api/publik/glosarium/autocomplete/:kata meneruskan error', async () => {
    ModelGlosarium.autocomplete.mockRejectedValue(new Error('glo ac gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/autocomplete/te');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('glo ac gagal');
  });

  it('GET /api/publik/glosarium/cari/:kata memanggil model sesuai query', async () => {
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/cari/istilah?limit=999&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      q: 'istilah',
      limit: 100,
      aktifSaja: true,
      hitungTotal: true,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
    });
    expect(ModelPencarian.catatPencarian).toHaveBeenCalledWith('istilah', { domain: 3 });
  });

  it('GET /api/publik/glosarium/cari/:kata meneruskan error', async () => {
    ModelGlosarium.cariCursor.mockRejectedValue(new Error('glo cari gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/cari/istilah');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('glo cari gagal');
  });

  it('GET /api/publik/glosarium/bidang mengembalikan daftar bidang', async () => {
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ bidang: 'ling', jumlah: 10 }]);

    const response = await request(createApp()).get('/api/publik/glosarium/bidang');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ bidang: 'ling', jumlah: 10 }]);
  });

  it('GET /api/publik/glosarium/bidang meneruskan error', async () => {
    ModelGlosarium.ambilDaftarBidang.mockRejectedValue(new Error('bidang gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/bidang');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bidang gagal');
  });

  it('GET /api/publik/glosarium/bidang/:bidang memanggil model', async () => {
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/bidang/ilmu%20komputer?limit=9&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      bidang: 'ilmu komputer',
      limit: 9,
      aktifSaja: true,
      hitungTotal: true,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
      sortBy: 'asing',
    });
  });

  it('GET /api/publik/glosarium/bidang/:bidang meneruskan error', async () => {
    ModelGlosarium.cariCursor.mockRejectedValue(new Error('bidang detail gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/bidang/ling');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('bidang detail gagal');
  });

  it('GET /api/publik/glosarium/sumber mengembalikan daftar sumber', async () => {
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([{ sumber: 'kbbi', jumlah: 5 }]);

    const response = await request(createApp()).get('/api/publik/glosarium/sumber');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ sumber: 'kbbi', jumlah: 5 }]);
  });

  it('GET /api/publik/glosarium/sumber meneruskan error', async () => {
    ModelGlosarium.ambilDaftarSumber.mockRejectedValue(new Error('sumber gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/sumber');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sumber gagal');
  });

  it('GET /api/publik/glosarium/sumber/:sumber memanggil model', async () => {
    ModelGlosarium.resolveSlugSumber.mockResolvedValue({ id: 42, kode: 'kbbi-v', nama: 'KBBI V' });
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/glosarium/sumber/kbbi-v?limit=6&cursor=abc&direction=prev');

    expect(response.status).toBe(200);
    expect(ModelGlosarium.resolveSlugSumber).toHaveBeenCalledWith('kbbi-v');
    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      sumberId: 42,
      limit: 6,
      aktifSaja: true,
      hitungTotal: true,
      cursor: 'abc',
      direction: 'prev',
      lastPage: false,
      sortBy: 'asing',
    });
  });

  it('GET /api/publik/glosarium/sumber/:sumber mengembalikan 404 jika sumber tidak ditemukan', async () => {
    ModelGlosarium.resolveSlugSumber.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/publik/glosarium/sumber/tidak-ada');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Sumber tidak ditemukan');
  });

  it('GET /api/publik/glosarium/sumber/:sumber meneruskan error', async () => {
    ModelGlosarium.resolveSlugSumber.mockResolvedValue({ id: 1, kode: 'kbbi', nama: 'KBBI' });
    ModelGlosarium.cariCursor.mockRejectedValue(new Error('sumber detail gagal'));

    const response = await request(createApp()).get('/api/publik/glosarium/sumber/kbbi');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('sumber detail gagal');
  });

  it('GET /api/publik/auth/me mengembalikan 401 saat token tidak ada', async () => {
    const response = await request(createApp()).get('/api/publik/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/publik/auth/me mengembalikan profil saat token valid', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-123',
        pid: 1,
        email: 'user@example.com',
        name: 'User Test',
        picture: 'https://img.example/user.png',
        peran: 'pengguna',
        izin: ['lihat_lema'],
        provider: 'google',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: 'google-123',
      pid: 1,
      email: 'user@example.com',
      name: 'User Test',
      picture: 'https://img.example/user.png',
      peran: 'pengguna',
      akses_redaksi: false,
      izin: ['lihat_lema'],
      provider: 'google',
    });
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/auth/me mengisi izin array kosong jika payload tidak memiliki izin', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-456',
        pid: 2,
        email: 'user2@example.com',
        name: 'User Tanpa Izin',
        picture: 'https://img.example/user2.png',
        peran: 'pengguna',
        provider: 'google',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.akses_redaksi).toBe(false);
    expect(response.body.data.izin).toEqual([]);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/auth/me memakai izin/peran terbaru dari DB saat pid tersedia', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    ModelPengguna.ambilDenganId.mockResolvedValue({ id: 2, peran_id: 7 });
    ModelPengguna.ambilPeranUntukAuth.mockResolvedValue({ kode: 'editor', akses_redaksi: true });
    ModelPengguna.ambilIzin.mockResolvedValue(['kelola_label', 'kelola_pengguna']);

    const token = jwt.sign(
      {
        sub: 'google-789',
        pid: 2,
        email: 'editor@example.com',
        name: 'Editor',
        picture: 'https://img.example/editor.png',
        peran: 'pengguna',
        izin: ['izin_lama'],
        provider: 'google',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(ModelPengguna.ambilDenganId).toHaveBeenCalledWith(2);
    expect(ModelPengguna.ambilPeranUntukAuth).toHaveBeenCalledWith(7);
    expect(ModelPengguna.ambilIzin).toHaveBeenCalledWith(7);
    expect(response.body.data.peran).toBe('editor');
    expect(response.body.data.akses_redaksi).toBe(true);
    expect(response.body.data.izin).toEqual(['kelola_label', 'kelola_pengguna']);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/cari/:kata menerima flag lastPage', async () => {
    layananKamusPublik.cariKamus.mockResolvedValue({ data: [], total: 0 });

    const response = await request(createApp())
      .get('/api/publik/kamus/cari/kata?lastPage=1');

    expect(response.status).toBe(200);
    expect(layananKamusPublik.cariKamus).toHaveBeenCalledWith('kata', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
    });
  });

  it('GET /api/publik/kamus/komentar/:indeks mengembalikan 400 jika indeks kosong', async () => {
    const response = await request(createApp()).get('/api/publik/kamus/komentar/%20%20');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Indeks wajib diisi');
  });

  it('POST /api/publik/kamus/komentar/:indeks mengembalikan 401 jika pid tidak tersedia', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Autentikasi diperlukan');
    delete process.env.JWT_SECRET;
  });

  it('POST /api/publik/kamus/komentar/:indeks validasi indeks dan komentar wajib', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 17,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    const noIndeks = await request(createApp())
      .post('/api/publik/kamus/komentar/%20')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    const noKomentar = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: '   ' });

    expect(noIndeks.status).toBe(400);
    expect(noIndeks.body.message).toBe('Indeks wajib diisi');
    expect(noKomentar.status).toBe(400);
    expect(noKomentar.body.message).toBe('Komentar wajib diisi');
    delete process.env.JWT_SECRET;
  });

  it('POST /api/publik/kamus/komentar/:indeks validasi komentar saat body kosong', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 17,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Komentar wajib diisi');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/kategori/:kategori/:kode meneruskan error decode parameter', async () => {
    const response = await request(createApp()).get('/api/publik/kamus/kategori/ragam/%E0%A4%A');

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Failed to decode param');
  });

  it('POST /api/publik/kamus/komentar/:indeks meneruskan error model', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-user',
        pid: 13,
        email: 'user@example.com',
        name: 'User',
        provider: 'google',
        peran: 'pengguna',
      },
      process.env.JWT_SECRET
    );
    ModelKomentar.upsertKomentarPengguna.mockRejectedValue(new Error('simpan komentar gagal'));

    const response = await request(createApp())
      .post('/api/publik/kamus/komentar/kata')
      .set('Authorization', `Bearer ${token}`)
      .send({ komentar: 'isi' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('simpan komentar gagal');
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/kamus/detail/:indeks meneruskan error saat ambil saran gagal', async () => {
    layananKamusPublik.ambilDetailKamus.mockResolvedValue(null);
    ModelEntri.saranEntri.mockRejectedValue(new Error('saran gagal'));

    const response = await request(createApp()).get('/api/publik/kamus/detail/tidak-ada');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('saran gagal');
  });

  it('GET /api/publik/auth/me memakai peran default saat token tidak memiliki field peran', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-noperan',
        email: 'noperan@example.com',
        name: 'Tanpa Peran',
        provider: 'google',
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.peran).toBe('pengguna');
    expect(response.body.data.akses_redaksi).toBe(false);
    expect(response.body.data.izin).toEqual([]);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/auth/me melewati sinkronisasi DB saat pid tidak valid', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    const token = jwt.sign(
      {
        sub: 'google-nopid',
        pid: 0,
        email: 'nopid@example.com',
        name: 'Tanpa PID',
        provider: 'google',
        peran: 'pengguna',
        izin: ['lihat_lema'],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(ModelPengguna.ambilDenganId).not.toHaveBeenCalled();
    expect(response.body.data.peran).toBe('pengguna');
    expect(response.body.data.izin).toEqual(['lihat_lema']);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/auth/me memakai peran token saat peranData null', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    ModelPengguna.ambilDenganId.mockResolvedValue({ id: 5, peran_id: 3 });
    ModelPengguna.ambilPeranUntukAuth.mockResolvedValue(null);
    ModelPengguna.ambilIzin.mockResolvedValue(['perm_satu']);

    const token = jwt.sign(
      {
        sub: 'google-nullperan',
        pid: 5,
        email: 'nullperan@example.com',
        name: 'Null Peran',
        provider: 'google',
        peran: 'kontributor',
        izin: [],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.peran).toBe('kontributor');
    expect(response.body.data.akses_redaksi).toBe(false);
    expect(response.body.data.izin).toEqual(['perm_satu']);
    delete process.env.JWT_SECRET;
  });

  it('GET /api/publik/auth/me memakai izin fallback array kosong saat izinDb bukan array', async () => {
    process.env.JWT_SECRET = 'test-secret-routes';
    ModelPengguna.ambilDenganId.mockResolvedValue({ id: 6, peran_id: 4 });
    ModelPengguna.ambilPeranUntukAuth.mockResolvedValue({ kode: '', akses_redaksi: true });
    ModelPengguna.ambilIzin.mockResolvedValue(null);

    const token = jwt.sign(
      {
        sub: 'google-nullizin',
        pid: 6,
        email: 'nullizin@example.com',
        name: 'Null Izin',
        provider: 'google',
        peran: 'pengguna',
        izin: [],
      },
      process.env.JWT_SECRET
    );

    const response = await request(createApp())
      .get('/api/publik/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.peran).toBe('pengguna');
    expect(response.body.data.akses_redaksi).toBe(true);
    expect(response.body.data.izin).toEqual([]);
    delete process.env.JWT_SECRET;
  });
});

