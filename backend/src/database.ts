import { DuckDBInstance } from "@duckdb/node-api";
import { existsSync } from "fs";
import { resolve, extname } from "path";

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
];

const MAX_ROWS = 10000;
const QUERY_TIMEOUT_MS = 5000;

type FileType = "sqlite" | "csv" | "parquet" | "json" | "ndjson" | "unknown";

/**
 * Validate database/file path - must exist and be a file
 */
export function validateDatabasePath(dbPath: string): string {
  const resolvedPath = resolve(dbPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`File does not exist: ${dbPath}`);
  }

  return resolvedPath;
}

/**
 * Detect file type based on extension
 */
export function getFileType(filePath: string): FileType {
  const ext = extname(filePath).toLowerCase();

  if (ext === ".db" || ext === ".sqlite" || ext === ".sqlite3") {
    return "sqlite";
  }

  if (ext === ".csv") {
    return "csv";
  }

  if (ext === ".parquet") {
    return "parquet";
  }

  if (ext === ".json") {
    return "json";
  }

  if (ext === ".jsonl" || ext === ".ndjson") {
    return "ndjson";
  }

  return "unknown";
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
 * Get the DuckDB read function for a file type
 */
function getReadFunction(filePath: string, fileType: FileType): string {
  const escapedPath = filePath.replace(/'/g, "''");

  switch (fileType) {
    case "sqlite":
      // For SQLite, we'll attach the database
      return `sqlite_scan('${escapedPath}', '')`;
    case "csv":
      return `read_csv_auto('${escapedPath}')`;
    case "parquet":
      return `read_parquet('${escapedPath}')`;
    case "json":
      return `read_json_auto('${escapedPath}')`;
    case "ndjson":
      return `read_json_auto('${escapedPath}', format='newline_delimited')`;
    default:
      throw new Error(
        `Unsupported file type. Supported: .db/.sqlite/.sqlite3 (SQLite), .csv, .parquet, .json, .jsonl/.ndjson`,
      );
  }
}

/**
 * Get table name from file path
 */
function getTableName(filePath: string): string {
  return (
    filePath
      .split("/")
      .pop()
      ?.replace(/\.(db|sqlite|sqlite3|csv|parquet|json|jsonl|ndjson)$/i, "") ||
    "data"
  );
}

/**
 * Get database/file schema using DuckDB
 */
export async function getDatabaseSchema(
  dbPath: string,
): Promise<DatabaseSchema> {
  const resolvedPath = validateDatabasePath(dbPath);
  const fileType = getFileType(resolvedPath);

  if (fileType === "unknown") {
    throw new Error(
      `Unsupported file type. Supported: .db/.sqlite/.sqlite3 (SQLite), .csv, .parquet, .json, .jsonl/.ndjson`,
    );
  }

  const instance = await DuckDBInstance.create(":memory:");
  const conn = await instance.connect();

  try {
    // For SQLite, we need to install and load the sqlite extension
    if (fileType === "sqlite") {
      await conn.run("INSTALL sqlite");
      await conn.run("LOAD sqlite");
    }

    const readFunc = getReadFunction(resolvedPath, fileType);
    const tableName = getTableName(resolvedPath);

    // For SQLite, we need to query the sqlite_master table
    if (fileType === "sqlite") {
      const escapedPath = resolvedPath.replace(/'/g, "''");

      // Get table names
      const tablesReader = await conn.runAndReadAll(
        `SELECT name FROM sqlite_scan('${escapedPath}', 'sqlite_master') WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
      );

      const tables = tablesReader.getRowObjects() as any[];

      if (!tables || tables.length === 0) {
        return { tables: [] };
      }

      // Get columns for each table
      const tableSchemas: TableSchema[] = [];

      for (const table of tables) {
        const columnsReader = await conn.runAndReadAll(
          `DESCRIBE SELECT * FROM sqlite_scan('${escapedPath}', '${table.name}') LIMIT 0`,
        );

        const columns = columnsReader.getRowObjects() as any[];

        tableSchemas.push({
          name: table.name,
          columns: columns.map((col) => ({
            name: col.column_name,
            type: col.column_type,
            notNull: false,
            defaultValue: null,
            primaryKey: false,
          })),
        });
      }

      return { tables: tableSchemas };
    } else {
      // For file-based formats (CSV, Parquet, JSON)
      const reader = await conn.runAndReadAll(
        `DESCRIBE SELECT * FROM ${readFunc} LIMIT 0`,
      );

      const columns = reader.getRowObjects() as any[];

      const columnInfos: ColumnInfo[] = columns.map((col) => ({
        name: col.column_name,
        type: col.column_type,
        notNull: false,
        defaultValue: null,
        primaryKey: false,
      }));

      return {
        tables: [
          {
            name: tableName,
            columns: columnInfos,
          },
        ],
      };
    }
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}

/**
 * Execute a SQL query using DuckDB
 */
export async function executeQuery(
  dbPath: string,
  sql: string,
): Promise<QueryResult> {
  const resolvedPath = validateDatabasePath(dbPath);
  const fileType = getFileType(resolvedPath);
  validateReadOnlyQuery(sql);

  if (fileType === "unknown") {
    throw new Error(
      `Unsupported file type. Supported: .db/.sqlite/.sqlite3 (SQLite), .csv, .parquet, .json, .jsonl/.ndjson`,
    );
  }

  const instance = await DuckDBInstance.create(":memory:");
  const conn = await instance.connect();

  try {
    // For SQLite, install and load the extension first
    if (fileType === "sqlite") {
      await conn.run("INSTALL sqlite");
      await conn.run("LOAD sqlite");
    }

    const readFunc = getReadFunction(resolvedPath, fileType);
    const tableName = getTableName(resolvedPath);

    // Replace table references with read function calls
    let modifiedSql = sql;

    // For SQLite, don't modify - queries reference tables directly via sqlite_scan
    if (fileType !== "sqlite") {
      modifiedSql = sql.replace(
        new RegExp(`\\b${tableName}\\b`, "gi"),
        readFunc,
      );
    }

    const reader = await conn.runAndReadAll(modifiedSql);
    const rawRows = reader.getRowObjects() as any[];

    if (rawRows.length > MAX_ROWS) {
      throw new Error(
        `Query returned ${rawRows.length} rows, exceeding limit of ${MAX_ROWS}`,
      );
    }

    // Convert BigInt values to numbers for JSON serialization
    const rows = rawRows.map((row) => {
      const converted: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "bigint") {
          converted[key] = Number(value);
        } else {
          converted[key] = value;
        }
      }
      return converted;
    });

    const columns = reader.columnNames();

    return {
      rows,
      columns,
    };
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}
