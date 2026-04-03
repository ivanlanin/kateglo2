import { describe, expect, it } from 'vitest';

import { Alat, AnalisisTeks, PenghitungHuruf } from '../../../../src/pages/publik/alat';
import AlatIndex from '../../../../src/pages/publik/alat/AlatIndex';
import PenghitungHurufPage from '../../../../src/pages/publik/alat/PenghitungHuruf';
import AnalisisTeksPage from '../../../../src/pages/publik/alat/AnalisisTeks';

describe('pages/publik/alat index', () => {
  it('mengekspor ulang semua halaman alat publik dari barrel file', () => {
    expect(Alat).toBe(AlatIndex);
    expect(PenghitungHuruf).toBe(PenghitungHurufPage);
    expect(AnalisisTeks).toBe(AnalisisTeksPage);
  });
});