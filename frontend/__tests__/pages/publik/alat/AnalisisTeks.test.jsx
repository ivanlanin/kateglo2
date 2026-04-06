import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AnalisisTeks, { __private } from '../../../../src/pages/publik/alat/AnalisisTeks';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('AnalisisTeks helpers', () => {
  it('analisisTeks dan kelompokkanFrekuensi menutup cabang preview kalimat dan grup angka', () => {
    const pendek = __private.analisisTeks('Halo dunia.');
    expect(pendek.paragraphDetails[0].sentenceList[0]).toMatchObject({
      preview: 'Halo dunia.',
      canToggle: false,
    });

    const panjang = __private.analisisTeks('Satu dua tiga empat.');
    expect(panjang.paragraphDetails[0].sentenceList[0]).toMatchObject({
      preview: 'Satu dua ....',
      canToggle: true,
    });

    expect(__private.kelompokkanFrekuensi({ 12: 1, Andi: 1, kata: 2 })).toEqual({
      numbers: ['12 (1)'],
      properNouns: ['Andi (1)'],
      commonWordsMoreThanOnce: ['kata (2)'],
      commonWordsOnce: [],
    });
  });

  it('analisisTeks memakai fallback nol untuk paragraf tanpa kalimat terpecah', () => {
    const hasil = __private.analisisTeks('...');

    expect(hasil.paragraphDetails[0]).toMatchObject({
      preview: '...',
      avgWordsPerSentenceRaw: 0,
    });
  });

  it('helper teks dasar dan kelas ambang menutup cabang utilitas', () => {
    expect(__private.escapeSingleQuotes("aku 'kamu'")).toBe('aku ’kamu’');
    expect(__private.bersihkanTeks('({Halo})–uji@')).toBe('Halo uji');
    expect(__private.pecahKalimat('Satu. Dua!')).toEqual(['Satu', 'Dua']);
    expect(__private.pecahKalimat()).toEqual([]);
    expect(__private.pecahKata('satu  dua')).toEqual(['satu', 'dua']);
    expect(__private.pecahKata()).toEqual([]);
    expect(__private.bagiAman(6, 3)).toBe(2);
    expect(__private.bagiAman(6, 0)).toBe(0);
    expect(__private.getThresholdClass(100)).toBe('alat-stat-value-danger');
    expect(__private.getThresholdClass(1)).toBe('alat-stat-value-safe');
    expect(__private.getParagraphSummaryClass(true)).toContain('danger');
    expect(__private.getParagraphSummaryClass(false)).toContain('safe');
    expect(__private.getSentenceClass({ isLong: true, canToggle: true })).toContain('alat-sentence-item-toggle');
    expect(__private.getSentenceClass({ isLong: false, canToggle: false })).toBe('alat-sentence-item alat-sentence-item-safe');
    expect(__private.analisisTeks('')).toBeNull();
  });
});

describe('AnalisisTeks', () => {
  it('membuka panel informasi markdown alat', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '## Fungsi\n\nAlat ini mengurai teks.',
    });

    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lihat informasi alat' }));

    expect(await screen.findByRole('heading', { name: 'Fungsi' })).toBeInTheDocument();
    expect(await screen.findByText('Alat ini mengurai teks.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Teks untuk dianalisis')).not.toBeInTheDocument();
  });

  it('menampilkan ringkasan langsung di panel hasil dan mengaktifkan tab detail paragraf setelah analisis', () => {
    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: 'Detail Paragraf' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.change(screen.getByLabelText('Teks untuk dianalisis'), {
      target: { value: 'Satu kalimat.\n\nDua kalimat pertama. Dua kalimat kedua! 12.30 50% Andi.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));

    expect(screen.getByText('Karakter/Kata')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Ringkasan' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Detail Paragraf' })).toHaveAttribute('aria-selected', 'true');
  });

  it('berpindah antar pill hasil, membuka rincian paragraf, dan membersihkan hasil', () => {
    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Isi contoh' }));
    expect(screen.getByDisplayValue(/Bahasa berkembang bersama cara kita memakainya/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Detail Paragraf' }));
    expect(screen.getByRole('tab', { name: 'Detail Paragraf' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Lihat 1 kalimat')).toBeInTheDocument();
    expect(screen.getAllByText(/6 kata/i).length).toBeGreaterThan(0);

    const detailParagraf = screen.getByText('Lihat 1 kalimat').closest('details');
    expect(detailParagraf).not.toHaveAttribute('open');

    fireEvent.click(screen.getByText('Lihat 1 kalimat'));
    expect(detailParagraf).toHaveAttribute('open');
    expect(within(detailParagraf).getByText(/Bahasa berkembang bersama cara kita memakainya\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Frekuensi Kata' }));
    expect(screen.getByRole('tab', { name: 'Frekuensi Kata' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Kata (1x)')).toBeInTheDocument();
    expect(screen.getByText(/bahasa \(1\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan' }));
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Frekuensi Kata' }));
    expect(screen.getByText('Belum ada frekuensi yang ditampilkan.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Frekuensi Kata' })).toHaveAttribute('aria-selected', 'true');
  });

  it('menampilkan pesan validasi saat teks kosong', () => {
    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));
    expect(screen.getByText('Silakan masukkan teks terlebih dahulu.')).toBeInTheDocument();
  });

  it('menampilkan kelompok frekuensi angka dan nama, serta kalimat singkat tanpa tombol toggle', () => {
    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Teks untuk dianalisis'), {
      target: { value: '12.30! rumah Andi. Halo dunia.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Detail Paragraf' }));

    const summaries = screen.getAllByText((_, element) => element?.tagName.toLowerCase() === 'summary');
    fireEvent.click(summaries[0]);

    expect(screen.getAllByText(/2 kata:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Halo dunia\./i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Halo dunia\./i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Frekuensi Kata' }));
    expect(screen.getByText('Angka')).toBeInTheDocument();
    expect(screen.getByText('Nama/Singkatan')).toBeInTheDocument();
    expect(screen.getByText('Andi (1)')).toBeInTheDocument();
  });

  it('menyembunyikan grup kata satu kali saat seluruh kata muncul berulang', () => {
    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Teks untuk dianalisis'), {
      target: { value: 'kata kata 12 12 Andi Andi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Frekuensi Kata' }));

    expect(screen.getByText('Kata (>1x)')).toBeInTheDocument();
    expect(screen.queryByText('Kata (1x)')).not.toBeInTheDocument();
  });

  it('menampilkan pesan kosong saat paragraf tidak memiliki kalimat yang bisa dihitung', () => {
    render(
      <MemoryRouter>
        <AnalisisTeks />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Teks untuk dianalisis'), {
      target: { value: '...' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));

    expect(screen.getByText('Belum ada kalimat yang terdeteksi pada paragraf ini.')).toBeInTheDocument();
  });

});