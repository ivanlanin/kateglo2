/**
 * @fileoverview Shared constants across frontend and backend
 */

// Lexical classes (kelas kata)
export const LEXICAL_CLASSES = {
  NOUN: 'n',           // Nomina
  VERB: 'v',           // Verba
  ADJECTIVE: 'adj',    // Adjektiva
  ADVERB: 'adv',       // Adverbia
  PRONOUN: 'pron',     // Pronomina
  NUMERAL: 'num',      // Numeralia
  OTHER: 'other'       // Lain-lain
};

// Phrase types
export const PHRASE_TYPES = {
  ROOT: 'r',           // Root word
  AFFIX: 'f',          // Affix (imbuhan)
  COMPOUND: 'c'        // Compound (majemuk)
};

// Relation types
export const RELATION_TYPES = {
  SYNONYM: 's',        // Sinonim
  ANTONYM: 'a',        // Antonim
  OTHER: 'o'           // Lainnya
};

// Proverb types
export const PROVERB_TYPES = {
  INVALID: 0,          // Salah/tidak valid
  PROVERB: 1,          // Peribahasa
  METAPHOR: 2          // Kiasan
};

// Search operators
export const SEARCH_OPERATORS = {
  EXACT: 'exact',      // Persis
  CONTAINS: 'contains', // Mengandung
  STARTS_WITH: 'starts', // Diawali
  ENDS_WITH: 'ends',   // Diakhiri
  SIMILAR: 'similar'   // Mirip
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found'
};

export default {
  LEXICAL_CLASSES,
  PHRASE_TYPES,
  RELATION_TYPES,
  PROVERB_TYPES,
  SEARCH_OPERATORS,
  PAGINATION,
  API_STATUS
};
