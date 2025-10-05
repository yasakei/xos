// packages/backend/src/utils/vfs.utils.ts
import fs from "fs/promises";
import path from "path";
import type { Request } from "express";
import type { VFSNode } from "../types";

// Use a fixed VFS_ROOT for containerized environments, fallback to local for development
const VFS_ROOT = process.env.VFS_ROOT || path.join(process.cwd(), "vfs");
export const USER_DATA_PATH = "system/user.json";

console.log("[VFS] VFS_ROOT initialized to:", VFS_ROOT);

// This is the simple, correct logic. It just prevents path traversal attacks.
// It does not try to be smart about permissions, which was the source of the bugs.
export const getSafePath = (filePath: string) => {
  // Validate input
  if (!filePath || typeof filePath !== 'string') {
    throw new Error("Invalid file path provided.");
  }
  
  // Normalize the path and remove any leading path traversal attempts
  const normalizedPath = path.normalize(filePath);
  const safeFilePath = normalizedPath.replace(/^(\.\.[\/\\])+/, "");
  
  // Resolve the absolute path
  const absolutePath = path.join(VFS_ROOT, safeFilePath);

  // Security check: Ensure the path is still within VFS_ROOT
  if (!absolutePath.startsWith(VFS_ROOT + path.sep) && absolutePath !== VFS_ROOT) {
    throw new Error("Access denied: Attempt to access outside VFS root.");
  }

  return absolutePath;
};

export async function getUserHomePath(req: Request): Promise<string> {
  const userFilePath = getSafePath(USER_DATA_PATH);
  const data = await fs.readFile(userFilePath, "utf-8").catch(() => {
    throw new Error("User profile not found. Cannot get user home.");
  });
  const userData = JSON.parse(data);
  if (!userData.username) throw new Error("Username not found.");
  return path.join("home", userData.username);
}

export const readVfsDirectory = async (
  req: Request,
  dirPath: string,
): Promise<VFSNode[]> => {
  const absoluteDirPath = getSafePath(dirPath);
  try {
    const entries = await fs.readdir(absoluteDirPath, { withFileTypes: true });
    const nodes: VFSNode[] = [];
    
    // Limit the number of entries to prevent performance issues
    const maxEntries = 1000;
    const limitedEntries = entries.slice(0, maxEntries);
    
    if (entries.length > maxEntries) {
      console.warn(`[VFS] Directory ${dirPath} has ${entries.length} entries, limiting to ${maxEntries}`);
    }
    
    for (const entry of limitedEntries) {
      // Skip hidden files and system files
      if (entry.name.startsWith(".") || entry.name.startsWith("~$")) continue;

      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // For performance, only recursively read directories if they're not too deep
        const pathDepth = fullPath.split(path.sep).length;
        if (pathDepth <= 5) { // Limit recursion depth
          nodes.push({
            name: entry.name,
            kind: "directory",
            children: await readVfsDirectory(req, fullPath),
          });
        } else {
          // For deep directories, just mark them as directories without children
          nodes.push({ name: entry.name, kind: "directory" });
        }
      } else {
        nodes.push({ name: entry.name, kind: "file" });
      }
    }
    
    // Sort nodes: directories first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === "directory" ? -1 : 1;
    });
  } catch (error: any) {
    console.error(`[VFS] Error reading directory ${dirPath}:`, error.message);
    return [];
  }
};
