import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeksLema from '../../../src/komponen/publik/TeksLema';

describe('TeksLema', () => {
  it('mengubah pola lema (nomor) menjadi superskrip', () => {
    render(<TeksLema lema="dara (3)" />);

    const sup = screen.getByText('3');
    expect(sup.tagName).toBe('SUP');
    expect(screen.getByText('dara')).toBeInTheDocument();
  });

  it('menampilkan teks asli jika tidak ada nomor homonim', () => {
    render(<TeksLema lema="gajah" />);

    expect(screen.getByText('gajah')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('aman untuk lema undefined (fallback default)', () => {
    const { container } = render(<TeksLema />);

    expect(container.textContent).toBe('');
  });
});
