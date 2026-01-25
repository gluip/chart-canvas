export interface SeriesData {
  name: string;
  data: [number, number][];
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface VisualizationData {
  id: string;
  type: "line" | "bar" | "scatter" | "table" | "flowchart" | "pie";
  series?: SeriesData[];
  table?: TableData;
  mermaid?: string;
  title?: string;
  description?: string;
  xLabels?: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CanvasState {
  visualizations: VisualizationData[];
}

// Database types
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

export interface ColumnMapping {
  xColumn?: string;
  yColumns?: string[];
  seriesColumn?: string;
  groupByColumn?: string;
}
