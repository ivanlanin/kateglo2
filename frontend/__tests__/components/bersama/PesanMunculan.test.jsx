import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PesanMunculan from '../../../src/components/bersama/PesanMunculan';

describe('PesanMunculan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tidak merender saat tidak tampil', () => {
    render(<PesanMunculan tampil={false} judul="Galat" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('merender pesan error dengan kelas getar', () => {
    const onClose = vi.fn();

    render(
      <PesanMunculan
        tampil
        jenis="error"
        judul="Kata tidak valid"
        deskripsi="Silakan coba lagi"
        onClose={onClose}
      />
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('pesan-munculan-error');
    expect(toast).toHaveClass('pesan-munculan-getar');
    expect(screen.getByText('Kata tidak valid')).toBeInTheDocument();
    expect(screen.getByText('Silakan coba lagi')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tutup pesan' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('menutup otomatis sesuai durasi', async () => {
    const onClose = vi.fn();

    render(
      <PesanMunculan
        tampil
        jenis="success"
        judul="Berhasil"
        durasi={1200}
        token="a"
        onClose={onClose}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tidak menutup otomatis saat durasi 0', async () => {
    const onClose = vi.fn();

    render(
      <PesanMunculan
        tampil
        jenis="success"
        judul="Berhasil"
        durasi={0}
        token="b"
        onClose={onClose}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('merender jenis info tanpa deskripsi dan tetap aman saat onClose default', () => {
    render(
      <PesanMunculan
        tampil
        jenis="info"
        judul="Informasi"
      />
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveClass('pesan-munculan-info');
    expect(screen.queryByText('Silakan coba lagi')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tutup pesan' }));
  });
});
