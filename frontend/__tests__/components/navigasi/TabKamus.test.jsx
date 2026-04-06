import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TabKamus from '../../../src/components/navigasi/TabKamus';

let mockLocation = { pathname: '/kamus/cari/air' };
let mockParams = { kata: 'air', indeks: undefined };

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => mockLocation,
  useParams: () => mockParams,
}));

describe('TabKamus', () => {
  beforeEach(() => {
    mockLocation = { pathname: '/kamus/cari/air' };
    mockParams = { kata: 'air', indeks: undefined };
  });

  it('tidak merender tab saat halaman bukan mode pencarian', () => {
    mockLocation = { pathname: '/kamus/detail/air' };

    const view = render(<TabKamus />);

    expect(view.container.firstChild).toBeNull();
  });

  it('merender tab aktif dan membuat path pencarian untuk kata aktif', () => {
    render(<TabKamus />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Kamus' })).toHaveAttribute('href', '/kamus/cari/air');
    expect(screen.getByRole('link', { name: 'Tesaurus' })).toHaveAttribute('href', '/tesaurus/cari/air');
    expect(screen.getByRole('link', { name: 'Makna' })).toHaveAttribute('href', '/makna/cari/air');
    expect(screen.getByRole('link', { name: 'Rima' })).toHaveAttribute('href', '/rima/cari/air');
    expect(screen.getByRole('link', { name: 'Kamus' })).toHaveAttribute('aria-current', 'page');
  });

  it('memakai indeks sebagai kata aktif, fallback tab pertama, dan path dasar saat kata kosong', () => {
    mockLocation = { pathname: '/asing/cari/' };
    mockParams = { kata: '', indeks: 'kata dua' };

    render(<TabKamus />);

    expect(screen.getByRole('link', { name: 'Kamus' })).toHaveAttribute('href', '/kamus/cari/kata%20dua');
    expect(screen.getByRole('link', { name: 'Kamus' })).toHaveAttribute('aria-current', 'page');

    mockParams = { kata: '', indeks: '' };
    const view = render(<TabKamus />);
    const allKamusLinks = view.container.querySelectorAll('a[href="/kamus"]');
    expect(allKamusLinks.length).toBeGreaterThan(0);
  });
});