import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Fragment, createElement } from 'react';
import {
  formatBilanganRibuan,
  formatLemaHomonim,
  formatLocalDateTime,
  formatWallClockDateTime,
  formatNamaBidang,
  normalizeLocalDateTimeValue,
  parseEntriGlosarium,
  parseUtcDate,
  tokenizeKurung,
  renderEntriGlosariumTertaut,
} from '../../src/utils/formatUtils';

describe('formatUtils.test.js', () => {
  it('mengembalikan fallback untuk nilai kosong/invalid', () => {
    expect(formatLocalDateTime('')).toBe('-');
    expect(formatLocalDateTime('invalid-date')).toBe('-');
  });

  it('memformat tanggal dan waktu lokal dengan pemisah titik', () => {
    const hasil = formatLocalDateTime('2026-02-17T09:39:00.000Z');
    expect(hasil).toMatch(/^\d{2} [A-Za-z]{3} \d{4} \d{2}\.\d{2}$/);
  });

  it('menganggap string tanpa timezone sebagai UTC', () => {
    const tanpaTimezone = formatLocalDateTime('2026-02-17 09:49:10');
    const denganUtc = formatLocalDateTime('2026-02-17T09:49:10Z');

    expect(tanpaTimezone).toBe(denganUtc);
  });

  it('menerima suffix timezone eksplisit (+0700) tanpa normalisasi tambahan', () => {
    const hasil = formatLocalDateTime('2026-02-17T09:49:10+0700');

    expect(hasil).toMatch(/\d{2}\.\d{2}$/);
    expect(hasil).not.toBe('-');
  });

  it('menerima suffix timezone eksplisit (+07:00)', () => {
    const hasil = formatLocalDateTime('2026-02-17T09:49:10+07:00');

    expect(hasil).toMatch(/\d{2}\.\d{2}$/);
    expect(hasil).not.toBe('-');
  });

  it('parseUtcDate menangani suffix timezone dan normalisasi spasi', () => {
    expect(parseUtcDate('2026-02-17 09:49:10')).toBeInstanceOf(Date);
    expect(parseUtcDate('2026-02-17T09:49')).toBeInstanceOf(Date);
    expect(parseUtcDate('2026-02-17T09:49:10Z')).toBeInstanceOf(Date);
    expect(parseUtcDate('2026-02-17T09:49:10+07:00')).toBeInstanceOf(Date);
    expect(parseUtcDate('   ')).toBeNull();
  });

  it('normalizeLocalDateTimeValue mempertahankan jam mentah tanpa konversi zona waktu', () => {
    expect(normalizeLocalDateTimeValue('2026-04-04T23:44:00.000Z')).toBe('2026-04-04T23:44:00');
    expect(normalizeLocalDateTimeValue('2026-04-04 23:44:00')).toBe('2026-04-04T23:44:00');
    expect(normalizeLocalDateTimeValue('2026-04-04T23:44')).toBe('2026-04-04T23:44:00');
    expect(normalizeLocalDateTimeValue('   ', { fallback: 'kosong' })).toBe('kosong');
    expect(normalizeLocalDateTimeValue('2026/04/04', { fallback: 'invalid' })).toBe('invalid');
    expect(normalizeLocalDateTimeValue('')).toBeNull();
  });

  it('normalizeLocalDateTimeValue menerima Date valid dan menolak Date invalid', () => {
    const value = new Date('2026-04-04T23:44:00.000Z');
    const expected = [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-') + [
      String(value.getHours()).padStart(2, '0'),
      String(value.getMinutes()).padStart(2, '0'),
      String(value.getSeconds()).padStart(2, '0'),
    ].join(':').replace(/^/, 'T');

    expect(normalizeLocalDateTimeValue(value)).toBe(expected);
    expect(normalizeLocalDateTimeValue(new Date('invalid'), { fallback: 'fallback' })).toBe('fallback');
  });

  it('formatWallClockDateTime memformat waktu lokal-naif tanpa geser UTC', () => {
    expect(formatWallClockDateTime('2026-04-04T23:44:00.000Z')).toBe('04 Apr 2026 23.44');
    expect(formatWallClockDateTime('2026-04-04 23:44:00')).toBe('04 Apr 2026 23.44');
    expect(formatWallClockDateTime('2026-99-99 25:61:00', { fallback: 'tidak-valid' })).toBe('tidak-valid');
  });

  it('menerima objek Date valid dan menolak Date invalid', () => {
    const valid = formatLocalDateTime(new Date('2026-02-17T09:00:00.000Z'));
    const invalid = formatLocalDateTime(new Date('invalid'));

    expect(valid).toMatch(/\d{2}\.\d{2}$/);
    expect(invalid).toBe('-');
  });

  it('formatLemaHomonim mengubah pola lema (nomor) menjadi superskrip', () => {
    render(createElement(Fragment, null, formatLemaHomonim('dara (3)')));

    const sup = screen.getByText('3');
    expect(sup.tagName).toBe('SUP');
    expect(screen.getByText('dara')).toBeInTheDocument();
  });

  it('formatLemaHomonim menampilkan teks asli jika tidak ada nomor homonim', () => {
    render(createElement(Fragment, null, formatLemaHomonim('gajah')));

    expect(screen.getByText('gajah')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('formatLemaHomonim aman untuk lema undefined (fallback default)', () => {
    const { container } = render(createElement(Fragment, null, formatLemaHomonim(undefined)));

    expect(container.textContent).toBe('');
  });

  it('formatNamaBidang memformat title case dan mempertahankan kata "dan" kecil', () => {
    expect(formatNamaBidang()).toBe('');
    expect(formatNamaBidang('ilmu komputer dan informatika')).toBe('Ilmu Komputer dan Informatika');
    expect(formatNamaBidang('DAN TEKNOLOGI')).toBe('Dan Teknologi');
    expect(formatNamaBidang('   ')).toBe('');
  });

  it('formatBilanganRibuan mengembalikan fallback saat nilai bukan angka valid', () => {
    expect(formatBilanganRibuan('abc')).toBe('0');
    expect(formatBilanganRibuan('abc', { fallback: '-' })).toBe('-');
    expect(formatBilanganRibuan('', { fallback: '-' })).toBe('-');
  });

  it('formatBilanganRibuan memformat dan memotong pecahan ke ribuan lokal', () => {
    expect(formatBilanganRibuan(12345.9)).toBe('12.345');
    expect(formatBilanganRibuan(-9876.4)).toBe('-9.876');
  });

  it('parseEntriGlosarium memecah entri per titik koma', () => {
    const result = parseEntriGlosarium('akses; data');
    expect(result).toEqual(['akses', '; ', 'data']);
  });

  it('parseEntriGlosarium mempertahankan awalan angka yang merupakan bagian dari istilah', () => {
    const result = parseEntriGlosarium('1H-imidazola; 4-aminoetil');
    expect(result).toEqual(['1H-imidazola', '; ', '4-aminoetil']);
  });

  it('parseEntriGlosarium menormalkan spasi liar di sekitar titik koma', () => {
    const result = parseEntriGlosarium('abiseka ; penobatan');
    expect(result).toEqual(['abiseka', '; ', 'penobatan']);
  });

  it('parseEntriGlosarium mendukung renderer tautan per bagian', () => {
    const nodes = parseEntriGlosarium('dam; darah', (part, index) => createElement('a', { href: `/kamus/detail/${part}`, key: index }, part));
    render(createElement(Fragment, null, ...nodes));

    expect(screen.getByRole('link', { name: 'dam' })).toHaveAttribute('href', '/kamus/detail/dam');
    expect(screen.getByRole('link', { name: 'darah' })).toHaveAttribute('href', '/kamus/detail/darah');
    expect(screen.getByText(';')).toBeInTheDocument();
  });

  it('parseEntriGlosarium mengembalikan kosong untuk input kosong dan renderer non-fungsi', () => {
    expect(parseEntriGlosarium('; ; ')).toEqual([]);
    expect(parseEntriGlosarium('data; informasi', {})).toEqual(['data', '; ', 'informasi']);
  });

  it('parseEntriGlosarium mengembalikan array kosong untuk input kosong/null', () => {
    expect(parseEntriGlosarium('')).toEqual([]);
    expect(parseEntriGlosarium(null)).toEqual([]);
  });

  it('renderEntriGlosariumTertaut memisah titik koma dan merender tautan per bagian', () => {
    const nodes = renderEntriGlosariumTertaut('accomplice; accessory', (part, info) => createElement('a', { href: `/glosarium/detail/${part}`, key: `${part}-${info.partIndex}` }, part));
    render(createElement(Fragment, null, ...nodes));

    expect(screen.getByRole('link', { name: 'accomplice' })).toHaveAttribute('href', '/glosarium/detail/accomplice');
    expect(screen.getByRole('link', { name: 'accessory' })).toHaveAttribute('href', '/glosarium/detail/accessory');
    expect(screen.getByText(';')).toBeInTheDocument();
  });

  it('renderEntriGlosariumTertaut tidak menyisakan spasi sebelum titik koma saat bagian pertama ditautkan', () => {
    const nodes = renderEntriGlosariumTertaut('abiseka ; penobatan', (part, info) => (
      info.partIndex === 0
        ? createElement('a', { href: `/kamus/detail/${part}`, key: `${part}-${info.partIndex}` }, part)
        : createElement('span', { key: `${part}-${info.partIndex}` }, part)
    ));
    const { container } = render(createElement(Fragment, null, ...nodes));

    expect(screen.getByRole('link', { name: 'abiseka' })).toHaveAttribute('href', '/kamus/detail/abiseka');
    expect(container.textContent).toBe('abiseka; penobatan');
  });

  it('renderEntriGlosariumTertaut tidak menautkan teks dalam tanda kurung', () => {
    const nodes = renderEntriGlosariumTertaut('change (a law) (verb)', (part, info) => createElement('a', { href: `/glosarium/detail/${part}`, key: `${part}-${info.partIndex}` }, part));
    const { container } = render(createElement(Fragment, null, ...nodes));

    expect(screen.getByRole('link', { name: 'change' })).toHaveAttribute('href', '/glosarium/detail/change');
    expect(container).toHaveTextContent('(a law)');
    expect(container).toHaveTextContent('(verb)');
    expect(screen.queryByRole('link', { name: '(a law)' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '(verb)' })).not.toBeInTheDocument();
  });

  it('tokenizeKurung mengembalikan array kosong untuk input kosong/default', () => {
    expect(tokenizeKurung()).toEqual([]);
    expect(tokenizeKurung('')).toEqual([]);
  });

  it('renderEntriGlosariumTertaut mengembalikan string saat renderer bukan fungsi', () => {
    const nodes = renderEntriGlosariumTertaut('alpha; beta', null);
    expect(nodes).toEqual(['alpha', '; ', 'beta']);
  });

  it('renderEntriGlosariumTertaut mengembalikan array kosong saat input kosong', () => {
    expect(renderEntriGlosariumTertaut('')).toEqual([]);
  });

  it('renderEntriGlosariumTertaut mempertahankan spasi leading/trailing saat menautkan', () => {
    const nodes = renderEntriGlosariumTertaut('alpha(beta) gamma', (part, info) => createElement('a', { href: `/glosarium/detail/${part}`, key: `${part}-${info.partIndex}-${info.tokenIndex}` }, part));
    const { container } = render(createElement(Fragment, null, ...nodes));

    expect(screen.getByRole('link', { name: 'alpha' })).toHaveAttribute('href', '/glosarium/detail/alpha');
    expect(screen.getByRole('link', { name: 'gamma' })).toHaveAttribute('href', '/glosarium/detail/gamma');
    expect(container).toHaveTextContent('alpha(beta) gamma');
  });
});
