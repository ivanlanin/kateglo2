/**
 * @fileoverview Halaman tunggal kaidah ejaan berbasis markdown statis di public/ejaan
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import PanelLipat from '../../komponen/publik/PanelLipat';
import KartuKategori from '../../komponen/publik/KartuKategori';

const daftarBab = [
  {
    judul: 'Penggunaan Huruf',
    slug: 'penggunaan-huruf',
    items: [
      { judul: 'Huruf Abjad', slug: 'huruf-abjad' },
      { judul: 'Huruf Vokal', slug: 'huruf-vokal' },
      { judul: 'Huruf Konsonan', slug: 'huruf-konsonan' },
      { judul: 'Gabungan Huruf Vokal', slug: 'gabungan-huruf-vokal' },
      { judul: 'Gabungan Huruf Konsonan', slug: 'gabungan-huruf-konsonan' },
      { judul: 'Huruf Kapital', slug: 'huruf-kapital' },
      { judul: 'Huruf Miring', slug: 'huruf-miring' },
      { judul: 'Huruf Tebal', slug: 'huruf-tebal' },
    ],
  },
  {
    judul: 'Penulisan Kata',
    slug: 'penulisan-kata',
    items: [
      { judul: 'Kata Dasar', slug: 'kata-dasar' },
      { judul: 'Kata Turunan', slug: 'kata-turunan' },
      { judul: 'Pemenggalan Kata', slug: 'pemenggalan-kata' },
      { judul: 'Kata Depan', slug: 'kata-depan' },
      { judul: 'Partikel', slug: 'partikel' },
      { judul: 'Singkatan', slug: 'singkatan' },
      { judul: 'Angka dan Bilangan', slug: 'angka-dan-bilangan' },
      { judul: 'Kata Ganti', slug: 'kata-ganti' },
      { judul: 'Kata Sandang', slug: 'kata-sandang' },
    ],
  },
  {
    judul: 'Penggunaan Tanda Baca',
    slug: 'penggunaan-tanda-baca',
    items: [
      { judul: 'Tanda Titik (.)', slug: 'tanda-titik' },
      { judul: 'Tanda Koma (,)', slug: 'tanda-koma' },
      { judul: 'Tanda Titik Koma (;)', slug: 'tanda-titik-koma' },
      { judul: 'Tanda Titik Dua (:)', slug: 'tanda-titik-dua' },
      { judul: 'Tanda Hubung (-)', slug: 'tanda-hubung' },
      { judul: 'Tanda Pisah (—)', slug: 'tanda-pisah' },
      { judul: 'Tanda Tanya (?)', slug: 'tanda-tanya' },
      { judul: 'Tanda Seru (!)', slug: 'tanda-seru' },
      { judul: 'Tanda Elipsis (...)', slug: 'tanda-elipsis' },
      { judul: 'Tanda Petik ("...")', slug: 'tanda-petik' },
      { judul: "Tanda Petik Tunggal ('...')", slug: 'tanda-petik-tunggal' },
      { judul: 'Tanda Kurung ((...))', slug: 'tanda-kurung' },
      { judul: 'Tanda Kurung Siku ([...])', slug: 'tanda-kurung-siku' },
      { judul: 'Tanda Garis Miring (/)', slug: 'tanda-garis-miring' },
      { judul: "Tanda Apostrof (')", slug: 'tanda-apostrof' },
    ],
  },
  {
    judul: 'Penulisan Unsur Serapan',
    slug: 'penulisan-unsur-serapan',
    items: [
      { judul: 'Serapan Umum', slug: 'serapan-umum' },
      { judul: 'Serapan Khusus', slug: 'serapan-khusus' },
    ],
  },
];

function bacaIsiMarkdown(mardownMentah = '') {
  return mardownMentah.replace(/^---[\s\S]*?---\s*/m, '');
}

function DaftarIsiEjaanGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {daftarBab.map((bab) => (
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
      {daftarBab.map((bab) => {
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
  const navigate = useNavigate();
  const { slug } = useParams();
  const [isiMarkdown, setIsiMarkdown] = useState('');
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  const semuaDokumen = useMemo(
    () => daftarBab.flatMap((bab) => bab.items.map((item) => ({
      judulBab: bab.judul,
      judul: item.judul,
      slug: item.slug,
      dokumen: `${bab.slug}/${item.slug}.md`,
    }))),
    [],
  );

  const metadataAktif = semuaDokumen.find((item) => item.slug === slug) || null;
  const dokumenValid = metadataAktif?.dokumen || '';

  const modeDaftarIsi = !slug;

  useEffect(() => {
    if (slug && !metadataAktif) {
      navigate('/ejaan', { replace: true });
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
  }, [dokumenValid, modeDaftarIsi]);

  if (modeDaftarIsi) {
    return (
      <HalamanDasar
        judul="Ejaan"
        deskripsi="Daftar isi kaidah ejaan bahasa Indonesia."
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
      </HalamanDasar>
    );
  }

  return (
    <HalamanDasar
      judul={metadataAktif?.judul || 'Ejaan'}
      deskripsi="Kaidah ejaan bahasa Indonesia berbasis dokumen markdown."
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
              <div className="changelog-content ejaan-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {isiMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </article>

        <div>
          <DaftarIsiPanel aktifSlug={metadataAktif?.slug || ''} />
        </div>
      </div>
    </HalamanDasar>
  );
}

export default Ejaan;