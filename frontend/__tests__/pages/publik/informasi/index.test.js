import { describe, expect, it } from 'vitest';
import * as informasiPages from '../../../../src/pages/publik/informasi';
import KebijakanPrivasi from '../../../../src/pages/publik/informasi/KebijakanPrivasi';
import Sumber from '../../../../src/pages/publik/informasi/Sumber';

describe('pages/publik/informasi index', () => {
  it('me-reexport modul informasi', () => {
    expect(informasiPages.KebijakanPrivasi).toBe(KebijakanPrivasi);
    expect(informasiPages.Sumber).toBe(Sumber);
  });
});
