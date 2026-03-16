import { describe, expect, it } from 'vitest';
import * as gimPages from '../../../../src/pages/publik/gim';
import GimIndex from '../../../../src/pages/publik/gim/GimIndex';
import KuisKata from '../../../../src/pages/publik/gim/KuisKata';
import SusunKata from '../../../../src/pages/publik/gim/SusunKata';

describe('pages/publik/gim index', () => {
  it('me-reexport modul gim', () => {
    expect(gimPages.GimIndex).toBe(GimIndex);
    expect(gimPages.KuisKata).toBe(KuisKata);
    expect(gimPages.SusunKata).toBe(SusunKata);
  });
});
