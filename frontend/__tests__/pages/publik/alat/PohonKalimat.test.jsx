import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PohonKalimat, { __private } from '../../../../src/pages/publik/alat/PohonKalimat';
import * as diagramModule from '../../../../src/pages/publik/alat/pohon-kalimat/PohonKalimatDiagram';

describe('PohonKalimat', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('membuka panel informasi markdown alat', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '## Fungsi\n\nAlat ini membantu menyusun pohon kalimat.',
    });

    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lihat informasi alat' }));

    expect(await screen.findByRole('heading', { name: 'Fungsi' })).toBeInTheDocument();
    expect(await screen.findByText('Alat ini membantu menyusun pohon kalimat.')).toBeInTheDocument();
    expect(screen.queryByText('Pohon akan muncul di sini.')).not.toBeInTheDocument();
  });

  it('merender builder dan memunculkan pohon setelah contoh dipilih', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Pohon Kalimat' })).toBeInTheDocument();
    expect(screen.getByText('Pohon akan muncul di sini.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pilih contoh pohon kalimat'), {
      target: { value: '0' },
    });

    expect(screen.getByLabelText('Pohon sintaksis kalimat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unduh' })).toBeInTheDocument();
  });

  it('dapat menambah klausa kedua', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Tambah klausa' }));

    expect(screen.getByLabelText('Konjungsi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '− Hapus klausa terakhir' })).toBeInTheDocument();
  });

  it('mengubah builder klausa, menyalakan klausa anak, dan mereset contoh', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Pilih contoh pohon kalimat'), {
      target: { value: '0' },
    });

    fireEvent.change(screen.getAllByLabelText('Label klausa')[0], {
      target: { value: 'Klausa Subordinatif' },
    });
    fireEvent.change(screen.getAllByLabelText('Teks segmen')[0], {
      target: { value: 'Rina' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Klausa' })[0]);
    expect(screen.getAllByLabelText('Teks segmen klausa anak').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Label klausa anak'), {
      target: { value: 'Klausa Utama' },
    });
    fireEvent.change(screen.getAllByLabelText('Teks segmen klausa anak')[0], {
      target: { value: 'anak klausa' },
    });
    fireEvent.click(screen.getAllByText('+ Tambah konstituen')[0]);
    expect(screen.getAllByLabelText('Teks segmen klausa anak').length).toBeGreaterThan(1);
    fireEvent.click(screen.getAllByLabelText('Hapus konstituen')[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Frasa' })[0]);
    expect(screen.queryByLabelText('Label klausa anak')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pilih contoh pohon kalimat'), {
      target: { value: '' },
    });
    expect(screen.getByText('Pohon akan muncul di sini.')).toBeInTheDocument();
  });

  it('mengelola klausa majemuk, konjungsi, konstituen, dan aksi unduh', () => {
    const unduhSpy = vi.spyOn(diagramModule, 'unduPng').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Tambah klausa' }));
    fireEvent.change(screen.getByLabelText('Konjungsi'), {
      target: { value: 'dan' },
    });
    fireEvent.click(screen.getAllByText('+ Tambah konstituen')[1]);
    expect(screen.getAllByLabelText('Teks segmen').length).toBeGreaterThan(2);
    fireEvent.change(screen.getAllByLabelText('Teks segmen')[2], {
      target: { value: 'hadir' },
    });
    fireEvent.click(screen.getAllByLabelText('Hapus konstituen')[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Unduh' }));
    expect(unduhSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '− Hapus klausa terakhir' }));
    expect(screen.queryByLabelText('Konjungsi')).not.toBeInTheDocument();
  });

  it('menjalankan callback subkomponen builder untuk semua aksi editor pohon', () => {
    const onChange = vi.fn();
    const onHapus = vi.fn();
    const onToggleRealisasi = vi.fn();
    const onKlausaAnakChange = vi.fn();
    const onKlausaAnakUbahKonstituen = vi.fn();
    const onKlausaAnakTambahKonstituen = vi.fn();
    const onKlausaAnakHapusKonstituen = vi.fn();

    const { rerender } = render(
      <__private.BarisKonstituen
        k={{ id: 'utama-1', peran: 'S', jenisFrasa: 'FN', teks: 'Rina', realisasi: 'frasa', klausaAnak: null }}
        bisaHapus
        onChange={onChange}
        onHapus={onHapus}
        onToggleRealisasi={onToggleRealisasi}
        onKlausaAnakChange={onKlausaAnakChange}
        onKlausaAnakUbahKonstituen={onKlausaAnakUbahKonstituen}
        onKlausaAnakTambahKonstituen={onKlausaAnakTambahKonstituen}
        onKlausaAnakHapusKonstituen={onKlausaAnakHapusKonstituen}
      />
    );

    fireEvent.change(screen.getByLabelText('Peran'), { target: { value: 'P' } });
    fireEvent.change(screen.getByLabelText('Jenis Frasa'), { target: { value: 'FV' } });
    fireEvent.change(screen.getByLabelText('Teks segmen'), { target: { value: 'membaca' } });
    fireEvent.click(screen.getByRole('button', { name: 'Klausa' }));
    fireEvent.click(screen.getByLabelText('Hapus konstituen'));

    expect(onChange).toHaveBeenCalledWith('utama-1', 'peran', 'P');
    expect(onChange).toHaveBeenCalledWith('utama-1', 'jenisFrasa', 'FV');
    expect(onChange).toHaveBeenCalledWith('utama-1', 'teks', 'membaca');
    expect(onToggleRealisasi).toHaveBeenCalledWith('utama-1');
    expect(onHapus).toHaveBeenCalledWith('utama-1');

    rerender(
      <__private.BarisKonstituen
        k={{
          id: 'utama-2',
          peran: 'O',
          jenisFrasa: 'FN',
          teks: '',
          realisasi: 'klausa',
          klausaAnak: {
            id: 'anak-1',
            label: 'Klausa Subordinatif',
            konstituen: [
              { id: 'sub-1', peran: 'S', jenisFrasa: 'FN', teks: 'Dia', realisasi: 'frasa', klausaAnak: null },
              { id: 'sub-2', peran: 'P', jenisFrasa: 'FV', teks: 'datang', realisasi: 'frasa', klausaAnak: null },
            ],
          },
        }}
        bisaHapus
        onChange={onChange}
        onHapus={onHapus}
        onToggleRealisasi={onToggleRealisasi}
        onKlausaAnakChange={onKlausaAnakChange}
        onKlausaAnakUbahKonstituen={onKlausaAnakUbahKonstituen}
        onKlausaAnakTambahKonstituen={onKlausaAnakTambahKonstituen}
        onKlausaAnakHapusKonstituen={onKlausaAnakHapusKonstituen}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Frasa' }));
    fireEvent.change(screen.getByLabelText('Label klausa anak'), { target: { value: 'Klausa Utama' } });
    fireEvent.change(screen.getAllByLabelText('Peran')[1], { target: { value: 'Konj' } });
    fireEvent.change(screen.getAllByLabelText('Jenis Frasa')[0], { target: { value: '—' } });
    fireEvent.change(screen.getAllByLabelText('Teks segmen klausa anak')[0], { target: { value: 'karena' } });
    fireEvent.click(screen.getByText('+ Tambah konstituen'));
    fireEvent.click(screen.getAllByLabelText('Hapus konstituen').at(-1));

    expect(onToggleRealisasi).toHaveBeenCalledWith('utama-2');
    expect(onKlausaAnakChange).toHaveBeenCalledWith('utama-2', 'label', 'Klausa Utama');
    expect(onKlausaAnakUbahKonstituen).toHaveBeenCalledWith('utama-2', 'sub-1', 'peran', 'Konj');
    expect(onKlausaAnakUbahKonstituen).toHaveBeenCalledWith('utama-2', 'sub-1', 'jenisFrasa', '—');
    expect(onKlausaAnakUbahKonstituen).toHaveBeenCalledWith('utama-2', 'sub-1', 'teks', 'karena');
    expect(onKlausaAnakTambahKonstituen).toHaveBeenCalledWith('utama-2');
    expect(onHapus).toHaveBeenCalledWith('utama-2');

    const hapusKlausaAnak = vi.fn();
    rerender(
      <__private.BlokKlausaAnak
        klausa={{
          id: 'anak-2',
          label: 'Klausa Subordinatif',
          konstituen: [
            { id: 'sub-a', peran: 'S', jenisFrasa: 'FN', teks: 'Dia', realisasi: 'frasa', klausaAnak: null },
            { id: 'sub-b', peran: 'P', jenisFrasa: 'FV', teks: 'datang', realisasi: 'frasa', klausaAnak: null },
          ],
        }}
        onChange={vi.fn()}
        onUbahKonstituen={vi.fn()}
        onTambahKonstituen={vi.fn()}
        onHapusKonstituen={hapusKlausaAnak}
      />
    );

    fireEvent.click(screen.getAllByLabelText('Hapus konstituen')[1]);
    expect(hapusKlausaAnak).toHaveBeenCalledWith('sub-b');
  });

  it('helper hapusKlausaDariSegmen menangani id yang tidak ada dan klausa tanpa konjungsi pendahulu', () => {
    const segmenTunggal = [{ tipe: 'klausa', id: 'kl-1', konstituen: [] }];
    expect(__private.hapusKlausaDariSegmen(segmenTunggal, 'tidak-ada')).toBe(segmenTunggal);
    expect(__private.hapusKlausaDariSegmen(segmenTunggal, 'kl-1')).toEqual([]);

    const segmenMajemuk = [
      { tipe: 'klausa', id: 'kl-1', konstituen: [] },
      { tipe: 'konjungsi', id: 'konj-1', teks: 'dan' },
      { tipe: 'klausa', id: 'kl-2', konstituen: [] },
    ];
    expect(__private.hapusKlausaDariSegmen(segmenMajemuk, 'kl-2')).toEqual([{ tipe: 'klausa', id: 'kl-1', konstituen: [] }]);
  });
});
