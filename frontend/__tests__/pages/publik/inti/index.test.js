import { describe, expect, it } from 'vitest';
import * as intiPages from '../../../../src/pages/publik/inti';
import AuthCallback from '../../../../src/pages/publik/inti/AuthCallback';
import Beranda from '../../../../src/pages/publik/inti/Beranda';

describe('pages/publik/inti index', () => {
  it('me-reexport modul inti', () => {
    expect(intiPages.AuthCallback).toBe(AuthCallback);
    expect(intiPages.Beranda).toBe(Beranda);
  });
});
