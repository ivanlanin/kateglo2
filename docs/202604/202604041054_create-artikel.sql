-- Migrasi: Buat tabel artikel dan artikel_topik
-- Tanggal: 2026-04-04

create table artikel (
  id serial primary key,
  judul text not null,
  slug text not null,
  konten text not null default '',
  penulis_id integer references pengguna(id) not null,
  penyunting_id integer references pengguna(id),
  diterbitkan boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  diterbitkan_pada timestamp without time zone,
  constraint artikel_slug_key unique (slug)
);

create index idx_artikel_diterbitkan on artikel using btree (diterbitkan, diterbitkan_pada desc);
create index idx_artikel_penulis on artikel using btree (penulis_id);

create trigger trg_set_timestamp_fields__artikel
  before insert or update on artikel
  for each row
  execute function set_timestamp_fields();

create table artikel_topik (
  artikel_id integer references artikel(id) on delete cascade,
  topik text not null,
  primary key (artikel_id, topik)
);

create index idx_artikel_topik_topik on artikel_topik using btree (topik);
