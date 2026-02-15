"""
Sinkronisasi flag makna dari SQLite kbbi4.db ke PostgreSQL.

Mapping:
- makna.ki  -> makna.kiasan = 1
- makna.kp  -> makna.tipe_penyingkat = 'kependekan'
- makna.akr -> makna.tipe_penyingkat = 'akronim'

Default: dry-run (tidak mengubah data)
Gunakan --apply untuk benar-benar update.
"""

from __future__ import annotations

import argparse
import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import psycopg2
from psycopg2.extras import execute_batch


SQLITE_PATH_DEFAULT = Path(__file__).resolve().parents[1] / '_data' / 'kbbi4.db'
ENV_PATH_DEFAULT = Path(__file__).resolve().parent / '.env'


@dataclass(frozen=True)
class ExpectedFlags:
    legacy_mid: int
    kiasan: int
    tipe_penyingkat: Optional[str]


def load_env_file(env_path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not env_path.exists():
        return values

    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, val = line.split('=', 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key:
            values[key] = val
    return values


def is_truthy_flag(value: object) -> bool:
    if value is None:
        return False
    text = str(value).strip().lower()
    return text not in ('', '0', 'null', 'none')


def derive_expected_flags(ki: object, kp: object, akr: object) -> Tuple[int, Optional[str]]:
    kiasan = 1 if is_truthy_flag(ki) else 0

    tipe_penyingkat: Optional[str] = None
    if is_truthy_flag(akr):
        tipe_penyingkat = 'akronim'
    elif is_truthy_flag(kp):
        tipe_penyingkat = 'kependekan'

    return kiasan, tipe_penyingkat


def fetch_expected_from_sqlite(sqlite_path: Path) -> Tuple[Dict[int, ExpectedFlags], Dict[str, int]]:
    conn = sqlite3.connect(sqlite_path)
    cur = conn.cursor()
    cur.execute('SELECT mid, ki, kp, akr FROM makna')

    expected: Dict[int, ExpectedFlags] = {}
    counts = {
        'rows': 0,
        'kiasan_1': 0,
        'tipe_akronim': 0,
        'tipe_kependekan': 0,
        'tipe_null': 0,
    }

    for mid, ki, kp, akr in cur.fetchall():
        kiasan, tipe = derive_expected_flags(ki, kp, akr)
        row = ExpectedFlags(legacy_mid=int(mid), kiasan=kiasan, tipe_penyingkat=tipe)
        expected[row.legacy_mid] = row

        counts['rows'] += 1
        if kiasan == 1:
            counts['kiasan_1'] += 1
        if tipe == 'akronim':
            counts['tipe_akronim'] += 1
        elif tipe == 'kependekan':
            counts['tipe_kependekan'] += 1
        else:
            counts['tipe_null'] += 1

    conn.close()
    return expected, counts


def open_pg_connection(database_url: str):
    return psycopg2.connect(database_url)


def fetch_pg_current(conn) -> Dict[int, Tuple[int, Optional[str]]]:
    current: Dict[int, Tuple[int, Optional[str]]] = {}
    with conn.cursor() as cur:
        cur.execute('SELECT legacy_mid, kiasan, tipe_penyingkat FROM makna WHERE legacy_mid IS NOT NULL')
        for legacy_mid, kiasan, tipe in cur.fetchall():
            current[int(legacy_mid)] = (int(kiasan or 0), tipe)
    return current


def build_updates(
    expected: Dict[int, ExpectedFlags],
    current: Dict[int, Tuple[int, Optional[str]]],
) -> Tuple[List[Tuple[int, Optional[str], int]], List[int]]:
    updates: List[Tuple[int, Optional[str], int]] = []
    missing: List[int] = []

    for legacy_mid, exp in expected.items():
        cur_val = current.get(legacy_mid)
        if cur_val is None:
            missing.append(legacy_mid)
            continue

        cur_kiasan, cur_tipe = cur_val
        if cur_kiasan != exp.kiasan or cur_tipe != exp.tipe_penyingkat:
            updates.append((exp.kiasan, exp.tipe_penyingkat, legacy_mid))

    return updates, missing


def apply_updates(conn, updates: Iterable[Tuple[int, Optional[str], int]]) -> int:
    sql = 'UPDATE makna SET kiasan = %s, tipe_penyingkat = %s WHERE legacy_mid = %s'
    batch = list(updates)
    if not batch:
        return 0

    with conn.cursor() as cur:
        execute_batch(cur, sql, batch, page_size=1000)
    conn.commit()
    return len(batch)


def fetch_pg_summary(conn) -> Dict[str, int]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE kiasan = 1)::int AS kiasan_1,
              COUNT(*) FILTER (WHERE tipe_penyingkat = 'akronim')::int AS tipe_akronim,
              COUNT(*) FILTER (WHERE tipe_penyingkat = 'kependekan')::int AS tipe_kependekan,
              COUNT(*) FILTER (WHERE tipe_penyingkat = 'singkatan')::int AS tipe_singkatan,
              COUNT(*) FILTER (WHERE tipe_penyingkat IS NULL)::int AS tipe_null
            FROM makna
            """
        )
        row = cur.fetchone()
    return {
        'total': row[0],
        'kiasan_1': row[1],
        'tipe_akronim': row[2],
        'tipe_kependekan': row[3],
        'tipe_singkatan': row[4],
        'tipe_null': row[5],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description='Sinkronisasi ki/kp/akr (SQLite) ke kiasan/tipe_penyingkat (Postgres).')
    parser.add_argument('--sqlite-path', default=str(SQLITE_PATH_DEFAULT), help='Path ke kbbi4.db')
    parser.add_argument('--env-path', default=str(ENV_PATH_DEFAULT), help='Path ke file .env backend')
    parser.add_argument('--apply', action='store_true', help='Jalankan update ke Postgres (default dry-run)')
    parser.add_argument('--sample', type=int, default=15, help='Jumlah sampel perubahan yang ditampilkan')
    args = parser.parse_args()

    sqlite_path = Path(args.sqlite_path)
    if not sqlite_path.exists():
        raise FileNotFoundError(f'SQLite DB tidak ditemukan: {sqlite_path}')

    env_values = load_env_file(Path(args.env_path))
    database_url = os.getenv('DATABASE_URL') or env_values.get('DATABASE_URL')
    if not database_url:
        raise RuntimeError('DATABASE_URL tidak ditemukan di environment maupun file .env')

    expected, sqlite_counts = fetch_expected_from_sqlite(sqlite_path)
    print('=== SOURCE (SQLite kbbi4.db) ===')
    print(sqlite_counts)

    conn = open_pg_connection(database_url)
    try:
        current = fetch_pg_current(conn)
        updates, missing = build_updates(expected, current)

        print('\n=== DIFF ===')
        print({
            'expected_rows': len(expected),
            'pg_rows_with_legacy_mid': len(current),
            'rows_to_update': len(updates),
            'missing_legacy_mid_in_pg': len(missing),
        })

        if updates:
            print('\nSample updates (kiasan, tipe_penyingkat, legacy_mid):')
            for row in updates[: max(0, args.sample)]:
                print(row)

        if missing:
            print('\nSample missing legacy_mid in PG:')
            print(missing[: max(0, args.sample)])

        if args.apply:
            changed = apply_updates(conn, updates)
            print(f'\nAPPLY DONE: {changed} rows updated.')
            print('\n=== POSTGRES SUMMARY AFTER APPLY ===')
            print(fetch_pg_summary(conn))
        else:
            print('\nDRY-RUN ONLY. Gunakan --apply untuk menulis perubahan.')
            print('\n=== POSTGRES SUMMARY CURRENT ===')
            print(fetch_pg_summary(conn))
    finally:
        conn.close()


if __name__ == '__main__':
    main()
