import express from "express";
import cors from "cors";
import { stateManager } from "./state.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Get current canvas state
app.get("/state", (req, res) => {
  res.json(stateManager.getState());
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
