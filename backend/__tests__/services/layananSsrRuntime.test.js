/**
 * @fileoverview Test runtime SSR frontend (helper, prefetch, dan runtime fallback)
 * @tested_in backend/services/layananSsrRuntime.js
 */

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const request = require('supertest');

jest.mock('../../config/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../services/layananKamusPublik', () => ({
  ambilDetailKamus: jest.fn(),
}));

jest.mock('../../services/layananTesaurusPublik', () => ({
  ambilDetailTesaurus: jest.fn(),
}));

jest.mock('../../models/modelGlosarium', () => ({
  cari: jest.fn(),
}));

const logger = require('../../config/logger');
const { ambilDetailKamus } = require('../../services/layananKamusPublik');
const { ambilDetailTesaurus } = require('../../services/layananTesaurusPublik');
const ModelGlosarium = require('../../models/modelGlosarium');
const runtime = require('../../services/layananSsrRuntime');

const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
const frontendDistDir = path.join(workspaceRoot, 'frontend', 'dist');
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

describe('services/layananSsrRuntime', () => {
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
    ambilDetailTesaurus.mockResolvedValue({ indeks: 'besar', sinonim: ['agung'], antonim: ['kecil'] });
    ModelGlosarium.cari.mockResolvedValue({ total: 2, data: [{ indonesia: 'istilah', asing: 'term' }] });
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
  });

  it('validateRendererModule mengembalikan render atau melempar error', async () => {
    const fn = jest.fn();
    expect(runtime.__private.validateRendererModule({ render: fn })).toBe(fn);
    expect(() => runtime.__private.validateRendererModule({})).toThrow('SSR bundle tidak mengekspor fungsi render(url)');
  });

  it('prefetchSsrData menutup semua route branch + catch error', async () => {
    expect(await runtime.__private.prefetchSsrData()).toBeNull();

    const detail = await runtime.__private.prefetchSsrData('/kamus/detail/sara');
    const tesaurusCari = await runtime.__private.prefetchSsrData('/tesaurus/cari/besar');
    const tesaurusRoot = await runtime.__private.prefetchSsrData('/tesaurus');
    const glosariumBidang = await runtime.__private.prefetchSsrData('/glosarium/bidang/biologi');
    const glosariumSumber = await runtime.__private.prefetchSsrData('/glosarium/sumber/Pusba');
    const glosariumCari = await runtime.__private.prefetchSsrData('/glosarium/cari/air');
    const kamusCari = await runtime.__private.prefetchSsrData('/kamus/cari/air');
    const unknown = await runtime.__private.prefetchSsrData('/apa-saja');

    expect(detail.type).toBe('kamus-detail');
    expect(tesaurusCari.type).toBe('tesaurus-detail');
    expect(tesaurusRoot).toBeNull();
    expect(glosariumBidang.type).toBe('glosarium-bidang');
    expect(glosariumSumber.type).toBe('glosarium-sumber');
    expect(glosariumCari.type).toBe('glosarium-cari');
    expect(kamusCari.type).toBe('kamus-cari');
    expect(unknown).toBeNull();

    ambilDetailKamus.mockRejectedValueOnce(new Error('db gagal'));
    const withError = await runtime.__private.prefetchSsrData('/kamus/detail/gagal');
    expect(withError).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('prefetchSsrData gagal untuk /kamus/detail/gagal: db gagal'));
  });

  it('prefetchSsrData menutup branch empty/null pada semua route', async () => {
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
    expect(await runtime.__private.prefetchSsrData('/kamus/cari/%20')).toBeNull();

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
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((target) => {
      if (target === templatePath) return false;
      return true;
    });

    const app = { use: jest.fn(), get: jest.fn() };
    runtime.pasangFrontendRuntime(app);

    expect(logger.warn).toHaveBeenCalledWith('Frontend build belum tersedia. Lewati pemasangan runtime frontend pada backend.');
    expect(app.use).not.toHaveBeenCalled();
    expect(app.get).not.toHaveBeenCalled();
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
