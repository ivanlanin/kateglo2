/**
 * @fileoverview Test runtime SSR frontend (helper, prefetch, dan runtime fallback)
 * @tested_in backend/services/sistem/layananSsrRuntime.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');
const request = require('supertest');

jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../../services/publik/layananKamusPublik', () => ({
  ambilDetailKamus: jest.fn(),
  ambilEntriAcak: jest.fn(),
}));

jest.mock('../../../services/publik/layananTesaurusPublik', () => ({
  ambilDetailTesaurus: jest.fn(),
}));

jest.mock('../../../services/publik/layananArtikelPublik', () => ({
  ambilDaftarArtikelPublik: jest.fn(),
  ambilDetailArtikelPublik: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelGlosarium', () => ({
  ambilPersisAsing: jest.fn(),
  cari: jest.fn(),
  resolveSlugBidang: jest.fn(),
}));

const logger = require('../../../config/logger');
const { ambilDaftarArtikelPublik, ambilDetailArtikelPublik } = require('../../../services/publik/layananArtikelPublik');
const { ambilDetailKamus, ambilEntriAcak } = require('../../../services/publik/layananKamusPublik');
const { ambilDetailTesaurus } = require('../../../services/publik/layananTesaurusPublik');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const runtime = require('../../../services/sistem/layananSsrRuntime');

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const frontendDistDir = path.join(repoRoot, 'frontend', 'dist');
const legacyFrontendDistDir = path.join(repoRoot, 'backend', 'frontend', 'dist');
const templatePath = path.join(frontendDistDir, 'index.html');
const serverDir = path.join(frontendDistDir, 'server');
const serverEntryPath = path.join(serverDir, 'entry-server.js');

let originalTemplate = null;
let originalTemplateExisted = false;
let originalEntry = null;
let originalEntryExisted = false;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeTemplate(html = null) {
  ensureDir(frontendDistDir);
  const content = html || `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>TemplateTitle</title>
    <meta name="description" content="TemplateDescription" />
    <link rel="canonical" href="https://kateglo.org/" />
    <meta property="og:title" content="TemplateOG" />
    <meta name="twitter:title" content="TemplateTW" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  fs.writeFileSync(templatePath, content, 'utf8');
}

function writeServerEntryWithRender() {
  ensureDir(serverDir);
  fs.writeFileSync(serverEntryPath, `export async function render(url, data) {
  if (globalThis.__SSR_TEST_THROW__) throw new Error('SSR_RENDER_FAIL');
  const type = data?.type || 'none';
  return {
    appHtml: '<main data-url="' + url + '">' + type + '</main>',
    headTags: '<title>SSR ' + type + '</title><meta name="description" content="' + type + '" />',
  };
}
`, 'utf8');
}

function createApp(loadSsrRenderer, prefetchSsrData) {
  const app = express();
  runtime.pasangFrontendRuntime(app, { loadSsrRenderer, prefetchSsrData });
  app.use((_req, res) => res.status(418).send('NEXT'));
  app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }));
  return app;
}

describe('services/sistem/layananSsrRuntime', () => {
  beforeAll(() => {
    originalTemplateExisted = fs.existsSync(templatePath);
    if (originalTemplateExisted) originalTemplate = fs.readFileSync(templatePath, 'utf8');
    originalEntryExisted = fs.existsSync(serverEntryPath);
    if (originalEntryExisted) originalEntry = fs.readFileSync(serverEntryPath, 'utf8');
  });

  afterAll(() => {
    if (originalTemplateExisted) fs.writeFileSync(templatePath, originalTemplate, 'utf8');
    else if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);

    if (originalEntryExisted) fs.writeFileSync(serverEntryPath, originalEntry, 'utf8');
    else if (fs.existsSync(serverEntryPath)) fs.unlinkSync(serverEntryPath);

    delete globalThis.__SSR_TEST_THROW__;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    writeTemplate();
    writeServerEntryWithRender();
    delete globalThis.__SSR_TEST_THROW__;

    ambilDetailKamus.mockResolvedValue({
      entri: [{
        lafal: '/lafal/',
        pemenggalan: 'pe·nggal',
        makna: [{ makna: 'makna 1', kelas_kata: 'n' }, { makna: 'makna 2', kelas_kata: 'v' }],
      }],
      tesaurus: { sinonim: ['sinonim'], antonim: ['antonim'] },
    });
    ambilEntriAcak.mockResolvedValue({ indeks: 'acak', url: '/kamus/detail/acak' });
    ambilDetailTesaurus.mockResolvedValue({ indeks: 'besar', sinonim: ['agung'], antonim: ['kecil'] });
    ModelGlosarium.cari.mockResolvedValue({ total: 2, data: [{ indonesia: 'istilah', asing: 'term' }] });
    ModelGlosarium.ambilPersisAsing.mockResolvedValue([{ id: 1, asing: 'bankrupt', indonesia: 'bangkrut' }]);
    ambilDaftarArtikelPublik.mockResolvedValue({
      total: 2,
      data: [
        { id: 1, slug: 'artikel-satu', judul: 'Artikel Satu', cuplikan: 'Cuplikan artikel satu.' },
        { id: 2, slug: 'artikel-dua', judul: 'Artikel Dua', cuplikan: 'Cuplikan artikel dua.' },
      ],
    });
    ambilDetailArtikelPublik.mockResolvedValue({
      id: 1,
      slug: 'artikel-satu',
      judul: 'Artikel Satu',
      konten: 'Isi artikel satu.',
      topik: ['bahasa'],
    });
  });

  it('helper isAssetRequest dan isBypassPath menutup semua cabang', () => {
    expect(runtime.__private.isAssetRequest()).toBe(false);
    expect(runtime.__private.isAssetRequest('/assets/app.js')).toBe(true);
    expect(runtime.__private.isAssetRequest('/kamus/detail/sara')).toBe(false);

    expect(runtime.__private.isBypassPath('/api/publik/kamus')).toBe(true);
    expect(runtime.__private.isBypassPath('/auth/google/callback')).toBe(true);
    expect(runtime.__private.isBypassPath('/health')).toBe(true);
    expect(runtime.__private.isBypassPath()).toBe(false);
    expect(runtime.__private.isBypassPath('/kamus')).toBe(false);

    expect(runtime.__private.isEjaanPagePath()).toBe(false);
    expect(runtime.__private.isEjaanPagePath('/ejaan')).toBe(true);
    expect(runtime.__private.isEjaanPagePath('/ejaan/')).toBe(true);
    expect(runtime.__private.isEjaanPagePath('/ejaan/huruf-kapital')).toBe(true);
    expect(runtime.__private.isEjaanPagePath('  /ejaan/huruf-kecil  ')).toBe(true);
    expect(runtime.__private.isEjaanPagePath('/ejaan/penggunaan-huruf/huruf-kapital')).toBe(false);

    expect(runtime.__private.isGramatikaPagePath()).toBe(false);
    expect(runtime.__private.isGramatikaPagePath('/gramatika')).toBe(true);
    expect(runtime.__private.isGramatikaPagePath('/gramatika/')).toBe(true);
    expect(runtime.__private.isGramatikaPagePath('/gramatika/preposisi')).toBe(true);
    expect(runtime.__private.isGramatikaPagePath('/gramatika/kata-tugas/preposisi')).toBe(false);

    const previousTtl = process.env.CACHE_TTL_SECONDS;
    delete process.env.CACHE_TTL_SECONDS;
    expect(runtime.__private.resolvePageCacheControl()).toBe('');
    expect(runtime.__private.resolvePageCacheControl('/kamus')).toBe('');
    expect(runtime.__private.resolvePageCacheControl('/ejaan')).toBe('public, max-age=1800');
    expect(runtime.__private.resolvePageCacheControl('/gramatika')).toBe('public, max-age=1800');
    expect(runtime.__private.resolvePageCacheControl('/gramatika/preposisi')).toBe('public, max-age=1800');
    process.env.CACHE_TTL_SECONDS = '3600';
    expect(runtime.__private.resolvePageCacheControl('/ejaan/huruf-kapital')).toBe('public, max-age=3600');
    process.env.CACHE_TTL_SECONDS = '0';
    expect(runtime.__private.resolvePageCacheControl('/ejaan/huruf-kapital')).toBe('public, max-age=1800');
    process.env.CACHE_TTL_SECONDS = 'tidak-valid';
    expect(runtime.__private.resolvePageCacheControl('/ejaan/huruf-kapital')).toBe('public, max-age=1800');
    if (previousTtl === undefined) {
      delete process.env.CACHE_TTL_SECONDS;
    } else {
      process.env.CACHE_TTL_SECONDS = previousTtl;
    }
  });

  it('helper strip/inject meta dan inject root app', () => {
    expect(runtime.__private.injectHeadTags('<head></head>')).toBe('<head></head>');
    const stripped = runtime.__private.stripReplaceableMeta(`
      <title>Old</title>
      <meta name="description" content="Old desc" />
      <link rel="canonical" href="https://old" />
      <meta property="og:title" content="old" />
      <meta name="twitter:title" content="old" />`);

    expect(stripped).not.toContain('Old');
    expect(stripped).not.toContain('og:title');

    const noHeadChange = runtime.__private.injectHeadTags('<head></head>', '');
    expect(noHeadChange).toBe('<head></head>');

    const withHead = runtime.__private.injectHeadTags('<head></head>', '<title>New</title>');
    expect(withHead).toContain('<title>New</title>');

    const withApp = runtime.__private.injectAppHtml('<div id="root"></div>', '<main>x</main>');
    expect(withApp).toContain('<div id="root"><main>x</main></div>');
    expect(runtime.__private.injectAppHtml('<div id="root"></div>')).toContain('<div id="root"></div>');

    const parsedMarkdown = runtime.__private.parseMarkdownFrontmatter('---\ntitle: Judul\ndescription: Ringkas\n---\nIsi');
    expect(parsedMarkdown.frontmatter.title).toBe('Judul');
    expect(parsedMarkdown.body).toBe('Isi');
    expect(runtime.__private.extractMarkdownSummary('# Judul\n\nParagraf ringkas pertama.')).toBe('Paragraf ringkas pertama.');
    expect(runtime.__private.rapikanItemRingkasanDaftarIsi('1) Nomina sebagai Subjek')).toBe('Nomina sebagai Subjek');
    expect(runtime.__private.extractMarkdownListSummary([
      '1. [Batasan dan Ciri Nomina](/gramatika/batasan-dan-ciri-nomina)',
      '   1. [1) Nomina sebagai Subjek](/gramatika/batasan-dan-ciri-nomina)',
      '2. [Makna Nomina](/gramatika/makna-nomina)',
    ].join('\n'))).toBe('Batasan dan Ciri Nomina, Nomina sebagai Subjek, Makna Nomina');
    expect(runtime.__private.extractMarkdownSummary([
      '1. [Batasan dan Ciri Nomina](/gramatika/batasan-dan-ciri-nomina)',
      '   1. [1) Nomina sebagai Subjek](/gramatika/batasan-dan-ciri-nomina)',
      '2. [Makna Nomina](/gramatika/makna-nomina)',
    ].join('\n'), 80)).toBe('Batasan dan Ciri Nomina, Nomina sebagai Subjek, Makna Nomina');
    expect(runtime.__private.buildMarkdownSlugMap('')).toBeInstanceOf(Map);
  });

  it('helper markdown menutup branch tanpa frontmatter dan truncate tanpa spasi', () => {
    expect(runtime.__private.parseMarkdownFrontmatter()).toEqual({ frontmatter: {}, body: '' });
    expect(runtime.__private.parseMarkdownFrontmatter('Isi polos')).toEqual({
      frontmatter: {},
      body: 'Isi polos',
    });
    expect(runtime.__private.truncateText()).toBe('');
    expect(runtime.__private.truncateText('abc', 5)).toBe('abc');
    expect(runtime.__private.truncateText('abc def ghij', 8)).toBe('abc def …');
    expect(runtime.__private.truncateText('abcdefghijk', 5)).toBe('abcde …');
  });

  it('helper markdown menutup branch invalid line, list pendek, dan summary kosong', () => {
    expect(runtime.__private.parseMarkdownFrontmatter('---\ninvalid\n:key\n : Kosong\njudul: Halo\n---\nIsi')).toEqual({
      frontmatter: { judul: 'Halo' },
      body: 'Isi',
    });
    expect(runtime.__private.bersihkanTeksMarkdown()).toBe('');
    expect(runtime.__private.rapikanItemRingkasanDaftarIsi()).toBe('');
    expect(runtime.__private.extractMarkdownListSummary('Satu baris saja')).toBe('');
    expect(runtime.__private.extractMarkdownListSummary()).toBe('');
    expect(runtime.__private.extractMarkdownListSummary('Paragraf biasa\n\nBaris dua')).toBe('');
    expect(runtime.__private.extractMarkdownSummary('### Judul')).toBe('### Judul');
    expect(runtime.__private.extractMarkdownSummary('123 test')).toBe('123 test');
    expect(runtime.__private.extractMarkdownSummary('1. Nomor saja', 20)).toBe('Nomor saja');
    expect(runtime.__private.extractMarkdownSummary('123abc')).toBe('123abc');
    expect(runtime.__private.extractMarkdownSummary(undefined)).toBe('');
    expect(runtime.__private.extractMarkdownSummary('')).toBe('');
  });

  it('helper markdown menutup branch slug duplikat dan section/slug invalid', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readdirSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue([
      'bab-01/pendahuluan.md',
      'bab-02/pendahuluan.md',
    ]);

    const slugMap = runtime.__private.buildMarkdownSlugMap('C:/dummy');
    expect(slugMap.size).toBe(1);
    expect(runtime.__private.readStaticMarkdownDocument()).toBeNull();
    expect(runtime.__private.readStaticMarkdownDocument('', 'slug')).toBeNull();
    expect(runtime.__private.readStaticMarkdownDocument('ejaan', '')).toBeNull();
    readdirSpy.mockRestore();
    existsSpy.mockRestore();

    expect(runtime.__private.listMarkdownDocumentPaths()).toEqual([]);
    expect(runtime.__private.buildMarkdownSlugMap()).toBeInstanceOf(Map);
  });

  it('listMarkdownDocumentPaths memfilter README, basename kosong, dan folder tersembunyi', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readdirSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue([
      'README.md',
      '.md',
      '_arsip/tersembunyi.md',
      'bab-01/pendahuluan.md',
    ]);

    const result = runtime.__private.listMarkdownDocumentPaths('C:/dummy');

    expect(result).toEqual(['bab-01/pendahuluan.md']);
    readdirSpy.mockRestore();
    existsSpy.mockRestore();
  });

  it('validateRendererModule mengembalikan render atau melempar error', async () => {
    const fn = jest.fn();
    expect(runtime.__private.validateRendererModule({ render: fn })).toBe(fn);
    expect(() => runtime.__private.validateRendererModule({})).toThrow('SSR bundle tidak mengekspor fungsi render(url)');
  });

  it('loadSsrRenderer memakai importModule/entryPath injeksi dan mengembalikan renderer valid', async () => {
    const renderFn = jest.fn();
    const importModule = jest.fn().mockResolvedValue({ render: renderFn });

    const result = await runtime.__private.loadSsrRenderer({
      entryPath: serverEntryPath,
      importModule,
    });

    expect(result).toBe(renderFn);
    expect(importModule).toHaveBeenCalledWith(pathToFileURL(serverEntryPath).href);
  });

  it('loadSsrRenderer melempar error jika modul tidak mengekspor render', async () => {
    const importModule = jest.fn().mockResolvedValue({});

    await expect(runtime.__private.loadSsrRenderer({
      entryPath: serverEntryPath,
      importModule,
    })).rejects.toThrow('SSR bundle tidak mengekspor fungsi render(url)');
  });

  it('prefetchSsrData menutup semua route branch + catch error', async () => {
    ModelGlosarium.resolveSlugBidang.mockResolvedValue({ id: 2, kode: 'Bio', nama: 'Biologi' });
    expect(await runtime.__private.prefetchSsrData()).toBeNull();

    const ejaanDetail = await runtime.__private.prefetchSsrData('/ejaan/huruf-kapital');
    const gramatikaDetail = await runtime.__private.prefetchSsrData('/gramatika/preposisi');
    const detail = await runtime.__private.prefetchSsrData('/kamus/detail/sara');
    const tesaurusCari = await runtime.__private.prefetchSsrData('/tesaurus/cari/besar');
    const tesaurusRoot = await runtime.__private.prefetchSsrData('/tesaurus');
    const glosariumBidang = await runtime.__private.prefetchSsrData('/glosarium/bidang/biologi');
    const glosariumSumber = await runtime.__private.prefetchSsrData('/glosarium/sumber/Pusba');
    const glosariumCari = await runtime.__private.prefetchSsrData('/glosarium/cari/air');
    const glosariumDetail = await runtime.__private.prefetchSsrData('/glosarium/detail/bankrupt');
    const kamusCari = await runtime.__private.prefetchSsrData('/kamus/cari/air');
    const artikelDaftar = await runtime.__private.prefetchSsrData('/artikel?topik=bahasa');
    const artikelDetail = await runtime.__private.prefetchSsrData('/artikel/artikel-satu');
    const unknown = await runtime.__private.prefetchSsrData('/apa-saja');

    expect(ejaanDetail.type).toBe('static-markdown');
    expect(ejaanDetail.section).toBe('ejaan');
    expect(gramatikaDetail.type).toBe('static-markdown');
    expect(gramatikaDetail.section).toBe('gramatika');
    expect(detail.type).toBe('kamus-detail');
    expect(tesaurusCari.type).toBe('tesaurus-detail');
    expect(tesaurusRoot).toBeNull();
    expect(glosariumBidang.type).toBe('glosarium-bidang');
    expect(glosariumSumber.type).toBe('glosarium-sumber');
    expect(glosariumCari.type).toBe('glosarium-cari');
    expect(glosariumDetail.type).toBe('glosarium-detail');
    expect(kamusCari.type).toBe('kamus-cari');
    expect(artikelDaftar.type).toBe('artikel-daftar');
    expect(artikelDaftar.topik).toBe('bahasa');
    expect(artikelDetail.type).toBe('artikel-detail');
    expect(artikelDetail.artikel.slug).toBe('artikel-satu');
    expect(unknown).toBeNull();

    ambilDetailKamus.mockRejectedValueOnce(new Error('db gagal'));
    const withError = await runtime.__private.prefetchSsrData('/kamus/detail/gagal');
    expect(withError).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('prefetchSsrData gagal untuk /kamus/detail/gagal: db gagal'));
  });

  it('prefetchSsrData menutup branch empty/null pada semua route', async () => {
    ModelGlosarium.resolveSlugBidang.mockResolvedValue(null);
    ambilDetailKamus.mockResolvedValueOnce(null);
    expect(await runtime.__private.prefetchSsrData('/kamus/detail/kosong')).toBeNull();

    ambilDetailKamus.mockResolvedValueOnce({ entri: [] });
    expect(await runtime.__private.prefetchSsrData('/kamus/detail/kosong2')).toBeNull();

    ambilDetailKamus.mockResolvedValueOnce({ entri: [{ makna: null }], tesaurus: null });
    const detailNoMakna = await runtime.__private.prefetchSsrData('/kamus/detail/nomakna');
    expect(detailNoMakna.type).toBe('kamus-detail');
    expect(detailNoMakna.semuaMakna).toEqual([]);
    expect(detailNoMakna.sinonim).toEqual([]);
    expect(detailNoMakna.antonim).toEqual([]);

    ambilDetailKamus.mockResolvedValueOnce({ entri: [{ makna: [{ makna: '' }, { kelas_kata: 'n' }] }] });
    const detailMaknaKosong = await runtime.__private.prefetchSsrData('/kamus/detail/kosong3');
    expect(detailMaknaKosong.semuaMakna).toEqual([]);

    ambilDetailTesaurus.mockResolvedValueOnce({ indeks: 'besar', sinonim: null, antonim: undefined });
    const tesaurusNullRelasi = await runtime.__private.prefetchSsrData('/tesaurus/cari/besar-null');
    expect(tesaurusNullRelasi.sinonim).toEqual([]);
    expect(tesaurusNullRelasi.antonim).toEqual([]);

    expect(await runtime.__private.prefetchSsrData('/kamus/detail/%20')).toBeNull();
    expect(await runtime.__private.prefetchSsrData('/tesaurus/cari/%20')).toBeNull();
    expect(await runtime.__private.prefetchSsrData('/glosarium/bidang/%20')).toBeNull();
    expect(await runtime.__private.prefetchSsrData('/glosarium/sumber/%20')).toBeNull();
    expect(await runtime.__private.prefetchSsrData('/glosarium/cari/%20')).toBeNull();
    expect(await runtime.__private.prefetchSsrData('/glosarium/detail/%20')).toBeNull();
    expect(await runtime.__private.prefetchSsrData('/kamus/cari/%20')).toBeNull();

    ambilDetailArtikelPublik.mockResolvedValueOnce(null);
    const artikelTidakAda = await runtime.__private.prefetchSsrData('/artikel/tidak-ada');
    expect(artikelTidakAda).toEqual({
      type: 'artikel-detail',
      slug: 'tidak-ada',
      notFound: true,
      artikel: null,
      artikelLain: [],
    });

    const ejaanTidakAda = await runtime.__private.prefetchSsrData('/ejaan/slug-tidak-ada');
    expect(ejaanTidakAda.notFound).toBe(true);

    const gramatikaTidakAda = await runtime.__private.prefetchSsrData('/gramatika/slug-tidak-ada');
    expect(gramatikaTidakAda.notFound).toBe(true);

    ambilDetailTesaurus.mockResolvedValueOnce(null);
    expect(await runtime.__private.prefetchSsrData('/tesaurus/cari/tidak-ada')).toBeNull();

    ModelGlosarium.cari.mockResolvedValueOnce({ total: 0, data: null });
    const bidangKosong = await runtime.__private.prefetchSsrData('/glosarium/bidang/kosong');
    expect(bidangKosong.contoh).toEqual([]);

    ModelGlosarium.cari.mockResolvedValueOnce({ total: 0, data: undefined });
    const sumberKosong = await runtime.__private.prefetchSsrData('/glosarium/sumber/kosong');
    expect(sumberKosong.contoh).toEqual([]);

    ModelGlosarium.cari.mockResolvedValueOnce({ total: 0, data: undefined });
    const cariKosong = await runtime.__private.prefetchSsrData('/glosarium/cari/kosong');
    expect(cariKosong.contoh).toEqual([]);

    ModelGlosarium.ambilPersisAsing.mockResolvedValueOnce(null);
    const detailKosong = await runtime.__private.prefetchSsrData('/glosarium/detail/tidak-ada');
    expect(detailKosong.type).toBe('glosarium-detail');
    expect(detailKosong.persis).toEqual([]);

    ambilDetailKamus.mockResolvedValueOnce(null);
    expect(await runtime.__private.prefetchSsrData('/kamus/cari/tidak-ada')).toBeNull();

    ambilDetailKamus.mockResolvedValueOnce({ entri: [{ makna: null }] });
    const kamusCariNoMakna = await runtime.__private.prefetchSsrData('/kamus/cari/tanpa-makna');
    expect(kamusCariNoMakna.semuaMakna).toEqual([]);

    ambilDetailKamus.mockResolvedValueOnce({ entri: [{ makna: [{ makna: '' }, { kelas_kata: 'n' }] }] });
    const kamusCariMaknaKosong = await runtime.__private.prefetchSsrData('/kamus/cari/makna-kosong');
    expect(kamusCariMaknaKosong.semuaMakna).toEqual([]);
  });

  it('pasangFrontendRuntime skip saat frontend build tidak ada', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const app = { use: jest.fn(), get: jest.fn() };
    runtime.pasangFrontendRuntime(app);

    expect(logger.warn).toHaveBeenCalledWith('Frontend build belum tersedia. Lewati pemasangan runtime frontend pada backend.');
    expect(app.use).not.toHaveBeenCalled();
    expect(app.get).not.toHaveBeenCalled();
    existsSpy.mockRestore();
  });

  it('resolveFrontendDistDir memprioritaskan frontend/dist di root workspace', () => {
    const legacyTemplatePath = path.join(legacyFrontendDistDir, 'index.html');
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((target) => {
      if (target === templatePath) return true;
      if (target === legacyTemplatePath) return true;
      return false;
    });

    expect(runtime.__private.resolveFrontendDistDir()).toBe(frontendDistDir);
    expect(runtime.__private.getFrontendTemplatePath()).toBe(templatePath);
    expect(runtime.__private.getFrontendServerEntryPath()).toBe(serverEntryPath);

    existsSpy.mockRestore();
  });

  it('pasangFrontendRuntime bypass /api, /auth/google, /health, asset', async () => {
    const app = createApp(
      jest.fn(async () => jest.fn(async () => ({ appHtml: '<main>x</main>', headTags: '<title>X</title>' }))),
      jest.fn(async () => ({ type: 'ok' }))
    );

    const api = await request(app).get('/api/x');
    const auth = await request(app).get('/auth/google/callback');
    const health = await request(app).get('/health');
    const asset = await request(app).get('/assets/a.js');

    expect(api.status).toBe(418);
    expect(auth.status).toBe(418);
    expect(health.status).toBe(418);
    expect(asset.status).toBe(418);
  });

  it('pasangFrontendRuntime fallback template statis saat bundle SSR tidak ada', async () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((target) => {
      if (target === serverEntryPath) return false;
      return true;
    });

    const app = createApp(jest.fn(), jest.fn());
    const response = await request(app).get('/kamus');

    expect(response.status).toBe(200);
    expect(response.text).toContain('TemplateTitle');
    existsSpy.mockRestore();
  });

  it('pasangFrontendRuntime fallback template statis tanpa SSR menambahkan cache untuk halaman ejaan', async () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((target) => {
      if (target === serverEntryPath) return false;
      return true;
    });

    const app = createApp(jest.fn(), jest.fn());
    const response = await request(app).get('/ejaan/huruf-kapital');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBeDefined();
    existsSpy.mockRestore();
  });

  it('pasangFrontendRuntime mengirim status 404 saat renderer menandai markdown tidak ditemukan', async () => {
    const app = createApp(
      async () => async (_url, data) => ({
        appHtml: '<main>not-found</main>',
        headTags: '<title>Not Found</title>',
        statusCode: data?.notFound ? 404 : 200,
      }),
      async () => ({ type: 'static-markdown', section: 'gramatika', slug: 'slug-tidak-ada', notFound: true })
    );

    const response = await request(app).get('/gramatika/slug-tidak-ada');

    expect(response.status).toBe(404);
    expect(response.text).toContain('not-found');
  });

  it('pasangFrontendRuntime dengan default loader/prefetch saat bundle ada', async () => {
    const realExistsSync = fs.existsSync.bind(fs);
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((target) => {
      if (target === templatePath || target === serverEntryPath) return true;
      return realExistsSync(target);
    });

    const app = createApp(undefined, undefined);
    const response = await request(app).get('/kamus/detail/sara');

    expect(response.status).toBe(200);
    existsSpy.mockRestore();
  });

  it('pasangFrontendRuntime render SSR normal dengan injected loader/prefetch', async () => {
    const renderFn = jest.fn(async (_url, data) => ({
      appHtml: `<main>${data.type}</main>`,
      headTags: `<title>SSR ${data.type}</title><meta name="description" content="${data.type}" />`,
    }));
    const loader = jest.fn(async () => renderFn);
    const prefetch = jest.fn(async () => ({ type: 'kamus-detail' }));
    const app = createApp(loader, prefetch);

    const response = await request(app).get('/kamus/detail/sara');

    expect(response.status).toBe(200);
    expect(loader).toHaveBeenCalled();
    expect(prefetch).toHaveBeenCalledWith('/kamus/detail/sara');
    expect(renderFn).toHaveBeenCalledWith('/kamus/detail/sara', { type: 'kamus-detail' });
    expect(response.text).toContain('<main>kamus-detail</main>');
    expect(response.text).toContain('<title>SSR kamus-detail</title>');
    expect(response.text).not.toContain('TemplateOG');
  });

  it('pasangFrontendRuntime me-redirect /kamus/acak sebelum SSR render', async () => {
    const loader = jest.fn(async () => jest.fn(async () => ({
      appHtml: '<main>tidak dipakai</main>',
      headTags: '<title>SSR</title>',
    })));
    const prefetch = jest.fn(async () => ({ type: 'kamus-detail' }));
    const app = createApp(loader, prefetch);

    const response = await request(app).get('/kamus/acak');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/kamus/detail/acak');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(ambilEntriAcak).toHaveBeenCalledTimes(1);
    expect(loader).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('pasangFrontendRuntime menambahkan header cache untuk halaman ejaan', async () => {
    const renderFn = jest.fn(async () => ({
      appHtml: '<main>ejaan</main>',
      headTags: '<title>SSR ejaan</title><meta name="description" content="ejaan" />',
    }));
    const app = createApp(jest.fn(async () => renderFn), jest.fn(async () => null));

    const indeks = await request(app).get('/ejaan');
    const detail = await request(app).get('/ejaan/huruf-kapital');
    const nonEjaan = await request(app).get('/kamus');

    expect(indeks.status).toBe(200);
    expect(detail.status).toBe(200);
    expect(indeks.headers['cache-control']).toBeDefined();
    expect(detail.headers['cache-control']).toBeDefined();
    expect(nonEjaan.headers['cache-control']).toBeUndefined();
  });

  it('pasangFrontendRuntime fallback ke template saat render error', async () => {
    const loader = jest.fn(async () => {
      throw new Error('render gagal');
    });
    const app = createApp(loader, jest.fn(async () => null));

    const response = await request(app).get('/kamus/detail/sara');

    expect(response.status).toBe(200);
    expect(response.text).toContain('TemplateTitle');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('SSR runtime fallback ke template statis: render gagal'));
  });

  it('pasangFrontendRuntime fallback karena render error tetap menambahkan cache untuk halaman ejaan', async () => {
    const loader = jest.fn(async () => {
      throw new Error('render gagal ejaan');
    });
    const app = createApp(loader, jest.fn(async () => null));

    const response = await request(app).get('/ejaan/huruf-kapital');

    expect(response.status).toBe(200);
    expect(response.text).toContain('TemplateTitle');
    expect(response.headers['cache-control']).toBeDefined();
  });

  it('pasangFrontendRuntime meneruskan error jika fallback template juga gagal', async () => {
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('template rusak');
    });
    const app = createApp(jest.fn(async () => jest.fn()), jest.fn(async () => null));

    const response = await request(app).get('/kamus/detail/sara');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('template rusak');
    readSpy.mockRestore();
  });

  it('pasangFrontendRuntime pakai fallback appHtml/headTags kosong saat renderer tidak kirim field', async () => {
    const renderFn = jest.fn(async () => ({}));
    const app = createApp(jest.fn(async () => renderFn), jest.fn(async () => ({ type: 'none' })));

    const response = await request(app).get('/kamus/detail/sara');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<div id="root"></div>');
    expect(response.text).toContain('TemplateTitle');
  });
});

