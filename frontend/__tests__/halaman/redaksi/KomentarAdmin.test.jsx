import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KomentarAdmin from '../../../src/halaman/redaksi/KomentarAdmin';

const mockUseDaftarKomentarAdmin = vi.fn();
const mutateSimpanKomentar = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarKomentarAdmin: (...args) => mockUseDaftarKomentarAdmin(...args),
  useSimpanKomentarAdmin: () => ({ mutate: mutateSimpanKomentar, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('KomentarAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDaftarKomentarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{
          id: 1,
          indeks: 'kata',
          komentar: 'komentar awal',
          pengguna_nama: 'Budi',
          pengguna_surel: 'budi@contoh.id',
          updated_at: '2026-02-17T09:39:00.000Z',
          aktif: 0,
        }],
      },
    });
  });

  it('menampilkan daftar komentar dan menyimpan moderasi', () => {
    mutateSimpanKomentar.mockImplementation((_data, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Komentar' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tanggal' })).toBeInTheDocument();
    expect(screen.getByText('kata')).toBeInTheDocument();
    expect(screen.getByText(/komentar awal/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('kata'));
    fireEvent.change(screen.getByLabelText('Komentar'), { target: { value: 'komentar diperbarui' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(mutateSimpanKomentar).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, komentar: 'komentar diperbarui' }),
      expect.any(Object)
    );
  });

  it('menampilkan validasi saat komentar kosong', () => {
    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('kata'));
    fireEvent.change(screen.getByLabelText('Komentar'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(screen.getByText('Komentar wajib diisi')).toBeInTheDocument();
    expect(mutateSimpanKomentar).not.toHaveBeenCalled();
  });
});
