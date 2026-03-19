/**
 * @fileoverview Halaman tunggal kaidah gramatika berbasis markdown statis di public/gramatika
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import PanelLipat from '../../../components/panel/PanelLipat';
import KartuKategori from '../../../components/data/KartuKategori';
import { daftarIsiGramatika, daftarItemGramatika } from '../../../constants/gramatikData';

function bacaIsiMarkdown(markdownMentah = '') {
  return markdownMentah.replace(/^---[\s\S]*?---\s*/m, '');
}

function DaftarIsiGramatikaGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {daftarIsiGramatika.map((bab) => (
        <KartuKategori
          key={bab.slug}
          judul={bab.judul}
          items={bab.items}
          getKey={(item) => item.slug}
          getTo={(item) => `/gramatika/${item.slug}`}
          getLabel={(item) => item.judul}
        />
      ))}
    </div>
  );
}

function DaftarIsiPanel({ aktifSlug = '' }) {
  return (
    <div className="space-y-4">
      {daftarIsiGramatika.map((bab) => {
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
                      to={`/gramatika/${item.slug}`}
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

function Gramatika() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [isiMarkdown, setIsiMarkdown] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  const semuaDokumen = useMemo(
    () => daftarItemGramatika,
    [],
  );

  const metadataAktif = semuaDokumen.find((item) => item.slug === slug) || null;
  const dokumenValid = metadataAktif?.dokumen || '';
  const indeksAktif = metadataAktif
    ? semuaDokumen.findIndex((item) => item.slug === metadataAktif.slug)
    : -1;
  const dokumenSebelumnya = indeksAktif > 0 ? semuaDokumen[indeksAktif - 1] : null;
  const dokumenSesudah = indeksAktif >= 0 && indeksAktif < semuaDokumen.length - 1
    ? semuaDokumen[indeksAktif + 1]
    : null;

  const modeDaftarIsi = !slug;

  const metaSeo = useMemo(() => {
    if (modeDaftarIsi) {
      return {
        judul: 'Gramatika',
        judulNoda: 'Gramatika',
        deskripsi: 'Panduan tata bahasa Indonesia mencakup kelas kata, kalimat, dan hubungan antarklausa berdasarkan Tata Bahasa Baku Bahasa Indonesia.',
      };
    }

    if (!metadataAktif) {
      return {
        judul: 'Gramatika',
        deskripsi: 'Panduan tata bahasa Indonesia untuk memahami struktur dan kaidah bahasa Indonesia.',
      };
    }

    return {
      judul: metadataAktif.judul,
      deskripsi: `Penjelasan tentang ${metadataAktif.judul} pada bab ${metadataAktif.judulBab} dalam panduan tata bahasa Indonesia di Kateglo.`,
    };
  }, [modeDaftarIsi, metadataAktif]);

  useEffect(() => {
    if (slug && !metadataAktif) {
      navigate('/gramatika', { replace: true });
    }
  }, [slug, metadataAktif, navigate]);

  useEffect(() => {
    if (modeDaftarIsi) {
      setIsiMarkdown('');
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
  }, [dokumenValid, modeDaftarIsi]);

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
              <span className="kamus-detail-heading-main">{metadataAktif?.judul || 'Gramatika'}</span>
            </h1>
          </div>

          <div className="mt-6">
            {sedangMemuat && <p className="secondary-text">Memuat dokumen gramatika …</p>}
            {!sedangMemuat && galat && <p className="secondary-text">{galat}</p>}

            {!sedangMemuat && !galat && (
              <div className="changelog-content ejaan-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {isiMarkdown}
                </ReactMarkdown>
              </div>
            )}

            {!sedangMemuat && !galat && (dokumenSebelumnya || dokumenSesudah) && (
              <nav className="ejaan-sekuens-nav" aria-label="Navigasi bab gramatika">
                {dokumenSebelumnya && (
                  <Link
                    to={`/gramatika/${dokumenSebelumnya.slug}`}
                    className="ejaan-sekuens-link ejaan-sekuens-link-prev"
                    aria-label={`‹ ${dokumenSebelumnya.judul}`}
                  >
                    <span className="ejaan-sekuens-arrow" aria-hidden="true">{'‹'}</span>
                    <span className="ejaan-sekuens-label">{dokumenSebelumnya.judul}</span>
                  </Link>
                )}

                {dokumenSesudah && (
                  <Link
                    to={`/gramatika/${dokumenSesudah.slug}`}
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

export default Gramatika;
