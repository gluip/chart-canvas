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
