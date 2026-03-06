import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GimPilihGanda, { gabungRiwayat } from '../../../src/komponen/publik/GimPilihGanda';

const mockRemoveQueries = vi.fn();
const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
  useQueryClient: () => ({ removeQueries: mockRemoveQueries }),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  ambilRondePilihGanda: vi.fn(),
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

describe('GimPilihGanda', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRemoveQueries.mockReset();
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({
      data: { ronde: rondeMock },
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('langsung pindah ke soal berikutnya setelah jeda singkat', async () => {
    const { container } = render(<GimPilihGanda />);
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
    const { container } = render(<GimPilihGanda />);
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
    const { container } = render(<GimPilihGanda />);

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

    fireEvent.click(screen.getByRole('button', { name: 'Lagi!' }));

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
  });
});