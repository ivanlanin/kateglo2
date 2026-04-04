/**
 * @fileoverview Shell konten publik untuk judul halaman dan metadata
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildSocialTitle } from '../../utils/socialMetaUtils';

const DEFAULT_TITLE = 'Kateglo';
const DEFAULT_DESCRIPTION = 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';

function upsertMetaTag({ name, property, content }) {
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    if (name) tag.setAttribute('name', name);
    if (property) tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function HalamanPublik({ judul, judulNoda, deskripsi, tampilkanJudul = true, children }) {
  const location = useLocation();

  useEffect(() => {
    document.title = judul
      ? `${judul} — Kateglo`
      : DEFAULT_TITLE;

    const finalDescription = deskripsi || DEFAULT_DESCRIPTION;
    const socialTitle = buildSocialTitle(
      `${location.pathname || '/'}${location.search || ''}`,
      document.title,
    );

    upsertMetaTag({ name: 'description', content: finalDescription });
    upsertMetaTag({ property: 'og:title', content: socialTitle });
    upsertMetaTag({ property: 'og:description', content: finalDescription });
    upsertMetaTag({ name: 'twitter:title', content: socialTitle });
    upsertMetaTag({ name: 'twitter:description', content: finalDescription });
  }, [judul, deskripsi, location.pathname, location.search]);

  return (
    <div className="halaman-dasar-container">
      {tampilkanJudul && (judulNoda || judul) && <h1 className="page-title">{judulNoda || judul}</h1>}
      {children}
    </div>
  );
}

export default HalamanPublik;
