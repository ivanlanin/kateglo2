import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DasborAdmin from '../../../src/halaman/redaksi/DasborAdmin';

const mockUseStatistikAdmin = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useStatistikAdmin: () => mockUseStatistikAdmin(),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
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

describe('DasborAdmin', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { izin: ['lihat_entri', 'lihat_tesaurus', 'lihat_glosarium', 'kelola_komentar', 'kelola_label', 'kelola_pengguna'] },
      punyaIzin: () => true,
    });
  });

  it('menampilkan statistik loading', () => {
    mockUseStatistikAdmin.mockReturnValue({ data: null, isLoading: true });
    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Dasbor')).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(6);
  });

  it('menampilkan statistik saat data tersedia', () => {
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: { data: { entri: 1000, tesaurus: 200, glosarium: 50, label: 321, pengguna: 12, komentar: 88 } },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('1.000')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('321')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
  });

  it('menyembunyikan kartu tanpa izin yang sesuai', () => {
    mockUseAuth.mockReturnValue({
      user: { izin: ['lihat_entri', 'lihat_tesaurus'] },
      punyaIzin: (izin) => ['lihat_entri', 'lihat_tesaurus'].includes(izin),
    });
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: { data: { entri: 1000, tesaurus: 200, glosarium: 50, label: 321, pengguna: 12, komentar: 88 } },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Entri Kamus')).toBeInTheDocument();
    expect(screen.getByText('Entri Tesaurus')).toBeInTheDocument();
    expect(screen.queryByText('Entri Glosarium')).not.toBeInTheDocument();
    expect(screen.queryByText('Komentar')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
    expect(screen.queryByText('Pengguna')).not.toBeInTheDocument();
  });

  it('menampilkan fallback strip saat nilai statistik kosong', () => {
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: { entri: null, tesaurus: undefined, glosarium: undefined, label: undefined, pengguna: undefined, komentar: undefined },
      },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});