import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KomentarAdmin from '../../../src/halaman/redaksi/KomentarAdmin';

const mockNavigate = vi.fn();
let mockParams = {};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const mockUseDaftarKomentarAdmin = vi.fn();
const mockUseDetailKomentarAdmin = vi.fn();
const mutateSimpanKomentar = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarKomentarAdmin: (...args) => mockUseDaftarKomentarAdmin(...args),
  useDetailKomentarAdmin: (...args) => mockUseDetailKomentarAdmin(...args),
  useSimpanKomentarAdmin: () => ({ mutate: mutateSimpanKomentar, isPending: false }),
}));

vi.mock('../../../src/komponen/bersama/TataLetak', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

describe('KomentarAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
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
    mockUseDetailKomentarAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
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

  it('menampilkan pesan error saat simpan gagal', () => {
    mutateSimpanKomentar.mockImplementation((_data, opts) => {
      opts.onError?.({ response: { data: { message: 'Gagal dari server' } } });
    });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('kata'));
    fireEvent.change(screen.getByLabelText('Komentar'), { target: { value: 'komentar baru' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(screen.getByText('Gagal dari server')).toBeInTheDocument();
  });

  it('menampilkan fallback data kosong saat respons belum tersedia', () => {
    mockUseDaftarKomentarAdmin.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('kolom tanggal memakai created_at saat updated_at kosong', () => {
    mockUseDaftarKomentarAdmin.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{
          id: 2,
          indeks: 'kota',
          komentar: 'pakai created_at',
          pengguna_nama: 'Ani',
          pengguna_surel: 'ani@contoh.id',
          updated_at: '',
          created_at: '2026-02-17T01:00:00.000Z',
          aktif: 1,
        }],
      },
    });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('kota')).toBeInTheDocument();
    expect(screen.getByText(/\d{2} [A-Za-z]{3} \d{4} \d{2}\.\d{2}/)).toBeInTheDocument();
  });

  it('menampilkan fallback error default saat simpan gagal tanpa payload', () => {
    mutateSimpanKomentar.mockImplementation((_data, opts) => {
      opts.onError?.({});
    });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('kata'));
    fireEvent.change(screen.getByLabelText('Komentar'), { target: { value: 'komentar baru' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(screen.getByText('Gagal menyimpan komentar')).toBeInTheDocument();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/komentar', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailKomentarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'kata',
          komentar: 'detail komentar',
          pengguna_nama: 'Budi',
          pengguna_surel: 'budi@contoh.id',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('detail komentar')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/komentar', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '2' };
    mockUseDetailKomentarAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/komentar', { replace: true });
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailKomentarAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText('Komentar')).not.toBeInTheDocument();
  });

  it('membuka panel tanpa navigasi saat item tidak punya id', () => {
    mockUseDaftarKomentarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, indeks: 'tanpa-id', komentar: 'komentar x', pengguna_nama: 'Anon', pengguna_surel: 'anon@x.id', updated_at: null, aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(screen.getByDisplayValue('komentar x')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/komentar/null');
  });

  it('menjalankan handler cari dan menerapkan filter aktif', () => {
    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Filter status komentar'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const argTerakhir = mockUseDaftarKomentarAdmin.mock.calls.at(-1)?.[0] || {};
    expect(argTerakhir.aktif).toBe('1');
  });

  it('tidak menavigasi saat panel sudah terbuka ketika klik baris lagi', () => {
    render(
      <MemoryRouter>
        <KomentarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('kata'));
    expect(screen.getByDisplayValue(/komentar awal/i)).toBeInTheDocument();

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('kata'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
