import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TombolSunting from '../../../src/komponen/publik/TombolSunting';

describe('TombolSunting', () => {
  it('mengembalikan null saat properti to kosong', () => {
    const { container } = render(
      <MemoryRouter>
        <TombolSunting to="" />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('merender link edit dengan properti default', () => {
    render(
      <MemoryRouter>
        <TombolSunting to="/redaksi/glosarium/10" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Sunting entri glosarium di Redaksi/i });
    expect(link).toHaveAttribute('href', '/redaksi/glosarium/10');
    expect(link).toHaveAttribute('title', 'Sunting entri glosarium di Redaksi');
    expect(screen.getByText('Sunting')).toBeInTheDocument();
  });
});
