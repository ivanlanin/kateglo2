import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KandidatKataAdmin from '../../../src/halaman/kadi/KandidatKataAdmin';

const mockUseAuth = vi.fn();
const mockUseDaftarKandidatKataAdmin = vi.fn();
const mockUseDetailKandidatKataAdmin = vi.fn();
const mockUseStatistikKandidatKata = vi.fn();
const mockUseDaftarAtestasi = vi.fn();
const mockUseDaftarRiwayat = vi.fn();
const mockUseFormPanel = vi.fn();
const mockUsePencarianAdmin = vi.fn();
const mockTataLetak = vi.fn();

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../src/api/apiKadi', () => ({
  useDaftarKandidatKataAdmin: (...args) => mockUseDaftarKandidatKataAdmin(...args),
  useDetailKandidatKataAdmin: (...args) => mockUseDetailKandidatKataAdmin(...args),
  useSimpanKandidatKata: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUbahStatusKandidatKata: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useHapusKandidatKata: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStatistikKandidatKata: (...args) => mockUseStatistikKandidatKata(...args),
  useDaftarAtestasi: (...args) => mockUseDaftarAtestasi(...args),
  useDaftarRiwayat: (...args) => mockUseDaftarRiwayat(...args),
}));

vi.mock('../../../src/komponen/bersama/TataLetak', () => ({
  default: (props) => {
    mockTataLetak(props);
    return (
      <div data-testid="tata-letak-admin">
        <div data-testid="tata-letak-mode">{props.mode}</div>
        <div data-testid="tata-letak-judul">{props.judul}</div>
        {props.children}
      </div>
    );
  },
}));

vi.mock('../../../src/komponen/redaksi/KomponenAdmin', () => ({
  BarisFilterCariAdmin: () => <div>Filter kandidat</div>,
  TabelAdmin: ({ data }) => (
    <div>
      {data.map((item) => <div key={item.id}>{item.kata}</div>)}
    </div>
  ),
  getApiErrorMessage: () => 'Galat',
  usePencarianAdmin: (...args) => mockUsePencarianAdmin(...args),
}));

vi.mock('../../../src/komponen/redaksi/PanelGeser', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../src/komponen/redaksi/FormulirAdmin', () => ({
  useFormPanel: (...args) => mockUseFormPanel(...args),
  InputField: () => <div>Input field</div>,
  SelectField: () => <div>Select field</div>,
  TextareaField: () => <div>Textarea field</div>,
  FormFooter: () => <div>Form footer</div>,
  PesanForm: () => null,
}));

describe('KandidatKataAdmin', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      punyaIzin: () => true,
    });

    mockUsePencarianAdmin.mockReturnValue({
      cari: '',
      setCari: vi.fn(),
      q: '',
      limit: 50,
      offset: 0,
      currentPage: 1,
      setOffset: vi.fn(),
      kirimCari: vi.fn(),
      hapusCari: vi.fn(),
      cursor: null,
      direction: 'next',
      lastPage: false,
    });

    mockUseFormPanel.mockReturnValue({
      buka: false,
      modeTambah: false,
      data: {},
      bukaUntukSunting: vi.fn(),
      tutup: vi.fn(),
      ubahField: vi.fn(),
      setData: vi.fn(),
    });

    mockUseStatistikKandidatKata.mockReturnValue({
      data: {
        data: [
          { status: 'menunggu', jumlah: 3 },
          { status: 'ditinjau', jumlah: 1 },
        ],
      },
    });

    mockUseDaftarKandidatKataAdmin.mockReturnValue({
      data: {
        data: [
          { id: 12, kata: 'swafoto', status: 'menunggu', jumlah_atestasi: 2, jenis: 'kata-dasar', sumber_scraper: 'wikipedia' },
        ],
        total: 1,
        pageInfo: {
          hasPrev: false,
          hasNext: false,
          prevCursor: null,
          nextCursor: null,
        },
      },
      isLoading: false,
      isError: false,
    });

    mockUseDetailKandidatKataAdmin.mockReturnValue({ data: null });
    mockUseDaftarAtestasi.mockReturnValue({ data: { data: [] }, isLoading: false });
    mockUseDaftarRiwayat.mockReturnValue({ data: { data: [] }, isLoading: false });
    mockTataLetak.mockReset();
  });

  it('memakai tata letak admin dan tetap merender isi halaman kandidat', () => {
    render(
      <MemoryRouter>
        <KandidatKataAdmin />
      </MemoryRouter>
    );

    expect(screen.getByTestId('tata-letak-mode')).toHaveTextContent('admin');
    expect(screen.getByTestId('tata-letak-judul')).toHaveTextContent('Kandidat Kata — KADI');
    expect(screen.getByText('Total: 4')).toBeInTheDocument();
    expect(screen.getByText('Filter kandidat')).toBeInTheDocument();
    expect(screen.getByText('swafoto')).toBeInTheDocument();
    expect(mockTataLetak).toHaveBeenCalled();
  });
});