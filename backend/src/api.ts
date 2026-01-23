import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { stateManager } from "./state.js";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverPort: number | null = null;

export function getServerPort(): number | null {
  return serverPort;
}

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

export async function startApiServer() {
  const app = express();
  const PORT = await findAvailablePort(3000);

  app.use(cors());
  app.use(express.json());

  // API endpoints
  app.get("/state", (req, res) => {
    res.json(stateManager.getState());
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve frontend static files in production
  const frontendDistPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDistPath));

  // Fallback to index.html for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });

  app.listen(PORT, () => {
    serverPort = PORT;
    console.error(`Server running on http://localhost:${PORT}`);
    console.error(`- API: http://localhost:${PORT}/state`);
    console.error(`- Frontend: http://localhost:${PORT}`);
  });
}
