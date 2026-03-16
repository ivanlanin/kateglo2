import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LencanaStatus from '../../../src/components/data/LencanaStatus';

describe('LencanaStatus', () => {
  it('merender status aktif dan nonaktif', () => {
    const { rerender } = render(<LencanaStatus aktif />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();

    rerender(<LencanaStatus aktif={false} />);
    expect(screen.getByText('Nonaktif')).toBeInTheDocument();
  });

  it('menerima prop aktif dan meragukan dalam bentuk numerik', () => {
    const { rerender } = render(<LencanaStatus aktif={1} />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();

    rerender(<LencanaStatus meragukan={1} />);
    expect(screen.getByText('Ragu')).toBeInTheDocument();

    rerender(<LencanaStatus meragukan={0} />);
    expect(screen.getByText('Pasti')).toBeInTheDocument();
  });

  it('memprioritaskan mode meragukan dan nilai eksplisit', () => {
    const { rerender } = render(<LencanaStatus meragukan />);
    expect(screen.getByText('Ragu')).toBeInTheDocument();

    rerender(<LencanaStatus jenis="meragukan" nilai={false} />);
    expect(screen.getByText('Pasti')).toBeInTheDocument();
  });

  it('memakai fallback konfigurasi aktif false saat jenis tidak dikenal', () => {
    render(<LencanaStatus jenis="misterius" nilai />);
    expect(screen.getByText('Nonaktif')).toBeInTheDocument();
  });
});
