// packages/backend/src/api/theme.router.ts
import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/vfs.utils";

const router = Router();
const THEMES_DIR = "system/themes";

// Ensure the themes directory exists on startup
fs.mkdir(getSafePath(THEMES_DIR), { recursive: true }).catch(console.error);

// POST /api/themes - Install a new theme
router.post("/", async (req: Request, res: Response) => {
  const themeData = req.body;

  // Basic validation
  if (!themeData.name || !themeData.id || !themeData.colors) {
    return res
      .status(400)
      .json({ error: "Invalid theme file. Missing name, id, or colors." });
  }

  try {
    const themePath = getSafePath(
      path.join(THEMES_DIR, `${themeData.id}.xtf.json`),
    );
    await fs.writeFile(themePath, JSON.stringify(themeData, null, 2), "utf-8");
    res.status(201).json({ message: "Theme installed successfully." });
  } catch (e: any) {
    console.error(`[Theme API Error - POST]:`, e);
    res
      .status(500)
      .json({ error: "Failed to install theme.", details: e.message });
  }
});

// GET /api/themes - Get all installed custom themes
router.get("/", async (req: Request, res: Response) => {
  try {
    const themesDir = getSafePath(THEMES_DIR);
    const files = await fs.readdir(themesDir).catch(() => []); // Return empty array if dir doesn't exist
    const customThemes = [];

    for (const file of files) {
      if (file.endsWith(".xtf.json")) {
        try {
          const filePath = path.join(themesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          customThemes.push(JSON.parse(content));
        } catch (e) {
          console.error(`Could not read or parse theme file: ${file}`, e);
        }
      }
    }
    res.status(200).json(customThemes);
  } catch (e: any) {
    console.error(`[Theme API Error - GET]:`, e);
    res
      .status(500)
      .json({ error: "Failed to retrieve custom themes.", details: e.message });
  }
});

export default router;
