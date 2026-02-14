const db = require('../db');

class PhraseModel {
  static async searchDictionary(query, limit = 20) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const prefixRows = await db.query(
      `SELECT phrase, actual_phrase, lex_class, info
       FROM phrase
       WHERE phrase ILIKE $1
       ORDER BY
         CASE
           WHEN LOWER(phrase) = LOWER($2) THEN 0
           ELSE 1
         END,
         phrase ASC
       LIMIT $3`,
      [`${normalizedQuery}%`, normalizedQuery, cappedLimit]
    );

    let combinedRows = prefixRows.rows;

    if (combinedRows.length < cappedLimit) {
      const remaining = cappedLimit - combinedRows.length;
      const containsRows = await db.query(
        `SELECT phrase, actual_phrase, lex_class, info
         FROM phrase
         WHERE phrase ILIKE $1
           AND phrase NOT ILIKE $2
         ORDER BY phrase ASC
         LIMIT $3`,
        [`%${normalizedQuery}%`, `${normalizedQuery}%`, remaining]
      );

      combinedRows = combinedRows.concat(containsRows.rows);
    }

    if (combinedRows.length === 0) {
      return [];
    }

    const phraseKeys = combinedRows.map((row) => row.phrase.toLowerCase());
    const definitionRows = await db.query(
      `SELECT DISTINCT ON (LOWER(phrase))
         LOWER(phrase) AS phrase_key,
         def_text
       FROM definition
       WHERE LOWER(phrase) = ANY($1::text[])
       ORDER BY LOWER(phrase), def_num NULLS FIRST, def_uid ASC`,
      [phraseKeys]
    );

    const previewByPhrase = new Map(
      definitionRows.rows.map((row) => [row.phrase_key, row.def_text])
    );

    return combinedRows.map((row) => ({
      ...row,
      definition_preview: previewByPhrase.get(row.phrase.toLowerCase()) || null
    }));
  }

  static async getPhraseBySlug(slug) {
    const result = await db.query(
      `SELECT phrase, actual_phrase, lex_class, info
       FROM phrase
       WHERE LOWER(phrase) = LOWER($1)
       LIMIT 1`,
      [slug]
    );

    return result.rows[0] || null;
  }

  static async getDefinitions(phrase) {
    const result = await db.query(
      `SELECT def_uid, phrase, def_num, def_text, lex_class, discipline, see
       FROM definition
       WHERE LOWER(phrase) = LOWER($1)
       ORDER BY def_num NULLS FIRST, def_uid ASC`,
      [phrase]
    );

    return result.rows;
  }

  static async getRelations(rootPhrase) {
    const result = await db.query(
      `SELECT rel_type, related_phrase
       FROM relation
       WHERE LOWER(root_phrase) = LOWER($1)
       ORDER BY rel_type, related_phrase`,
      [rootPhrase]
    );

    return result.rows;
  }
}

module.exports = PhraseModel;
