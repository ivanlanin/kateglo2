create index concurrently if not exists idx_entri_lower_indeks_detail_aktif
  on entri using btree (lower(indeks), homograf, homonim, entri, id)
  where aktif = 1 and indeks <> '';

create index concurrently if not exists idx_entri_lower_indeks_label_aktif
  on entri using btree (lower(indeks), indeks)
  where aktif = 1 and indeks <> '';

analyze entri;