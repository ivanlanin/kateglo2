/**
 * @fileoverview Utilitas title sosial bersama untuk SSR dan runtime client.
 */

function stripKategloSuffix(value = '') {
  return String(value || '').replace(/\s+[—-]\s+Kateglo$/, '').trim();
}

function resolveDomainLabel(pathname = '/') {
  const path = decodeURIComponent(pathname || '/');

  if (path === '/kamus' || path === '/kamus/' || path.startsWith('/kamus/')) return 'Kamus';
  if (path === '/tesaurus' || path === '/tesaurus/' || path.startsWith('/tesaurus/')) return 'Tesaurus';
  if (path === '/glosarium' || path === '/glosarium/' || path.startsWith('/glosarium/')) return 'Glosarium';
  if (path === '/artikel' || path === '/artikel/' || path.startsWith('/artikel/')) return 'Artikel';
  if (path === '/makna' || path === '/makna/' || path.startsWith('/makna/')) return 'Makna';
  if (path === '/rima' || path === '/rima/' || path.startsWith('/rima/')) return 'Rima';
  if (path === '/gramatika' || path === '/gramatika/' || path.startsWith('/gramatika/')) return 'Gramatika';
  if (path === '/ejaan' || path === '/ejaan/' || path.startsWith('/ejaan/')) return 'Ejaan';
  if (path === '/alat' || path === '/alat/' || path.startsWith('/alat/')) return 'Alat';
  if (path === '/gim' || path === '/gim/' || path.startsWith('/gim/')) return 'Gim';

  return '';
}

function buildSocialTitle(pathname = '/', fallbackTitle = '') {
  const fallback = stripKategloSuffix(fallbackTitle) || 'Kateglo';
  const domainLabel = resolveDomainLabel(pathname);

  if (!domainLabel) return `${fallback} — Kateglo`;

  if (!fallback || fallback.toLowerCase() === domainLabel.toLowerCase()) {
    return `${domainLabel} — Kateglo`;
  }

  return `${fallback} — ${domainLabel} — Kateglo`;
}

export {
  stripKategloSuffix,
  buildSocialTitle,
};