import type { CanvasState } from "@/types/canvas";

const API_URL = "http://localhost:3000";

export async function fetchCanvasState(): Promise<CanvasState> {
  const response = await fetch(`${API_URL}/state`);
  if (!response.ok) {
    throw new Error("Failed to fetch canvas state");
  }
  return response.json();
}

export function pollCanvasState(
  callback: (state: CanvasState) => void,
  interval: number = 2000,
): () => void {
  const poll = async () => {
    try {
      const state = await fetchCanvasState();
      callback(state);
    } catch (error) {
      console.error("Error polling canvas state:", error);
    }
  };

  // Initial fetch
  poll();

  // Set up interval
  const intervalId = setInterval(poll, interval);

  return () => clearInterval(intervalId);
}
