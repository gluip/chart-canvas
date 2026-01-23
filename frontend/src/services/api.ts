import type { CanvasState } from "@/types/canvas";

// Use relative URL so it works with whatever port the server is running on
const API_URL = "";

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
