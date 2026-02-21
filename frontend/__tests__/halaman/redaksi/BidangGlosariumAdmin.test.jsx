import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BidangGlosariumAdmin from '../../../src/halaman/redaksi/BidangGlosariumAdmin';

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

const mockUseDaftar = vi.fn();
const mockUseDetail = vi.fn();
const mutateSimpan = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarBidangGlosariumAdmin: (...args) => mockUseDaftar(...args),
  useDetailBidangGlosariumAdmin: (...args) => mockUseDetail(...args),
  useSimpanBidangGlosarium: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusBidangGlosarium: () => ({ mutate: vi.fn(), isPending: false }),
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

describe('BidangGlosariumAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kode: 'kimia', nama: 'Kimia', jumlah_entri: 2, aktif: true }],
      },
    });
    mockUseDetail.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan dapat menyimpan data', () => {
    render(
      <MemoryRouter>
        <BidangGlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'hukum' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Hukum' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpan).toHaveBeenCalled();
  });
});
