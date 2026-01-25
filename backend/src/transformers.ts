import type { SeriesData, TableData } from "./types.js";

export interface ColumnMapping {
  xColumn?: string;
  yColumns?: string[];
  seriesColumn?: string;
  groupByColumn?: string;
}

/**
 * Transform SQL query results to TableData format
 */
export function transformToTable(
  rows: Record<string, any>[],
  columns: string[],
): TableData {
  if (rows.length === 0) {
    return {
      headers: columns,
      rows: [],
    };
  }

  return {
    headers: columns,
    rows: rows.map((row) => columns.map((col) => row[col])),
  };
}

/**
 * Transform SQL query results to SeriesData format for charts
 */
export function transformToSeries(
  rows: Record<string, any>[],
  columns: string[],
  mapping: ColumnMapping,
): SeriesData[] {
  if (rows.length === 0) {
    return [];
  }

  const { xColumn, yColumns, seriesColumn, groupByColumn } = mapping;

  // Validate required columns
  if (!xColumn) {
    throw new Error("xColumn is required for chart transformation");
  }

  if (!yColumns || yColumns.length === 0) {
    throw new Error(
      "At least one yColumn is required for chart transformation",
    );
  }

  // Validate columns exist
  if (!columns.includes(xColumn)) {
    throw new Error(`xColumn '${xColumn}' not found in query results`);
  }

  for (const yCol of yColumns) {
    if (!columns.includes(yCol)) {
      throw new Error(`yColumn '${yCol}' not found in query results`);
    }
  }

  if (seriesColumn && !columns.includes(seriesColumn)) {
    throw new Error(
      `seriesColumn '${seriesColumn}' not found in query results`,
    );
  }

  if (groupByColumn && !columns.includes(groupByColumn)) {
    throw new Error(
      `groupByColumn '${groupByColumn}' not found in query results`,
    );
  }

  // If there's a seriesColumn, group data by series
  if (seriesColumn) {
    return transformWithSeriesColumn(rows, xColumn, yColumns[0], seriesColumn);
  }

  // If there's a groupByColumn, create separate series for each group
  if (groupByColumn) {
    return transformWithGroupBy(rows, xColumn, yColumns[0], groupByColumn);
  }

  // Otherwise, create one series per yColumn
  return transformMultipleYColumns(rows, xColumn, yColumns);
}

/**
 * Transform data with a series column (e.g., different product lines)
 */
function transformWithSeriesColumn(
  rows: Record<string, any>[],
  xColumn: string,
  yColumn: string,
  seriesColumn: string,
): SeriesData[] {
  const seriesMap = new Map<string, Map<number, number>>();

  for (const row of rows) {
    const seriesName = String(row[seriesColumn]);
    const xValue = parseNumericValue(row[xColumn]);
    const yValue = parseNumericValue(row[yColumn]);

    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, new Map());
    }

    seriesMap.get(seriesName)!.set(xValue, yValue);
  }

  const result: SeriesData[] = [];

  for (const [seriesName, dataMap] of seriesMap.entries()) {
    const data: [number, number][] = Array.from(dataMap.entries()).sort(
      (a, b) => a[0] - b[0],
    );

    result.push({
      name: seriesName,
      data,
    });
  }

  return result;
}

/**
 * Transform data with a group by column
 */
function transformWithGroupBy(
  rows: Record<string, any>[],
  xColumn: string,
  yColumn: string,
  groupByColumn: string,
): SeriesData[] {
  return transformWithSeriesColumn(rows, xColumn, yColumn, groupByColumn);
}

/**
 * Transform data with multiple Y columns (each becomes a series)
 */
function transformMultipleYColumns(
  rows: Record<string, any>[],
  xColumn: string,
  yColumns: string[],
): SeriesData[] {
  const result: SeriesData[] = [];

  for (const yColumn of yColumns) {
    const data: [number, number][] = rows
      .map((row) => {
        const xValue = parseNumericValue(row[xColumn]);
        const yValue = parseNumericValue(row[yColumn]);
        return [xValue, yValue] as [number, number];
      })
      .sort((a, b) => a[0] - b[0]);

    result.push({
      name: yColumn,
      data,
    });
  }

  return result;
}

/**
 * Parse a value to number, handling various formats
 */
function parseNumericValue(value: any): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    // Try to parse as number
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }

    // Try to parse as date
    const date = Date.parse(value);
    if (!isNaN(date)) {
      return date;
    }
  }

  // For other types, try to convert to number
  const num = Number(value);
  if (!isNaN(num)) {
    return num;
  }

  throw new Error(`Cannot convert value to number: ${value}`);
}

/**
 * Extract X labels from query results
 */
export function extractXLabels(
  rows: Record<string, any>[],
  xColumn: string,
): string[] {
  return rows.map((row) => String(row[xColumn]));
}
