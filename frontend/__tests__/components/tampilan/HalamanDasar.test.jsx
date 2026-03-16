import { describe, expect, it, vi } from 'vitest';
import { bacaPreferensiTema, hitungModeGelapAwal } from '../../../src/components/tampilan/HalamanDasar';

describe('HalamanDasar', () => {
  it('hitungModeGelapAwal menangani no-window, tema tersimpan, dan preferensi sistem', () => {
    expect(hitungModeGelapAwal({ hasWindow: false, tersimpan: null, prefersDark: true })).toBe(false);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: 'dark', prefersDark: false })).toBe(true);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: 'light', prefersDark: true })).toBe(false);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: null, prefersDark: true })).toBe(true);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: null, prefersDark: false })).toBe(false);
  });

  it('bacaPreferensiTema menangani runtime null dan runtime browser', () => {
    expect(bacaPreferensiTema(null)).toEqual({ hasWindow: false, tersimpan: null, prefersDark: false });

    const runtimeMock = {
      localStorage: { getItem: vi.fn().mockReturnValue('dark') },
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    };

    expect(bacaPreferensiTema(runtimeMock)).toEqual({ hasWindow: true, tersimpan: 'dark', prefersDark: true });
    expect(runtimeMock.localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(runtimeMock.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});