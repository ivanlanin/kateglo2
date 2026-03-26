/**
 * @fileoverview Katalog alat dan gim interaktif beserta konfigurasi visibilitas publik dan SEO-nya.
 */

import katalogFiturData from './katalogFiturData.json';

export const seoKatalogAlat = katalogFiturData.alat.index;
export const seoKatalogGim = katalogFiturData.gim.index;
export const katalogAlat = katalogFiturData.alat.items;
export const katalogGim = katalogFiturData.gim.items;

const grupKatalogInteraktif = [
  { jenis: 'alat', index: seoKatalogAlat, items: katalogAlat },
  { jenis: 'gim', index: seoKatalogGim, items: katalogGim },
];

function normalizePath(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  if (raw === '/') return '/';
  return raw.replace(/\/+$|\/+$/g, '').replace(/\/+/g, '/');
}

function buildMetaInteraktif(source = {}, fallbackItem = {}) {
  const judul = String(source.seoJudul || source.judul || fallbackItem.seoJudul || fallbackItem.judul || '').trim();
  const deskripsi = String(source.seoDeskripsi || source.deskripsi || fallbackItem.seoDeskripsi || fallbackItem.deskripsi || '').trim();
  const canonicalPath = String(source.canonicalPath || fallbackItem.canonicalPath || fallbackItem.href || source.href || '').trim();

  if (!judul || !deskripsi) return null;

  return { judul, deskripsi, canonicalPath };
}

export function ambilMetaFiturInteraktif(pathname = '') {
  const path = normalizePath(pathname);

  for (const grup of grupKatalogInteraktif) {
    if (normalizePath(grup.index?.href) === path) {
      return buildMetaInteraktif(grup.index);
    }

    for (const item of grup.items) {
      const seoVariant = Array.isArray(item.seoVariants)
        ? item.seoVariants.find((variant) => normalizePath(variant.path) === path)
        : null;
      if (seoVariant) {
        return buildMetaInteraktif(seoVariant, item);
      }

      const seoAlias = Array.isArray(item.seoAliases)
        ? item.seoAliases.find((alias) => normalizePath(alias.path) === path)
        : null;
      if (seoAlias) {
        return buildMetaInteraktif(seoAlias, item);
      }

      if (normalizePath(item.href) === path || normalizePath(item.canonicalPath) === path) {
        return buildMetaInteraktif(item, item);
      }

      const fallbackPrefix = normalizePath(item.seoFallback?.pathPrefix || '');
      if (fallbackPrefix !== '/' && (path === fallbackPrefix || path.startsWith(`${fallbackPrefix}/`))) {
        return buildMetaInteraktif(item.seoFallback, item);
      }
    }
  }

  return null;
}

export function ambilPathSitemapFiturInteraktif() {
  const paths = [];

  grupKatalogInteraktif.forEach((grup) => {
    if (grup.index?.sitemap !== false) {
      paths.push(grup.index.canonicalPath || grup.index.href);
    }

    grup.items.forEach((item) => {
      if (Array.isArray(item.sitemapPaths) && item.sitemapPaths.length) {
        paths.push(...item.sitemapPaths);
        return;
      }

      if (item.sitemap !== false && item.tampilPublik !== false) {
        paths.push(item.canonicalPath || item.href);
      }
    });
  });

  return [...new Set(paths.map((item) => normalizePath(item)).filter((item) => item && item !== '/'))];
}

export function filterItemInteraktif(items, adalahAdmin = false) {
  return items.filter((item) => item.tampilPublik !== false || adalahAdmin);
}

export function ambilDaftarAlat(adalahAdmin = false) {
  return filterItemInteraktif(katalogAlat, adalahAdmin);
}

export function ambilDaftarGim(adalahAdmin = false) {
  return filterItemInteraktif(katalogGim, adalahAdmin);
}

export function aksesRuteInteraktif(item) {
  return item?.tampilPublik === false ? 'admin' : 'publik';
}
