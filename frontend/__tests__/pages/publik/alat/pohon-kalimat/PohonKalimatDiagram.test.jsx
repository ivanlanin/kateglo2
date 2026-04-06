import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PohonKalimatDiagram, { unduPng } from '../../../../../src/pages/publik/alat/pohon-kalimat/PohonKalimatDiagram';

describe('PohonKalimatDiagram', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merender diagram lengkap dengan legenda singkatan', () => {
    render(
      <PohonKalimatDiagram
        berwarna
        state={{
          segmen: [
            {
              tipe: 'klausa',
              id: 'kl-1',
              label: 'Klausa Utama',
              konstituen: [
                { id: 'k-1', peran: 'S', jenisFrasa: 'FN', teks: 'Rina', realisasi: 'frasa', klausaAnak: null },
                { id: 'k-2', peran: 'P', jenisFrasa: 'FV', teks: 'membaca', realisasi: 'frasa', klausaAnak: null },
              ],
            },
          ],
        }}
      />
    );

    expect(screen.getByLabelText('Pohon sintaksis kalimat')).toBeInTheDocument();
    const legenda = screen.getByText((teks) => teks.includes('S = Subjek') && teks.includes('FV = Frasa Verbal'));
    expect(legenda).toBeInTheDocument();
  });

  it('mendukung nodus spacer konjungsi dan diagram tanpa legenda', () => {
    const { rerender, container } = render(
      <PohonKalimatDiagram
        berwarna
        state={{
          segmen: [
            {
              tipe: 'klausa',
              id: 'kl-1',
              label: 'Klausa Utama',
              konstituen: [
                { id: 'k-1', peran: 'S', jenisFrasa: 'FN', teks: 'Rina', realisasi: 'frasa', klausaAnak: null },
                { id: 'k-2', peran: 'P', jenisFrasa: 'FV', teks: 'membaca', realisasi: 'frasa', klausaAnak: null },
              ],
            },
            { tipe: 'konjungsi', id: 'konj-1', teks: 'dan' },
            {
              tipe: 'klausa',
              id: 'kl-2',
              label: 'Klausa Utama',
              konstituen: [
                { id: 'k-3', peran: 'S', jenisFrasa: 'FN', teks: 'Budi', realisasi: 'frasa', klausaAnak: null },
                { id: 'k-4', peran: 'P', jenisFrasa: 'FV', teks: 'menulis', realisasi: 'frasa', klausaAnak: null },
              ],
            },
          ],
        }}
      />
    );

    expect(container.querySelectorAll('line').length).toBeGreaterThan(3);
    expect(screen.getByText('dan')).toBeInTheDocument();

    rerender(
      <PohonKalimatDiagram
        berwarna={false}
        state={{
          jenis: 'tunggal',
          konstituen: [{ id: 'x-1', peran: 'X', jenisFrasa: '—', teks: 'netral', realisasi: 'frasa', klausaAnak: null }],
        }}
      />
    );

    expect(screen.getByText('netral')).toBeInTheDocument();
    expect(screen.queryByText((teks) => teks.includes(' = '))).not.toBeInTheDocument();
  });

  it('mengonversi svg menjadi png saat diunduh', () => {
    URL.createObjectURL = vi.fn().mockReturnValueOnce('blob:svg').mockReturnValueOnce('blob:png');
    URL.revokeObjectURL = vi.fn();
    const svgEl = { viewBox: { baseVal: { width: 120, height: 60 } } };
    const serializeToString = vi.spyOn(XMLSerializer.prototype, 'serializeToString').mockReturnValue('<svg></svg>');
    const anchorClick = vi.fn();
    const scale = vi.fn();
    const fillRect = vi.fn();
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback) => callback(new Blob(['png'], { type: 'image/png' })));
    const getContext = vi.fn(() => ({ scale, fillStyle: '', fillRect, drawImage }));

    const createElementAsli = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext,
          toBlob,
        };
      }

      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: anchorClick,
        };
      }

      return createElementAsli(tagName);
    });

    const imageInstances = [];
    class MockImage {
      constructor() {
        this.onload = null;
        imageInstances.push(this);
      }

      set src(value) {
        this._src = value;
        this.onload?.();
      }
    }
    vi.stubGlobal('Image', MockImage);

    unduPng(svgEl, 'diagram-uji.png');

    expect(serializeToString).toHaveBeenCalledWith(svgEl);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(imageInstances).toHaveLength(1);
    expect(getContext).toHaveBeenCalledWith('2d');
    expect(scale).toHaveBeenCalledWith(2, 2);
    expect(fillRect).toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalled();
    expect(toBlob).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:svg');
  });
});