import { describe, expect, it } from 'vitest';
import * as informasiPages from '../../../../src/pages/publik/informasi';
import Ihwal from '../../../../src/pages/publik/informasi/Ihwal';
import Privasi from '../../../../src/pages/publik/informasi/Privasi';
import Sumber from '../../../../src/pages/publik/informasi/Sumber';

describe('pages/publik/informasi index', () => {
  it('me-reexport modul informasi', () => {
    expect(informasiPages.Ihwal).toBe(Ihwal);
    expect(informasiPages.Privasi).toBe(Privasi);
    expect(informasiPages.Sumber).toBe(Sumber);
  });
});
