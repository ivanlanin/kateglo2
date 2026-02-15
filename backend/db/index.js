/**
 * @fileoverview PostgreSQL database connection and query builder
 * Native PostgreSQL with query chaining syntax (inspired by Supabase)
 */

const { Pool } = require('pg');
const logger = require('../config/logger');

const databaseUrl = process.env.DATABASE_URL || '';
const shouldUseSsl =
  process.env.DATABASE_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  databaseUrl.includes('render.com');

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: Number.parseInt(process.env.DB_POOL_MAX || '8', 10),
  idleTimeoutMillis: Number.parseInt(process.env.DB_IDLE_TIMEOUT_MS || '15000', 10),
  connectionTimeoutMillis: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '15000', 10),
  keepAlive: true,
});

function isRetryableConnectionError(error) {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    message.includes('connection terminated due to connection timeout') ||
    message.includes('timeout expired') ||
    message.includes('the database system is starting up')
  );
}

async function queryWithRetry(text, params, retries = 1) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    if (retries > 0 && isRetryableConnectionError(error)) {
      logger.warn('Retrying PostgreSQL query after transient connection error');
      return queryWithRetry(text, params, retries - 1);
    }

    throw error;
  }
}

// Test connection
pool.on('connect', () => {
  logger.info('🗄️  PostgreSQL connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Query builder with chaining syntax
 */
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectFields = '*';
    this.whereConditions = [];
    this.orderByClause = null;
    this.limitValue = null;
    this.offsetValue = null;
    this.params = [];
  }

  select(fields = '*') {
    this.selectFields = Array.isArray(fields) ? fields.join(', ') : fields;
    return this;
  }

  eq(column, value) {
    this.params.push(value);
    this.whereConditions.push(`${column} = $${this.params.length}`);
    return this;
  }

  neq(column, value) {
    this.params.push(value);
    this.whereConditions.push(`${column} != $${this.params.length}`);
    return this;
  }

  like(column, pattern) {
    this.params.push(pattern);
    this.whereConditions.push(`${column} LIKE $${this.params.length}`);
    return this;
  }

  ilike(column, pattern) {
    this.params.push(pattern);
    this.whereConditions.push(`${column} ILIKE $${this.params.length}`);
    return this;
  }

  in(column, values) {
    this.params.push(values);
    this.whereConditions.push(`${column} = ANY($${this.params.length})`);
    return this;
  }

  order(column, ascending = true) {
    this.orderByClause = `${column} ${ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  offset(value) {
    this.offsetValue = value;
    return this;
  }

  async execute() {
    let query = `SELECT ${this.selectFields} FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderByClause) {
      query += ` ORDER BY ${this.orderByClause}`;
    }

    if (this.limitValue) {
      query += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    const result = await pool.query(query, this.params);
    return { data: result.rows, count: result.rowCount };
  }
}

/**
 * Main database interface
 */
const db = {
  pool,

  /**
   * Create query builder for table
   */
  from(table) {
    return new QueryBuilder(table);
  },

  /**
   * Execute raw SQL query
   */
  async query(text, params) {
    const result = await queryWithRetry(text, params);
    return result;
  },

  /**
   * Execute query and return rows
   */
  async execute(text, params) {
    const result = await queryWithRetry(text, params);
    return { data: result.rows, count: result.rowCount };
  },

  /**
   * Close all connections
   */
  async close() {
    await pool.end();
  }
};

module.exports = db;
