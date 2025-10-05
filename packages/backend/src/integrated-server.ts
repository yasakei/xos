// packages/backend/src/integrated-server.ts
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { getSafePath } from "./utils/vfs.utils";
import vfsRouter from "./api/vfs.router";
import systemRouter from "./api/system.router";
import themeRouter from "./api/theme.router";
import developerRouter from "./api/developer.router";
import usersRouter from "./api/users.router";

const app = express();
// Use PORT environment variable, or default to 3001 for development, 8080 for production
const port = parseInt(process.env.PORT || (process.env.NODE_ENV === 'production' ? '8080' : '3001'), 10);
const host = process.env.HOST || '0.0.0.0';

console.log(`[Integrated Server] Starting server with PORT=${port}, HOST=${host}`);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log('[Integrated Server] Health check endpoint called');
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/vfs", vfsRouter);
app.use("/api/themes", themeRouter);
app.use("/api/developer", developerRouter);
app.use("/api/users", usersRouter);
app.use("/api", systemRouter);

// Serve static frontend files in development
if (process.env.NODE_ENV !== 'production') {
  // In development, we proxy to Vite dev server
  console.log('[Integrated Server] Running in development mode - API only');
} else {
  // Serve static frontend files in production
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  console.log(`[Integrated Server] Serving frontend from: ${frontendDistPath}`);
  
  // Serve static files
  app.use(express.static(frontendDistPath));
  
  // Handle client-side routing by serving index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

app.listen(port, host, async () => {
  console.log(`[Integrated Server] Listening on http://${host}:${port}`);
  
  // Ensure VFS directories exist
  try {
    await fs.mkdir(getSafePath("home"), { recursive: true });
    await fs.mkdir(getSafePath("system"), { recursive: true });
    await fs.mkdir(getSafePath("local"), { recursive: true });
    
    // Create wallpapers directory in VFS
    const wallpapersPath = getSafePath("wallpapers");
    await fs.mkdir(wallpapersPath, { recursive: true });
    
    // Create users directory
    const usersDir = path.join(getSafePath("system"), "users");
    await fs.mkdir(usersDir, { recursive: true });
    
    console.log('[Integrated Server] VFS directories created');
  } catch (error) {
    console.error('[Integrated Server] Error creating VFS directories:', error);
  }
  
  // Copy wallpapers from frontend dist to VFS if they don't exist
  try {
    const frontendDistPath = path.join(__dirname, '../../frontend/dist');
    const frontendWallpapersPath = path.join(frontendDistPath, 'wallpapers');
    const vfsWallpapersPath = getSafePath("wallpapers");
    
    // Check if wallpapers exist in VFS
    const vfsWallpapers = await fs.readdir(vfsWallpapersPath).catch(() => []);
    
    if (vfsWallpapers.length === 0) {
      // Copy wallpapers from frontend dist to VFS
      const frontendWallpapers = await fs.readdir(frontendWallpapersPath).catch(() => []);
      
      for (const wallpaper of frontendWallpapers) {
        if (wallpaper !== '.DS_Store') {
          const sourcePath = path.join(frontendWallpapersPath, wallpaper);
          const destPath = getSafePath(`wallpapers/${wallpaper}`);
          
          try {
            await fs.copyFile(sourcePath, destPath);
            console.log(`[Integrated Server] Copied wallpaper: ${wallpaper}`);
          } catch (error) {
            console.error(`[Integrated Server] Failed to copy wallpaper ${wallpaper}:`, error);
          }
        }
      }
    } else {
      console.log('[Integrated Server] Wallpapers already exist in VFS');
    }
  } catch (error) {
    console.error('[Integrated Server] Error copying wallpapers:', error);
  }
  
  // Create default user profile if it doesn't exist
  try {
    const systemDir = getSafePath("system");
    const usersDir = path.join(systemDir, "users");
    
    // Create users directory if it doesn't exist
    await fs.mkdir(usersDir, { recursive: true });
    
    console.log('[Integrated Server] Users directory ready');
  } catch (error) {
    console.error('[Integrated Server] Error creating users directory:', error);
  }
  
  // Create default settings if they don't exist
  try {
    const settingsFilePath = getSafePath("system/settings.json");
    try {
      await fs.access(settingsFilePath);
      console.log('[Integrated Server] Settings already exist');
    } catch (error) {
      // Settings don't exist, create default
      const defaultSettings = {
        ui: { 
          theme: "dark", 
          dockPosition: "bottom",
          buildVersion: "Public Alpha"
        },
        fileManager: { 
          viewType: "grid", 
          favorites: ["/Downloads"] 
        },
      };
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(settingsFilePath), { recursive: true });
      await fs.writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      console.log('[Integrated Server] Created default settings');
    }
  } catch (error) {
    console.error('[Integrated Server] Error creating default settings:', error);
  }
});