import type { CanvasState, VisualizationData } from "./types.js";
import { randomUUID } from "crypto";

class StateManager {
  private state: CanvasState = {
    visualizations: [],
  };

  getState(): CanvasState {
    return JSON.parse(JSON.stringify(this.state));
  }

  addVisualization(
    viz: Omit<VisualizationData, "id" | "x" | "y" | "w" | "h">,
  ): VisualizationData {
    const newViz: VisualizationData = {
      id: randomUUID(),
      ...viz,
      // Auto-position: calculate next available spot
      x: (this.state.visualizations.length % 2) * 6,
      y: Math.floor(this.state.visualizations.length / 2) * 4,
      w: 6,
      h: 4,
    };

    this.state.visualizations.push(newViz);
    return newViz;
  }

  removeVisualization(id: string): boolean {
    const initialLength = this.state.visualizations.length;
    this.state.visualizations = this.state.visualizations.filter(
      (v) => v.id !== id,
    );
    return this.state.visualizations.length < initialLength;
  }

  clearCanvas(): void {
    this.state.visualizations = [];
  }
}

export const stateManager = new StateManager();
