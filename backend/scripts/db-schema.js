// backend/scripts/db-schema.js

/**
 * Database Schema Extractor untuk Kateglo PostgreSQL
 *
 * @fileoverview Utility script untuk extract complete database schema dari PostgreSQL
 * menggunakan system catalogs (pg_catalog). Script ini generate DDL statements
 * untuk tables, constraints, indexes, sequences, triggers, dan trigger functions.
 *
 * USAGE:
 * ```bash
 * # Export schema ke file (default: _sql/tables.sql)
 * node backend/scripts/db-schema.js
 *
 * # Export dengan custom output
 * DB_OUTPUT_FILE=../_sql/schema_backup.sql node backend/scripts/db-schema.js
 * ```
 *
 * ENVIRONMENT VARIABLES:
 * - DATABASE_URL: PostgreSQL connection string (required, dari backend/.env)
 * - DB_SCHEMA: Target schema name (default: 'public')
 * - DB_ORDER_BY: Table ordering ('alphabetical' | 'dependency', default: 'alphabetical')
 * - DB_SYNTAX: Output syntax style ('verbose' | 'simplified', default: 'simplified')
 * - DB_INCLUDE_SCHEMA: Include schema prefix in names ('true' | 'false', default: 'false')
 * - DB_OUTPUT_FILE: Output file path relative to backend/ (default: '../_sql/tables.sql')
 *
 * @requires pg
 * @version 1.0.0
 * @since 2026-02-14
 */

// Suppress dotenv output untuk clean schema generation
const originalConsoleLog = console.log;
console.log = () => {};
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
console.log = originalConsoleLog;

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL || '';
const shouldUseSsl =
  process.env.DATABASE_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  databaseUrl.includes('render.com');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

const SCHEMA_NAME = process.env.DB_SCHEMA || 'public';
const ORDER_BY = process.env.DB_ORDER_BY || 'alphabetical';
const SYNTAX_STYLE = process.env.DB_SYNTAX || 'simplified';
const INCLUDE_SCHEMA_PREFIX = process.env.DB_INCLUDE_SCHEMA === 'true';
const OUTPUT_FILE = process.env.DB_OUTPUT_FILE || '../_sql/tables.sql';

/**
 * Extract complete database schema
 * @returns {Promise<string>} DDL statements sebagai string
 */
async function extractSchema() {
  const output = [];

  try {
    output.push('-- WARNING: This schema is for context only and is not meant to be run.');
    output.push('-- Table order and constraints may not be valid for execution.');
    output.push(`-- Generated: ${new Date().toISOString()}\n`);

    const triggerFunctions = await extractTriggerFunctions();
    if (triggerFunctions) {
      output.push('-- ============================================');
      output.push('-- TRIGGER FUNCTIONS (Standalone Procedures)');
      output.push('-- ============================================\n');
      output.push(triggerFunctions);
      output.push('');
    }

    const nonTriggerRoutines = await extractNonTriggerRoutines();
    if (nonTriggerRoutines) {
      output.push('-- ============================================');
      output.push('-- NON-TRIGGER ROUTINES (App Functions/Procedures)');
      output.push('-- ============================================\n');
      output.push(nonTriggerRoutines);
      output.push('');
    }

    output.push('-- ============================================');
    output.push('-- TABLES');
    output.push('-- ============================================\n');

    const tables = ORDER_BY === 'dependency'
      ? await getTablesWithOrder()
      : await getTablesAlphabetical();

    for (const table of tables) {
      const tableSchema = await extractTableSchema(table.table_name);
      const tableIndexes = await extractTableIndexes(table.table_name);
      const tableTriggers = await extractTableTriggers(table.table_name);

      output.push(tableSchema);
      if (tableIndexes) output.push(tableIndexes);
      if (tableTriggers) output.push(tableTriggers);
      output.push('');
    }

    output.push('-- Schema extraction completed successfully');
    return output.join('\n');
  } catch (error) {
    console.error('-- ERROR extracting schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Get tables ordered by foreign key dependency depth
 */
async function getTablesWithOrder() {
  const query = `
    WITH RECURSIVE dep_graph AS (
      SELECT t.table_name, 0 as depth
      FROM information_schema.tables t
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_schema = $1
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = t.table_name
        )

      UNION ALL

      SELECT t.table_name, dg.depth + 1
      FROM information_schema.tables t
      JOIN information_schema.table_constraints tc
        ON tc.table_name = t.table_name AND tc.table_schema = $1
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      JOIN dep_graph dg ON dg.table_name = ccu.table_name
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
        AND tc.constraint_type = 'FOREIGN KEY'
    )
    SELECT DISTINCT table_name, MAX(depth) as depth
    FROM dep_graph
    GROUP BY table_name
    ORDER BY depth, table_name;
  `;

  const result = await pool.query(query, [SCHEMA_NAME]);
  return result.rows;
}

/**
 * Get tables in alphabetical order
 */
async function getTablesAlphabetical() {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  const result = await pool.query(query, [SCHEMA_NAME]);
  return result.rows;
}

/**
 * Extract CREATE TABLE statement for a single table
 * @param {string} tableName - Name of the table
 * @returns {Promise<string>} CREATE TABLE DDL
 */
async function extractTableSchema(tableName) {
  const output = [];
  const columns = await getTableColumns(tableName);
  const constraints = await getTableConstraints(tableName);
  const useSimplified = SYNTAX_STYLE === 'simplified';

  const pkConstraint = constraints.find(c => c.constraint_type === 'PRIMARY KEY');
  const pkColumns = pkConstraint ? pkConstraint.column_names.split(', ') : [];

  const fkConstraints = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
  const fkMap = new Map();
  fkConstraints.forEach(fk => {
    const colName = fk.column_names;
    fkMap.set(colName, {
      table: fk.foreign_table_name,
      column: fk.foreign_column_names,
      delete_rule: fk.delete_rule,
      update_rule: fk.update_rule,
    });
  });

  const columnDefs = columns.map(col => {
    let def = `  ${col.column_name} `;

    if (
      useSimplified &&
      pkColumns.includes(col.column_name) &&
      col.data_type === 'integer' &&
      col.column_default &&
      col.column_default.includes('nextval')
    ) {
      def += 'serial primary key';
      return def;
    }

    def += col.data_type;

    if (useSimplified && fkMap.has(col.column_name)) {
      const fk = fkMap.get(col.column_name);
      const tableRef = INCLUDE_SCHEMA_PREFIX ? `${SCHEMA_NAME}.${fk.table}` : fk.table;
      def += ` references ${tableRef}(${fk.column})`;

      if (fk.delete_rule && fk.delete_rule !== 'NO ACTION') {
        def += ` on delete ${fk.delete_rule.toLowerCase()}`;
      }
      if (fk.update_rule && fk.update_rule !== 'NO ACTION') {
        def += ` on update ${fk.update_rule.toLowerCase()}`;
      }
    }

    if (col.is_nullable === 'NO' && (!useSimplified || !pkColumns.includes(col.column_name))) {
      def += ' not null';
    }

    if (col.column_default && (!useSimplified || !col.column_default.includes('nextval'))) {
      def += ` default ${col.column_default}`;
    }

    return def;
  });

  const constraintDefs = constraints
    .filter(c => {
      if (useSimplified) {
        return c.constraint_type !== 'PRIMARY KEY' && c.constraint_type !== 'FOREIGN KEY';
      }
      return true;
    })
    .map(c => {
      if (c.constraint_type === 'PRIMARY KEY') {
        return `  constraint ${c.constraint_name} primary key (${c.column_names})`;
      } else if (c.constraint_type === 'FOREIGN KEY') {
        const tableRef = INCLUDE_SCHEMA_PREFIX
          ? `${SCHEMA_NAME}.${c.foreign_table_name}`
          : c.foreign_table_name;
        let fkDef = `  constraint ${c.constraint_name} foreign key (${c.column_names}) references ${tableRef}(${c.foreign_column_names})`;
        if (c.delete_rule && c.delete_rule !== 'NO ACTION') {
          fkDef += ` on delete ${c.delete_rule.toLowerCase()}`;
        }
        if (c.update_rule && c.update_rule !== 'NO ACTION') {
          fkDef += ` on update ${c.update_rule.toLowerCase()}`;
        }
        return fkDef;
      } else if (c.constraint_type === 'UNIQUE') {
        return `  constraint ${c.constraint_name} unique (${c.column_names})`;
      } else if (c.constraint_type === 'CHECK') {
        return `  constraint ${c.constraint_name} check ${c.check_clause}`;
      }
      return null;
    })
    .filter(Boolean);

  const allDefs = [...columnDefs, ...constraintDefs];
  const tableKeyword = useSimplified ? 'create table' : 'CREATE TABLE';
  const tableFullName = INCLUDE_SCHEMA_PREFIX ? `${SCHEMA_NAME}.${tableName}` : tableName;
  output.push(`${tableKeyword} ${tableFullName} (`);
  output.push(allDefs.join(',\n'));
  output.push(');');

  return output.join('\n');
}

/**
 * Get column definitions for a table
 */
async function getTableColumns(tableName) {
  const query = `
    SELECT
      column_name, data_type, character_maximum_length,
      numeric_precision, numeric_scale, is_nullable,
      column_default, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `;

  const result = await pool.query(query, [SCHEMA_NAME, tableName]);

  return result.rows.map(col => {
    let dataType = col.data_type;
    if (col.data_type === 'character varying' && col.character_maximum_length) {
      dataType = `character varying(${col.character_maximum_length})`;
    } else if (col.data_type === 'character' && col.character_maximum_length) {
      dataType = `character(${col.character_maximum_length})`;
    } else if (col.data_type === 'numeric' && col.numeric_precision) {
      dataType = col.numeric_scale
        ? `numeric(${col.numeric_precision},${col.numeric_scale})`
        : `numeric(${col.numeric_precision})`;
    } else if (col.data_type === 'ARRAY') {
      dataType = 'ARRAY';
    }
    return { ...col, data_type: dataType };
  });
}

/**
 * Get constraints for a table (PK, FK, UNIQUE, CHECK)
 */
async function getTableConstraints(tableName) {
  const query = `
    SELECT
      tc.constraint_name, tc.constraint_type,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as column_names,
      ccu.table_name as foreign_table_name,
      string_agg(ccu.column_name, ', ' ORDER BY kcu.ordinal_position) as foreign_column_names,
      cc.check_clause, rc.update_rule, rc.delete_rule
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      AND tc.constraint_type = 'FOREIGN KEY'
    LEFT JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    LEFT JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
      AND tc.constraint_type = 'FOREIGN KEY'
    WHERE tc.table_schema = $1 AND tc.table_name = $2
    GROUP BY tc.constraint_name, tc.constraint_type, ccu.table_name, cc.check_clause, rc.update_rule, rc.delete_rule
    ORDER BY CASE tc.constraint_type
      WHEN 'PRIMARY KEY' THEN 1 WHEN 'UNIQUE' THEN 2 WHEN 'FOREIGN KEY' THEN 3 WHEN 'CHECK' THEN 4 ELSE 5 END;
  `;

  const result = await pool.query(query, [SCHEMA_NAME, tableName]);
  return result.rows.filter(constraint => {
    if (constraint.constraint_type === 'CHECK' && constraint.check_clause) {
      return !/^\(?(\w+) IS NOT NULL\)?$/i.test(constraint.check_clause.trim());
    }
    return true;
  });
}

/**
 * Get indexes for a table (excluding primary key indexes)
 */
async function getTableIndexes(tableName) {
  const query = `
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = $1 AND tablename = $2 AND indexname NOT LIKE '%_pkey';
  `;
  const result = await pool.query(query, [SCHEMA_NAME, tableName]);
  return result.rows;
}

/**
 * Get sequences for a table
 */
async function getTableSequences(tableName) {
  const query = `
    SELECT s.sequence_name, s.data_type, s.start_value, s.minimum_value, s.maximum_value, s.increment
    FROM information_schema.sequences s
    WHERE s.sequence_schema = $1 AND s.sequence_name LIKE $2;
  `;
  const result = await pool.query(query, [SCHEMA_NAME, `${tableName}_%_seq`]);
  return result.rows;
}

/**
 * Extract index DDL statements for a table
 */
async function extractTableIndexes(tableName) {
  const query = `
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = $1 AND tablename = $2 AND indexname NOT LIKE '%_pkey'
    ORDER BY indexname;
  `;

  const result = await pool.query(query, [SCHEMA_NAME, tableName]);
  if (result.rows.length === 0) return null;

  const output = [];
  const useSimplified = SYNTAX_STYLE === 'simplified';

  for (const idx of result.rows) {
    let indexDef = idx.indexdef;
    if (useSimplified) {
      indexDef = indexDef.replace(/CREATE INDEX/i, 'create index');
      indexDef = indexDef.replace(/CREATE UNIQUE INDEX/i, 'create unique index');
      indexDef = indexDef.replace(/\bON\b/g, 'on');
      indexDef = indexDef.replace(/\bUSING\b/g, 'using');
    }
    if (!INCLUDE_SCHEMA_PREFIX) {
      indexDef = indexDef.replace(new RegExp(`\\b${SCHEMA_NAME}\\.`, 'g'), '');
    }
    output.push(`${indexDef};`);
  }

  return output.join('\n');
}

/**
 * Extract trigger DDL statements for a table
 */
async function extractTableTriggers(tableName) {
  const query = `
    SELECT t.trigger_schema, t.trigger_name, t.event_manipulation,
      t.event_object_table, t.action_statement, t.action_timing, t.action_orientation
    FROM information_schema.triggers t
    WHERE t.trigger_schema = $1 AND t.event_object_table = $2
    ORDER BY t.trigger_name, t.event_manipulation;
  `;

  const result = await pool.query(query, [SCHEMA_NAME, tableName]);
  if (result.rows.length === 0) return null;

  const output = [];
  const useSimplified = SYNTAX_STYLE === 'simplified';
  const triggerGroups = new Map();

  for (const trg of result.rows) {
    const key = trg.trigger_name;
    if (!triggerGroups.has(key)) {
      triggerGroups.set(key, { ...trg, events: [] });
    }
    triggerGroups.get(key).events.push(trg.event_manipulation);
  }

  for (const [triggerName, triggerInfo] of triggerGroups) {
    const createKeyword = useSimplified ? 'create trigger' : 'CREATE TRIGGER';
    const tableRef = INCLUDE_SCHEMA_PREFIX
      ? `${SCHEMA_NAME}.${triggerInfo.event_object_table}`
      : triggerInfo.event_object_table;
    const timing = useSimplified ? triggerInfo.action_timing.toLowerCase() : triggerInfo.action_timing;
    const onKeyword = useSimplified ? 'on' : 'ON';
    const forKeyword = useSimplified ? 'for each' : 'FOR EACH';
    const orientation = useSimplified ? triggerInfo.action_orientation.toLowerCase() : triggerInfo.action_orientation;
    const events = triggerInfo.events
      .map(e => (useSimplified ? e.toLowerCase() : e))
      .join(useSimplified ? ' or ' : ' OR ');
    let actionStatement = triggerInfo.action_statement;
    if (useSimplified) {
      actionStatement = actionStatement.replace(/EXECUTE FUNCTION/i, 'execute function');
      actionStatement = actionStatement.replace(/EXECUTE PROCEDURE/i, 'execute procedure');
    }
    output.push(`${createKeyword} ${triggerName}`);
    output.push(`  ${timing} ${events} ${onKeyword} ${tableRef}`);
    output.push(`  ${forKeyword} ${orientation}`);
    output.push(`  ${actionStatement};`);
  }

  return output.join('\n');
}

/**
 * Extract trigger function definitions
 */
async function extractTriggerFunctions() {
  const query = `
    SELECT n.nspname as schema_name, p.proname as function_name,
      pg_get_functiondef(p.oid) as function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = $1 AND p.prorettype = 'trigger'::regtype
    ORDER BY p.proname;
  `;

  const result = await pool.query(query, [SCHEMA_NAME]);
  if (result.rows.length === 0) return null;

  const output = [];
  const useSimplified = SYNTAX_STYLE === 'simplified';

  for (const func of result.rows) {
    let funcDef = func.function_definition;
    if (useSimplified) {
      funcDef = funcDef.replace(/CREATE OR REPLACE FUNCTION/gi, 'create or replace function');
      funcDef = funcDef.replace(/\bRETURNS\b/g, 'returns');
      funcDef = funcDef.replace(/\bLANGUAGE\b/g, 'language');
      funcDef = funcDef.replace(/\bBEGIN\b/g, 'begin');
      funcDef = funcDef.replace(/\bEND\b/g, 'end');
      funcDef = funcDef.replace(/\bDECLARE\b/g, 'declare');
      funcDef = funcDef.replace(/\bAS\b/g, 'as');
    }
    if (!INCLUDE_SCHEMA_PREFIX) {
      funcDef = funcDef.replace(new RegExp(`\\b${SCHEMA_NAME}\\.`, 'g'), '');
    }
    output.push(`-- Function: ${func.function_name}`);
    output.push(funcDef);
    output.push('');
  }

  return output.join('\n');
}

/**
 * Extract non-trigger function/procedure definitions (excluding extension-owned)
 */
async function extractNonTriggerRoutines() {
  const query = `
    SELECT n.nspname as schema_name, p.proname as routine_name,
      p.prokind as routine_kind, pg_get_functiondef(p.oid) as routine_definition,
      ext.extname as extension_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    LEFT JOIN pg_depend dep ON dep.classid = 'pg_proc'::regclass AND dep.objid = p.oid AND dep.deptype = 'e'
    LEFT JOIN pg_extension ext ON ext.oid = dep.refobjid
    WHERE n.nspname = $1 AND p.prorettype <> 'trigger'::regtype
      AND p.prokind IN ('f', 'p') AND ext.extname IS NULL
    ORDER BY p.prokind, p.proname;
  `;

  const result = await pool.query(query, [SCHEMA_NAME]);
  if (result.rows.length === 0) return null;

  const output = [];
  const useSimplified = SYNTAX_STYLE === 'simplified';

  for (const r of result.rows) {
    let routineDef = r.routine_definition;
    if (useSimplified) {
      routineDef = routineDef.replace(/CREATE OR REPLACE FUNCTION/gi, 'create or replace function');
      routineDef = routineDef.replace(/CREATE OR REPLACE PROCEDURE/gi, 'create or replace procedure');
      routineDef = routineDef.replace(/\bRETURNS\b/g, 'returns');
      routineDef = routineDef.replace(/\bLANGUAGE\b/g, 'language');
      routineDef = routineDef.replace(/\bBEGIN\b/g, 'begin');
      routineDef = routineDef.replace(/\bEND\b/g, 'end');
      routineDef = routineDef.replace(/\bDECLARE\b/g, 'declare');
      routineDef = routineDef.replace(/\bAS\b/g, 'as');
    }
    if (!INCLUDE_SCHEMA_PREFIX) {
      routineDef = routineDef.replace(new RegExp(`\\b${SCHEMA_NAME}\\.`, 'g'), '');
    }
    const kindLabel = r.routine_kind === 'p' ? 'Procedure' : 'Function';
    output.push(`-- ${kindLabel}: ${r.routine_name}`);
    output.push(routineDef);
    output.push('');
  }

  return output.join('\n');
}

// Run extraction
if (require.main === module) {
  (async () => {
    try {
      const schemaOutput = await extractSchema();
      const outputPath = path.resolve(__dirname, '..', OUTPUT_FILE);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, schemaOutput, 'utf8');
      console.error(`✅ Schema written to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Schema extraction failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  extractSchema,
  getTablesWithOrder,
  getTablesAlphabetical,
  extractTableSchema,
  getTableColumns,
  getTableConstraints,
  getTableIndexes,
  getTableSequences,
  extractTriggerFunctions,
  extractNonTriggerRoutines,
};
