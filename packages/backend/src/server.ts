// packages/backend/src/server.ts
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import { getSafePath } from "./utils/vfs.utils";
import vfsRouter from "./api/vfs.router";
import systemRouter from "./api/system.router";
import themeRouter from "./api/theme.router"; // <-- Import new router
import developerRouter from "./api/developer.router"; // <-- Import developer router

const app = express();
// Use PORT environment variable, or default to 3001
// Convert to number since process.env values are strings
const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

console.log(`[Backend] Starting server with PORT=${port}, HOST=${host}`);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log('[Backend] Health check endpoint called');
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/vfs", vfsRouter);
app.use("/api/themes", themeRouter); // <-- Register new router
app.use("/api/developer", developerRouter); // <-- Register developer router
app.use("/api", systemRouter);

app.listen(port, host, () => {
  console.log(`XOS Backend listening on http://${host}:${port}`);
  fs.mkdir(getSafePath("home"), { recursive: true }).catch(console.error);
  fs.mkdir(getSafePath("system"), { recursive: true }).catch(console.error);
  fs.mkdir(getSafePath("local"), { recursive: true }).catch(console.error);
});
