import { describe, expect, it } from 'vitest';
import {
  buildDeskripsiDetailKamus,
  buildDeskripsiPencarianGlosarium,
  buildDeskripsiPencarianTesaurus,
  buildMetaBidangGlosarium,
  buildMetaBrowseGlosarium,
  buildMetaBrowseKamus,
  buildMetaBrowseTesaurus,
  buildMetaDetailKamus,
  buildMetaKategoriKamus,
  buildMetaPencarianGlosarium,
  buildMetaPencarianKamus,
  buildMetaPencarianTesaurus,
  buildMetaSumberGlosarium,
  formatAwalKapital,
  formatLabelDariSlug,
  glosariumMetaUtils,
  kamusMetaUtils,
  metaUtils,
  normalisasiSlugNama,
  tentukanNamaKategoriDariPath,
  tentukanSlugLabel,
  tesaurusMetaUtils,
} from '../../src/utils/metaUtils';

describe('metaUtils', () => {
  it('format helper kamus bekerja untuk input normal dan malformed uri', () => {
    expect(formatAwalKapital('kata dasar')).toBe('Kata Dasar');
    expect(normalisasiSlugNama('  Kata Dasar!  ')).toBe('kata-dasar');
    expect(normalisasiSlugNama()).toBe('');
    expect(formatLabelDariSlug('kelas-kata')).toBe('Kelas Kata');
    expect(() => formatLabelDariSlug('%E0%A4%A')).not.toThrow();
  });

  it('builder kategori kamus menutup cabang kelas/bentuk/fallback', () => {
    expect(tentukanNamaKategoriDariPath('kelas', 'verba')).toBe('Kelas Kata');
    expect(tentukanNamaKategoriDariPath('bentuk', 'prefiks')).toBe('Bentuk');
    expect(tentukanNamaKategoriDariPath('bentuk', 'prakategorial')).toBe('Bentuk');
    expect(tentukanNamaKategoriDariPath('khusus', 'kata-dasar')).toBe('Khusus');
    expect(tentukanNamaKategoriDariPath()).toBe('');

    expect(tentukanSlugLabel('kelas', { nama: 'Kata Dasar', kode: 'kd' })).toBe('kata-dasar');
    expect(tentukanSlugLabel('bentuk', { nama: 'Kata Dasar', kode: 'KD' })).toBe('kd');
    expect(tentukanSlugLabel('', {})).toBe('');

    const kategori = buildMetaKategoriKamus({ kategori: 'kelas', kode: 'verba' });
    expect(kategori.judul).toBe('Kelas Kata Verba');
  });

  it('builder metadata kamus menutup cabang browse, pencarian kosong, detail kosong, dan truncate', () => {
    expect(buildMetaBrowseKamus().judul).toBe('Kamus');
    expect(buildMetaPencarianKamus('').judul).toBe('Kamus');
    expect(buildMetaPencarianKamus('air').judul).toBe('Hasil Pencarian "air" di Kamus');
    expect(buildDeskripsiDetailKamus('', {})).toContain('Telusuri entri kamus');

    const panjang = Array.from({ length: 80 }).map(() => 'panjang').join(' ');
    const deskripsi = buildDeskripsiDetailKamus('kata', {
      lafal: '/ka.ta/',
      makna: [{ kelas_kata: 'n', makna: panjang }],
    });
    expect(deskripsi.endsWith('…')).toBe(true);

    const kataPanjangTanpaSpasi = 'x'.repeat(200);
    const deskripsiMultiMakna = buildDeskripsiDetailKamus('kata', {
      makna: [
        { kelas_kata: 'n', makna: kataPanjangTanpaSpasi },
        { kelas_kata: 'v', makna: 'aksi' },
      ],
    });
    expect(deskripsiMultiMakna.endsWith('…')).toBe(true);
    expect(deskripsiMultiMakna).toContain('(1)');

    expect(buildMetaDetailKamus('', null).judul).toBe('Kamus');
    expect(buildMetaDetailKamus('kata', { makna: [{ makna: 'arti' }] }).judul).toBe('kata');

    const tanpaMakna = buildDeskripsiDetailKamus('kata', {
      makna: [{ kelas_kata: 'n', makna: '' }],
    });
    expect(tanpaMakna).toContain('kata');

    const multiTanpaMakna = buildDeskripsiDetailKamus('kata', {
      makna: [
        { kelas_kata: 'n', makna: '' },
        { kelas_kata: 'v', makna: 'aksi' },
      ],
    });
    expect(multiTanpaMakna).toContain('(1)');
  });

  it('builder metadata tesaurus menutup cabang kosong dan data lengkap', () => {
    expect(buildMetaBrowseTesaurus().judul).toBe('Tesaurus');
    expect(buildDeskripsiPencarianTesaurus('', {})).toContain('Temukan sinonim');
    expect(buildDeskripsiPencarianTesaurus('besar', {})).toContain('Hasil pencarian tesaurus');

    const lengkap = buildDeskripsiPencarianTesaurus('besar', {
      sinonim: ['agung', 'akbar'],
      antonim: ['kecil'],
    });
    expect(lengkap).toContain('Sinonim');
    expect(lengkap).toContain('Antonim');

    expect(buildMetaPencarianTesaurus('', null).judul).toBe('Tesaurus');
    expect(buildMetaPencarianTesaurus('besar', null).judul).toBe('Hasil Pencarian "besar" di Tesaurus');
  });

  it('builder metadata glosarium menutup cabang browse/kata/bidang/sumber', () => {
    expect(buildMetaBrowseGlosarium().judul).toBe('Glosarium');
    expect(buildDeskripsiPencarianGlosarium('', {})).toContain('Hasil pencarian glosarium');
    expect(buildDeskripsiPencarianGlosarium('air', { total: 0 })).toContain('Hasil pencarian glosarium');

    const deskripsiCari = buildDeskripsiPencarianGlosarium('air', {
      total: 3,
      contoh: [{ indonesia: 'air tanah', asing: 'groundwater' }],
    });
    expect(deskripsiCari).toContain('3 hasil');
    expect(deskripsiCari).toContain('Contoh');

    expect(buildMetaPencarianGlosarium('', null).judul).toBe('Glosarium');
    expect(buildMetaPencarianGlosarium('air', null).judul).toBe('Hasil Pencarian "air" di Glosarium');

    expect(buildMetaBidangGlosarium('', null).judul).toBe('Glosarium');
    expect(buildMetaBidangGlosarium('biologi', { total: 2 }).judul).toBe('Glosarium Biologi');
    expect(buildMetaSumberGlosarium('', null).judul).toBe('Glosarium');
    expect(buildMetaSumberGlosarium('KBBI', { total: 2 }).judul).toBe('Glosarium KBBI');
  });

  it('namespace export tersedia untuk tiap domain', () => {
    expect(kamusMetaUtils.buildMetaBrowseKamus).toBeTypeOf('function');
    expect(tesaurusMetaUtils.buildMetaBrowseTesaurus).toBeTypeOf('function');
    expect(glosariumMetaUtils.buildMetaBrowseGlosarium).toBeTypeOf('function');
    expect(metaUtils.kamus).toBe(kamusMetaUtils);
    expect(metaUtils.tesaurus).toBe(tesaurusMetaUtils);
    expect(metaUtils.glosarium).toBe(glosariumMetaUtils);
  });
});
