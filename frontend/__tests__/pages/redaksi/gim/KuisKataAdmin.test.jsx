import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KuisKataAdmin from '../../../../src/pages/redaksi/gim/KuisKataAdmin';

const mockUseKuisKataAdmin = vi.fn();
const mockTabelAdmin = vi.fn();

vi.mock('../../../../src/api/apiAdmin', () => ({
  useKuisKataAdmin: (...args) => mockUseKuisKataAdmin(...args),
}));

vi.mock('../../../../src/components/redaksi/HalamanAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../../src/components/redaksi/KomponenAdmin', () => ({
  TabelAdmin: (props) => {
    mockTabelAdmin(props);
    return (
      <div>
        <div>rows:{props.data.length}</div>
        <div>loading:{String(props.isLoading)}</div>
        <div>error:{String(props.isError)}</div>
      </div>
    );
  },
}));

describe('KuisKataAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('memetakan data rekap kuis kata ke tabel admin', () => {
    mockUseKuisKataAdmin.mockReturnValue({
      data: {
        data: [{
          id: 4,
          tanggal: '2026-03-15',
          nama: 'Ivan',
          jumlah_main: '3',
          jumlah_benar: '12',
          jumlah_pertanyaan: '15',
          skor_total: '120',
          durasi_detik: '95',
        }],
      },
      isLoading: false,
      isError: false,
    });

    render(<KuisKataAdmin />);

    expect(screen.getByRole('heading', { name: 'Kuis Kata' })).toBeInTheDocument();
    expect(screen.getByText('rows:1')).toBeInTheDocument();
    expect(mockTabelAdmin).toHaveBeenCalledWith(expect.objectContaining({
      total: 1,
      limit: 100,
      offset: 0,
      kunciId: 'id',
      isLoading: false,
      isError: false,
      data: [{
        id: 4,
        tanggal: '2026-03-15',
        nama: 'Ivan',
        main: 3,
        benar: 12,
        pertanyaan: 15,
        skor: 120,
        durasi: 95,
      }],
    }));

    const kolom = mockTabelAdmin.mock.calls[0][0].kolom;
    expect(kolom[2].render({ main: 1500 })).toBe('1.500');
    expect(kolom[3].render({ benar: 12 })).toBe('12');
    expect(kolom[4].render({ pertanyaan: 15 })).toBe('15');
    expect(kolom[5].render({ skor: 120 })).toBe('120');
    expect(kolom[6].render({ durasi: 95 })).toBe('95 dtk');
  });

  it('memakai fallback array kosong dan durasi nol untuk data tak valid', () => {
    mockUseKuisKataAdmin.mockReturnValue({
      data: {
        data: [{
          id: 9,
          tanggal: '2026-03-16',
          nama: 'Anonim',
          jumlah_main: 'bukan-angka',
          jumlah_benar: undefined,
          jumlah_pertanyaan: null,
          skor_total: '',
          durasi_detik: 'durasi',
        }],
      },
      isLoading: true,
      isError: true,
    });

    render(<KuisKataAdmin />);

    expect(screen.getByText('rows:1')).toBeInTheDocument();
    expect(screen.getByText('loading:true')).toBeInTheDocument();
    expect(screen.getByText('error:true')).toBeInTheDocument();

    expect(mockTabelAdmin).toHaveBeenCalledWith(expect.objectContaining({
      data: [{
        id: 9,
        tanggal: '2026-03-16',
        nama: 'Anonim',
        main: 0,
        benar: 0,
        pertanyaan: 0,
        skor: 0,
        durasi: 0,
      }],
    }));

    const kolom = mockTabelAdmin.mock.calls[0][0].kolom;
    expect(kolom[6].render({ durasi: 'bukan-angka' })).toBe('0 dtk');
  });

  it('memakai fallback array kosong bila data bukan array', () => {
    mockUseKuisKataAdmin.mockReturnValue({
      data: { data: { bukan: 'array' } },
      isLoading: false,
      isError: false,
    });

    render(<KuisKataAdmin />);

    expect(screen.getByText('rows:0')).toBeInTheDocument();
  });
});