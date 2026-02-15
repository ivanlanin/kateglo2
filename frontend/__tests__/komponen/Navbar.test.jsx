/**
 * @fileoverview Test untuk komponen Navbar
 * @tested_in frontend/src/komponen/Navbar.jsx
 */

// Mock react-router-dom SEBELUM import komponen
const mockNavigate = vi.fn();
vi.mock('../../src/api/apiPublik', () => ({
  autocomplete: vi.fn().mockResolvedValue([]),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/kamus' }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../../src/komponen/Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('menampilkan logo Kateglo', () => {
    render(<Navbar />);
    expect(screen.getByText('Kateglo')).toBeInTheDocument();
  });

  it('menampilkan link menu navigasi', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'Kamus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tesaurus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Glosarium' })).toBeInTheDocument();
  });

  it('menampilkan input pencarian', () => {
    render(<Navbar />);
    expect(screen.getByPlaceholderText('Cari kata …')).toBeInTheDocument();
  });

  it('navigasi ke halaman kamus saat pencarian di-submit', () => {
    render(<Navbar />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    fireEvent.change(input, { target: { value: 'rumah' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/rumah');
  });

  it('tidak navigasi jika query kosong', () => {
    render(<Navbar />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('encode karakter khusus dalam query', () => {
    render(<Navbar />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    fireEvent.change(input, { target: { value: 'anak & ibu' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/anak%20%26%20ibu');
  });

  it('toggle menu mobile saat hamburger diklik', () => {
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText('Toggle menu');

    // Menu mobile belum terlihat (link hanya tampil di desktop)
    const linksBefore = screen.getAllByText('Kamus');
    const countBefore = linksBefore.length;

    // Klik hamburger
    fireEvent.click(toggleBtn);

    // Sekarang link mobile muncul
    const linksAfter = screen.getAllByText('Kamus');
    expect(linksAfter.length).toBeGreaterThan(countBefore);
  });

  it('klik link mobile menutup menu', () => {
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleBtn);

    const mobileLinks = screen.getAllByText('Glosarium');
    const mobileLink = mobileLinks[mobileLinks.length - 1];
    fireEvent.click(mobileLink);

    expect(screen.queryByText('Glosarium', { selector: '.navbar-mobile-link' })).not.toBeInTheDocument();
  });

  it('submit pencarian dari form mobile melakukan navigasi', () => {
    render(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));

    const inputs = screen.getAllByPlaceholderText('Cari kata …');
    const mobileInput = inputs[inputs.length - 1];
    fireEvent.change(mobileInput, { target: { value: 'mobile kata' } });
    fireEvent.submit(mobileInput.closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/mobile%20kata');
  });
});
