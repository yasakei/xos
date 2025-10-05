// packages/backend/src/api/system.router.ts
import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import CryptoJS from "crypto-js";
import { getSafePath, USER_DATA_PATH } from "../utils/vfs.utils";
import { verifyPassword } from "../services/encryption.service";

const router = Router();
const SETTINGS_PATH = "system/settings.json";

// GET /api/user-profile
router.get("/user-profile", async (req, res) => {
  try {
    const userFilePath = getSafePath(USER_DATA_PATH);
    await fs.access(userFilePath); // Check if file exists
    const data = await fs.readFile(userFilePath, "utf-8");
    const userData = JSON.parse(data);
    delete userData.passwordHash;
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(userData));
  } catch (error) {
    res.status(404).json({ error: "User profile not found." });
  }
});

// GET /api/settings
router.get("/settings", async (req, res) => {
  try {
    const settingsFilePath = getSafePath(SETTINGS_PATH);
    console.log("[Settings API] Loading settings from:", settingsFilePath);
    let data;
    try {
      data = await fs.readFile(settingsFilePath, "utf-8");
      console.log("[Settings API] Successfully read settings file");
    } catch (readError: any) {
      console.log("[Settings API] Settings file not found, creating default:", readError.message);
      // If file doesn't exist, create it with default settings
      const defaultSettings = {
        ui: { theme: "dark", dockPosition: "bottom" },
        fileManager: { viewType: "grid", favorites: ["/Downloads"] },
      };
      try {
        // Ensure parent directory exists
        const dirPath = path.dirname(settingsFilePath);
        console.log("[Settings API] Ensuring directory exists:", dirPath);
        await fs.mkdir(dirPath, { recursive: true });
        console.log("[Settings API] Writing default settings to:", settingsFilePath);
        await fs.writeFile(
          settingsFilePath,
          JSON.stringify(defaultSettings, null, 2),
          "utf-8",
        );
        data = JSON.stringify(defaultSettings);
      } catch (writeError: any) {
        console.error("[API Error - /settings GET - Write]:", writeError);
        // Return default settings even if we can't write them
        data = JSON.stringify(defaultSettings);
      }
    }
    res.json(JSON.parse(data));
  } catch (error: any) {
    console.error("[API Error - /settings GET]:", error);
    // Return default settings as a fallback
    const defaultSettings = {
      ui: { theme: "dark", dockPosition: "bottom" },
      fileManager: { viewType: "grid", favorites: ["/Downloads"] },
    };
    res.json(defaultSettings);
  }
});

// POST /api/settings
router.post("/settings", async (req, res) => {
  const { updates } = req.body;
  if (!updates) {
    return res.status(400).json({ error: "No updates provided." });
  }
  
  console.log("[Settings API] Received settings update request:", updates);
  
  try {
    const settingsFilePath = getSafePath(SETTINGS_PATH);
    console.log("[Settings API] Saving settings to:", settingsFilePath);
    
    // Ensure parent directory exists
    const dirPath = path.dirname(settingsFilePath);
    console.log("[Settings API] Ensuring directory exists:", dirPath);
    await fs.mkdir(dirPath, { recursive: true }).catch((err) => {
      console.log("[Settings API] Directory creation warning (may already exist):", err.message);
    });
    
    const existingSettingsRaw = await fs
      .readFile(settingsFilePath, "utf-8")
      .catch(() => {
        console.log("[Settings API] No existing settings file found, using empty object");
        return "{}";
      });
    const existingSettings = JSON.parse(existingSettingsRaw);

    // Deep merge logic
    const updatedSettings = { ...existingSettings, ...updates };
    if (updates.ui)
      updatedSettings.ui = { ...existingSettings.ui, ...updates.ui };
    if (updates.fileManager)
      updatedSettings.fileManager = {
        ...existingSettings.fileManager,
        ...updates.fileManager,
      };

    console.log("[Settings API] Writing updated settings:", updatedSettings);
    await fs.writeFile(
      settingsFilePath,
      JSON.stringify(updatedSettings, null, 2),
      "utf-8",
    );
    res.status(200).json(updatedSettings);
  } catch (error: any) {
    console.error("[API Error - /settings POST]:", error);
    // Even if we can't save, return success to prevent infinite loops
    res.status(200).json({ message: "Settings update received but not saved due to server error." });
  }
});

// POST /api/system/setup (modified for multi-user support)
router.post("/system/setup", async (req: Request, res: Response) => {
  const { userData } = req.body;
  if (!userData || !userData.username || !userData.passwordHash) {
    return res.status(400).json({ error: "Invalid user data" });
  }
  try {
    // Create user through the users API instead
    const systemDir = getSafePath("system");
    const usersDir = path.join(systemDir, "users");
    
    // Ensure users directory exists
    await fs.mkdir(usersDir, { recursive: true });
    
    // Save user profile in users directory
    const userFilePath = path.join(usersDir, `${userData.username}.json`);
    const userProfile = {
      ...userData,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    await fs.writeFile(
      userFilePath,
      JSON.stringify(userProfile, null, 2),
      "utf-8",
    );
    
    // Also set as current user
    const currentUserPath = path.join(systemDir, "user.json");
    await fs.writeFile(
      currentUserPath,
      JSON.stringify(userProfile, null, 2),
      "utf-8",
    );
    
    // Create user home directory
    const userHome = path.join("home", userData.username);
    await fs.mkdir(getSafePath(userHome), { recursive: true });

    const defaultFolders = [
      "Documents",
      "Downloads",
      "Pictures",
      ".wallpapers",
    ];
    for (const folder of defaultFolders) {
      await fs.mkdir(getSafePath(path.join(userHome, folder)), {
        recursive: true,
      });
    }
    
    // Copy wallpapers to user's directory
    try {
      const globalWallpapersPath = getSafePath(".wallpapers");
      const userWallpapersPath = getSafePath(path.join(userHome, ".wallpapers"));
      
      const wallpapers = await fs.readdir(globalWallpapersPath).catch(() => []);
      for (const wallpaper of wallpapers) {
        if (wallpaper !== '.DS_Store') {
          const sourcePath = path.join(globalWallpapersPath, wallpaper);
          const destPath = path.join(userWallpapersPath, wallpaper);
          await fs.copyFile(sourcePath, destPath).catch(err => {
            console.error(`Failed to copy wallpaper ${wallpaper}:`, err);
          });
        }
      }
    } catch (error) {
      console.error("Failed to copy wallpapers to user directory:", error);
    }

    const defaultSettings = {
      ui: { theme: "dark", dockPosition: "bottom" },
      fileManager: { viewType: "grid", favorites: ["/Downloads"] },
    };
    await fs.writeFile(
      getSafePath(SETTINGS_PATH),
      JSON.stringify(defaultSettings, null, 2),
      "utf-8",
    );

    res.status(201).json({ message: "User profile created successfully." });
  } catch (error: any) {
    console.error("[API Error - /system/setup]:", error);
    res
      .status(500)
      .json({
        error: "Failed to create user profile.",
        details: error.message,
      });
  }
});

// POST /api/system/profile/update
router.post("/system/profile/update", async (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!updates) {
    return res.status(400).json({ error: "No updates provided." });
  }
  try {
    const userFilePath = getSafePath(USER_DATA_PATH);
    const userDataRaw = await fs.readFile(userFilePath, "utf-8");
    const userData = JSON.parse(userDataRaw);

    if (updates.wallpaperToRemove) {
      const userHome = path.join("home", userData.username);
      const relativePath = (updates.wallpaperToRemove || "").startsWith("/")
        ? updates.wallpaperToRemove.substring(1)
        : updates.wallpaperToRemove;
      const wallpaperPath = getSafePath(path.join(userHome, relativePath));
      await fs
        .unlink(wallpaperPath)
        .catch((err) =>
          console.log("Wallpaper file not found, continuing profile update."),
        );
      delete updates.wallpaperToRemove;
    }

    if (updates.themeToRemove) {
      const themePath = getSafePath(`system/themes/${updates.themeToRemove}.xtf.json`);
      await fs
        .unlink(themePath)
        .catch((err) =>
          console.log("Theme file not found, continuing profile update."),
        );
      delete updates.themeToRemove;
    }
    const updatedUserData = { ...userData, ...updates };
    await fs.writeFile(
      userFilePath,
      JSON.stringify(updatedUserData, null, 2),
      "utf-8",
    );
    res
      .status(200)
      .json({ message: "User profile updated.", userData: updatedUserData });
  } catch (error: any) {
    res
      .status(500)
      .json({
        error: "Failed to update user profile.",
        details: error.message,
      });
  }
});

// POST /api/system/verify-password
router.post("/system/verify-password", async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  try {
    // Get current user data to verify password against
    const systemDir = getSafePath("system");
    const currentUserPath = path.join(systemDir, "user.json");
    const userData = JSON.parse(await fs.readFile(currentUserPath, 'utf-8'));
    
    if (!userData.salt || !userData.passwordHash) {
      return res.status(500).json({ error: "User profile is incomplete" });
    }
    
    // Inline password verification to avoid import conflicts
    const salt = CryptoJS.enc.Hex.parse(userData.salt);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA512,
    }).toString(CryptoJS.enc.Hex);
    const isCorrect = hash === userData.passwordHash;
    
    if (isCorrect) {
      res.status(200).json({ success: true, message: "Password verified." });
    } else {
      res.status(401).json({ success: false, error: "Incorrect password." });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to verify password.",
        details: error.message,
      });
  }
});

export default router;
