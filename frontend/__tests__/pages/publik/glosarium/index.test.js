import { describe, expect, it } from 'vitest';
import * as glosariumPages from '../../../../src/pages/publik/glosarium';
import Glosarium from '../../../../src/pages/publik/glosarium/Glosarium';
import GlosariumDetail from '../../../../src/pages/publik/glosarium/GlosariumDetail';

describe('pages/publik/glosarium index', () => {
  it('me-reexport modul glosarium', () => {
    expect(glosariumPages.Glosarium).toBe(Glosarium);
    expect(glosariumPages.GlosariumDetail).toBe(GlosariumDetail);
  });
});
