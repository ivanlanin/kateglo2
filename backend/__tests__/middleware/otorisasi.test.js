/**
 * @fileoverview Test middleware otorisasi berbasis izin/peran
 * @tested_in backend/middleware/otorisasi.js
 */

const { periksaIzin, adminSaja } = require('../../middleware/otorisasi');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('middleware/otorisasi', () => {
  describe('periksaIzin', () => {
    it('mengembalikan 401 saat req.user tidak ada', () => {
      const req = {};
      const res = createRes();
      const next = jest.fn();

      periksaIzin('kelola_pengguna')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Autentikasi diperlukan',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('mengembalikan 403 saat user tidak punya izin', () => {
      const req = { user: { izin: ['lihat_kamus'] } };
      const res = createRes();
      const next = jest.fn();

      periksaIzin('kelola_pengguna', 'kelola_peran')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Anda tidak memiliki izin untuk tindakan ini',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('lanjut next saat user punya salah satu izin yang dibutuhkan', () => {
      const req = { user: { izin: ['lihat_kamus', 'kelola_peran'] } };
      const res = createRes();
      const next = jest.fn();

      periksaIzin('kelola_pengguna', 'kelola_peran')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('memperlakukan izin user kosong sebagai tidak memiliki izin', () => {
      const req = { user: {} };
      const res = createRes();
      const next = jest.fn();

      periksaIzin('kelola_pengguna')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('adminSaja', () => {
    it('mengembalikan 403 saat user bukan admin', () => {
      const req = { user: { peran: 'pengguna' } };
      const res = createRes();
      const next = jest.fn();

      adminSaja(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Hanya admin yang dapat mengakses',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('mengembalikan 403 saat req.user tidak ada', () => {
      const req = {};
      const res = createRes();
      const next = jest.fn();

      adminSaja(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('lanjut next saat user admin', () => {
      const req = { user: { peran: 'admin' } };
      const res = createRes();
      const next = jest.fn();

      adminSaja(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
