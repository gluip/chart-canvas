import Database from "better-sqlite3";
import { existsSync } from "fs";
import { resolve } from "path";

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string | null;
  primaryKey: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
}

export interface DatabaseSchema {
  tables: TableSchema[];
}

export interface QueryResult {
  rows: Record<string, any>[];
  columns: string[];
}

const FORBIDDEN_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "REPLACE",
  "ATTACH",
  "DETACH",
  "PRAGMA",
];

const MAX_ROWS = 10000;
const QUERY_TIMEOUT_MS = 5000;

/**
 * Validate database path - must exist and be a file
 */
export function validateDatabasePath(dbPath: string): string {
  const resolvedPath = resolve(dbPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Database file does not exist: ${dbPath}`);
  }

  return resolvedPath;
}

/**
 * Validate SQL query - must be read-only (SELECT only)
 */
export function validateReadOnlyQuery(sql: string): void {
  const upperSQL = sql.trim().toUpperCase();

  // Must start with SELECT or WITH (for CTEs)
  if (!upperSQL.startsWith("SELECT") && !upperSQL.startsWith("WITH")) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(sql)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`);
    }
  }
}

/**
 * Get database schema for all tables
 */
export function getDatabaseSchema(dbPath: string): DatabaseSchema {
  const resolvedPath = validateDatabasePath(dbPath);
  const db = new Database(resolvedPath, { readonly: true });

  try {
    // Get all table names (excluding sqlite internal tables)
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
      )
      .all() as { name: string }[];

    const schema: DatabaseSchema = {
      tables: [],
    };

    // Get columns for each table
    for (const table of tables) {
      const columns = db
        .prepare(`PRAGMA table_info(${table.name})`)
        .all() as any[];

      schema.tables.push({
        name: table.name,
        columns: columns.map((col) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk === 1,
        })),
      });
    }

    return schema;
  } finally {
    db.close();
  }
}

/**
 * Execute a SQL query with timeout and row limit
 */
export function executeQuery(dbPath: string, sql: string): QueryResult {
  const resolvedPath = validateDatabasePath(dbPath);
  validateReadOnlyQuery(sql);

  const db = new Database(resolvedPath, {
    readonly: true,
    timeout: QUERY_TIMEOUT_MS,
  });

  try {
    // Prepare and execute query
    const stmt = db.prepare(sql);
    const rows = stmt.all() as Record<string, any>[];

    // Check row limit
    if (rows.length > MAX_ROWS) {
      throw new Error(
        `Query returned ${rows.length} rows, exceeding limit of ${MAX_ROWS}`,
      );
    }

    // Get column names from first row or statement columns
    const columns =
      rows.length > 0
        ? Object.keys(rows[0])
        : stmt.columns().map((c) => c.name);

    return {
      rows,
      columns,
    };
  } finally {
    db.close();
  }
}
