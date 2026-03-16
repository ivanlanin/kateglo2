import { describe, expect, it } from 'vitest';
import * as kamusPages from '../../../../src/pages/publik/kamus';
import Ejaan from '../../../../src/pages/publik/kamus/Ejaan';
import Kamus from '../../../../src/pages/publik/kamus/Kamus';
import KamusDetail from '../../../../src/pages/publik/kamus/KamusDetail';
import Makna from '../../../../src/pages/publik/kamus/Makna';
import Rima from '../../../../src/pages/publik/kamus/Rima';
import Tesaurus from '../../../../src/pages/publik/kamus/Tesaurus';

describe('pages/publik/kamus index', () => {
  it('me-reexport modul kamus', () => {
    expect(kamusPages.Ejaan).toBe(Ejaan);
    expect(kamusPages.Kamus).toBe(Kamus);
    expect(kamusPages.KamusDetail).toBe(KamusDetail);
    expect(kamusPages.Makna).toBe(Makna);
    expect(kamusPages.Rima).toBe(Rima);
    expect(kamusPages.Tesaurus).toBe(Tesaurus);
  });
});
