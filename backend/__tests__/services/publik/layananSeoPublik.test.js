/**
 * @fileoverview Test layananSeoPublik
 * @tested_in backend/services/publik/layananSeoPublik.js
 */

const fs = require('node:fs');

jest.mock('@resvg/resvg-js', () => ({
  Resvg: jest.fn().mockImplementation(() => ({
    render: () => ({
      asPng: () => Buffer.alloc(2048, 1),
    }),
  })),
}));

jest.mock('../../../models/master/modelLabel', () => ({
  ambilSemuaKategori: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelGlosarium', () => ({
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
}));

const ModelLabel = require('../../../models/master/modelLabel');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const {
  resolveSiteBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  generateSitemapPaths,
  buildOgImagePayload,
  buildOgImageSvg,
  renderOgImagePng,
  __private,
} = require('../../../services/publik/layananSeoPublik');

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
    expect(paths).toContain('/gramatika');
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

  it('ambilPathGramatika mengembalikan array kosong saat folder gramatika tidak ada', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const paths = __private.ambilPathGramatika();

    expect(paths).toEqual([]);
    existsSpy.mockRestore();
  });

  it('ambilPathGramatika mengembalikan path gramatika dari file markdown', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readdirSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue([
      { isFile: () => true, name: 'preposisi.md' },
      { isFile: () => true, name: 'konjungsi.md' },
      { isFile: () => true, name: 'README.md' },
      { isFile: () => false, name: 'kata-tugas' },
      { isFile: () => true, name: '.md' },
    ]);

    const paths = __private.ambilPathGramatika();

    expect(paths).toContain('/gramatika/preposisi');
    expect(paths).toContain('/gramatika/konjungsi');
    expect(paths).not.toContain('/gramatika/README');
    expect(paths).not.toContain('/gramatika/kata-tugas');
    expect(paths).not.toContain('/gramatika/');
    readdirSpy.mockRestore();
    existsSpy.mockRestore();
  });

  it('helper og image menormalisasi input dan membagi baris judul', () => {
    expect(__private.pickQueryValue(['judul utama', 'cadangan'])).toBe('judul utama');
    expect(__private.pickQueryValue()).toBe('');
    expect(__private.truncatePlainTextWithOptions()).toBe('');
    expect(__private.truncatePlainText('kata pendek', 20)).toBe('kata pendek');
    expect(__private.truncatePlainTextWithOptions('kata pendek', 20, { forceEllipsis: true })).toBe('kata pendek…');
    expect(__private.truncatePlainText('ini teks yang cukup panjang untuk dipotong secara aman', 24)).toMatch(/…$/);
    expect(__private.truncatePlainTextWithOptions('ini teks yang cukup panjang untuk dipotong secara aman', 24, { leadingSpaceBeforeEllipsis: true })).toMatch(/ …$/);
    expect(__private.formatTitleFromSlug('huruf-kapital')).toBe('Huruf Kapital');
    expect(__private.normalizeOgSection('Gramatika')).toBe('gramatika');
    expect(__private.normalizeOgSection('Kamus')).toBe('kamus');
    expect(__private.normalizeOgSection('lainnya')).toBe('default');
    expect(__private.stripRepeatedOgContextTitle('gajah', 'gajah: binatang besar')).toBe('binatang besar');
    expect(__private.normalizeOgContext('gajah', 'gajah: binatang menyusui berbelalai bergading berkaki besar dan berkulit tebal berdaun telinga lebar', 'fallback', { stripRepeatedTitle: true })).toMatch(/^binatang menyusui/);
    expect(__private.normalizeOgContext('gajah', 'gajah: binatang menyusui', 'fallback')).toBe('gajah: binatang menyusui');

    const lines = __private.splitOgTextIntoLines('Preposisi dalam konstruksi verba taktransitif yang panjang sekali', 16, 3);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(__private.renderSvgTextLines(['Baris Satu', 'Baris Dua'], { x: 10, y: 20, lineHeight: 30 })).toContain('<tspan x="10" y="20">Baris Satu</tspan>');
    expect(__private.ogImageDimensions).toEqual({ width: 1200, height: 630 });
  });

  it('helper og image menutup branch array, slug kosong, dan potong tanpa spasi', () => {
    expect(__private.pickQueryValue()).toBe('');
    expect(__private.pickQueryValue([])).toBe('');
    expect(__private.pickQueryValue(['judul array'])).toBe('judul array');
    expect(__private.truncatePlainText()).toBe('');
    expect(__private.truncatePlainText('abcdefghij', 5)).toBe('abcde…');
    expect(__private.formatTitleFromSlug()).toBe('');
    expect(__private.normalizeOgSection()).toBe('default');
    expect(buildOgImagePayload()).toMatchObject({
      section: 'default',
      sectionLabel: 'Bahasa Indonesia',
    });
    expect(buildOgImagePayload({ section: 'ejaan' })).toMatchObject({
      title: 'Panduan Ejaan Bahasa Indonesia',
      context: 'Pedoman Bahasa Indonesia',
    });
    expect(buildOgImagePayload({ section: 'ejaan', slug: 'huruf-kapital' })).toMatchObject({
      section: 'ejaan',
      title: 'Huruf Kapital',
      context: 'Kaidah Bahasa Indonesia',
    });
    expect(buildOgImagePayload().logoDataUri).toMatch(/^data:image\/png;base64,/);
  });

  it('helper og image menutup branch judul berulang tanpa pemisah', () => {
    expect(__private.escapeRegex()).toBe('');
    expect(__private.escapeRegex('c++')).toBe('c\\+\\+');
    expect(__private.stripRepeatedOgContextTitle()).toBe('');
    expect(__private.stripRepeatedOgContextTitle('', '  konteks tanpa judul  ')).toBe('konteks tanpa judul');
    expect(__private.stripRepeatedOgContextTitle('gajah', '')).toBe('');
    expect(__private.stripRepeatedOgContextTitle('gajah', 'gajah binatang besar')).toBe('binatang besar');
    expect(__private.stripRepeatedOgContextTitle('gajah', 'gajah')).toBe('gajah');
    expect(__private.stripRepeatedOgContextTitle('c++', 'c++: bahasa pemrograman')).toBe('bahasa pemrograman');
    expect(__private.normalizeOgContext()).toBe('');
    expect(__private.normalizeOgContext('', '', 'fallback')).toBe('fallback');
    expect(__private.normalizeOgContext('gajah', 'gajah binatang besar', 'fallback', { stripRepeatedTitle: true })).toBe('binatang besar');
  });

  it('helper og image menutup branch teks kosong, pemotongan, dan fallback palette', () => {
    expect(__private.splitOgTextIntoLines()).toEqual(['Kateglo']);
    expect(__private.splitOgTextIntoLines(null, 10, 2)).toEqual(['Kateglo']);
    expect(__private.splitOgTextIntoLines('', 10, 2)).toEqual(['Kateglo']);
    expect(__private.splitOgTextIntoLines('supercalifragilistic kata lain lagi', 10, 2)).toEqual(['supercalifragilistic', 'kata lain…']);
    expect(__private.splitOgTextIntoLines('satu dua tiga empat lima', 8, 2)).toEqual(['satu dua', 'tiga…']);
    expect(__private.splitOgTextIntoLines('satu dua tiga empat lima enam tujuh', 8, 1)).toEqual(['satu dua…']);
    expect(__private.splitOgTextIntoLines('aa bb cc', 2, 1)).toEqual(['aa…']);
    expect(__private.splitOgTextIntoLines('aaaa bbbbbbbbbbbbbbbb cccccccccccccccc', 8, 2)[1]).toMatch(/…$/);
    expect(__private.splitOgTextIntoLines('satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas dua belas', 10, 3, { leadingSpaceBeforeEllipsis: true })[2]).toMatch(/ …$/);

    const svg = buildOgImageSvg({
      section: 'tidak-ada',
      title: '',
      context: 'Ringkas',
      sectionLabel: 'Bahasa Indonesia',
      cta: 'CTA',
      logoDataUri: 'data:image/png;base64,abc',
    });

    expect(svg).toContain('linearGradient');
    expect(svg).toContain('Bahasa Indonesia');
    expect(svg).toContain('<image href="data:image/png;base64,abc"');
    expect(svg).not.toContain('font-size="32"');
    expect(buildOgImageSvg()).toContain('<svg');
    expect(buildOgImageSvg(buildOgImagePayload({ title: 'satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas' }))).toContain('font-size="68"');
    expect(__private.renderSvgTextLines()).toBe('');
    expect(__private.getOgLogoDataUri()).toMatch(/^data:image\/png;base64,/);
    expect(Buffer.isBuffer(renderOgImagePng())).toBe(true);
  });

  it('buildOgImagePayload menutup semua fallback section OG', () => {
    expect(buildOgImagePayload({ section: 'tesaurus' })).toMatchObject({
      section: 'tesaurus',
      sectionLabel: 'Tesaurus',
      context: 'Sinonim, antonim, dan relasi kata',
    });
    expect(buildOgImagePayload({ section: 'glosarium' })).toMatchObject({
      section: 'glosarium',
      sectionLabel: 'Glosarium',
      context: 'Istilah dan padanan bidang ilmu',
    });
    expect(buildOgImagePayload({ section: 'makna' })).toMatchObject({
      section: 'makna',
      sectionLabel: 'Makna',
      context: 'Cari kata berdasarkan makna',
    });
    expect(buildOgImagePayload({ section: 'rima' })).toMatchObject({
      section: 'rima',
      sectionLabel: 'Rima',
      context: 'Cari kata berdasarkan rima',
    });
    expect(buildOgImagePayload({ section: 'alat' })).toMatchObject({
      section: 'alat',
      sectionLabel: 'Alat',
      context: 'Penganalisis teks dan penghitung huruf',
    });
    expect(buildOgImagePayload({ section: 'gim' })).toMatchObject({
      section: 'gim',
      sectionLabel: 'Gim',
      context: 'Kuis kata dan susun kata',
    });
    expect(buildOgImagePayload({ section: 'gramatika' })).toMatchObject({
      section: 'gramatika',
      sectionLabel: 'Gramatika',
      title: 'Panduan Tata Bahasa Indonesia',
      context: 'Panduan Bahasa Indonesia',
    });
  });
});

describe('layananSeoPublik dynamic og image', () => {
  it('getOgLogoDataUri fallback ke string kosong saat logo gagal dibaca', () => {
    const readFileSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('logo tidak tersedia');
    });

    let isolatedPrivate;
    jest.isolateModules(() => {
      ({ __private: isolatedPrivate } = require('../../../services/publik/layananSeoPublik'));
    });

    expect(isolatedPrivate.getOgLogoDataUri()).toBe('');
    readFileSpy.mockRestore();
  });

  it('buildOgImagePayload memberi fallback sesuai section', () => {
    expect(buildOgImagePayload({ section: 'gramatika', slug: 'preposisi' })).toEqual({
      section: 'gramatika',
      sectionLabel: 'Gramatika',
      title: 'Preposisi',
      context: 'Tata Bahasa Indonesia',
      cta: 'Baca di Kateglo',
      logoDataUri: expect.stringMatching(/^data:image\/png;base64,/),
    });

    expect(buildOgImagePayload({ section: 'default', title: 'Kamus', context: 'Bahasa' }).title).toBe('Kamus');
    expect(buildOgImagePayload({ section: 'kamus', title: 'gajah', context: 'gajah: binatang menyusui berbelalai bergading berkaki besar berkulit tebal', stripRepeatedTitle: true }).context).toBe('binatang menyusui berbelalai bergading berkaki besar berkulit tebal');
    expect(buildOgImagePayload({ section: 'glosarium', title: 'accounting', context: 'accounting: istilah akuntansi' }).context).toBe('accounting: istilah akuntansi');
    expect(buildOgImagePayload({ section: 'kamus' })).toMatchObject({
      section: 'kamus',
      sectionLabel: 'Kamus',
      context: 'Entri dan pencarian kamus',
    });
  });

  it('buildOgImageSvg menghasilkan svg branded dan renderOgImagePng mengembalikan buffer png', () => {
    const svg = buildOgImageSvg(buildOgImagePayload({
      section: 'ejaan',
      slug: 'huruf-kapital',
      title: 'Huruf Kapital',
      context: 'Penggunaan Huruf',
    }));

    expect(svg).toContain('<svg');
    expect(svg).toContain('Huruf Kapital');
    expect(svg).toContain('Penggunaan Huruf');
    expect(svg).toContain('<image href="data:image/png;base64,');

    const pngBuffer = renderOgImagePng({
      section: 'ejaan',
      slug: 'huruf-kapital',
      title: 'Huruf Kapital',
      context: 'Penggunaan Huruf',
    });

    expect(Buffer.isBuffer(pngBuffer)).toBe(true);
    expect(pngBuffer.length).toBeGreaterThan(1000);
  });
});

