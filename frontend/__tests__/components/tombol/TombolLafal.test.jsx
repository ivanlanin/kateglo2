import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TombolLafal from '../../../src/components/tombol/TombolLafal';

const speechSynthesisMock = {
  speaking: false,
  cancel: vi.fn(),
  getVoices: vi.fn(() => [{ lang: 'id-ID', name: 'Indonesian' }]),
  speak: vi.fn(),
};

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

describe('TombolLafal', () => {
  const speechSynthesisAwal = window.speechSynthesis;
  const utteranceAwal = globalThis.SpeechSynthesisUtterance;

  beforeEach(() => {
    speechSynthesisMock.speaking = false;
    speechSynthesisMock.cancel.mockReset();
    speechSynthesisMock.getVoices.mockClear();
    speechSynthesisMock.speak.mockReset();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: speechSynthesisMock,
    });
    globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: speechSynthesisAwal,
    });
    globalThis.SpeechSynthesisUtterance = utteranceAwal;
  });

  it('merender tombol besar dan mengucapkan kata tanpa sufiks homonim', () => {
    render(<TombolLafal kata="seri (2)" size="large" />);

    const tombol = screen.getByRole('button', { name: 'Dengarkan pelafalan seri (2)' });
    expect(tombol.className).toContain('tombol-lafal');
    expect(tombol.className).toContain('tombol-lafal-large');

    fireEvent.click(tombol);

    expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);
    expect(speechSynthesisMock.speak.mock.calls[0][0].text).toBe('seri');
    expect(speechSynthesisMock.speak.mock.calls[0][0].lang).toBe('id-ID');
    expect(speechSynthesisMock.speak.mock.calls[0][0].rate).toBe(0.9);
  });

  it('menghentikan pelafalan aktif saat tombol ditekan lagi', () => {
    speechSynthesisMock.speaking = true;

    render(<TombolLafal kata="aktif" />);

    fireEvent.click(screen.getByRole('button', { name: 'Dengarkan pelafalan aktif' }));

    expect(speechSynthesisMock.cancel).toHaveBeenCalledTimes(1);
    expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
  });
});