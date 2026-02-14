#!/usr/bin/env python3
"""
Migrasi data dari kbbi.db (SQLite) ke PostgreSQL (Render)
dan bangun tabel tesaurus dari relation + _thesaurus.

Langkah:
  1. Buat tabel baru (label, lema, makna, contoh, tesaurus) dari SQL migrasi
  2. Salin data dari kbbi.db ke tabel baru
  3. Bangun tabel tesaurus dari relation + _thesaurus yang sudah ada
  4. Verifikasi jumlah baris
"""

import sqlite3
import psycopg2
import psycopg2.extras
import os
import sys

# Konfigurasi
KBBI_DB = os.path.join(os.path.dirname(__file__), '..', '..', '_data', 'kbbi.db')
SQL_MIGRASI = os.path.join(os.path.dirname(__file__), '..', '..', '_docs', '202602', '20260214_migrasi-skema-baru.sql')
DATABASE_URL = os.environ.get('DATABASE_URL',
    'postgresql://kateglo:7TkSy8oWtA5NuB5d77qsE3qM6MZPAgCH@dpg-d67rnigboq4c73cmgjqg-a.singapore-postgres.render.com/kateglo')

BATCH_SIZE = 500


def buka_sqlite():
    db = sqlite3.connect(KBBI_DB)
    db.row_factory = sqlite3.Row
    return db


def buka_postgres():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    conn.autocommit = False
    return conn


def tahap1_buat_tabel(pg):
    """Buat tabel baru dari SQL migrasi."""
    print('\n=== Tahap 1: Buat tabel baru ===\n')

    with open(SQL_MIGRASI, 'r', encoding='utf-8') as f:
        sql = f.read()

    cur = pg.cursor()
    cur.execute(sql)
    pg.commit()
    print('  Tabel label, lema, makna, contoh, tesaurus berhasil dibuat.')


def tahap2_salin_label(sqlite_db, pg):
    """Salin tabel label dari kbbi.db."""
    print('\n=== Tahap 2a: Salin label ===\n')

    cur_src = sqlite_db.cursor()
    rows = cur_src.execute('SELECT id, kategori, kode, nama, keterangan, sumber FROM label ORDER BY id').fetchall()

    cur_pg = pg.cursor()
    data = [(r['id'], r['kategori'], r['kode'], r['nama'], r['keterangan'], r['sumber']) for r in rows]

    psycopg2.extras.execute_values(
        cur_pg,
        'INSERT INTO label (id, kategori, kode, nama, keterangan, sumber) VALUES %s',
        data,
        page_size=BATCH_SIZE
    )

    # Fix sequence
    cur_pg.execute("SELECT setval('label_id_seq', COALESCE(MAX(id), 1)) FROM label")
    pg.commit()
    print(f'  label: {len(data)} baris')


def tahap2_salin_lema(sqlite_db, pg):
    """Salin tabel lema dari kbbi.db."""
    print('\n=== Tahap 2b: Salin lema ===\n')

    cur_src = sqlite_db.cursor()

    # Pertama, insert lema tanpa induk (induk=NULL) agar foreign key tidak gagal
    # Lalu update induk setelah semua lema terinsert
    rows = cur_src.execute('''
        SELECT id, legacy_eid, lema, jenis, induk, pemenggalan, lafal, varian,
               jenis_rujuk, lema_rujuk, aktif, legacy_tabel, legacy_tid
        FROM lema ORDER BY id
    ''').fetchall()

    cur_pg = pg.cursor()
    data = [(
        r['id'], r['legacy_eid'], r['lema'], r['jenis'], None,  # induk sementara NULL
        r['pemenggalan'], r['lafal'], r['varian'],
        r['jenis_rujuk'], r['lema_rujuk'], r['aktif'],
        r['legacy_tabel'], r['legacy_tid']
    ) for r in rows]

    psycopg2.extras.execute_values(
        cur_pg,
        '''INSERT INTO lema (id, legacy_eid, lema, jenis, induk, pemenggalan, lafal, varian,
           jenis_rujuk, lema_rujuk, aktif, legacy_tabel, legacy_tid) VALUES %s''',
        data,
        page_size=BATCH_SIZE
    )

    # Update induk
    induk_data = [(r['induk'], r['id']) for r in rows if r['induk'] is not None]
    if induk_data:
        psycopg2.extras.execute_batch(
            cur_pg,
            'UPDATE lema SET induk = %s WHERE id = %s',
            induk_data,
            page_size=BATCH_SIZE
        )
        print(f'  induk di-update: {len(induk_data)} baris')

    # Fix sequence
    cur_pg.execute("SELECT setval('lema_id_seq', COALESCE(MAX(id), 1)) FROM lema")
    pg.commit()
    print(f'  lema: {len(data)} baris')


def tahap2_salin_makna(sqlite_db, pg):
    """Salin tabel makna dari kbbi.db."""
    print('\n=== Tahap 2c: Salin makna ===\n')

    cur_src = sqlite_db.cursor()
    rows = cur_src.execute('''
        SELECT id, legacy_mid, lema_id, polisem, urutan, makna, ragam, ragam_varian,
               kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia
        FROM makna ORDER BY id
    ''').fetchall()

    cur_pg = pg.cursor()
    data = [(
        r['id'], r['legacy_mid'], r['lema_id'], r['polisem'], r['urutan'],
        r['makna'], r['ragam'], r['ragam_varian'], r['kelas_kata'],
        r['bahasa'], r['bidang'], r['kiasan'], r['tipe_penyingkat'],
        r['ilmiah'], r['kimia']
    ) for r in rows]

    psycopg2.extras.execute_values(
        cur_pg,
        '''INSERT INTO makna (id, legacy_mid, lema_id, polisem, urutan, makna, ragam, ragam_varian,
           kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia) VALUES %s''',
        data,
        page_size=BATCH_SIZE
    )

    cur_pg.execute("SELECT setval('makna_id_seq', COALESCE(MAX(id), 1)) FROM makna")
    pg.commit()
    print(f'  makna: {len(data)} baris')


def tahap2_salin_contoh(sqlite_db, pg):
    """Salin tabel contoh dari kbbi.db."""
    print('\n=== Tahap 2d: Salin contoh ===\n')

    cur_src = sqlite_db.cursor()
    rows = cur_src.execute('''
        SELECT id, legacy_cid, makna_id, urutan, contoh, ragam, bahasa, bidang,
               kiasan, makna_contoh
        FROM contoh ORDER BY id
    ''').fetchall()

    cur_pg = pg.cursor()
    data = [(
        r['id'], r['legacy_cid'], r['makna_id'], r['urutan'],
        r['contoh'], r['ragam'], r['bahasa'], r['bidang'],
        r['kiasan'], r['makna_contoh']
    ) for r in rows]

    psycopg2.extras.execute_values(
        cur_pg,
        '''INSERT INTO contoh (id, legacy_cid, makna_id, urutan, contoh, ragam, bahasa, bidang,
           kiasan, makna_contoh) VALUES %s''',
        data,
        page_size=BATCH_SIZE
    )

    cur_pg.execute("SELECT setval('contoh_id_seq', COALESCE(MAX(id), 1)) FROM contoh")
    pg.commit()
    print(f'  contoh: {len(data)} baris')


def tahap3_bangun_tesaurus(pg):
    """Bangun tabel tesaurus dari relation + _thesaurus yang sudah ada di PostgreSQL."""
    print('\n=== Tahap 3: Bangun tesaurus ===\n')

    cur = pg.cursor()

    # Mapping rel_type dari tabel relation:
    # s = sinonim, a = antonim, r = berkaitan, d = turunan, c = gabungan
    rel_map = {
        's': 'sinonim',
        'a': 'antonim',
        'r': 'berkaitan',
        'd': 'turunan',
        'c': 'gabungan',
    }

    # Ambil semua relasi dari tabel relation
    cur.execute('SELECT root_phrase, related_phrase, rel_type FROM relation ORDER BY root_phrase')
    relations = cur.fetchall()
    print(f'  Membaca {len(relations)} relasi dari tabel relation')

    # Kumpulkan per lema
    tesaurus = {}  # lema -> { sinonim: set, antonim: set, ... }

    for root, related, rel_type in relations:
        kolom = rel_map.get(rel_type)
        if not kolom:
            continue

        if root not in tesaurus:
            tesaurus[root] = {k: set() for k in rel_map.values()}
        tesaurus[root][kolom].add(related)

    # Tambahkan data dari _thesaurus
    try:
        cur.execute('SELECT lemma, synonym, antonym FROM _thesaurus WHERE lemma IS NOT NULL')
        thesaurus_rows = cur.fetchall()
        print(f'  Membaca {len(thesaurus_rows)} baris dari tabel _thesaurus')

        for lemma, synonym, antonym in thesaurus_rows:
            if not lemma:
                continue
            if lemma not in tesaurus:
                tesaurus[lemma] = {k: set() for k in rel_map.values()}

            if synonym:
                for s in synonym.split(';'):
                    s = s.strip()
                    if s:
                        tesaurus[lemma]['sinonim'].add(s)

            if antonym:
                for a in antonym.split(';'):
                    a = a.strip()
                    if a:
                        tesaurus[lemma]['antonim'].add(a)
    except psycopg2.Error as e:
        print(f'  Peringatan: tabel _thesaurus tidak tersedia ({e})')
        pg.rollback()

    # Insert ke tabel tesaurus
    data = []
    for lema, rels in tesaurus.items():
        data.append((
            lema,
            '; '.join(sorted(rels['sinonim'])) or None,
            '; '.join(sorted(rels['antonim'])) or None,
            '; '.join(sorted(rels['turunan'])) or None,
            '; '.join(sorted(rels['gabungan'])) or None,
            '; '.join(sorted(rels['berkaitan'])) or None,
        ))

    psycopg2.extras.execute_values(
        cur,
        'INSERT INTO tesaurus (lema, sinonim, antonim, turunan, gabungan, berkaitan) VALUES %s',
        data,
        page_size=BATCH_SIZE
    )

    cur.execute("SELECT setval('tesaurus_id_seq', COALESCE(MAX(id), 1)) FROM tesaurus")
    pg.commit()
    print(f'  tesaurus: {len(data)} baris')


def tahap4_verifikasi(sqlite_db, pg):
    """Verifikasi jumlah baris cocok."""
    print('\n=== Tahap 4: Verifikasi ===\n')

    cur_src = sqlite_db.cursor()
    cur_pg = pg.cursor()

    tabel_kbbi = ['label', 'lema', 'makna', 'contoh']
    semua_cocok = True

    for tabel in tabel_kbbi:
        src_count = cur_src.execute(f'SELECT COUNT(*) FROM {tabel}').fetchone()[0]
        cur_pg.execute(f'SELECT COUNT(*) FROM {tabel}')
        pg_count = cur_pg.fetchone()[0]
        status = 'OK' if src_count == pg_count else 'BEDA!'
        if src_count != pg_count:
            semua_cocok = False
        print(f'  {tabel}: kbbi.db={src_count}, PostgreSQL={pg_count} [{status}]')

    # Tesaurus (tidak ada padanan di kbbi.db, cek saja ada isinya)
    cur_pg.execute('SELECT COUNT(*) FROM tesaurus')
    ts_count = cur_pg.fetchone()[0]
    print(f'  tesaurus: PostgreSQL={ts_count}')

    if semua_cocok:
        print('\n  Semua tabel cocok!')
    else:
        print('\n  PERINGATAN: Ada tabel yang jumlahnya tidak cocok!')

    return semua_cocok


def main():
    print('Migrasi Kateglo ke Skema Baru')
    print(f'  Sumber: {os.path.abspath(KBBI_DB)}')
    print(f'  SQL: {os.path.abspath(SQL_MIGRASI)}')
    print(f'  Target: PostgreSQL (Render)')

    sqlite_db = buka_sqlite()
    pg = buka_postgres()

    try:
        tahap1_buat_tabel(pg)
        tahap2_salin_label(sqlite_db, pg)
        tahap2_salin_lema(sqlite_db, pg)
        tahap2_salin_makna(sqlite_db, pg)
        tahap2_salin_contoh(sqlite_db, pg)
        tahap3_bangun_tesaurus(pg)
        tahap4_verifikasi(sqlite_db, pg)
        print('\nSelesai!')
    except Exception as e:
        pg.rollback()
        print(f'\nGAGAL: {e}')
        raise
    finally:
        sqlite_db.close()
        pg.close()


if __name__ == '__main__':
    main()
