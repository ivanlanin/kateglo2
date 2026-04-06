import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TeksMarkdownInline, { stripInlineMarkdown } from '../../../src/components/tampilan/TeksMarkdownInline';

describe('TeksMarkdownInline', () => {
  it('merender italic markdown ringan dalam judul', () => {
    render(<TeksMarkdownInline as="h1" text="Asal *Kata* dan _Makna_" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Asal Kata dan Makna');
    expect(screen.getByText('Kata', { selector: 'em' })).toBeInTheDocument();
    expect(screen.getByText('Makna', { selector: 'em' })).toBeInTheDocument();
  });

  it('menghapus penanda italic untuk metadata teks polos', () => {
    expect(stripInlineMarkdown('Asal *Kata* dan _Makna_')).toBe('Asal Kata dan Makna');
    expect(stripInlineMarkdown(null)).toBe('');
  });

  it('menjaga teks ekor setelah token italic dan memakai wrapper default', () => {
    const { container } = render(<TeksMarkdownInline text="Awal *Tengah* akhir" className="inline-kustom" />);

    const wrapper = container.querySelector('span.inline-kustom');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveTextContent('Awal Tengah akhir');
    expect(screen.getByText('Tengah', { selector: 'em' })).toBeInTheDocument();
  });
});
