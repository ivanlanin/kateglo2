/**
 * @fileoverview Halaman tunggal kaidah ejaan berbasis markdown statis di public/ejaan
 */

import '../../../styles/gramatika.css';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { rehypeCollapsibleHeadings } from '../../../utils/rehypeCollapsibleHeadings';
import { rehypeStatusSymbols } from '../../../utils/rehypeStatusSymbols';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import PanelLipat from '../../../components/panel/PanelLipat';
import KartuKategori from '../../../components/data/KartuKategori';
import { useSsrPrefetch } from '../../../context/ssrPrefetchContext';
import { daftarIsiEjaan, daftarItemEjaan } from '../../../constants/ejaanData';

function bacaIsiMarkdown(mardownMentah = '') {
  return mardownMentah.replace(/^---[\s\S]*?---\s*/m, '');
}

function DaftarIsiEjaanGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {daftarIsiEjaan.map((bab) => (
        <KartuKategori
          key={bab.slug}
          judul={bab.judul}
          items={bab.items}
          getKey={(item) => item.slug}
          getTo={(item) => `/ejaan/${item.slug}`}
          getLabel={(item) => item.judul}
        />
      ))}
    </div>
  );
}

function DaftarIsiPanel({ aktifSlug = '' }) {
  return (
    <div className="space-y-4">
      {daftarIsiEjaan.map((bab) => {
        const kategoriAktif = bab.items.some((item) => item.slug === aktifSlug);
        return (
          <PanelLipat
            key={`${bab.slug}-${aktifSlug}`}
            judul={bab.judul}
            terbukaAwal={kategoriAktif}
            aksen={true}
          >
            <ul className="ejaan-sidebar-pill-grid">
              {bab.items.map((item) => (
                <li key={item.slug} className="ejaan-sidebar-pill-item">
                  {aktifSlug === item.slug ? (
                    <span className="ejaan-sidebar-pill ejaan-sidebar-pill-active" aria-current="page">
                      {item.judul}
                    </span>
                  ) : (
                    <Link
                      to={`/ejaan/${item.slug}`}
                      className="ejaan-sidebar-pill"
                    >
                      {item.judul}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </PanelLipat>
        );
      })}
    </div>
  );
}

function Ejaan() {
  const { slug } = useParams();
  const ssrPrefetch = useSsrPrefetch();
  const [isiMarkdown, setIsiMarkdown] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  const semuaDokumen = useMemo(
    () => daftarItemEjaan,
    [],
  );

  const metadataAktif = semuaDokumen.find((item) => item.slug === slug) || null;
  const dataMarkdownSsr = useMemo(() => {
    if (ssrPrefetch?.type !== 'static-markdown' || ssrPrefetch.section !== 'ejaan') return null;
    if (String(ssrPrefetch.slug || '') !== String(slug || '')) return null;
    return ssrPrefetch;
  }, [ssrPrefetch, slug]);
  const dokumenValid = metadataAktif?.dokumen || '';
  const indeksAktif = metadataAktif
    ? semuaDokumen.findIndex((item) => item.slug === metadataAktif.slug)
    : -1;
  const dokumenSebelumnya = indeksAktif > 0 ? semuaDokumen[indeksAktif - 1] : null;
  const dokumenSesudah = indeksAktif >= 0 && indeksAktif < semuaDokumen.length - 1
    ? semuaDokumen[indeksAktif + 1]
    : null;

  const modeDaftarIsi = !slug;
  const halamanTidakDitemukan = Boolean(slug && (!metadataAktif || dataMarkdownSsr?.notFound));

  const metaSeo = useMemo(() => {
    if (modeDaftarIsi) {
      return {
        judul: 'Ejaan',
        judulNoda: 'Ejaan',
        deskripsi: 'Panduan kaidah ejaan bahasa Indonesia mencakup penggunaan huruf, penulisan kata, tanda baca, dan unsur serapan.',
      };
    }

    if (halamanTidakDitemukan) {
      return {
        judul: 'Ejaan Tidak Ditemukan',
        deskripsi: 'Halaman ejaan yang diminta tidak ditemukan di Kateglo.',
      };
    }

    if (!metadataAktif) {
      return {
        judul: 'Ejaan',
        deskripsi: 'Panduan kaidah ejaan bahasa Indonesia untuk penulisan yang tepat dan konsisten.',
      };
    }

    return {
      judul: metadataAktif.judul,
      deskripsi: dataMarkdownSsr?.description || `Kaidah ${metadataAktif.judul} pada bab ${metadataAktif.judulBab} dalam pedoman ejaan bahasa Indonesia di Kateglo.`,
    };
  }, [modeDaftarIsi, metadataAktif, halamanTidakDitemukan, dataMarkdownSsr]);

  useEffect(() => {
    if (modeDaftarIsi) {
      setIsiMarkdown('');
      setSedangMemuat(false);
      setGalat('');
      return;
    }

    if (halamanTidakDitemukan) {
      setIsiMarkdown('');
      setSedangMemuat(false);
      setGalat('Halaman ejaan tidak ditemukan.');
      return;
    }

    if (dataMarkdownSsr && !dataMarkdownSsr.notFound) {
      setIsiMarkdown(bacaIsiMarkdown(dataMarkdownSsr.markdown || ''));
      setSedangMemuat(false);
      setGalat('');
      return;
    }

    if (!dokumenValid) {
      setIsiMarkdown('');
      setSedangMemuat(false);
      setGalat('Dokumen ejaan tidak tersedia.');
      return;
    }

    const controller = new AbortController();

    const muat = async () => {
      setSedangMemuat(true);
      setGalat('');
      try {
        const response = await fetch(`/ejaan/${dokumenValid}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Dokumen tidak dapat dimuat.');
        }

        const teks = await response.text();
        setIsiMarkdown(bacaIsiMarkdown(teks));
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setIsiMarkdown('');
        setGalat('Gagal memuat dokumen ejaan.');
      } finally {
        setSedangMemuat(false);
      }
    };

    muat();
    return () => controller.abort();
  }, [dokumenValid, modeDaftarIsi, halamanTidakDitemukan, dataMarkdownSsr]);

  if (modeDaftarIsi) {
    return (
      <HalamanPublik
        judul={metaSeo.judul}
        judulNoda={metaSeo.judulNoda}
        deskripsi={metaSeo.deskripsi}
      >
        <DaftarIsiEjaanGrid />
        <p className="secondary-text mt-4">
          Sumber:{' '}
          <a
            href="https://ejaan.kemendikdasmen.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-action"
          >
            Pedoman Umum Ejaan yang Disempurnakan V
          </a>{' '}
          melalui{' '}
          <a
            href="https://github.com/gipsterya/eyd"
            target="_blank"
            rel="noopener noreferrer"
            className="link-action"
          >
            gipsterya/eyd
          </a>
        </p>
      </HalamanPublik>
    );
  }

  if (halamanTidakDitemukan) {
    return (
      <HalamanPublik judul={metaSeo.judul} deskripsi={metaSeo.deskripsi}>
        <p className="secondary-text">Halaman ejaan tidak ditemukan.</p>
      </HalamanPublik>
    );
  }

  return (
    <HalamanPublik
      judul={metaSeo.judul}
      deskripsi={metaSeo.deskripsi}
      tampilkanJudul={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2">
          <div className="kamus-detail-heading-row">
            <h1 className="kamus-detail-heading">
              <span className="kamus-detail-heading-main">{metadataAktif?.judul || 'Ejaan'}</span>
            </h1>
          </div>

          <div className="mt-6">
            {sedangMemuat && <p className="secondary-text">Memuat dokumen ejaan …</p>}
            {!sedangMemuat && galat && <p className="secondary-text">{galat}</p>}

            {!sedangMemuat && !galat && (
              <div className="ejaan-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeCollapsibleHeadings, rehypeStatusSymbols]}>
                  {isiMarkdown}
                </ReactMarkdown>
              </div>
            )}

            {!sedangMemuat && !galat && (dokumenSebelumnya || dokumenSesudah) && (
              <nav className="ejaan-sekuens-nav" aria-label="Navigasi bab ejaan">
                {dokumenSebelumnya && (
                  <Link
                    to={`/ejaan/${dokumenSebelumnya.slug}`}
                    className="ejaan-sekuens-link ejaan-sekuens-link-prev"
                    aria-label={`‹ ${dokumenSebelumnya.judul}`}
                  >
                    <span className="ejaan-sekuens-arrow" aria-hidden="true">{'‹'}</span>
                    <span className="ejaan-sekuens-label">{dokumenSebelumnya.judul}</span>
                  </Link>
                )}

                {dokumenSesudah && (
                  <Link
                    to={`/ejaan/${dokumenSesudah.slug}`}
                    className="ejaan-sekuens-link ejaan-sekuens-link-next"
                    aria-label={`${dokumenSesudah.judul} ›`}
                  >
                    <span className="ejaan-sekuens-label">{dokumenSesudah.judul}</span>
                    <span className="ejaan-sekuens-arrow" aria-hidden="true">{'›'}</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </article>

        <div>
          <DaftarIsiPanel aktifSlug={metadataAktif?.slug || ''} />
        </div>
      </div>
    </HalamanPublik>
  );
}

export default Ejaan;