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
    expect(screen.getAllByText('…')).toHaveLength(15);
  });

  it('menampilkan statistik saat data tersedia', () => {
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          entri: 1000,
          tesaurus: 200,
          glosarium: 50,
          etimologi: 70,
          susunKataHarian: 77,
          susunKataBebas: 66,
          auditMakna: 44,
          auditTagar: 33,
          tagar: 22,
          bidang: 14,
          sumber: 18,
          label: 321,
          pengguna: 12,
          komentar: 88,
          pencarian: 999,
        },
      },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('1.000')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('77')).toBeInTheDocument();
    expect(screen.getByText('66')).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('33')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('321')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('menyembunyikan kartu tanpa izin yang sesuai', () => {
    mockUseAuth.mockReturnValue({
      user: { izin: ['lihat_entri', 'lihat_tesaurus'] },
      punyaIzin: (izin) => ['lihat_entri', 'lihat_tesaurus'].includes(izin),
    });
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          entri: 1000,
          tesaurus: 200,
          glosarium: 50,
          etimologi: 70,
          bidang: 14,
          sumber: 18,
          label: 321,
          pengguna: 12,
          komentar: 88,
        },
      },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Entri Kamus')).toBeInTheDocument();
    expect(screen.getByText('Entri Tesaurus')).toBeInTheDocument();
    expect(screen.queryByText('Entri Glosarium')).not.toBeInTheDocument();
    expect(screen.queryByText('Bidang')).not.toBeInTheDocument();
    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
    expect(screen.queryByText('Komentar')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
    expect(screen.queryByText('Pengguna')).not.toBeInTheDocument();
  });

  it('menggunakan fallback izin dari user saat punyaIzin bukan fungsi', () => {
    mockUseAuth.mockReturnValue({
      user: { izin: ['lihat_entri', 'kelola_label'] },
      punyaIzin: undefined,
    });
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          entri: 10,
          tesaurus: 20,
          glosarium: 30,
          etimologi: 0,
          bidang: 7,
          sumber: 8,
          label: 40,
          pengguna: 50,
          komentar: 60,
        },
      },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Entri Kamus')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.queryByText('Bidang')).not.toBeInTheDocument();
    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
    expect(screen.queryByText('Entri Tesaurus')).not.toBeInTheDocument();
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

  it('fallback izin user menjadi array kosong saat format izin tidak valid', () => {
    mockUseAuth.mockReturnValue({
      user: { izin: null },
      punyaIzin: undefined,
    });
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          entri: 10,
          tesaurus: 20,
          glosarium: 30,
          etimologi: 0,
          bidang: 7,
          sumber: 8,
          label: 40,
          pengguna: 50,
          komentar: 60,
        },
      },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByText('Entri Kamus')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
  });
});