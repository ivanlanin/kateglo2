import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import KotakCari from '../../../src/komponen/publik/KotakCari';
import {
  deteksiKategori,
  ekstrakQuery,
  SorotTeks,
  navigasiCari,
  navigasiSaranSpesifik,
} from '../../../src/komponen/publik/KotakCari';
import { autocomplete } from '../../../src/api/apiPublik';

const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('../../../src/api/apiPublik', () => ({
  autocomplete: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

describe('KotakCari', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockReset();
    autocomplete.mockReset();
    mockPathname = '/';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mendeteksi kategori dan query dari pathname', () => {
    mockPathname = '/tesaurus/cari/anak%20ibu';

    render(<KotakCari autoFocus={false} />);

    expect(screen.getByDisplayValue('Tesaurus')).toBeInTheDocument();
    expect(screen.getByDisplayValue('anak ibu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cari relasi …')).toBeInTheDocument();
  });

  it('mendeteksi kategori glosarium dari pathname', () => {
    mockPathname = '/glosarium/cari/istilah';

    render(<KotakCari autoFocus={false} />);

    expect(screen.getByDisplayValue('Glosarium')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cari istilah …')).toBeInTheDocument();
  });

  it('helper deteksi/ekstrak/navigasi bekerja sesuai input', () => {
    expect(deteksiKategori('/tesaurus/cari/kata')).toBe('tesaurus');
    expect(deteksiKategori('/glosarium/cari/kata')).toBe('glosarium');
    expect(deteksiKategori('/kamus')).toBe('kamus');

    expect(ekstrakQuery('/kamus/cari/anak%20ibu')).toBe('anak ibu');
    expect(ekstrakQuery('/bukan/cari/kata')).toBe('');

    const navigate = vi.fn();
    navigasiCari(navigate, 'kamus', 'anak ibu');
    expect(navigate).toHaveBeenCalledWith('/kamus/cari/anak%20ibu');

    navigate.mockReset();
    navigasiSaranSpesifik(navigate, 'kamus', 'anak ibu');
    expect(navigate).toHaveBeenCalledWith('/kamus/detail/anak%20ibu');

    navigate.mockReset();
    navigasiSaranSpesifik(navigate, 'tesaurus', 'anak ibu');
    expect(navigate).toHaveBeenCalledWith('/tesaurus/cari/anak%20ibu');
  });

  it('SorotTeks menangani query kosong dan query tidak ditemukan', () => {
    const { rerender } = render(<SorotTeks teks="anak" query="" />);
    expect(screen.getByText('anak')).toBeInTheDocument();

    rerender(<SorotTeks teks="anak" query="zzz" italic />);
    const emText = screen.getByText('anak');
    expect(emText.tagName.toLowerCase()).toBe('em');
  });

  it('submit query kosong tidak menavigasi', () => {
    render(<KotakCari autoFocus={false} />);

    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submit query menavigasi sesuai kategori aktif', () => {
    render(<KotakCari autoFocus={false} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anak ibu' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/anak%20ibu');
  });

  it('memuat saran, mendukung keyboard, dan memilih item aktif ke detail kamus', async () => {
    autocomplete.mockResolvedValue([
      { value: 'anak', asing: 'child' },
      { value: 'anakan' },
    ]);

    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'an' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    expect(within(listbox).getAllByRole('option')).toHaveLength(2);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/kamus/detail/anak');
  });

  it('menutup dropdown dengan escape, klik luar, hapus, dan query pendek', async () => {
    autocomplete.mockResolvedValue([{ value: 'kata' }]);
    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'ka' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(input).toHaveValue('');

    fireEvent.change(input, { target: { value: 'a' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(autocomplete).toHaveBeenCalledTimes(1);
  });

  it('handleKeyDown kembali tanpa aksi saat saran tidak tampil', () => {
    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('ganti kategori memicu request saran baru saat query valid', async () => {
    autocomplete.mockResolvedValue([]);
    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'kata' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(autocomplete).toHaveBeenCalledWith('kamus', 'kata');

    fireEvent.change(screen.getByDisplayValue('Kamus'), { target: { value: 'glosarium' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(autocomplete).toHaveBeenCalledWith('glosarium', 'kata');
    expect(screen.getByPlaceholderText('Cari istilah …')).toBeInTheDocument();
  });

  it('menangani error autocomplete dan menutup daftar saran', async () => {
    autocomplete.mockRejectedValue(new Error('gagal'));
    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'kata' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keyboard navigation memungkinkan kembali ke pencarian umum', async () => {
    autocomplete.mockResolvedValue([
      { value: 'anak' },
      { value: 'anakan' },
    ]);

    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'an' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    fireEvent.keyDown(input, { key: 'ArrowDown' }); // -1 -> 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0 -> 1
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 1 -> -1 (kembali ke mode umum)

    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/an');
  });

  it('opsi saran merespons hover dan klik mouse ke detail kamus', async () => {
    autocomplete.mockResolvedValue([
      { value: 'anak' },
      { value: 'anakan' },
    ]);

    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'an' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    fireEvent.mouseEnter(options[1]);
    fireEvent.mouseDown(options[1]);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/detail/anakan');
  });

  it('setelah hover lalu keluar daftar, Enter kembali ke pencarian umum', async () => {
    autocomplete.mockResolvedValue([
      { value: 'anak' },
      { value: 'anakan' },
    ]);

    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'an' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    fireEvent.mouseEnter(options[0]);
    fireEvent.mouseLeave(listbox);
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/an');
  });

  it('Enter pada saran menandai lewati submit sehingga submit berikutnya tidak menavigasi ulang', async () => {
    autocomplete.mockResolvedValue([{ value: 'anak' }]);

    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'an' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledTimes(1);

    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('ArrowUp dari posisi -1 pindah ke item terakhir lalu turun sampai -1 lagi', async () => {
    autocomplete.mockResolvedValue([{ value: 'anak' }, { value: 'anakan' }]);

    render(<KotakCari autoFocus={false} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'an' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await act(async () => {});

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/an');
  });
});