import { describe, it, expect } from 'vitest';
import { formatTanggalKomentar } from '../../src/utils/formatTanggalKomentar';

describe('formatTanggalKomentar', () => {
  it('mengembalikan fallback untuk nilai kosong/invalid', () => {
    expect(formatTanggalKomentar('')).toBe('-');
    expect(formatTanggalKomentar('invalid-date')).toBe('-');
  });

  it('memformat tanggal dan waktu lokal dengan pemisah titik', () => {
    const hasil = formatTanggalKomentar('2026-02-17T09:39:00.000Z');
    expect(hasil).toMatch(/^\d{2} [A-Za-z]{3} \d{4} \d{2}\.\d{2}$/);
  });

  it('menganggap string tanpa timezone sebagai UTC', () => {
    const tanpaTimezone = formatTanggalKomentar('2026-02-17 09:49:10');
    const denganUtc = formatTanggalKomentar('2026-02-17T09:49:10Z');

    expect(tanpaTimezone).toBe(denganUtc);
  });
});
