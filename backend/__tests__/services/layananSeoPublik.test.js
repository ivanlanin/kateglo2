/**
 * @fileoverview Test layananSeoPublik
 * @tested_in backend/services/layananSeoPublik.js
 */

const fs = require('node:fs');

jest.mock('../../models/modelLabel', () => ({
  ambilSemuaKategori: jest.fn(),
}));

jest.mock('../../models/modelGlosarium', () => ({
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
}));

const ModelLabel = require('../../models/modelLabel');
const ModelGlosarium = require('../../models/modelGlosarium');
const {
  resolveSiteBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  generateSitemapPaths,
  __private,
} = require('../../services/layananSeoPublik');

describe('layananSeoPublik.buildRobotsTxt', () => {
  it('membuat robots.txt dengan sitemap dan blok redaksi/api/auth', () => {
    const text = buildRobotsTxt('https://kateglo.org');

    expect(text).toContain('User-agent: *');
    expect(text).toContain('Disallow: /redaksi/');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain('Disallow: /auth/');
    expect(text).toContain('Sitemap: https://kateglo.org/sitemap.xml');
  });

  it('fallback ke localhost saat base URL tidak valid', () => {
    const text = buildRobotsTxt('ftp://invalid-url');

    expect(text).toContain('Sitemap: http://localhost:3000/sitemap.xml');
  });
});

describe('layananSeoPublik.buildSitemapXml', () => {
  it('membuat xml valid dengan deduplikasi path', () => {
    const xml = buildSitemapXml('https://kateglo.org/', ['/', '/kamus', '/kamus']);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://kateglo.org/</loc>');
    const countKamus = (xml.match(/<loc>https:\/\/kateglo.org\/kamus<\/loc>/g) || []).length;
    expect(countKamus).toBe(1);
  });

  it('menangani path relatif, path kosong, dan karakter XML khusus', () => {
    const xml = buildSitemapXml('invalid-base-url', ['kamus', '', '/glosarium?q=a&b=1']);

    expect(xml).toContain('<loc>http://localhost:3000/kamus</loc>');
    expect(xml).toContain('<loc>http://localhost:3000/glosarium?q=a&amp;b=1</loc>');
  });

  it('menggunakan default paths kosong saat argumen paths tidak diberikan', () => {
    const xml = buildSitemapXml('https://kateglo.org');

    expect(xml).toContain('<urlset');
    expect(xml).not.toContain('<url>');
  });
});

describe('layananSeoPublik.resolveSiteBaseUrl', () => {
  const envKeys = ['SITE_URL', 'PUBLIC_SITE_URL', 'APP_URL', 'FRONTEND_URL'];
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    envKeys.forEach((key) => delete process.env[key]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('memprioritaskan SITE_URL jika valid', () => {
    process.env.SITE_URL = 'https://kateglo.org/';
    process.env.PUBLIC_SITE_URL = 'https://public.example.com';

    const result = resolveSiteBaseUrl({ get: () => 'example.com', protocol: 'https' });

    expect(result).toBe('https://kateglo.org');
  });

  it('memakai kandidat env berikutnya jika sebelumnya tidak valid', () => {
    process.env.SITE_URL = 'not-a-url';
    process.env.PUBLIC_SITE_URL = '   ';
    process.env.APP_URL = 'https://app.example.com///';

    const result = resolveSiteBaseUrl({ get: () => 'example.com', protocol: 'https' });

    expect(result).toBe('https://app.example.com');
  });

  it('fallback ke host/protocol request dan default localhost', () => {
    const fromReq = resolveSiteBaseUrl({ get: () => 'kateglo.test:8080', protocol: 'https' });
    const fromDefault = resolveSiteBaseUrl({});

    expect(fromReq).toBe('https://kateglo.test:8080');
    expect(fromDefault).toBe('http://localhost:3000');
  });
});

describe('layananSeoPublik.generateSitemapPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('menggabungkan path statis + kategori kamus + kategori glosarium', async () => {
    ModelLabel.ambilSemuaKategori.mockResolvedValue({
      kelas_kata: [{ kode: 'n', nama: 'nomina' }],
      bidang: [{ kode: 'ti', nama: 'Teknologi Informasi' }],
      abjad: [{ kode: 'A', nama: 'A' }],
      bentuk: [],
      unsur_terikat: [],
      ekspresi: [],
      ragam: [],
      bahasa: [],
    });
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ kode: 'ekonomi', nama: 'Ekonomi' }]);
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([{ kode: 'kemdikbud', nama: 'Kemdikbud' }]);

    const paths = await generateSitemapPaths();

    expect(paths).toContain('/kamus');
    expect(paths).toContain('/tesaurus');
    expect(paths).toContain('/makna');
    expect(paths).toContain('/rima');
    expect(paths).toContain('/sumber');
    expect(paths).toContain('/alat');
    expect(paths).toContain('/alat/penganalisis-teks');
    expect(paths).toContain('/alat/penghitung-huruf');
    expect(paths).toContain('/gim');
    expect(paths).toContain('/gim/kuis-kata');
    expect(paths).toContain('/gim/susun-kata/harian');
    expect(paths).toContain('/gim/susun-kata/bebas');
    expect(paths).toContain('/ejaan');
    expect(paths).toContain('/ejaan/huruf-kapital');
    expect(paths).toContain('/kamus/kelas/nomina');
    expect(paths).toContain('/kamus/bidang/teknologi-informasi');
    expect(paths).toContain('/kamus/abjad/a');
    expect(paths).toContain('/glosarium/bidang/ekonomi');
    expect(paths).toContain('/glosarium/sumber/kemdikbud');
    expect(paths.some((path) => path.startsWith('/redaksi'))).toBe(false);
  });
});

describe('layananSeoPublik private helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalisasi kategori path ke route publik kamus', () => {
    expect(__private.normalisasiKategoriPath()).toBe('');
    expect(__private.normalisasiKategoriPath('kelas_kata')).toBe('kelas');
    expect(__private.normalisasiKategoriPath('kelas-kata')).toBe('kelas');
    expect(__private.normalisasiKategoriPath('kelas')).toBe('kelas');
    expect(__private.normalisasiKategoriPath('unsur_terikat')).toBe('bentuk');
    expect(__private.normalisasiKategoriPath('ragam')).toBe('ragam');
  });

  it('menentukan slug label berdasarkan kategori dan fallback kode/nama', () => {
    expect(__private.tentukanSlugLabel()).toBe('');
    expect(__private.tentukanSlugLabel('kelas_kata', { kode: 'n', nama: 'Nomina Dasar' })).toBe('nomina-dasar');
    expect(__private.tentukanSlugLabel('abjad', { kode: 'A' })).toBe('a');
    expect(__private.tentukanSlugLabel('abjad', { nama: '  Huruf A  ' })).toBe('huruf-a');
  });

  it('normalisasi slug dan encoding path mendukung default argumen', () => {
    expect(__private.normalisasiSlug()).toBe('');
    expect(__private.encodePathSegment()).toBe('');
    expect(__private.encodePathSegment('teknik kimia')).toBe('teknik%20kimia');
  });

  it('buildPathKamusKategori mengembalikan kosong jika data tidak valid', () => {
    expect(__private.buildPathKamusKategori('ragam')).toBe('');
    expect(__private.buildPathKamusKategori('', { kode: 'n' })).toBe('');
    expect(__private.buildPathKamusKategori('ragam', {})).toBe('');
  });

  it('escapeXml mengubah semua karakter spesial XML', () => {
    expect(__private.escapeXml()).toBe('');
    const escaped = __private.escapeXml('<tag attr="v&x">\'isi\'</tag>');
    expect(escaped).toBe('&lt;tag attr=&quot;v&amp;x&quot;&gt;&apos;isi&apos;&lt;/tag&gt;');
  });

  it('ambilPathKamusKategori mengabaikan kategori yang bukan array dan label invalid', async () => {
    ModelLabel.ambilSemuaKategori.mockResolvedValue({
      abjad: [{ nama: 'A' }, {}],
      ragam: null,
    });

    const paths = await __private.ambilPathKamusKategori();

    expect(paths).toContain('/kamus/abjad/a');
    expect(paths).toHaveLength(1);
  });

  it('ambilPathGlosariumKategori memakai fallback bidang/sumber/nama', async () => {
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([
      { kode: 'eko', nama: 'Ekonomi', slug: 'ekonomi' },
      { bidang: 'teknik kimia' },
      { nama: 'sains data' },
      {},
    ]);
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue([
      { kode: 'kateglo' },
      { sumber: 'kemdikbud' },
      { nama: 'Badan Bahasa' },
      {},
    ]);

    const paths = await __private.ambilPathGlosariumKategori();

    expect(paths).toEqual([
      '/glosarium/bidang/ekonomi',
      '/glosarium/bidang/teknik-kimia',
      '/glosarium/bidang/sains-data',
      '/glosarium/sumber/kateglo',
      '/glosarium/sumber/kemdikbud',
      '/glosarium/sumber/Badan%20Bahasa',
    ]);
  });

  it('ambilPathGlosariumKategori fallback ke array kosong saat data null', async () => {
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue(null);
    ModelGlosarium.ambilDaftarSumber.mockResolvedValue(undefined);

    const paths = await __private.ambilPathGlosariumKategori();

    expect(paths).toEqual([]);
  });

  it('ambilPathEjaan mengembalikan array kosong saat folder ejaan tidak ada', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const paths = __private.ambilPathEjaan();

    expect(paths).toEqual([]);
    existsSpy.mockRestore();
  });

  it('ambilPathEjaan mengabaikan file markdown dengan basename kosong', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readdirSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue([
      {
        isFile: () => true,
        name: '.md',
      },
    ]);

    const paths = __private.ambilPathEjaan();

    expect(paths).toEqual([]);
    readdirSpy.mockRestore();
    existsSpy.mockRestore();
  });
});
