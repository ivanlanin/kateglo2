import { describe, it, expect } from 'vitest';
import { formatLocalDateTime, parseUtcDate } from '../../src/utils/formatTanggalLokal';

describe('formatTanggalLokal', () => {
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

  it('menerima objek Date valid dan menolak Date invalid', () => {
    const valid = formatLocalDateTime(new Date('2026-02-17T09:00:00.000Z'));
    const invalid = formatLocalDateTime(new Date('invalid'));

    expect(valid).toMatch(/\d{2}\.\d{2}$/);
    expect(invalid).toBe('-');
  });
});
