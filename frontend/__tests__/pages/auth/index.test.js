import { describe, expect, it } from 'vitest';
import * as authPages from '../../../src/pages/auth';
import AuthCallback from '../../../src/pages/auth/AuthCallback';
import LoginAdmin from '../../../src/pages/auth/LoginAdmin';

describe('pages/auth index', () => {
  it('me-reexport semua halaman autentikasi', () => {
    expect(authPages.AuthCallback).toBe(AuthCallback);
    expect(authPages.LoginAdmin).toBe(LoginAdmin);
  });
});
