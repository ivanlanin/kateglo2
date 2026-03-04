import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SusunKataBebas from '../../../src/halaman/redaksi/SusunKataBebas';

const mockUseSusunKataBebasAdmin = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useSusunKataBebasAdmin: (...args) => mockUseSusunKataBebasAdmin(...args),
}));

vi.mock('../../../src/komponen/bersama/TataLetak', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('SusunKataBebas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan tabel rekap dengan format angka dan persen', () => {
    mockUseSusunKataBebasAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: [
          {
            tanggal: '2026-03-04',
            pemenang: 'ana',
            jumlah_peserta: 1450,
            total_main: 2450,
            persen_menang: 37.5,
          },
          {
            tanggal: '2026-03-03',
            pemenang: '',
            jumlah_peserta: 'x',
            total_main: null,
            persen_menang: 'tidak-valid',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <SusunKataBebas />
      </MemoryRouter>
    );

    expect(screen.getByText('Susun Kata Bebas')).toBeInTheDocument();
    expect(screen.getByText('1.450')).toBeInTheDocument();
    expect(screen.getByText('2.450')).toBeInTheDocument();
    expect(screen.getByText('37.50%')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('tetap aman saat respons tidak memiliki array data', () => {
    mockUseSusunKataBebasAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: null },
    });

    render(
      <MemoryRouter>
        <SusunKataBebas />
      </MemoryRouter>
    );

    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('menampilkan state loading dan error', () => {
    mockUseSusunKataBebasAdmin
      .mockReturnValueOnce({ isLoading: true, isError: false, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: true, data: undefined });

    const { rerender } = render(
      <MemoryRouter>
        <SusunKataBebas />
      </MemoryRouter>
    );
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <SusunKataBebas />
      </MemoryRouter>
    );
    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument();
  });
});
