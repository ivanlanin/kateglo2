export function normalisasiIndeksKamus(teks = '') {
  const nilai = String(teks || '').trim();
  if (!nilai) return '';

  const tanpaNomor = nilai.replace(/\s*\([0-9]+\)\s*$/, '');
  const tanpaStripTepi = tanpaNomor.replace(/^-+/, '').replace(/-+$/, '');
  return tanpaStripTepi.trim() || nilai;
}

export function buatPathDetailKamus(teks = '') {
  const indeks = normalisasiIndeksKamus(teks);
  if (!indeks) return '/kamus';
  return `/kamus/detail/${encodeURIComponent(indeks)}`;
}
