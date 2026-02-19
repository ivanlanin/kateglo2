/**
 * @fileoverview Komponen layout dasar halaman konten
 */

import { useEffect } from 'react';

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

function HalamanDasar({ judul, deskripsi, children }) {
  useEffect(() => {
    document.title = judul
      ? `${judul} — Kateglo`
      : DEFAULT_TITLE;

    const finalDescription = deskripsi || DEFAULT_DESCRIPTION;
    upsertMetaTag({ name: 'description', content: finalDescription });
    upsertMetaTag({ property: 'og:title', content: document.title });
    upsertMetaTag({ property: 'og:description', content: finalDescription });
    upsertMetaTag({ name: 'twitter:title', content: document.title });
    upsertMetaTag({ name: 'twitter:description', content: finalDescription });
  }, [judul, deskripsi]);

  return (
    <div className="halaman-dasar-container">
      {judul && <h1 className="page-title">{judul}</h1>}
      {children}
    </div>
  );
}

export default HalamanDasar;
