# Sistem Pelacakan Kata Terpopuler (Minimal)

Tanggal: 2026-02-23

## Tujuan

Mulai dari desain paling minimal, hemat storage, dan mudah dikembangkan:

- hanya **1 tabel logis**: `pencarian`,
- tabel fisik otomatis per bulan: `pencarian_<yyyymm>`,
- tanpa tabel tambahan (`populer`, `rekap`),
- tanpa kolom tambahan (`awal`, `akhir`).

---

## Struktur Minimal

Standar nama sederhana:

- tabel: `pencarian`
- kolom: `tanggal`, `kata`, `jumlah`

```sql
create table if not exists pencarian (
  tanggal date not null,
  kata text not null,
  jumlah integer not null default 0
);
```

> Catatan: `pencarian` adalah tabel induk (logical table). Data aktual disimpan di tabel bulanan `pencarian_<yyyymm>`.

---

## Trigger Otomatis Buat Tabel Bulanan

Desain ini menggunakan trigger `before insert` pada tabel induk untuk:

1. membuat tabel bulanan jika belum ada,
2. membuat index unik `(tanggal, kata)` di tabel bulanan,
3. melakukan upsert ke tabel bulanan,
4. membatalkan insert ke induk (`return null`).

```sql
create or replace function pencarian_route()
returns trigger
language plpgsql
as $$
declare
  nama_tabel text;
  awal_bulan date;
  akhir_bulan date;
begin
  if new.tanggal is null then
    new.tanggal := current_date;
  end if;

  if new.kata is null or btrim(new.kata) = '' then
    return null;
  end if;

  if new.jumlah is null or new.jumlah < 1 then
    new.jumlah := 1;
  end if;

  nama_tabel := format('pencarian_%s', to_char(new.tanggal, 'YYYYMM'));
  awal_bulan := date_trunc('month', new.tanggal)::date;
  akhir_bulan := (date_trunc('month', new.tanggal) + interval '1 month')::date;

  execute format(
    'create table if not exists %I (
      check (tanggal >= date %L and tanggal < date %L)
    ) inherits (pencarian)',
    nama_tabel, awal_bulan, akhir_bulan
  );

  execute format(
    'create unique index if not exists %I on %I (tanggal, kata)',
    nama_tabel || '_tanggal_kata_key',
    nama_tabel
  );

  execute format(
    'insert into %I (tanggal, kata, jumlah)
     values ($1, $2, $3)
     on conflict (tanggal, kata)
     do update set jumlah = %I.jumlah + excluded.jumlah',
    nama_tabel,
    nama_tabel
  ) using new.tanggal, lower(btrim(new.kata)), new.jumlah;

  return null;
end;
$$;

create trigger trg_pencarian_route
before insert on pencarian
for each row
execute function pencarian_route();
```

---

## Cara Pakai (Write Path)

Aplikasi cukup insert ke tabel induk `pencarian`.

```sql
insert into pencarian (tanggal, kata, jumlah)
values (current_date, $1, 1);
```

Trigger akan otomatis:

- membuat `pencarian_202602` (contoh),
- melakukan upsert per `(tanggal, kata)`.

---

## Query Top Kata

## Top all-time

```sql
select kata, sum(jumlah) as jumlah
from pencarian
group by kata
order by jumlah desc, kata asc
limit $1;
```

## Top 7 hari terakhir

```sql
select kata, sum(jumlah) as jumlah
from pencarian
where tanggal >= current_date - interval '6 days'
group by kata
order by jumlah desc, kata asc
limit $1;
```

---

## Retensi Data

Retensi paling sederhana: drop tabel bulanan yang sudah lewat periode simpan.

```sql
drop table if exists pencarian_202508;
```

Contoh kebijakan awal:

- simpan 6 bulan terakhir,
- hapus per bulan (bukan delete jutaan baris).

---

## Alasan `awal` dan `akhir` Dihapus

Untuk fase awal (MVP), keduanya tidak wajib:

- `awal` bisa diturunkan dari `min(tanggal)`,
- `akhir` bisa diturunkan dari `max(tanggal)`.

Karena itu, skema minimal cukup `tanggal`, `kata`, `jumlah`.

---

## Rekomendasi Implementasi Bertahap

1. Terapkan tabel induk `pencarian` + trigger `pencarian_route`.
2. Ubah alur pencarian agar selalu insert ke `pencarian`.
3. Tambah endpoint `GET /api/publik/kamus/terpopuler` dengan query agregasi.
4. Tambah job bulanan untuk drop tabel lama.
5. Evaluasi performa; jika perlu, baru tambah tabel ringkas all-time di fase berikutnya.
