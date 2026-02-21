import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/App', () => ({
  default: () => <div>App SSR Mock</div>,
}));

vi.mock('../src/context/authContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
}));

import { render, __private } from '../src/entry-server';

describe('entry-server', () => {
  const originalProcess = globalThis.process;

  beforeEach(() => {
    globalThis.process = {
      ...(originalProcess || {}),
      env: {
        ...((originalProcess && originalProcess.env) || {}),
        PUBLIC_SITE_URL: 'https://kateglo.org/',
      },
    };
  });

  afterEach(() => {
    globalThis.process = originalProcess;
  });

  it('helper utilitas bekerja untuk escape, strip, dan truncate', () => {
    expect(__private.escapeHtml(`<a>&"'</a>`)).toBe('&lt;a&gt;&amp;&quot;&#39;&lt;/a&gt;');
    expect(__private.stripTrailingSlash('https://kateglo.org///')).toBe('https://kateglo.org');
    expect(__private.stripTrailingSlash()).toBe('');

    expect(__private.truncate('pendek', 10)).toBe('pendek');
    expect(__private.truncate('ini kalimat sangat panjang sekali untuk dipotong', 20)).toMatch(/…$/);
    expect(__private.truncate('x'.repeat(220), 20)).toBe(`${'x'.repeat(20)}…`);
  });

  it('builder deskripsi kamus menutup semua cabang', () => {
    expect(__private.buildKamusDescription('sara', { semuaMakna: [], lafal: '' })).toContain('Lihat detail entri kamus');

    const satuMakna = __private.buildKamusDescription('sara', {
      lafal: '/sa.ra/',
      semuaMakna: [{ makna: 'makna tunggal', kelas_kata: 'n' }],
    });
    expect(satuMakna).toContain('/sa.ra/');
    expect(satuMakna).toContain('(n)');

    const multiMakna = __private.buildKamusDescription('sara', {
      lafal: null,
      semuaMakna: [
        { makna: 'makna 1', kelas_kata: 'n' },
        { makna: 'makna 2', kelas_kata: 'v' },
      ],
    });
    expect(multiMakna).toContain('(1)');
    expect(multiMakna).toContain('(2)');
  });

  it('builder tesaurus dan glosarium menutup semua cabang', () => {
    expect(__private.buildTesaurusDescription('besar', { sinonim: [], antonim: [] })).toContain('Hasil pencarian tesaurus');

    const tesaurusLengkap = __private.buildTesaurusDescription('besar', {
      sinonim: ['agung', 'akbar'],
      antonim: ['kecil'],
    });
    expect(tesaurusLengkap).toContain('Sinonim');
    expect(tesaurusLengkap).toContain('Antonim');

    expect(__private.buildGlosariumCariDescription('air', { total: 0, contoh: [] })).toContain('Hasil pencarian glosarium');

    const glosariumAda = __private.buildGlosariumCariDescription('air', {
      total: 5,
      contoh: [{ indonesia: 'air tanah', asing: 'groundwater' }],
    });
    expect(glosariumAda).toContain('5 hasil');
    expect(glosariumAda).toContain('Contoh');
  });

  it('buildMetaForPath menutup seluruh jalur route', () => {
    const site = 'https://kateglo.org';

    expect(__private.buildMetaForPath('/kamus/detail/%20', site).title).toBe('Kamus — Kateglo');

    const kamusDetailRich = __private.buildMetaForPath('/kamus/detail/sara', site, {
      type: 'kamus-detail',
      semuaMakna: [{ makna: 'makna detail', kelas_kata: 'n' }],
      lafal: '/sa.ra/',
    });
    expect(kamusDetailRich.title).toBe('sara — Kateglo');
    expect(kamusDetailRich.description).toContain('makna detail');

    expect(__private.buildMetaForPath('/kamus/cari/%20', site).title).toBe('Kamus — Kateglo');
    const kamusCariRich = __private.buildMetaForPath('/kamus/cari/air', site, {
      type: 'kamus-cari',
      semuaMakna: [{ makna: 'cairan jernih', kelas_kata: 'n' }],
    });
    expect(kamusCariRich.title).toBe('Hasil Pencarian "air" di Kamus — Kateglo');
    expect(kamusCariRich.description).toContain('air:');

    const kamusKategori = __private.buildMetaForPath('/kamus/kelas-kata/nomina', site);
    expect(kamusKategori.title).toBe('Kelas Kata Nomina — Kateglo');
    expect(kamusKategori.description).toContain('kategori kelas kata Nomina');

    const kamusKategoriAlias = __private.buildMetaForPath('/kamus/kelas/verba', site);
    expect(kamusKategoriAlias.title).toBe('Kelas Kata Verba — Kateglo');
    expect(__private.buildMetaForPath('/kamus', site).title).toBe('Kamus — Kateglo');

    expect(__private.buildMetaForPath('/tesaurus/cari/%20', site).title).toBe('Tesaurus — Kateglo');
    const tesaurusRich = __private.buildMetaForPath('/tesaurus/cari/besar', site, {
      type: 'tesaurus-detail',
      sinonim: ['agung'],
      antonim: ['kecil'],
    });
    expect(tesaurusRich.description).toContain('Sinonim');

    expect(__private.buildMetaForPath('/tesaurus', site).title).toBe('Tesaurus — Kateglo');

    expect(__private.buildMetaForPath('/glosarium/cari/%20', site).title).toBe('Glosarium — Kateglo');
    const glosariumCari = __private.buildMetaForPath('/glosarium/cari/air', site, {
      type: 'glosarium-cari',
      total: 2,
      contoh: [{ indonesia: 'air tanah', asing: 'groundwater' }],
    });
    expect(glosariumCari.description).toContain('2 hasil');

    expect(__private.buildMetaForPath('/glosarium/bidang/%20', site).title).toBe('Glosarium — Kateglo');
    const glosariumBidang = __private.buildMetaForPath('/glosarium/bidang/biologi', site, {
      type: 'glosarium-bidang',
      total: 10,
      contoh: [{ indonesia: 'sel', asing: 'cell' }],
    });
    expect(glosariumBidang.title).toBe('Glosarium Biologi — Kateglo');

    expect(__private.buildMetaForPath('/glosarium/sumber/%20', site).title).toBe('Glosarium — Kateglo');
    const glosariumSumber = __private.buildMetaForPath('/glosarium/sumber/Pusba', site, {
      type: 'glosarium-sumber',
      total: 10,
      contoh: [{ indonesia: 'sel', asing: 'cell' }],
    });
    expect(glosariumSumber.title).toBe('Glosarium Pusba — Kateglo');

    expect(__private.buildMetaForPath('/glosarium', site).title).toBe('Glosarium — Kateglo');
    expect(__private.buildMetaForPath('/kebijakan-privasi', site).title).toBe('Kebijakan Privasi — Kateglo');

    const defaultMeta = __private.buildMetaForPath('/random', site);
    expect(defaultMeta.title).toContain('Kateglo — Kamus');
    expect(defaultMeta.canonicalUrl).toBe('https://kateglo.org/random');
  });

  it('render menghasilkan appHtml + headTags dengan canonical dan escaped content', async () => {
    const { appHtml, headTags } = await render('/kamus/detail/sara?q=1', {
      type: 'kamus-detail',
      lafal: '/sa.ra/',
      semuaMakna: [{ makna: 'x < y & z', kelas_kata: 'n' }],
    });

    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('canonical');
    expect(headTags).toContain('https://kateglo.org/kamus/detail/sara');
    expect(headTags).toContain('&lt;');
    expect(headTags).toContain('&amp;');
  });

  it('render fallback site URL saat process/global/env tidak tersedia', async () => {
    const originalGlobal = globalThis.process;
    delete globalThis.process;

    const { headTags } = await render('/');
    expect(headTags).toContain('https://kateglo.org/Logo%20Kateglo.png');

    globalThis.process = originalGlobal;
  });

  it('buildMetaForPath memakai fallback pathname root saat input kosong', () => {
    const meta = __private.buildMetaForPath('', 'https://kateglo.org');
    expect(meta.title).toContain('Kateglo — Kamus');
    expect(meta.canonicalUrl).toBe('https://kateglo.org/');
  });

  it('render memakai fallback pathname root saat URL kosong', async () => {
    const { headTags } = await render('');
    expect(headTags).toContain('https://kateglo.org/');
  });
});
