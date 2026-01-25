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
    // Flowcharts krijgen een grotere default grootte
    const isFlowchart = viz.type === "flowchart";
    const defaultWidth = isFlowchart ? 10 : 6;
    const defaultHeight = isFlowchart ? 8 : 4;

    const newViz: VisualizationData = {
      id: randomUUID(),
      ...viz,
      // Auto-position: calculate next available spot
      x: (this.state.visualizations.length % 2) * 6,
      y: Math.floor(this.state.visualizations.length / 2) * 4,
      w: defaultWidth,
      h: defaultHeight,
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

  updateVisualization(
    id: string,
    updates: Partial<Omit<VisualizationData, "id">>,
  ): VisualizationData | null {
    const index = this.state.visualizations.findIndex((v) => v.id === id);
    if (index === -1) {
      return null;
    }

    this.state.visualizations[index] = {
      ...this.state.visualizations[index],
      ...updates,
    };

    return this.state.visualizations[index];
  }

  clearCanvas(): void {
    this.state.visualizations = [];
  }
}

export const stateManager = new StateManager();
