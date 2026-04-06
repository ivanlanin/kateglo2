import { describe, expect, it } from 'vitest';
import {
  aksesRuteInteraktif,
  ambilDaftarAlat,
  ambilDaftarGim,
  ambilMetaFiturInteraktif,
  ambilPathSitemapFiturInteraktif,
  filterItemInteraktif,
  katalogAlat,
  seoKatalogAlat,
  __private,
} from '../../src/constants/katalogFitur';

describe('katalogFitur', () => {
  it('mengambil metadata untuk index, alias, variant, fallback prefix, canonical path, dan unknown path', () => {
    expect(ambilMetaFiturInteraktif('')).toBeNull();
    expect(ambilMetaFiturInteraktif('/')).toBeNull();
    expect(ambilMetaFiturInteraktif('/alat')?.judul).toBe('Alat');
    expect(ambilMetaFiturInteraktif('/alat/penganalisis-teks')?.canonicalPath).toBe('/alat/analisis-teks');
    expect(ambilMetaFiturInteraktif('/gim/susun-kata/bebas')?.judul).toBe('Susun Kata Bebas');
    expect(ambilMetaFiturInteraktif('/alat/analisis-korpus/kata/indonesia')?.canonicalPath).toBe('/alat/analisis-korpus');
    expect(ambilMetaFiturInteraktif('/gim/kuis-kata')?.judul).toBe('Kuis Kata');
    expect(ambilMetaFiturInteraktif('/tidak-ada')).toBeNull();
  });

  it('menghasilkan sitemap unik, memfilter item internal, dan memetakan akses rute', () => {
    const paths = ambilPathSitemapFiturInteraktif();

    expect(paths).toContain('/alat');
    expect(paths).toContain('/alat/analisis-teks');
    expect(paths).toContain('/gim/susun-kata/bebas');
    expect(paths).not.toContain('/alat/pohon-kalimat');

    const items = [
      { slug: 'publik', tampilPublik: true },
      { slug: 'internal', tampilPublik: false },
    ];

    expect(filterItemInteraktif(items, false)).toEqual([{ slug: 'publik', tampilPublik: true }]);
    expect(filterItemInteraktif(items, true)).toEqual(items);
    expect(ambilDaftarAlat(false).every((item) => item.tampilPublik !== false)).toBe(true);
    expect(ambilDaftarGim(false).every((item) => item.tampilPublik !== false)).toBe(true);
    expect(aksesRuteInteraktif({ tampilPublik: false })).toBe('admin');
    expect(aksesRuteInteraktif({ tampilPublik: true })).toBe('publik');
  });

  it('memakai fallback canonical href di sitemap dan mengembalikan null saat metadata SEO tidak lengkap', () => {
    katalogAlat.push({
      slug: 'alat-uji-sitemap',
      judul: 'Alat Uji Sitemap',
      deskripsi: 'Deskripsi alat uji.',
      href: '/alat/uji-sitemap',
      canonicalPath: '',
      tampilPublik: true,
    });
    katalogAlat.push({
      slug: 'alat-uji-kosong',
      judul: '',
      deskripsi: '',
      href: '/alat/uji-kosong',
      tampilPublik: true,
    });

    const paths = ambilPathSitemapFiturInteraktif();

    expect(paths).toContain('/alat/uji-sitemap');
    expect(ambilMetaFiturInteraktif('/alat/uji-sitemap')?.canonicalPath).toBe('/alat/uji-sitemap');
    expect(ambilMetaFiturInteraktif('/alat/uji-kosong')).toBeNull();

    katalogAlat.pop();
    katalogAlat.pop();
  });

  it('helper private menutup normalisasi path, metadata kosong, dan index tanpa sitemap', () => {
    expect(__private.normalizePath()).toBe('/');
    expect(__private.normalizePath(null)).toBe('/');
    expect(__private.normalizePath('/')).toBe('/');
    expect(__private.normalizePath(' /alat//uji/// ')).toBe('/alat/uji');
    expect(__private.buildMetaInteraktif({}, {})).toBeNull();
    expect(__private.buildMetaInteraktif({ judul: 'Judul', deskripsi: 'Desk', href: '/alat/uji' }, {})).toEqual({
      judul: 'Judul',
      deskripsi: 'Desk',
      canonicalPath: '/alat/uji',
    });

    const sitemapAwal = seoKatalogAlat.sitemap;
    const canonicalAwal = seoKatalogAlat.canonicalPath;
    seoKatalogAlat.sitemap = false;
    expect(ambilPathSitemapFiturInteraktif()).not.toContain('/alat');
    seoKatalogAlat.sitemap = sitemapAwal;

    seoKatalogAlat.canonicalPath = '';
    expect(ambilPathSitemapFiturInteraktif()).toContain('/alat');
    seoKatalogAlat.canonicalPath = canonicalAwal;
  });
});