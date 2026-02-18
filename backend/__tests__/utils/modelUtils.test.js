const { normalizeBoolean, parseCount } = require('../../utils/modelUtils');

describe('modelUtils', () => {
  describe('normalizeBoolean', () => {
    it('menggunakan default true saat nullish', () => {
      expect(normalizeBoolean(undefined)).toBe(true);
      expect(normalizeBoolean(null)).toBe(true);
    });

    it('mengubah nilai lintas tipe ke boolean', () => {
      expect(normalizeBoolean(true)).toBe(true);
      expect(normalizeBoolean(false)).toBe(false);
      expect(normalizeBoolean(1)).toBe(true);
      expect(normalizeBoolean(0)).toBe(false);
      expect(normalizeBoolean('ya')).toBe(true);
      expect(normalizeBoolean('YES')).toBe(true);
      expect(normalizeBoolean('false')).toBe(false);
    });

    it('menggunakan default custom saat nilai tidak dikenali', () => {
      expect(normalizeBoolean({}, false)).toBe(false);
      expect(normalizeBoolean({}, true)).toBe(true);
    });
  });

  describe('parseCount', () => {
    it('mengembalikan angka valid', () => {
      expect(parseCount('12')).toBe(12);
      expect(parseCount(7)).toBe(7);
    });

    it('mengembalikan 0 untuk nilai tidak valid', () => {
      expect(parseCount(undefined)).toBe(0);
      expect(parseCount(null)).toBe(0);
      expect(parseCount('abc')).toBe(0);
    });
  });
});