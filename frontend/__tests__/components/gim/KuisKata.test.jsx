import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import KuisKata, { gabungRiwayat, __private } from '../../../src/components/publik/KuisKata';

const mockRemoveQueries = vi.fn();
const mockUseQuery = vi.fn();
const mockMutate = vi.fn();
const mockAuthState = { isAuthenticated: false };
const mockMutationMode = { current: 'idle' };

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
  useMutation: (config) => ({
    mutate: (payload) => {
      mockMutate(payload);
      config.mutationFn?.(payload);

      if (mockMutationMode.current === 'saving') {
        config.onMutate?.(payload);
        return;
      }

      if (mockMutationMode.current === 'success') {
        config.onMutate?.(payload);
        config.onSuccess?.({ ok: true }, payload, undefined);
        return;
      }

      if (mockMutationMode.current === 'error') {
        config.onMutate?.(payload);
        config.onError?.(new Error('gagal simpan'), payload, undefined);
      }
    },
    isPending: mockMutationMode.current === 'pending',
  }),
  useQueryClient: () => ({ removeQueries: mockRemoveQueries }),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  ambilRondeKuisKata: vi.fn(),
  submitRekapKuisKata: vi.fn(),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuthState,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

const rondeMock = [
  {
    mode: 'kamus',
    soal: 'alpha',
    pilihan: ['arti alpha', 'arti beta'],
    jawaban: 0,
    penjelasan: 'alpha artinya: arti alpha.',
  },
  {
    mode: 'tesaurus',
    soal: 'beta',
    relasi: 'antonim',
    pilihan: ['padanan beta; imbangan beta; sanding beta; ekor beta', 'lawan beta'],
    jawaban: 1,
    penjelasan: 'lawan beta adalah antonim dari beta.',
  },
];

describe('KuisKata', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRemoveQueries.mockReset();
    mockUseQuery.mockReset();
    mockMutate.mockReset();
    mockAuthState.isAuthenticated = false;
    mockMutationMode.current = 'idle';
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) {
        options.queryFn();
      }
      return {
        data: { ronde: rondeMock },
        isLoading: false,
        isError: false,
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('helper private memetakan label, ikon, kelas skor, pemendek tesaurus, dan path ringkasan', () => {
    expect(__private.labelSkor(50)).toBe('Sempurna!');
    expect(__private.labelSkor(40)).toBe('Hampir sempurna!');
    expect(__private.labelSkor(30)).toBe('Lumayan!');
    expect(__private.labelSkor(20)).toBe('Terus berlatih!');
    expect(__private.labelSkor(10)).toBe('Coba lagi!');
    expect(__private.ikonMode('asing')).toBe('❓');
    expect(__private.batasiPilihanTesaurus()).toBe('');
    expect(__private.batasiPilihanTesaurus('a; b; c; d')).toBe('a; b; c');
    expect(__private.batasiPilihanTesaurus('a; b')).toBe('a; b');
    expect(__private.teksPilihan({ mode: 'tesaurus' }, 'a; b; c; d')).toBe('a; b; c');
    expect(__private.teksPilihan({ mode: 'kamus' }, 'arti')).toBe('arti');
    expect(__private.kelasSkorAkhir(0, 5)).toBe('gim-ringkasan-skor-merah');
    expect(__private.kelasSkorAkhir(5, 5)).toBe('gim-ringkasan-skor-hijau');
    expect(__private.kelasSkorAkhir(4, 5)).toBe('gim-ringkasan-skor-hijau-muda');
    expect(__private.kelasSkorAkhir(3, 5)).toBe('gim-ringkasan-skor-kuning');
    expect(__private.kelasSkorAkhir(2, 4)).toBe('gim-ringkasan-skor-kuning');
    expect(__private.kelasSkorAkhir(1, 4)).toBe('gim-ringkasan-skor-jingga');
    expect(__private.kelasSkorAkhir(4, 6)).toBe('gim-ringkasan-skor-limau');
    expect(__private.kelasSkorHeader(0)).toBe('gim-header-skor-merah');
    expect(__private.kelasSkorHeader(50)).toBe('gim-header-skor-hijau');
    expect(__private.kelasSkorHeader(10)).toBe('gim-header-skor-hijau-muda');
    expect(__private.buatPathRingkasan({ mode: 'glosarium', soal: 'loan word' })).toBe('/glosarium/detail/loan%20word');
    expect(__private.buatPathRingkasan({ mode: 'tesaurus', soal: 'kata' })).toBe('/tesaurus/cari/kata');
    expect(__private.buatPathRingkasan({ mode: 'makna', soal: 'arti' })).toBe('/makna/cari/arti');
    expect(__private.buatPathRingkasan({ mode: 'rima', soal: 'nada' })).toBe('/rima/cari/nada');
    expect(__private.buatPathRingkasan({ mode: 'kamus', soal: 'kata' })).toBe('/kamus/detail/kata');
  });

  it('helper private merender pertanyaan untuk mode ringkasan dan mode soal', () => {
    const parentClick = vi.fn();
    const { rerender } = render(<div onClick={parentClick}><__private.PertanyaanRingkasan soal={{ mode: 'makna', soal: 'arti' }} /></div>);
    expect(screen.getByText(/Apa yang bermakna/i)).toBeInTheDocument();

    rerender(<__private.PertanyaanRingkasan soal={{ mode: 'rima', soal: 'nada' }} />);
    expect(screen.getByText(/Apa yang berima dengan/i)).toBeInTheDocument();

    rerender(<__private.PertanyaanRingkasan soal={{ mode: 'glosarium', soal: 'loan word' }} />);
    expect(screen.getByText('loan word').tagName).toBe('EM');
    fireEvent.click(screen.getByRole('link', { name: 'loan word' }));
    expect(parentClick).not.toHaveBeenCalled();

    rerender(<__private.PertanyaanRingkasan soal={{ mode: 'tesaurus', soal: 'kata', relasi: '' }} />);
    expect(screen.getByText(/Apa sinonim/i)).toBeInTheDocument();

    rerender(<__private.PertanyaanSoal soal={{ mode: 'kamus', soal: 'kata' }} />);
    expect(screen.getByText('kata').tagName).toBe('STRONG');

    rerender(<__private.PertanyaanSoal soal={{ mode: 'tesaurus', soal: 'kata', relasi: '' }} />);
    expect(screen.getByText(/Apa sinonim/i)).toBeInTheDocument();

    rerender(<__private.PertanyaanSoal soal={{ mode: 'makna', soal: 'arti' }} />);
    expect(screen.getByText(/Apa yang bermakna/i)).toBeInTheDocument();

    rerender(<__private.PertanyaanSoal soal={{ mode: 'rima', soal: 'nada' }} />);
    expect(screen.getByText(/Apa yang berima dengan/i)).toBeInTheDocument();

    rerender(<__private.PertanyaanSoal soal={{ mode: 'glosarium', soal: 'loan word' }} />);
    expect(screen.getByText('loan word').tagName).toBe('EM');
  });

  it('menampilkan loading state dan null pada error, ronde kosong, atau soal aktif tak tersedia', () => {
    mockUseQuery.mockReturnValueOnce({ data: null, isLoading: true, isError: false });
    const loadingView = render(<KuisKata />);
    expect(screen.getByText('Menyiapkan soal …')).toBeInTheDocument();
    loadingView.unmount();

    mockUseQuery.mockReturnValueOnce({ data: null, isLoading: false, isError: true });
    const errorView = render(<KuisKata />);
    expect(errorView.container.firstChild).toBeNull();
    errorView.unmount();

    mockUseQuery.mockReturnValueOnce({ data: { ronde: [] }, isLoading: false, isError: false });
    const emptyView = render(<KuisKata />);
    expect(emptyView.container.firstChild).toBeNull();
    emptyView.unmount();

    mockUseQuery.mockReturnValueOnce({ data: { ronde: [undefined] }, isLoading: false, isError: false });
    const noQuestionView = render(<KuisKata />);
    expect(noQuestionView.container.firstChild).toBeNull();
  });

  it('langsung pindah ke soal berikutnya setelah jeda singkat', async () => {
    const { container } = render(<KuisKata />);
    const ambilSoal = () => container.querySelector('.gim-soal');

    expect(ambilSoal()).toHaveTextContent('Apa arti alpha?');
    expect(container.querySelector('strong')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /lanjut/i })).not.toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Skor')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.gim-progress-bullet')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Lewati' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'arti alpha' }));
    expect(screen.queryByText('alpha artinya: arti alpha.')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });

    expect(ambilSoal()).toHaveTextContent('Apa antonim beta?');
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'padanan beta; imbangan beta; sanding beta' })).toBeInTheDocument();
  });

  it('lewati dihitung salah dan tetap lanjut otomatis', async () => {
    const { container } = render(<KuisKata />);
    const ambilSoal = () => container.querySelector('.gim-soal');

    fireEvent.click(screen.getByRole('button', { name: 'Lewati' }));

    expect(screen.queryByText('alpha artinya: arti alpha.')).not.toBeInTheDocument();
    expect(container.querySelector('.gim-progress-bullet-salah')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });

    expect(ambilSoal()).toHaveTextContent('Apa antonim beta?');
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('mempertahankan skor total antar ronde dan menampilkan opsi benar-salah di ringkasan', async () => {
    const { container } = render(<KuisKata />);

    fireEvent.click(screen.getByRole('button', { name: 'arti alpha' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });

    fireEvent.click(screen.getByRole('button', { name: 'padanan beta; imbangan beta; sanding beta' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });

    expect(screen.getByText('1/2')).toBeInTheDocument();

    fireEvent.click(container.querySelector('.gim-ringkasan-item'));

    expect(screen.getByText('arti alpha')).toBeInTheDocument();
    expect(screen.getByText('arti beta')).toBeInTheDocument();
    expect(container.querySelectorAll('.gim-ringkasan-item-benar')).toHaveLength(1);
    expect(container.querySelectorAll('.gim-ringkasan-item-salah')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Main lagi!' }));

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(container.querySelector('.gim-soal')).toHaveTextContent('Apa arti alpha?');
  });

  it('gabungRiwayat menyimpan riwayat terbaru per mode tanpa duplikat', () => {
    const hasil = gabungRiwayat(
      [
        { mode: 'kamus', kunciSoal: 'lama-1' },
        { mode: 'kamus', kunciSoal: 'lama-2' },
        { mode: 'kamus', kunciSoal: 'lama-3' },
        { mode: 'tesaurus', kunciSoal: 'padan' },
      ],
      [
        { mode: 'kamus', kunciSoal: 'lama-2' },
        { mode: 'kamus', kunciSoal: 'baru-1' },
        { mode: 'tesaurus', kunciSoal: 'kontras' },
      ],
    );

    expect(hasil.filter((item) => item.mode === 'kamus')).toEqual([
      { mode: 'kamus', kunciSoal: 'lama-3' },
      { mode: 'kamus', kunciSoal: 'lama-2' },
      { mode: 'kamus', kunciSoal: 'baru-1' },
    ]);
    expect(hasil.filter((item) => item.mode === 'tesaurus')).toEqual([
      { mode: 'tesaurus', kunciSoal: 'padan' },
      { mode: 'tesaurus', kunciSoal: 'kontras' },
    ]);

    expect(gabungRiwayat([], null)).toEqual([]);
    expect(gabungRiwayat([], [{ mode: '   ', kunciSoal: 'x' }])).toEqual([]);
    expect(gabungRiwayat(null, [{ mode: '', kunciSoal: '' }, { mode: 'kamus', soal: 'baru-2' }])).toEqual([
      { mode: 'kamus', kunciSoal: 'baru-2' },
    ]);
  });

  it('mengabaikan klik jawaban dan lewati setelah soal sudah dijawab', async () => {
    const { container } = render(<KuisKata />);

    fireEvent.click(screen.getByRole('button', { name: 'arti alpha' }));
    fireEvent.click(screen.getByRole('button', { name: 'arti beta' }));
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lewati' })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });

    expect(container.querySelector('.gim-soal')).toHaveTextContent('Apa antonim beta?');
  });

  it('menampilkan catatan ringkasan untuk tamu, pending, saving, success, dan error', async () => {
    const mainkanSampaiRingkasan = async () => {
      fireEvent.click(screen.getByRole('button', { name: 'arti alpha' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1900);
      });
      fireEvent.click(screen.getByRole('button', { name: 'lawan beta' }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1900);
      });
    };

    const guestView = render(<KuisKata />);
    await mainkanSampaiRingkasan();
    expect(screen.getByText('Masuk untuk ikut ke klasemen harian.')).toBeInTheDocument();
    guestView.unmount();

    mockAuthState.isAuthenticated = true;
    mockMutationMode.current = 'pending';
    const pendingView = render(<KuisKata />);
    await mainkanSampaiRingkasan();
    expect(screen.getByText('Skor harian sedang disiapkan.')).toBeInTheDocument();
    pendingView.unmount();

    mockAuthState.isAuthenticated = true;
    mockMutationMode.current = 'saving';
    const savingView = render(<KuisKata />);
    await mainkanSampaiRingkasan();
    expect(screen.getByText('Menyimpan skor harian…')).toBeInTheDocument();
    savingView.unmount();

    mockAuthState.isAuthenticated = true;
    mockMutationMode.current = 'success';
    const successView = render(<KuisKata />);
    await mainkanSampaiRingkasan();
    expect(screen.getByText('Skor harian tersimpan.')).toBeInTheDocument();
    successView.unmount();

    mockAuthState.isAuthenticated = true;
    mockMutationMode.current = 'error';
    render(<KuisKata />);
    await mainkanSampaiRingkasan();
    expect(screen.getByText('Skor harian belum tersimpan.')).toBeInTheDocument();
  });
});