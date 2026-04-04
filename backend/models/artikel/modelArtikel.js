/**
 * @fileoverview Model untuk artikel editorial Kateglo
 */

const db = require('../../db');

function buatSlugDariJudul(judul) {
  return judul
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

class ModelArtikel {
  static async buatSlug(judul, { excludeId } = {}) {
    const basis = buatSlugDariJudul(judul) || 'artikel';
    const params = [basis, `${basis}-%`];
    let sql = 'SELECT slug FROM artikel WHERE (slug = $1 OR slug LIKE $2)';

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $${params.length}`;
    }

    sql += ' ORDER BY slug';

    const result = await db.query(sql, params);
    const slugExisting = new Set(result.rows.map((r) => r.slug));
    if (!slugExisting.has(basis)) return basis;
    let i = 2;
    while (slugExisting.has(`${basis}-${i}`)) i += 1;
    return `${basis}-${i}`;
  }

  static async ambilDaftarPublik({ topik, q, limit = 20, offset = 0 }) {
    const params = [];
    const conditions = ['a.diterbitkan = true'];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(a.judul ILIKE $${params.length} OR a.konten ILIKE $${params.length})`);
    }

    const topikArr = Array.isArray(topik) ? topik.filter(Boolean) : (topik ? [topik] : []);
    if (topikArr.length > 0) {
      params.push(topikArr);
      conditions.push(`EXISTS (SELECT 1 FROM artikel_topik at2 WHERE at2.artikel_id = a.id AND at2.topik = ANY($${params.length}))`);
    }

    const where = conditions.join(' AND ');
    params.push(limit, offset);

    const sql = `
      SELECT
        a.id, a.judul, a.slug, a.diterbitkan_pada,
        LEFT(a.konten, 200) AS cuplikan,
        p.nama AS penulis,
        p.nama AS penulis_nama,
        COALESCE(
          (SELECT array_agg(at2.topik ORDER BY at2.ctid) FROM artikel_topik at2 WHERE at2.artikel_id = a.id),
          '{}'
        ) AS topik
      FROM artikel a
      JOIN pengguna p ON p.id = a.penulis_id
      WHERE ${where}
      ORDER BY a.diterbitkan_pada DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countSql = `SELECT COUNT(*) FROM artikel a WHERE ${where}`;
    const countParams = params.slice(0, params.length - 2);

    const [rows, countResult] = await Promise.all([
      db.query(sql, params).then((r) => r.rows),
      db.query(countSql, countParams).then((r) => parseInt(r.rows[0].count, 10)),
    ]);

    return { data: rows, total: countResult };
  }

  static async ambilSatuPublik(slug) {
    const result = await db.query(
      `SELECT
        a.id, a.judul, a.slug, a.konten, a.diterbitkan_pada, a.updated_at,
        p.nama AS penulis,
        p.nama AS penulis_nama,
        pn.nama AS penyunting,
        pn.nama AS penyunting_nama,
        COALESCE(
          (SELECT array_agg(at2.topik ORDER BY at2.ctid) FROM artikel_topik at2 WHERE at2.artikel_id = a.id),
          '{}'
        ) AS topik
      FROM artikel a
      JOIN pengguna p ON p.id = a.penulis_id
      LEFT JOIN pengguna pn ON pn.id = a.penyunting_id
      WHERE a.slug = $1 AND a.diterbitkan = true`,
      [slug]
    );
    return result.rows[0] || null;
  }

  static async ambilTopikPublik() {
    const result = await db.query(
      `SELECT at2.topik, COUNT(*) AS jumlah
       FROM artikel_topik at2
       JOIN artikel a ON a.id = at2.artikel_id AND a.diterbitkan = true
       GROUP BY at2.topik
       ORDER BY jumlah DESC`
    );
    return result.rows;
  }

  static async ambilDaftarRedaksi({ topik, diterbitkan, q, limit = 50, offset = 0 }) {
    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(a.judul ILIKE $${params.length} OR a.konten ILIKE $${params.length})`);
    }

    if (diterbitkan === 'true' || diterbitkan === true) {
      conditions.push('a.diterbitkan = true');
    } else if (diterbitkan === 'false' || diterbitkan === false) {
      conditions.push('a.diterbitkan = false');
    }

    const topikArr = Array.isArray(topik) ? topik.filter(Boolean) : (topik ? [topik] : []);
    if (topikArr.length > 0) {
      params.push(topikArr);
      conditions.push(`EXISTS (SELECT 1 FROM artikel_topik at2 WHERE at2.artikel_id = a.id AND at2.topik = ANY($${params.length}))`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const sql = `
      SELECT
        a.id, a.judul, a.slug, a.diterbitkan, a.diterbitkan_pada, a.updated_at,
        LEFT(a.konten, 200) AS cuplikan,
        p.id AS penulis_id, p.nama AS penulis, p.nama AS penulis_nama,
        pn.id AS penyunting_id, pn.nama AS penyunting, pn.nama AS penyunting_nama,
        COALESCE(
          (SELECT array_agg(at2.topik ORDER BY at2.ctid) FROM artikel_topik at2 WHERE at2.artikel_id = a.id),
          '{}'
        ) AS topik
      FROM artikel a
      JOIN pengguna p ON p.id = a.penulis_id
      LEFT JOIN pengguna pn ON pn.id = a.penyunting_id
      ${where}
      ORDER BY a.diterbitkan_pada DESC NULLS LAST, a.updated_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countSql = `SELECT COUNT(*) FROM artikel a ${where}`;
    const countParams = params.slice(0, params.length - 2);

    const [rows, countResult] = await Promise.all([
      db.query(sql, params).then((r) => r.rows),
      db.query(countSql, countParams).then((r) => parseInt(r.rows[0].count, 10)),
    ]);

    return { data: rows, total: countResult };
  }

  static async ambilSatuRedaksi(id) {
    const result = await db.query(
      `SELECT
        a.id, a.judul, a.slug, a.konten, a.diterbitkan, a.diterbitkan_pada, a.created_at, a.updated_at,
        p.id AS penulis_id, p.nama AS penulis, p.nama AS penulis_nama,
        pn.id AS penyunting_id, pn.nama AS penyunting, pn.nama AS penyunting_nama,
        COALESCE(
          (SELECT array_agg(at2.topik ORDER BY at2.ctid) FROM artikel_topik at2 WHERE at2.artikel_id = a.id),
          '{}'
        ) AS topik
      FROM artikel a
      JOIN pengguna p ON p.id = a.penulis_id
      LEFT JOIN pengguna pn ON pn.id = a.penyunting_id
      WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async buat({ judul, konten, topik, penulis_id, diterbitkan, diterbitkan_pada }) {
    const slug = await ModelArtikel.buatSlug(judul);
    const statusTerbit = Boolean(diterbitkan);
    const topikArr = [...new Set((Array.isArray(topik) ? topik : [topik])
      .map((item) => String(item || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean))];

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO artikel (judul, slug, konten, penulis_id, diterbitkan, diterbitkan_pada)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, judul, slug, konten, diterbitkan, diterbitkan_pada, created_at, updated_at`,
        [judul, slug, konten || '', penulis_id, statusTerbit, diterbitkan_pada || null]
      );
      const artikel = result.rows[0];
      if (topikArr.length > 0) {
        await client.query(
          `INSERT INTO artikel_topik (artikel_id, topik)
           SELECT $1, unnest($2::text[])`,
          [artikel.id, topikArr]
        );
      }
      await client.query('COMMIT');
      return { ...artikel, topik: topikArr };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async perbarui(id, data, penggunaId) {
    const { judul, konten, topik, penyunting_id, penulis_id, diterbitkan_pada } = data;
    const setClauses = [];
    const params = [];

    if (judul !== undefined) {
      params.push(judul);
      setClauses.push(`judul = $${params.length}`);
      const slugBaru = await ModelArtikel.buatSlug(judul, { excludeId: id });
      params.push(slugBaru);
      setClauses.push(`slug = $${params.length}`);
    }
    if (konten !== undefined) { params.push(konten); setClauses.push(`konten = $${params.length}`); }
    if (penulis_id !== undefined && penulis_id !== null) { params.push(penulis_id); setClauses.push(`penulis_id = $${params.length}`); }

    const penyuntingId = penyunting_id !== undefined ? penyunting_id : penggunaId;
    if (penyuntingId !== undefined) { params.push(penyuntingId); setClauses.push(`penyunting_id = $${params.length}`); }

    if (diterbitkan_pada !== undefined) {
      params.push(diterbitkan_pada || null);
      setClauses.push(`diterbitkan_pada = $${params.length}`);
    }

    if (setClauses.length === 0 && topik === undefined) return ModelArtikel.ambilSatuRedaksi(id);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      if (setClauses.length > 0) {
        params.push(id);
        await client.query(
          `UPDATE artikel SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
          params
        );
      }
      if (topik !== undefined) {
        const topikArr = [...new Set((Array.isArray(topik) ? topik : [topik])
          .map((item) => String(item || '').trim().replace(/\s+/g, ' '))
          .filter(Boolean))];
        await client.query('DELETE FROM artikel_topik WHERE artikel_id = $1', [id]);
        if (topikArr.length > 0) {
          await client.query(
            `INSERT INTO artikel_topik (artikel_id, topik) SELECT $1, unnest($2::text[])`,
            [id, topikArr]
          );
        }
      }
      await client.query('COMMIT');
      return ModelArtikel.ambilSatuRedaksi(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async terbitkan(id, terbitkan) {
    const diterbitkan = Boolean(terbitkan);
    await db.query(
      `UPDATE artikel
       SET diterbitkan = $1,
           diterbitkan_pada = CASE WHEN $1 = true AND diterbitkan_pada IS NULL THEN now() ELSE diterbitkan_pada END
       WHERE id = $2`,
      [diterbitkan, id]
    );
    return ModelArtikel.ambilSatuRedaksi(id);
  }

  static async hapus(id) {
    await db.query('DELETE FROM artikel WHERE id = $1', [id]);
  }

  static async ambilSlugTerbit() {
    const result = await db.query(
      'SELECT slug FROM artikel WHERE diterbitkan = true ORDER BY diterbitkan_pada DESC'
    );
    return result.rows.map((r) => r.slug);
  }
}

module.exports = ModelArtikel;
