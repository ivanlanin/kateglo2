import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TombolAksiAdmin from '../../../src/components/tombol/TombolAksiAdmin';

describe('TombolAksiAdmin', () => {
  it('memakai label default dan memanggil callback', () => {
    const onClick = vi.fn();

    render(<TombolAksiAdmin onClick={onClick} />);
    fireEvent.click(screen.getByText('+ Tambah'));

    expect(onClick).toHaveBeenCalled();
  });

  it('memakai label kustom', () => {
    render(<TombolAksiAdmin onClick={vi.fn()} label="Aksi Utama" />);
    expect(screen.getByText('Aksi Utama')).toBeInTheDocument();
  });
});