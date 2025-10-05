// packages/backend/src/api/vfs.router.ts
import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import {
  getSafePath,
  getUserHomePath,
  readVfsDirectory,
} from "../utils/vfs.utils";
import { encrypt, decrypt } from "../services/encryption.service";

const router = Router();

const getRelativePath = (p: string) =>
  (p || "").startsWith("/") ? p.substring(1) : p;

// Serve static VFS files
router.get("/static/*", async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0];
    if (!filePath) {
      return res.status(400).json({ error: "File path is required." });
    }
    
    // Security: Ensure we're only serving from the static directory
    if (!filePath.startsWith("wallpapers/") && !filePath.startsWith("icons/")) {
      return res.status(403).json({ error: "Access denied to non-static files." });
    }
    
    // For wallpapers, first check in the .wallpapers directory in VFS
    if (filePath.startsWith("wallpapers/")) {
      // Extract filename from path
      const fileName = path.basename(filePath);
      const wallpaperPath = getSafePath(`wallpapers/${fileName}`);
      
      try {
        const data = await fs.readFile(wallpaperPath);
        const ext = path.extname(fileName).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        return res.send(data);
      } catch (error) {
        console.log(`[VFS] Wallpaper not found in VFS: ${wallpaperPath}`);
        // Fall through to default handling
      }
    }
    
    const absolutePath = getSafePath(filePath);
    const fileExists = await fs.access(absolutePath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Return default wallpaper if requested file doesn't exist
      if (filePath.startsWith("wallpapers/")) {
        // Try to serve default.png from .wallpapers directory
        const defaultWallpaperPath = getSafePath("wallpapers/default.png");
        const defaultExists = await fs.access(defaultWallpaperPath).then(() => true).catch(() => false);
        if (defaultExists) {
          const data = await fs.readFile(defaultWallpaperPath);
          res.setHeader('Content-Type', 'image/jpeg');
          return res.send(data);
        }
      }
      return res.status(404).json({ error: "File not found." });
    }
    
    // Check if it's an image or other binary file
    const ext = path.extname(filePath).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    
    if (imageExts.includes(ext)) {
      const data = await fs.readFile(absolutePath);
      res.setHeader('Content-Type', `image/${ext.substring(1)}`);
      res.send(data);
    } else {
      // For other files, serve as text
      const content = await fs.readFile(absolutePath, "utf-8");
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    }
  } catch (error: any) {
    console.error(`[VFS Router Error - /static]:`, error);
    // More specific error handling
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: "File not found." });
    }
    if (error.message && error.message.includes("Access denied")) {
      return res.status(403).json({ error: "Access denied." });
    }
    res
      .status(500)
      .json({ error: "Failed to serve file.", details: error.message });
  }
});

// ALL aPIs in this router are now relative to the user's home directory.
router.get("/tree", async (req: Request, res: Response) => {
  try {
    const userHome = await getUserHomePath(req);
    const tree = {
      name: "Home",
      kind: "directory",
      children: await readVfsDirectory(req, userHome),
    };
    res.json(tree);
  } catch (error: any) {
    console.error("[VFS Router Error - /tree]:", error);
    res
      .status(500)
      .json({
        error: "Failed to read file system tree.",
        details: error.message,
      });
  }
});

router.get("/read", async (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath || filePath === "undefined")
    return res.status(400).json({ error: "File path is required." });
  try {
    const userHome = await getUserHomePath(req);
    // We now join the user's home path with the relative path from the client.
    const absolutePath = getSafePath(
      path.join(userHome, getRelativePath(filePath)),
    );
    const encryptedContent = await fs.readFile(absolutePath, "utf-8");
    const content = await decrypt(encryptedContent);

    const matches = content.match(/^data:(.+);base64,(.*)$/);
    if (matches && matches[1] && matches[2]) {
      const buffer = Buffer.from(matches[2], "base64");
      res.writeHead(200, {
        "Content-Type": matches[1],
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    } else {
      res.json({ content });
    }
  } catch (error: any) {
    console.error(`[VFS Router Error - /read on ${filePath}]:`, error);
    res
      .status(500)
      .json({ error: "Failed to read file.", details: error.message });
  }
});

router.post("/write", async (req: Request, res: Response) => {
  const { filePath, content } = req.body;
  if (!filePath || typeof content !== "string")
    return res.status(400).json({ error: "Invalid request" });
  try {
    const userHome = await getUserHomePath(req);
    const absolutePath = getSafePath(
      path.join(userHome, getRelativePath(filePath)),
    );
    const encryptedContent = await encrypt(content);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, encryptedContent, "utf-8");
    res.status(200).json({ message: "File saved successfully." });
  } catch (error: any) {
    console.error(`[VFS Router Error - /write on ${filePath}]:`, error);
    res
      .status(500)
      .json({ error: "Failed to save file.", details: error.message });
  }
});

router.post("/upload", async (req: Request, res: Response) => {
  const { filePath, base64Data } = req.body;
  if (!filePath || !base64Data)
    return res
      .status(400)
      .json({ error: "filePath and base64Data are required." });
  try {
    const userHome = await getUserHomePath(req);
    const relativePath = getRelativePath(filePath);
    const absolutePath = getSafePath(path.join(userHome, relativePath));
    const encrypted = await encrypt(base64Data);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, encrypted, "utf-8");
    res
      .status(201)
      .json({ message: "File uploaded successfully.", path: relativePath });
  } catch (error: any) {
    console.error(`[VFS Router Error - /upload on ${filePath}]:`, error);
    res
      .status(500)
      .json({ error: "Failed to upload file.", details: error.message });
  }
});

router.post("/create", async (req, res) => {
  const { path: newPath, type } = req.body;
  if (!newPath || !type)
    return res.status(400).json({ error: "Path and type are required" });

  try {
    const userHome = await getUserHomePath(req);
    const absP = getSafePath(path.join(userHome, getRelativePath(newPath)));

    if (type === "directory") {
      await fs.mkdir(absP, { recursive: true });
    } else {
      const encryptedEmptyString = await encrypt("");
      await fs.writeFile(absP, encryptedEmptyString);
    }
    res.status(200).json({ message: "Operation successful" });
  } catch (e: any) {
    console.error(`[VFS Router Error - /create on ${newPath}]:`, e);
    res
      .status(500)
      .json({ error: "Create operation failed", details: e.message });
  }
});

router.post("/delete", async (req, res) => {
  const { path: itemPath } = req.body;
  if (!itemPath) return res.status(400).json({ error: "Path is required" });

  try {
    const userHome = await getUserHomePath(req);
    const absolutePath = getSafePath(
      path.join(userHome, getRelativePath(itemPath)),
    );
    await fs.rm(absolutePath, { recursive: true, force: true });
    res.status(200).json({ message: "Operation successful" });
  } catch (e: any) {
    console.error(`[VFS Router Error - /delete on ${itemPath}]:`, e);
    res
      .status(500)
      .json({ error: "Delete operation failed", details: e.message });
  }
});

router.post("/rename", async (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath)
    return res.status(400).json({ error: "oldPath and newPath are required" });

  try {
    const userHome = await getUserHomePath(req);
    const absoluteOldPath = getSafePath(
      path.join(userHome, getRelativePath(oldPath)),
    );
    const absoluteNewPath = getSafePath(
      path.join(userHome, getRelativePath(newPath)),
    );
    await fs.rename(absoluteOldPath, absoluteNewPath);
    res.status(200).json({ message: "Rename successful" });
  } catch (e: any) {
    console.error(`[VFS Router Error - /rename on ${oldPath}]:`, e);
    res.status(500).json({ error: "Rename failed", details: e.message });
  }
});

export default router;
