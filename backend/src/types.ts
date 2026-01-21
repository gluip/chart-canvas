export interface VisualizationData {
  id: string;
  type: "line" | "bar" | "scatter";
  points: [number, number][];
  title?: string;
  description?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CanvasState {
  visualizations: VisualizationData[];
}
