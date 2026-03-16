import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DasborAdmin from '../../../src/pages/redaksi/DasborAdmin';

const mockUseStatistikAdmin = vi.fn();
const mockUseAuth = vi.fn();
const mockFilterKelompokMenuRedaksi = vi.fn();

function buatKelompokMenuRedaksiFixture() {
  return [
    {
      judul: 'Leksikon',
      items: [
        {
          path: '/redaksi/kamus',
          label: 'Kamus',
          dashboardLabel: 'Entri Kamus',
          izin: 'lihat_entri',
          statistik: { key: 'entri', warna: 'text-blue-600' },
        },
        {
          path: '/redaksi/tesaurus',
          label: 'Tesaurus',
          dashboardLabel: 'Entri Tesaurus',
          izin: 'lihat_tesaurus',
          statistik: { key: 'tesaurus', warna: 'text-emerald-600' },
        },
        {
          path: '/redaksi/glosarium',
          label: 'Glosarium',
          dashboardLabel: 'Entri Glosarium',
          izin: 'lihat_glosarium',
          statistik: { key: 'glosarium', warna: 'text-amber-600' },
        },
        {
          path: '/redaksi/etimologi',
          label: 'Etimologi',
          dashboardLabel: 'Entri Etimologi',
          izin: 'kelola_etimologi',
          statistik: { key: 'etimologi', warna: 'text-indigo-600' },
        },
        {
          path: '/redaksi/kandidat-kata',
          label: 'Kandidat Kata',
          dashboardLabel: 'Kandidat Kata',
          izin: 'lihat_kandidat',
          statistik: { key: 'kandidatKata', warna: 'text-cyan-700' },
        },
      ],
    },
    {
      judul: 'Audit',
      items: [
        {
          path: '/redaksi/audit-makna',
          label: 'Makna',
          dashboardLabel: 'Audit Makna',
          izin: 'audit_makna',
          statistik: { key: 'auditMakna', warna: 'text-fuchsia-600' },
        },
        {
          path: '/redaksi/audit-tagar',
          label: 'Tagar',
          dashboardLabel: 'Audit Tagar',
          izin: 'audit_tagar',
          statistik: { key: 'auditTagar', warna: 'text-violet-600' },
        },
      ],
    },
    {
      judul: 'Gim',
      items: [
        {
          path: '/redaksi/susun-kata-harian',
          label: 'Susun Kata Harian',
          dashboardLabel: 'Susun Kata Harian',
          izin: 'kelola_susun_kata',
          statistik: { key: 'susunKataHarian', warna: 'text-lime-600' },
        },
        {
          path: '/redaksi/susun-kata-bebas',
          label: 'Susun Kata Bebas',
          dashboardLabel: 'Susun Kata Bebas',
          izin: 'kelola_susun_kata',
          statistik: { key: 'susunKataBebas', warna: 'text-green-600' },
        },
        {
          path: '/redaksi/kuis-kata',
          label: 'Kuis Kata',
          dashboardLabel: 'Kuis Kata',
          izin: 'kelola_susun_kata',
          statistik: { key: 'kuisKata', warna: 'text-emerald-600' },
        },
      ],
    },
    {
      judul: 'Interaksi',
      items: [
        {
          path: '/redaksi/komentar',
          label: 'Komentar',
          dashboardLabel: 'Komentar',
          izin: 'kelola_komentar',
          statistik: { key: 'komentar', warna: 'text-rose-600' },
        },
        {
          path: '/redaksi/pencarian',
          label: 'Pencarian',
          dashboardLabel: 'Pencarian',
          izin: 'lihat_pencarian',
          statistik: { key: 'pencarian', warna: 'text-orange-600' },
        },
        {
          path: '/redaksi/pencarian-hitam',
          label: 'Pencarian Hitam',
          dashboardLabel: 'Pencarian Hitam',
          izin: 'lihat_pencarian',
          statistik: { key: 'pencarianHitam', warna: 'text-stone-600' },
        },
      ],
    },
    {
      judul: 'Master',
      items: [
        {
          path: '/redaksi/bahasa',
          label: 'Bahasa',
          dashboardLabel: 'Bahasa',
          izin: 'kelola_bahasa',
          statistik: { key: 'bahasa', warna: 'text-blue-500' },
        },
        {
          path: '/redaksi/bidang',
          label: 'Bidang',
          dashboardLabel: 'Bidang',
          izin: 'kelola_bidang',
          statistik: { key: 'bidang', warna: 'text-sky-600' },
        },
        {
          path: '/redaksi/sumber',
          label: 'Sumber',
          dashboardLabel: 'Sumber',
          izin: 'kelola_sumber',
          statistik: { key: 'sumber', warna: 'text-teal-600' },
        },
        {
          path: '/redaksi/tagar',
          label: 'Tagar',
          dashboardLabel: 'Tagar',
          izin: 'kelola_tagar',
          statistik: { key: 'tagar', warna: 'text-pink-600' },
        },
        {
          path: '/redaksi/label',
          label: 'Label',
          dashboardLabel: 'Label',
          izin: 'kelola_label',
          statistik: { key: 'label', warna: 'text-cyan-600' },
        },
      ],
    },
    {
      judul: 'Akses',
      items: [
        {
          path: '/redaksi/peran',
          label: 'Peran',
          dashboardLabel: 'Peran',
          izin: 'kelola_peran',
          statistik: { key: 'peran', warna: 'text-red-600' },
        },
        {
          path: '/redaksi/izin',
          label: 'Izin',
          dashboardLabel: 'Izin',
          izin: 'kelola_peran',
          statistik: { key: 'izin', warna: 'text-amber-700' },
        },
        {
          path: '/redaksi/pengguna',
          label: 'Pengguna',
          dashboardLabel: 'Pengguna',
          izin: 'kelola_pengguna',
          statistik: { key: 'pengguna', warna: 'text-purple-600' },
        },
      ],
    },
  ];
}

function filterKelompokMenuFixture(hasIzin) {
  return buatKelompokMenuRedaksiFixture()
    .map((kelompok) => ({
      ...kelompok,
      items: kelompok.items.filter((item) => hasIzin(item.izin)),
    }))
    .filter((kelompok) => kelompok.items.length > 0);
}

vi.mock('../../../src/api/apiAdmin', () => ({
  useStatistikAdmin: () => mockUseStatistikAdmin(),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../src/constants/menuRedaksi', () => ({
  filterKelompokMenuRedaksi: (...args) => mockFilterKelompokMenuRedaksi(...args),
}));

vi.mock('../../../src/components/redaksi/HalamanAdmin', () => ({
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
      user: { izin: ['lihat_entri', 'lihat_tesaurus', 'lihat_glosarium', 'kelola_komentar', 'kelola_label', 'kelola_bahasa', 'kelola_pengguna'] },
      punyaIzin: () => true,
    });
    mockFilterKelompokMenuRedaksi.mockImplementation(filterKelompokMenuFixture);
  });

  it('menampilkan statistik loading', () => {
    mockUseStatistikAdmin.mockReturnValue({ data: null, isLoading: true });
    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Dasbor')).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(21);
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
          kandidatKata: 65,
          susunKataHarian: 77,
          susunKataBebas: 66,
          kuisKata: 55,
          auditMakna: 44,
          auditTagar: 33,
          tagar: 22,
          bidang: 14,
          bahasa: 19,
          sumber: 18,
          peran: 17,
          izin: 23,
          label: 321,
          pengguna: 12,
          komentar: 88,
          pencarian: 999,
          pencarianHitam: 27,
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
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('33')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('321')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
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
          kandidatKata: 65,
          bidang: 14,
          bahasa: 19,
          sumber: 18,
          peran: 7,
          izin: 8,
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
    expect(screen.queryByText('Bahasa')).not.toBeInTheDocument();
    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
    expect(screen.queryByText('Komentar')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
    expect(screen.queryByText('Pengguna')).not.toBeInTheDocument();
  });

  it('menggunakan fallback izin dari user saat punyaIzin bukan fungsi', () => {
    mockUseAuth.mockReturnValue({
      user: { izin: ['lihat_entri', 'kelola_label', 'kelola_bahasa'] },
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
          kandidatKata: 5,
          bidang: 7,
          bahasa: 9,
          sumber: 8,
          peran: 5,
          izin: 6,
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
    expect(screen.getByText('Bahasa')).toBeInTheDocument();
    expect(screen.queryByText('Bidang')).not.toBeInTheDocument();
    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
    expect(screen.queryByText('Entri Tesaurus')).not.toBeInTheDocument();
  });

  it('menampilkan fallback strip saat nilai statistik kosong', () => {
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          entri: null,
          tesaurus: undefined,
          glosarium: undefined,
          kandidatKata: undefined,
          label: undefined,
          peran: undefined,
          izin: undefined,
          pengguna: undefined,
          komentar: undefined,
        },
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
          kandidatKata: 5,
          bidang: 7,
          sumber: 8,
          peran: 5,
          izin: 6,
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

  it('memakai fallback label biasa dan jumlah null saat item tanpa dashboardLabel', () => {
    mockUseStatistikAdmin.mockReturnValue({ isLoading: false, data: { data: {} } });
    mockUseAuth.mockReturnValue({
      user: { izin: ['akses-kustom'] },
      punyaIzin: () => true,
    });
    mockFilterKelompokMenuRedaksi.mockReturnValue([
      {
        judul: 'Kustom',
        items: [
          { path: '/redaksi/kustom', label: 'Item Biasa' },
          { path: '/redaksi/stat', label: 'Item Statistik', statistik: { key: 'tidak_ada', warna: 'text-blue-600' } },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Item Biasa')).toBeInTheDocument();
    expect(screen.getByText('Item Statistik')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});