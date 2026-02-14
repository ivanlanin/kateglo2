/**
 * @fileoverview Test App routing
 */

import { render, screen } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

vi.mock('../src/komponen/TataLetak', () => ({
  default: () => <div data-testid="layout">Layout</div>,
}));
vi.mock('../src/halaman/Beranda', () => ({ default: () => <div>Hal Beranda</div> }));
vi.mock('../src/halaman/Kamus', () => ({ default: () => <div>Hal Kamus</div> }));
vi.mock('../src/halaman/KamusDetail', () => ({ default: () => <div>Hal Kamus Detail</div> }));
vi.mock('../src/halaman/Glosarium', () => ({ default: () => <div>Hal Glosarium</div> }));
vi.mock('../src/halaman/Peribahasa', () => ({ default: () => <div>Hal Peribahasa</div> }));
vi.mock('../src/halaman/Singkatan', () => ({ default: () => <div>Hal Singkatan</div> }));

describe('App', () => {
  it('merender route layout', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});
