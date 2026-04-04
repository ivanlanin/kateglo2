/**
 * @fileoverview Halaman tunggal kaidah gramatika berbasis markdown statis di public/gramatika
 */

import '../../../styles/referensi.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { rehypeCollapsibleHeadings } from '../../../utils/rehypeCollapsibleHeadings';
import { rehypeStatusSymbols } from '../../../utils/rehypeStatusSymbols';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import PanelLipat from '../../../components/panel/PanelLipat';
import KartuKategori from '../../../components/data/KartuKategori';
import { useSsrPrefetch } from '../../../context/ssrPrefetchContext';
import {
  daftarHalamanReferensiGramatika,
  daftarIsiGramatika,
  daftarItemGramatika,
} from '../../../constants/gramatikaData';

function bacaIsiMarkdown(markdownMentah = '') {
  return markdownMentah.replace(/^---[\s\S]*?---\s*/m, '');
}

function setStatusHeadingLipat(container, terbuka) {
  if (!container) return 0;

  const daftarHeadingLipat = container.querySelectorAll('details');
  daftarHeadingLipat.forEach((heading) => {
    heading.open = terbuka;
  });

  return daftarHeadingLipat.length;
}

function DaftarIsiGramatikaGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <KartuKategori
        judul="Daftar"
        items={daftarHalamanReferensiGramatika}
        getKey={(item) => item.slug}
        getTo={(item) => `/gramatika/${item.slug}`}
        getLabel={(item) => item.judul}
        className="beranda-feature-card text-center md:col-span-2"
      />
      {daftarIsiGramatika.map((bab) => (
        <KartuKategori
          key={bab.slug}
          judul={bab.judul}
          judulTo={`/gramatika/${bab.slug}`}
          items={bab.items}
          getKey={(item) => item.slug}
          getTo={(item) => `/gramatika/${item.slug}`}
          getLabel={(item) => item.judul}
        />
      ))}
    </div>
  );
}

function DaftarIsiPanel({ aktifSlug = '', aktifSlugSebagaiTautan = '' }) {
  return (
    <div className="space-y-4">
      {daftarIsiGramatika.map((bab) => {
        const kategoriAktif = bab.slug === aktifSlug
          || bab.slug === aktifSlugSebagaiTautan
          || bab.items.some((item) => item.slug === aktifSlug || item.slug === aktifSlugSebagaiTautan);
        return (
          <PanelLipat
            key={`${bab.slug}-${aktifSlug}`}
            judul={bab.judul}
            terbukaAwal={kategoriAktif}
            aksen={true}
          >
            <ul className="ref-sidebar-pill-grid">
              <li key={`${bab.slug}-ikhtisar`} className="ref-sidebar-pill-item">
                {aktifSlug === bab.slug ? (
                  <span className="ref-sidebar-pill ref-sidebar-pill-active" aria-current="page">
                    Ikhtisar Bab
                  </span>
                ) : (
                  <Link
                    to={`/gramatika/${bab.slug}`}
                    className="ref-sidebar-pill"
                  >
                    Ikhtisar Bab
                  </Link>
                )}
              </li>
              {bab.items.map((item) => (
                <li key={item.slug} className="ref-sidebar-pill-item">
                  {aktifSlug === item.slug ? (
                    <span className="ref-sidebar-pill ref-sidebar-pill-active" aria-current="page">
                      {item.judul}
                    </span>
                  ) : aktifSlugSebagaiTautan === item.slug ? (
                    <Link
                      to={`/gramatika/${item.slug}`}
                      className="ref-sidebar-pill ref-sidebar-pill-active"
                      aria-current="page"
                    >
                      {item.judul}
                    </Link>
                  ) : (
                    <Link
                      to={`/gramatika/${item.slug}`}
                      className="ref-sidebar-pill"
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

function DaftarReferensiPanel({ aktifSlug = '' }) {
  return (
    <PanelLipat judul="Daftar" terbukaAwal={true} aksen={true}>
      <ul className="ref-sidebar-pill-grid">
        {daftarHalamanReferensiGramatika.map((item) => (
          <li key={item.slug} className="ref-sidebar-pill-item">
            {aktifSlug === item.slug ? (
              <span className="ref-sidebar-pill ref-sidebar-pill-active" aria-current="page">
                {item.judul}
              </span>
            ) : (
              <Link to={`/gramatika/${item.slug}`} className="ref-sidebar-pill">
                {item.judul}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </PanelLipat>
  );
}

function buildBreadcrumbGramatika(metadataAktif) {
  const breadcrumbs = [
    {
      label: 'Gramatika',
      to: '/gramatika',
    },
  ];

  if (!metadataAktif) {
    return breadcrumbs;
  }

  if (metadataAktif.tipe === 'bab') {
    return breadcrumbs;
  }

  if (metadataAktif.tipe === 'daftar') {
    return [
      ...breadcrumbs,
      {
        label: 'Daftar',
        to: null,
      },
    ];
  }

  breadcrumbs.push({
    label: metadataAktif.judulBab,
    to: `/gramatika/${metadataAktif.babSlug}`,
  });

  const ancestorTrail = Array.isArray(metadataAktif.ancestorTrail) && metadataAktif.ancestorTrail.length
    ? metadataAktif.ancestorTrail
    : metadataAktif.tipe === 'subitem' && metadataAktif.parentJudul && metadataAktif.parentSlug
      ? [{ judul: metadataAktif.parentJudul, slug: metadataAktif.parentSlug }]
      : [];

  ancestorTrail.forEach((ancestor) => {
    breadcrumbs.push({
      label: ancestor.judul,
      to: `/gramatika/${ancestor.slug}`,
    });
  });

  return breadcrumbs;
}
function Gramatika() {
  const { slug } = useParams();
  const ssrPrefetch = useSsrPrefetch();
  const markdownContainerRef = useRef(null);
  const [isiMarkdown, setIsiMarkdown] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [galat, setGalat] = useState('');
  const [semuaHeadingTerbuka, setSemuaHeadingTerbuka] = useState(true);
  const [adaHeadingLipat, setAdaHeadingLipat] = useState(false);

  const semuaDokumen = useMemo(
    () => [...daftarItemGramatika, ...daftarHalamanReferensiGramatika],
    [],
  );

  const metadataAktif = semuaDokumen.find((item) => item.slug === slug) || null;
  const dataMarkdownSsr = useMemo(() => {
    if (ssrPrefetch?.type !== 'static-markdown' || ssrPrefetch.section !== 'gramatika') return null;
    if (String(ssrPrefetch.slug || '') !== String(slug || '')) return null;
    return ssrPrefetch;
  }, [ssrPrefetch, slug]);
  const dokumenValid = metadataAktif?.dokumen || '';
  const urutanNavigasi = metadataAktif?.tipe === 'daftar'
    ? daftarHalamanReferensiGramatika
    : daftarItemGramatika;
  const indeksAktif = metadataAktif
    ? urutanNavigasi.findIndex((item) => item.slug === metadataAktif.slug)
    : -1;
  const dokumenSebelumnya = indeksAktif > 0 ? urutanNavigasi[indeksAktif - 1] : null;
  const dokumenSesudah = indeksAktif >= 0 && indeksAktif < urutanNavigasi.length - 1
    ? urutanNavigasi[indeksAktif + 1]
    : null;
  const aktifSlugSidebar = metadataAktif?.tipe === 'subitem' ? '' : (metadataAktif?.slug || '');
  const aktifSlugSidebarSebagaiTautan = metadataAktif?.tipe === 'subitem' ? metadataAktif.parentSlug : '';
  const breadcrumbItems = useMemo(() => buildBreadcrumbGramatika(metadataAktif), [metadataAktif]);

  const modeDaftarIsi = !slug;
  const halamanTidakDitemukan = Boolean(slug && (!metadataAktif || dataMarkdownSsr?.notFound));

  const toggleSemuaHeading = () => {
    const statusBerikutnya = !semuaHeadingTerbuka;
    setSemuaHeadingTerbuka(statusBerikutnya);
    setStatusHeadingLipat(markdownContainerRef.current, statusBerikutnya);
  };

  const metaSeo = useMemo(() => {
    if (modeDaftarIsi) {
      return {
        judul: 'Gramatika',
        judulNoda: 'Gramatika',
        deskripsi: 'Panduan tata bahasa Indonesia mencakup kelas kata, kalimat, dan hubungan antarklausa berdasarkan Tata Bahasa Baku Bahasa Indonesia.',
      };
    }

    if (halamanTidakDitemukan) {
      return {
        judul: 'Gramatika Tidak Ditemukan',
        deskripsi: 'Halaman gramatika yang diminta tidak ditemukan di Kateglo.',
      };
    }

    if (metadataAktif?.tipe === 'bab') {
      return {
        judul: metadataAktif.judul,
        deskripsi: dataMarkdownSsr?.description || `Ikhtisar bab ${metadataAktif.judul} dalam panduan tata bahasa Indonesia di Kateglo.`,
      };
    }

    if (metadataAktif?.tipe === 'daftar') {
      return {
        judul: metadataAktif.judul,
        deskripsi: dataMarkdownSsr?.description || metadataAktif.deskripsi,
      };
    }

    return {
      judul: metadataAktif.judul,
      deskripsi: dataMarkdownSsr?.description || `Penjelasan tentang ${metadataAktif.judul} pada bab ${metadataAktif.judulBab} dalam panduan tata bahasa Indonesia di Kateglo.`,
    };
  }, [modeDaftarIsi, metadataAktif, halamanTidakDitemukan, dataMarkdownSsr]);

  useEffect(() => {
    setSemuaHeadingTerbuka(true);
  }, [slug]);

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
      setGalat('Halaman gramatika tidak ditemukan.');
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
      setGalat('Dokumen gramatika tidak tersedia.');
      return;
    }

    const controller = new AbortController();

    const muat = async () => {
      setSedangMemuat(true);
      setGalat('');
      try {
        const response = await fetch(`/gramatika/${dokumenValid}`, {
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
        setGalat('Gagal memuat dokumen gramatika.');
      } finally {
        setSedangMemuat(false);
      }
    };

    muat();
    return () => controller.abort();
  }, [dokumenValid, modeDaftarIsi, halamanTidakDitemukan, dataMarkdownSsr]);

  useEffect(() => {
    if (sedangMemuat || galat || !isiMarkdown.trim()) {
      setAdaHeadingLipat(false);
      return;
    }

    const jumlahHeadingLipat = setStatusHeadingLipat(markdownContainerRef.current, semuaHeadingTerbuka);
    setAdaHeadingLipat(jumlahHeadingLipat > 0);
  }, [semuaHeadingTerbuka, sedangMemuat, galat, isiMarkdown]);

  if (modeDaftarIsi) {
    return (
      <HalamanPublik
        judul={metaSeo.judul}
        judulNoda={metaSeo.judulNoda}
        deskripsi={metaSeo.deskripsi}
      >
        <DaftarIsiGramatikaGrid />
        <p className="secondary-text mt-4">
          Sumber:{' '}
          <em>Tata Bahasa Baku Bahasa Indonesia</em>{' '}
          Edisi Keempat (2017), Badan Pengembangan dan Pembinaan Bahasa,
          Kementerian Pendidikan dan Kebudayaan.
        </p>
      </HalamanPublik>
    );
  }

  if (halamanTidakDitemukan) {
    return (
      <HalamanPublik judul={metaSeo.judul} deskripsi={metaSeo.deskripsi}>
        <p className="secondary-text">Halaman gramatika tidak ditemukan.</p>
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
          <nav className="kamus-detail-breadcrumb" aria-label="Breadcrumb gramatika">
            {breadcrumbItems.map((item, index) => {
              return (
                <span key={`${item.label}-${item.to}`}>
                  {index > 0 && <span aria-hidden="true"> / </span>}
                  {item.to ? (
                    <Link to={item.to} className="kamus-detail-breadcrumb-link">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="kamus-detail-heading-row">
            <h1 className="kamus-detail-heading">
              <span className="kamus-detail-heading-main">{metadataAktif.judul}</span>
            </h1>
            {adaHeadingLipat && (
              <button
                type="button"
                onClick={toggleSemuaHeading}
                className="ref-heading-toggle"
                aria-pressed={!semuaHeadingTerbuka}
              >
                {semuaHeadingTerbuka ? 'Ciutkan' : 'Luaskan'}
              </button>
            )}
          </div>

          <div className="mt-6">
            {sedangMemuat && <p className="secondary-text">Memuat dokumen gramatika …</p>}
            {!sedangMemuat && galat && <p className="secondary-text">{galat}</p>}

            {!sedangMemuat && !galat && (
              <div
                ref={markdownContainerRef}
                className="ref-markdown-content ref-gramatika-content"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeCollapsibleHeadings, { defaultOpen: true }], rehypeStatusSymbols]}>
                  {isiMarkdown}
                </ReactMarkdown>
              </div>
            )}

            {!sedangMemuat && !galat && (dokumenSebelumnya || dokumenSesudah) && (
              <nav className="ref-sekuens-nav" aria-label="Navigasi gramatika">
                {dokumenSebelumnya && (
                  <Link
                    to={`/gramatika/${dokumenSebelumnya.slug}`}
                    className="ref-sekuens-link ref-sekuens-link-prev"
                    aria-label={`‹ ${dokumenSebelumnya.judul}`}
                  >
                    <span className="ref-sekuens-arrow" aria-hidden="true">{'‹'}</span>
                    <span className="ref-sekuens-label">{dokumenSebelumnya.judul}</span>
                  </Link>
                )}

                {dokumenSesudah && (
                  <Link
                    to={`/gramatika/${dokumenSesudah.slug}`}
                    className="ref-sekuens-link ref-sekuens-link-next"
                    aria-label={`${dokumenSesudah.judul} ›`}
                  >
                    <span className="ref-sekuens-label">{dokumenSesudah.judul}</span>
                    <span className="ref-sekuens-arrow" aria-hidden="true">{'›'}</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </article>

        <div className="space-y-4">
          <DaftarReferensiPanel aktifSlug={metadataAktif?.tipe === 'daftar' ? metadataAktif.slug : ''} />
          <DaftarIsiPanel
            aktifSlug={aktifSlugSidebar}
            aktifSlugSebagaiTautan={aktifSlugSidebarSebagaiTautan}
          />
        </div>
      </div>
    </HalamanPublik>
  );
}

export const __private = {
  bacaIsiMarkdown,
  setStatusHeadingLipat,
  buildBreadcrumbGramatika,
  DaftarIsiGramatikaGrid,
  DaftarReferensiPanel,
  DaftarIsiPanel,
};

export default Gramatika;
