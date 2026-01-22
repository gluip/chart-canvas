import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { stateManager } from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startApiServer() {
  const app = express();
  const PORT = 3000;

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
    console.error(`Server running on http://localhost:${PORT}`);
    console.error(`- API: http://localhost:${PORT}/state`);
    console.error(`- Frontend: http://localhost:${PORT}`);
  });
}
