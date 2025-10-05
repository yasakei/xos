// packages/frontend/src/apps/file-manager/api.ts
import type { VFSNode } from "./types";

// Simple in-memory cache for file reads
const fileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function handleResponse(response: Response, cacheKey?: string) {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "An unknown server error occurred" }));
    throw new Error(
      errorData.details ||
        errorData.error ||
        `Request failed with status ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type");
  let data;
  
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.blob();
  }
  
  // Cache the response if it's a successful file read
  if (cacheKey) {
    fileCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }
  
  return data;
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fileCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      fileCache.delete(key);
    }
  }
}, 60000); // Check every minute

export const vfsApi = {
  async getTree(): Promise<VFSNode> {
    // Check cache first
    const cacheKey = "vfs-tree";
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache for tree
      return cached.data;
    }
    
    const response = await fetch("/api/vfs/tree");
    return handleResponse(response, cacheKey);
  },

  async readFile(path: string): Promise<{ content: string }> {
    // Check cache first
    const cacheKey = `vfs-read-${path}`;
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    const response = await fetch(
      `/api/vfs/read?path=${encodeURIComponent(path)}`,
    );
    return handleResponse(response, cacheKey);
  },

  async writeFile(
    filePath: string,
    content: string,
  ): Promise<{ message: string }> {
    // Clear cache when writing
    fileCache.delete(`vfs-read-${filePath}`);
    fileCache.delete("vfs-tree");
    
    const response = await fetch(`/api/vfs/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, content }),
    });
    return handleResponse(response);
  },

  async createNode(
    path: string,
    type: "file" | "directory",
  ): Promise<{ message: string }> {
    // Clear tree cache when creating nodes
    fileCache.delete("vfs-tree");
    
    const response = await fetch(`/api/vfs/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, type }),
    });
    return handleResponse(response);
  },

  async deleteNode(path: string): Promise<{ message: string }> {
    // Clear relevant cache entries when deleting
    fileCache.delete(`vfs-read-${path}`);
    fileCache.delete("vfs-tree");
    
    const response = await fetch(`/api/vfs/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    return handleResponse(response);
  },

  async renameNode(
    oldPath: string,
    newPath: string,
  ): Promise<{ message: string }> {
    // Clear relevant cache entries when renaming
    fileCache.delete(`vfs-read-${oldPath}`);
    fileCache.delete(`vfs-read-${newPath}`);
    fileCache.delete("vfs-tree");
    
    const response = await fetch(`/api/vfs/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath, newPath }),
    });
    return handleResponse(response);
  },

  async uploadFile(
    filePath: string,
    base64Data: string,
  ): Promise<{ message: string; path: string }> {
    // Clear relevant cache entries when uploading
    fileCache.delete(`vfs-read-${filePath}`);
    fileCache.delete("vfs-tree");
    
    const response = await fetch(`/api/vfs/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, base64Data }),
    });
    return handleResponse(response);
  },
  
  // Helper function to check if a file exists
  async exists(path: string): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/vfs/read?path=${encodeURIComponent(path)}`,
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  
  // Helper function to list directory contents
  async listDirectory(path: string): Promise<VFSNode[]> {
    try {
      const response = await fetch("/api/vfs/tree");
      const tree = await handleResponse(response);
      
      // Navigate to the specified path in the tree
      const parts = path.split("/").filter(Boolean);
      let currentNode: VFSNode | null = tree;
      
      for (const part of parts) {
        if (!currentNode || !currentNode.children) {
          return [];
        }
        currentNode = currentNode.children.find(child => child.name === part) || null;
      }
      
      return currentNode?.children || [];
    } catch (error) {
      console.error("Error listing directory:", error);
      return [];
    }
  },
  
  // Helper function to create a directory
  async createDirectory(path: string): Promise<{ message: string }> {
    return this.createNode(path, "directory");
  },
  
  // Helper function to delete a file
  async deleteFile(path: string): Promise<{ message: string }> {
    return this.deleteNode(path);
  },
};
