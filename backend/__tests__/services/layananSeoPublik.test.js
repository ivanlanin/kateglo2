/**
 * @fileoverview Test layananSeoPublik
 * @tested_in backend/services/layananSeoPublik.js
 */

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
});

describe('layananSeoPublik.buildSitemapXml', () => {
  it('membuat xml valid dengan deduplikasi path', () => {
    const xml = buildSitemapXml('https://kateglo.org/', ['/', '/kamus', '/kamus']);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://kateglo.org/</loc>');
    const countKamus = (xml.match(/<loc>https:\/\/kateglo.org\/kamus<\/loc>/g) || []).length;
    expect(countKamus).toBe(1);
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
    expect(paths).toContain('/kamus/kelas/nomina');
    expect(paths).toContain('/kamus/bidang/teknologi-informasi');
    expect(paths).toContain('/kamus/abjad/a');
    expect(paths).toContain('/glosarium/bidang/ekonomi');
    expect(paths).toContain('/glosarium/sumber/kemdikbud');
    expect(paths.some((path) => path.startsWith('/redaksi'))).toBe(false);
  });
});

describe('layananSeoPublik private helpers', () => {
  it('normalisasi kategori path ke route publik kamus', () => {
    expect(__private.normalisasiKategoriPath('kelas_kata')).toBe('kelas');
    expect(__private.normalisasiKategoriPath('unsur_terikat')).toBe('bentuk');
    expect(__private.normalisasiKategoriPath('ragam')).toBe('ragam');
  });
});
