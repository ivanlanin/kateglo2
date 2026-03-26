/**
 * @fileoverview Renderer markdown statis dari berkas publik.
 */

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function hapusFrontmatter(markdownMentah = '') {
  return String(markdownMentah || '').replace(/^---[\s\S]*?---\s*/m, '');
}

function KontenMarkdownStatis({
  src,
  className = 'halaman-markdown-content',
  loadingText = 'Memuat dokumen ...',
  errorText = 'Gagal memuat dokumen.',
  components,
}) {
  const [isiMarkdown, setIsiMarkdown] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    if (!src) {
      setIsiMarkdown('');
      setSedangMemuat(false);
      setGalat(errorText);
      return undefined;
    }

    const controller = new AbortController();

    const muatDokumen = async () => {
      setSedangMemuat(true);
      setGalat('');

      try {
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Dokumen tidak dapat dimuat.');
        }

        const markdownMentah = await response.text();
        setIsiMarkdown(hapusFrontmatter(markdownMentah));
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setIsiMarkdown('');
        setGalat(errorText);
      } finally {
        setSedangMemuat(false);
      }
    };

    muatDokumen();
    return () => controller.abort();
  }, [errorText, src]);

  if (sedangMemuat) {
    return <p className="secondary-text">{loadingText}</p>;
  }

  if (galat) {
    return <p className="secondary-text">{galat}</p>;
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {isiMarkdown}
      </ReactMarkdown>
    </div>
  );
}

export { hapusFrontmatter };
export default KontenMarkdownStatis;
