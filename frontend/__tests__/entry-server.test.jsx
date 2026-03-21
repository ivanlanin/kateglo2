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
    expect(__private.truncate('ini kalimat sangat panjang sekali untuk dipotong', 20)).toMatch(/\s…$/);
    expect(__private.truncate('x'.repeat(220), 20)).toBe(`${'x'.repeat(20)} …`);
  });

  it('builder deskripsi kamus menutup semua cabang', () => {
    expect(__private.buildKamusDescription('sara', { semuaMakna: [], lafal: '' })).toBe('Lihat detail kamus di Kateglo.');

    const satuMakna = __private.buildKamusDescription('sara', {
      lafal: '/sa.ra/',
      semuaMakna: [{ makna: 'makna tunggal', kelas_kata: 'n' }],
    });
    expect(satuMakna).not.toContain('/sa.ra/');
    expect(satuMakna).not.toContain('sara');
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
    expect(kamusDetailRich.description).not.toContain('sara');
    expect(kamusDetailRich.description).not.toContain('/sa.ra/');
    expect(kamusDetailRich.description).toContain('makna detail');

    expect(__private.buildMetaForPath('/kamus/cari/%20', site).title).toBe('Kamus — Kateglo');
    const kamusCariRich = __private.buildMetaForPath('/kamus/cari/air', site, {
      type: 'kamus-cari',
      semuaMakna: [{ makna: 'cairan jernih', kelas_kata: 'n' }],
    });
    expect(kamusCariRich.title).toBe('Hasil Pencarian "air" di Kamus — Kateglo');
    expect(kamusCariRich.description).toContain('air:');

    const kamusCariKosong = __private.buildMetaForPath('/kamus/cari/air', site, {
      type: 'kamus-cari',
      semuaMakna: [],
    });
    expect(kamusCariKosong.description).toContain('Hasil pencarian kamus untuk kata');

    const kamusKategori = __private.buildMetaForPath('/kamus/kelas-kata/nomina', site);
    expect(kamusKategori.title).toBe('Kelas Kata Nomina — Kateglo');
    expect(kamusKategori.description).toContain('kategori kelas kata Nomina');

    const kamusKategoriAlias = __private.buildMetaForPath('/kamus/kelas/verba', site);
    expect(kamusKategoriAlias.title).toBe('Kelas Kata Verba — Kateglo');
    const kamusTagar = __private.buildMetaForPath('/kamus/tagar/prefiks', site);
    expect(kamusTagar.title).toBe('Tagar prefiks — Kateglo');
    const kamusTagarKosong = __private.buildMetaForPath('/kamus/tagar/', site);
    expect(kamusTagarKosong.title).toBe('Tagar — Kateglo');
    expect(__private.buildMetaForPath('/kamus', site).title).toBe('Kamus — Kateglo');

    expect(__private.buildMetaForPath('/makna', site).title).toBe('Makna — Kateglo');
    const maknaCari = __private.buildMetaForPath('/makna/cari/air', site);
    expect(maknaCari.title).toBe('Hasil Pencarian Makna "air" — Kateglo');
    expect(maknaCari.description).toContain('maknanya mengandung');

    expect(__private.buildMetaForPath('/rima', site).title).toBe('Rima — Kateglo');
    const rimaCari = __private.buildMetaForPath('/rima/cari/senja', site);
    expect(rimaCari.title).toBe('Hasil Pencarian Rima "senja" — Kateglo');
    expect(rimaCari.description).toContain('berima dengan');

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

    const glosariumSumberSlug = __private.buildMetaForPath('/glosarium/sumber/kamus-tata-boga', site, {
      type: 'glosarium-sumber',
      sumberNama: 'Kamus Tata Boga',
      total: 4,
      contoh: [{ indonesia: 'acar', asing: 'achar' }],
    });
    expect(glosariumSumberSlug.title).toBe('Glosarium Kamus Tata Boga — Kateglo');

    const glosariumDetail = __private.buildMetaForPath('/glosarium/detail/bankrupt', site, {
      type: 'glosarium-detail',
      persis: [{ id: 1, asing: 'bankrupt', indonesia: 'bangkrut' }],
    });
    expect(glosariumDetail.title).toBe('bankrupt — Kateglo');
    expect(glosariumDetail.description).toContain('1 padanan Indonesia');

    expect(__private.buildMetaForPath('/glosarium', site).title).toBe('Glosarium — Kateglo');
    const ejaanIndex = __private.buildMetaForPath('/ejaan', site);
    expect(ejaanIndex.title).toBe('Ejaan — Kateglo');
    expect(ejaanIndex.description).toContain('penggunaan huruf');

    const ejaanDetail = __private.buildMetaForPath('/ejaan/huruf-kapital', site);
    expect(ejaanDetail.title).toBe('Huruf Kapital — Kateglo');
    expect(ejaanDetail.description).toContain('Penggunaan Huruf');

    const ejaanDetailUnknown = __private.buildMetaForPath('/ejaan/aturan-baru', site);
    expect(ejaanDetailUnknown.title).toBe('Aturan Baru — Kateglo');
    const ejaanDetailKosong = __private.buildMetaForPath('/ejaan/---', site);
    expect(ejaanDetailKosong.title).toBe('Ejaan — Kateglo');

    const gramatikaIndex = __private.buildMetaForPath('/gramatika', site);
    expect(gramatikaIndex.title).toBe('Gramatika — Kateglo');
    expect(gramatikaIndex.description).toContain('tata bahasa');

    const gramatikaDetail = __private.buildMetaForPath('/gramatika/preposisi', site);
    expect(gramatikaDetail.title).toBe('Preposisi — Kateglo');
    expect(gramatikaDetail.description).toContain('Kata Tugas');

    const gramatikaDetailUnknown = __private.buildMetaForPath('/gramatika/klausa-baru', site);
    expect(gramatikaDetailUnknown.title).toBe('Klausa Baru — Kateglo');
    const gramatikaDetailKosong = __private.buildMetaForPath('/gramatika/---', site);
    expect(gramatikaDetailKosong.title).toBe('Gramatika — Kateglo');

    const alat = __private.buildMetaForPath('/alat', site);
    expect(alat.title).toBe('Alat — Kateglo');
    expect(alat.description).toContain('Penghitung Huruf');

    const penganalisisTeks = __private.buildMetaForPath('/alat/penganalisis-teks', site);
    expect(penganalisisTeks.title).toBe('Penganalisis Teks — Kateglo');
    expect(penganalisisTeks.description).toContain('paragraf');

    const penghitungHuruf = __private.buildMetaForPath('/alat/penghitung-huruf', site);
    expect(penghitungHuruf.title).toBe('Penghitung Huruf — Kateglo');
    expect(penghitungHuruf.description).toContain('frekuensi huruf');

    const gim = __private.buildMetaForPath('/gim', site);
    expect(gim.title).toBe('Gim — Kateglo');
    expect(gim.description).toContain('Kuis Kata');

    const gimSusunKata = __private.buildMetaForPath('/gim/susun-kata', site);
    expect(gimSusunKata.title).toBe('Susun Kata Harian — Kateglo');
    expect(gimSusunKata.description).toContain('susun kata harian');
    expect(gimSusunKata.canonicalUrl).toBe('https://kateglo.org/gim/susun-kata/harian');

    const gimSusunKataHarian = __private.buildMetaForPath('/gim/susun-kata/harian', site);
    expect(gimSusunKataHarian.title).toBe('Susun Kata Harian — Kateglo');
    expect(gimSusunKataHarian.description).toContain('susun kata harian');

    const gimSusunKataBebas = __private.buildMetaForPath('/gim/susun-kata/bebas', site);
    expect(gimSusunKataBebas.title).toBe('Susun Kata Bebas — Kateglo');
    expect(gimSusunKataBebas.description).toContain('mode bebas');

    const gimSusunKataTakDikenal = __private.buildMetaForPath('/gim/susun-kata/eksperimen', site);
    expect(gimSusunKataTakDikenal.title).toBe('Susun Kata Harian — Kateglo');
    expect(gimSusunKataTakDikenal.canonicalUrl).toBe('https://kateglo.org/gim/susun-kata/harian');

    const kuisKata = __private.buildMetaForPath('/gim/kuis-kata', site);
    expect(kuisKata.title).toBe('Kuis Kata — Kateglo');
    expect(kuisKata.description).toContain('pilihan ganda');

    expect(__private.buildMetaForPath('/kebijakan-privasi', site).title).toBe('Kebijakan Privasi — Kateglo');

    const defaultMeta = __private.buildMetaForPath('/random', site);
    expect(defaultMeta.title).toBe('Kateglo');
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
    expect(headTags).toContain('https://kateglo.org/og/kamus.png?title=sara&amp;context=%28n%29+x+%3C+y+%26+z');
    expect(headTags).toContain('__KATEGLO_SSR_DATA__');
  });

  it('render memakai deskripsi spesifik dari markdown SSR untuk route ejaan dan gramatika', async () => {
    const hasilEjaan = await render('/ejaan/huruf-kapital', {
      type: 'static-markdown',
      section: 'ejaan',
      slug: 'huruf-kapital',
      markdown: '# Huruf Kapital\n\nRingkasan huruf kapital.',
      description: 'Ringkasan huruf kapital.',
      notFound: false,
    });

    const hasilGramatika = await render('/gramatika/preposisi', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'preposisi',
      markdown: '# Preposisi\n\nRingkasan preposisi.',
      description: 'Ringkasan preposisi.',
      notFound: false,
    });

    expect(hasilEjaan.headTags).toContain('Ringkasan huruf kapital.');
    expect(hasilGramatika.headTags).toContain('Ringkasan preposisi.');
    expect(hasilEjaan.headTags).toContain('https://kateglo.org/og/ejaan/huruf-kapital.png?title=Huruf+Kapital&amp;context=Ringkasan+huruf+kapital.');
    expect(hasilGramatika.headTags).toContain('https://kateglo.org/og/gramatika/preposisi.png?title=Preposisi&amp;context=Ringkasan+preposisi.');
    expect(hasilGramatika.headTags).toContain('Preposisi | Kata Tugas | Kateglo');
  });

  it('render mengembalikan status 404 untuk markdown statis yang tidak ditemukan', async () => {
    const hasil = await render('/gramatika/slug-tidak-ada', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'slug-tidak-ada',
      markdown: '',
      description: '',
      notFound: true,
    });

    expect(hasil.statusCode).toBe(404);
    expect(hasil.headTags).toContain('Gramatika Tidak Ditemukan');
  });

  it('render fallback site URL saat process/global/env tidak tersedia', async () => {
    const originalGlobal = globalThis.process;
    delete globalThis.process;

    const { headTags } = await render('/');
    expect(headTags).toContain('https://kateglo.org/og/default.png?title=Kateglo&amp;context=Kamus%2C+Tesaurus%2C+dan+Glosarium+Bahasa+Indonesia');

    globalThis.process = originalGlobal;
  });

  it('helper sosial membangun judul dan path gambar yang lebih kaya untuk ejaan dan gramatika', () => {
    expect(__private.buildSocialTitle('/gramatika/preposisi', 'Preposisi — Kateglo')).toBe('Preposisi | Kata Tugas | Kateglo');
    expect(__private.buildSocialTitle('/ejaan/huruf-kapital', 'Huruf Kapital — Kateglo')).toBe('Huruf Kapital | Penggunaan Huruf | Kateglo');
    expect(__private.buildSocialTitle('/kamus/detail/sara', 'sara — Kateglo')).toBe('sara | Kateglo');
    expect(__private.stripKategloSuffix('Preposisi — Kateglo')).toBe('Preposisi');
    expect(__private.buildOgQueryString({ title: 'Huruf Kapital', context: 'Penggunaan Huruf' })).toBe('?title=Huruf+Kapital&context=Penggunaan+Huruf');
    expect(__private.buildGenericSocialContext('/kamus/detail/sara')).toEqual({ section: 'kamus', context: 'Entri Kamus Bahasa Indonesia' });
    expect(__private.buildGenericSocialContext('/glosarium/cari/air')).toEqual({ section: 'glosarium', context: 'Hasil Pencarian Glosarium' });
    expect(__private.buildSocialImageUrl('/gramatika/preposisi', 'https://kateglo.org')).toBe('https://kateglo.org/og/gramatika/preposisi.png?title=Preposisi&context=Penjelasan+tentang+Preposisi+pada+bab+Kata+Tugas+dalam+panduan+tata+bahasa+Indonesia+di+Kateglo.');
    expect(__private.buildSocialImageUrl('/kamus/detail/sara', 'https://kateglo.org', {
      type: 'kamus-detail',
      lafal: '/sa.ra/',
      semuaMakna: [{ makna: 'makna detail', kelas_kata: 'n' }],
    }, 'sara — Kateglo')).toBe('https://kateglo.org/og/kamus.png?title=sara&context=%28n%29+makna+detail');
    expect(__private.buildSocialImageUrl('/random', 'https://kateglo.org', null, 'Kamus — Kateglo')).toBe('https://kateglo.org/og/default.png?title=Kateglo&context=Kamus%2C+Tesaurus%2C+dan+Glosarium+Bahasa+Indonesia');
  });

  it('render melewati SSR untuk route redaksi agar hydrasi client yang mengelola auth', async () => {
    const { appHtml, headTags } = await render('/redaksi/kamus');
    expect(appHtml).toBe('');
    expect(headTags).toContain('canonical');
    expect(headTags).toContain('https://kateglo.org/redaksi/kamus');
  });

  it('render menghasilkan canonical untuk route alat', async () => {
    const { appHtml, headTags } = await render('/alat');
    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('Alat — Kateglo');
    expect(headTags).toContain('https://kateglo.org/alat');
  });

  it('render menghasilkan canonical untuk route alat penganalisis teks', async () => {
    const { appHtml, headTags } = await render('/alat/penganalisis-teks');
    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('Penganalisis Teks — Kateglo');
    expect(headTags).toContain('https://kateglo.org/alat/penganalisis-teks');
  });

  it('render menghasilkan canonical untuk route alat penghitung huruf', async () => {
    const { appHtml, headTags } = await render('/alat/penghitung-huruf');
    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('Penghitung Huruf — Kateglo');
    expect(headTags).toContain('https://kateglo.org/alat/penghitung-huruf');
  });

  it('render menghasilkan canonical dan title SEO untuk route susun kata harian', async () => {
    const { appHtml, headTags } = await render('/gim/susun-kata/harian');
    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('Susun Kata Harian — Kateglo');
    expect(headTags).toContain('https://kateglo.org/gim/susun-kata/harian');
  });

  it('render menghasilkan canonical dan title SEO untuk route susun kata bebas', async () => {
    const { appHtml, headTags } = await render('/gim/susun-kata/bebas');
    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('Susun Kata Bebas — Kateglo');
    expect(headTags).toContain('https://kateglo.org/gim/susun-kata/bebas');
  });

  it('render mengkanonikal-kan route redirect susun kata ke mode harian', async () => {
    const { appHtml, headTags } = await render('/gim/susun-kata');
    expect(appHtml).toContain('App SSR Mock');
    expect(headTags).toContain('Susun Kata Harian — Kateglo');
    expect(headTags).toContain('https://kateglo.org/gim/susun-kata/harian');
  });

  it('buildMetaForPath memakai fallback pathname root saat input kosong', () => {
    const meta = __private.buildMetaForPath('', 'https://kateglo.org');
    expect(meta.title).toBe('Kateglo');
    expect(meta.canonicalUrl).toBe('https://kateglo.org/');
  });

  it('render memakai fallback pathname root saat URL kosong', async () => {
    const { headTags } = await render('');
    expect(headTags).toContain('https://kateglo.org/');
  });

  it('shouldSkipSsr mengembalikan false saat pathname kosong', () => {
    expect(__private.shouldSkipSsr('')).toBe(false);
    expect(__private.shouldSkipSsr()).toBe(false);
  });
});
