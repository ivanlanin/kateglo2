-- Tabel staging untuk data mentah scraping LWIM (Loan Words in Indonesian and Malay)
-- Sumber: http://sealang.net/lwim/
-- Tujuan: menampung semua entri sealang sebelum dianalisis dan dihubungkan ke tabel entri

create table etimologi_lwim (
  lwim_id text primary key,             -- e.g., "LWIM:22824" — ID unik dari sealang
  indeks_query text not null,           -- indeks yang dipakai saat query (dari entri.indeks)
  lwim_orth text not null,              -- orthTarget dengan diakritik, e.g., "véntilasi"
  lwim_hom integer,                     -- nomor hom dari sealang (bisa duplikat per orthTarget)

  -- Data etimologi yang diparsing dari <etym>
  etym_lang text,                       -- bahasa asal, e.g., "Dutch", "English", "Sanskrit"
  etym_mentioned text,                  -- kata dalam bahasa asal, e.g., "ventilatie"
  etym_cite text,                       -- kutipan referensi, e.g., "Monier-Williams:1098.2"
  etym_aksara text,                     -- aksara non-Latin, e.g., "四" (Tionghoa)

  -- Data tambahan yang diparsing
  raw_def text,                         -- teks <def> lengkap (termasuk inline etymology jika format B)
  xr_lihat text,                        -- cross-ref <xr type="see">, e.g., "fair"
  xr_varian text,                       -- cross-ref <xr type="var">, e.g., "pir"

  fetched_at timestamp without time zone not null default now()
);

create index idx_etimologi_lwim_indeks on etimologi_lwim using btree (indeks_query);
create index idx_etimologi_lwim_orth on etimologi_lwim using btree (lwim_orth);
