import { describe, expect, it } from 'vitest';
import { __private, buildSocialTitle, stripKategloSuffix } from '../../src/utils/socialMetaUtils';

describe('socialMetaUtils', () => {
  it('menghapus sufiks Kateglo dan membangun title sosial untuk root, domain, unknown path, dan fallback serupa', () => {
    expect(stripKategloSuffix('Kamus — Kateglo')).toBe('Kamus');
    expect(stripKategloSuffix('Judul Lain')).toBe('Judul Lain');
    expect(stripKategloSuffix()).toBe('');

    expect(buildSocialTitle(undefined, undefined)).toBe('Kateglo');
    expect(buildSocialTitle('', 'Beranda — Kateglo')).toBe('Beranda');
    expect(buildSocialTitle('/', 'Beranda — Kateglo')).toBe('Beranda');
    expect(buildSocialTitle('/kamus/cari/air', 'Kamus — Kateglo')).toBe('Kamus — Kateglo');
    expect(buildSocialTitle('/tesaurus/cari/air', 'Tesaurus — Kateglo')).toBe('Tesaurus — Kateglo');
    expect(buildSocialTitle('/glosarium/detail/air', 'Glosarium — Kateglo')).toBe('Glosarium — Kateglo');
    expect(buildSocialTitle('/artikel/detail/uji', 'Artikel — Kateglo')).toBe('Artikel — Kateglo');
    expect(buildSocialTitle('/makna/cari/arti', 'Makna — Kateglo')).toBe('Makna — Kateglo');
    expect(buildSocialTitle('/rima/cari/nada', 'Rima — Kateglo')).toBe('Rima — Kateglo');
    expect(buildSocialTitle('/gramatika/preposisi', 'Gramatika — Kateglo')).toBe('Gramatika — Kateglo');
    expect(buildSocialTitle('/ejaan/huruf-kapital', 'Ejaan — Kateglo')).toBe('Ejaan — Kateglo');
    expect(buildSocialTitle('/gim/kuis-kata', 'Gim — Kateglo')).toBe('Gim — Kateglo');
    expect(buildSocialTitle('/alat/analisis-teks', 'Analisis Teks — Kateglo')).toBe('Analisis Teks — Alat — Kateglo');
    expect(buildSocialTitle('/lintas%20ruang', 'Judul Khusus — Kateglo')).toBe('Judul Khusus — Kateglo');
    expect(buildSocialTitle('/alat', '')).toBe('Kateglo — Alat — Kateglo');
  });

  it('helper resolveDomainLabel mengenali semua domain dan fallback kosong', () => {
    expect(__private.resolveDomainLabel()).toBe('');
    expect(__private.resolveDomainLabel('')).toBe('');
    expect(__private.resolveDomainLabel('/kamus')).toBe('Kamus');
    expect(__private.resolveDomainLabel('/tesaurus')).toBe('Tesaurus');
    expect(__private.resolveDomainLabel('/glosarium')).toBe('Glosarium');
    expect(__private.resolveDomainLabel('/artikel')).toBe('Artikel');
    expect(__private.resolveDomainLabel('/makna')).toBe('Makna');
    expect(__private.resolveDomainLabel('/rima')).toBe('Rima');
    expect(__private.resolveDomainLabel('/gramatika')).toBe('Gramatika');
    expect(__private.resolveDomainLabel('/ejaan')).toBe('Ejaan');
    expect(__private.resolveDomainLabel('/alat')).toBe('Alat');
    expect(__private.resolveDomainLabel('/gim')).toBe('Gim');
    expect(__private.resolveDomainLabel('/tidak-ada')).toBe('');
  });
});