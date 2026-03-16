import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InfoTotal from '../../../src/components/data/InfoTotal';

describe('InfoTotal', () => {
  it('merender mode pencarian dan total', () => {
    const { rerender } = render(<InfoTotal q="kata" total={10} label="data" />);
    expect(screen.getByText('Pencarian "kata":', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    rerender(<InfoTotal q="" total={3} label="entri" />);
    expect(screen.getByText('Total:', { exact: false })).toBeInTheDocument();
  });
});