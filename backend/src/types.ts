export interface SeriesData {
  name: string;
  data: [number, number][];
}

export interface VisualizationData {
  id: string;
  type: "line" | "bar" | "scatter";
  series: SeriesData[];
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
