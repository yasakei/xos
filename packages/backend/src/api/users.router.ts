// packages/backend/src/api/users.router.ts
import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { getSafePath } from "../utils/vfs.utils";
import { verifyPassword } from "../services/encryption.service";
import CryptoJS from "crypto-js";

const router = Router();

// Create a new user
router.post("/", async (req: Request, res: Response) => {
  const { userData } = req.body;
  
  if (!userData || !userData.username || !userData.passwordHash) {
    return res.status(400).json({ error: "Invalid user data" });
  }
  
  try {
    const systemDir = getSafePath("system");
    const usersDir = path.join(systemDir, "users");
    
    // Ensure users directory exists
    await fs.mkdir(usersDir, { recursive: true });
    
    // Check if user already exists
    const userFilePath = path.join(usersDir, `${userData.username}.json`);
    try {
      await fs.access(userFilePath);
      return res.status(409).json({ error: "User already exists" });
    } catch (error) {
      // User doesn't exist, continue
    }
    
    // Check for duplicate usernames in all user files (additional safety)
    const userFiles = await fs.readdir(usersDir);
    for (const file of userFiles) {
      if (file.endsWith('.json') && file !== `${userData.username}.json`) {
        try {
          const existingUserPath = path.join(usersDir, file);
          const existingUserData = JSON.parse(await fs.readFile(existingUserPath, 'utf-8'));
          if (existingUserData.username === userData.username) {
            return res.status(409).json({ 
              error: "User already exists",
              warning: "A user with this username already exists in the system"
            });
          }
        } catch (error) {
          // Continue if we can't read a file
          console.warn(`Could not read user file ${file}:`, error);
        }
      }
    }
    
    // Create user home directory
    const userHome = path.join("home", userData.username);
    await fs.mkdir(getSafePath(userHome), { recursive: true });
    
    // Create default user folders
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
    
    // Save user profile
    const userProfile = {
      ...userData,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    await fs.writeFile(
      userFilePath,
      JSON.stringify(userProfile, null, 2),
      "utf-8"
    );
    
    // Copy default wallpapers to user's wallpapers directory
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
    
    res.status(201).json({ 
      message: "User created successfully.",
      user: {
        username: userData.username,
        pfp: userData.pfp
      }
    });
  } catch (error: any) {
    console.error("[Users API Error - /users POST]:", error);
    res.status(500).json({ 
      error: "Failed to create user.", 
      details: error.message 
    });
  }
});

// Login as a specific user
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  
  try {
    const systemDir = getSafePath("system");
    const usersDir = path.join(systemDir, "users");
    const userFilePath = path.join(usersDir, `${username}.json`);
    
    // Check if user exists
    try {
      await fs.access(userFilePath);
    } catch (error) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Read user data
    const userData = JSON.parse(await fs.readFile(userFilePath, 'utf-8'));
        
    // Verify password using inline implementation to avoid import conflicts
    const salt = CryptoJS.enc.Hex.parse(userData.salt);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA512,
    }).toString(CryptoJS.enc.Hex);
    const isPasswordCorrect = hash === userData.passwordHash;

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    
    // Update last login
    userData.lastLogin = new Date().toISOString();
    await fs.writeFile(userFilePath, JSON.stringify(userData, null, 2), 'utf-8');
    
    // Create current user symlink or copy
    const currentUserPath = path.join(systemDir, "user.json");
    await fs.writeFile(currentUserPath, JSON.stringify(userData, null, 2), 'utf-8');
    
    // Return user data (without sensitive info)
    const safeUserData = {
      username: userData.username,
      pfp: userData.pfp,
      wallpaper: userData.wallpaper || "/wallpapers/default.png",
      lockScreenWallpaper: userData.lockScreenWallpaper || "/wallpapers/default.png",
      lockScreenFont: userData.lockScreenFont || "",
      customWallpapers: userData.customWallpapers || [],
      customThemes: userData.customThemes || []
    };
    
    res.json({ 
      message: "Login successful",
      user: safeUserData
    });
  } catch (error: any) {
    console.error("[Users API Error - /users/login POST]:", error);
    res.status(500).json({ 
      error: "Login failed", 
      details: error.message 
    });
  }
});

// Switch to a different user (admin only or same user session)
router.post("/switch", async (req: Request, res: Response) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  
  try {
    const systemDir = getSafePath("system");
    const usersDir = path.join(systemDir, "users");
    const userFilePath = path.join(usersDir, `${username}.json`);
    
    // Check if user exists
    try {
      await fs.access(userFilePath);
    } catch (error) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Read user data
    const userData = JSON.parse(await fs.readFile(userFilePath, 'utf-8'));
    
    // Update last login
    userData.lastLogin = new Date().toISOString();
    await fs.writeFile(userFilePath, JSON.stringify(userData, null, 2), 'utf-8');
    
    // Create current user symlink or copy
    const currentUserPath = path.join(systemDir, "user.json");
    await fs.writeFile(currentUserPath, JSON.stringify(userData, null, 2), 'utf-8');
    
    // Return user data (without sensitive info)
    const safeUserData = {
      username: userData.username,
      pfp: userData.pfp,
      wallpaper: userData.wallpaper || "/wallpapers/default.png",
      lockScreenWallpaper: userData.lockScreenWallpaper || "/wallpapers/default.png",
      lockScreenFont: userData.lockScreenFont || "",
      customWallpapers: userData.customWallpapers || [],
      customThemes: userData.customThemes || []
    };
    
    res.json({ 
      message: "Switched user successfully",
      user: safeUserData
    });
  } catch (error: any) {
    console.error("[Users API Error - /users/switch POST]:", error);
    res.status(500).json({ 
      error: "Failed to switch user", 
      details: error.message 
    });
  }
});

// Get current user session
router.get("/session", async (req: Request, res: Response) => {
  try {
    const systemDir = getSafePath("system");
    const currentUserPath = path.join(systemDir, "user.json");
    
    try {
      await fs.access(currentUserPath);
      const userData = JSON.parse(await fs.readFile(currentUserPath, 'utf-8'));
      // Remove sensitive data
      delete userData.passwordHash;
      delete userData.salt;
      res.json({ user: userData });
    } catch (error) {
      // If user.json doesn't exist, there is no active session
      res.json({ user: null });
    }
  } catch (error: any) {
    res.status(500).json({ 
      error: "Failed to retrieve session.", 
      details: error.message 
    });
  }
});

// Get all users (for login/switch user screen)
router.get("/", async (req: Request, res: Response) => {
  try {
    const systemDir = getSafePath("system");
    const usersDir = path.join(systemDir, "users");
    
    // Check if users directory exists
    try {
      await fs.access(usersDir);
    } catch (error) {
      // Create users directory if it doesn't exist
      await fs.mkdir(usersDir, { recursive: true });
    }
    
    // Read all user profiles
    const userFiles = await fs.readdir(usersDir);
    const users = [];
    
    for (const file of userFiles) {
      if (file.endsWith('.json')) {
        try {
          const userPath = path.join(usersDir, file);
          const userData = JSON.parse(await fs.readFile(userPath, 'utf-8'));
          // Only return safe user data (no password hashes)
          users.push({
            username: userData.username,
            pfp: userData.pfp,
            lastLogin: userData.lastLogin
          });
        } catch (error) {
          console.error(`Error reading user file ${file}:`, error);
        }
      }
    }
    
    res.json(users);
  } catch (error: any) {
    console.error("[Users API Error - /users GET]:", error);
    res.status(500).json({ 
      error: "Failed to retrieve users.", 
      details: error.message 
    });
  }
});

// Logout current user
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const systemDir = getSafePath("system");
    const currentUserPath = path.join(systemDir, "user.json");
    
    try {
      // Remove the current user session file
      await fs.unlink(currentUserPath);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      // If file doesn't exist, user is already logged out
      res.json({ message: "Already logged out" });
    }
  } catch (error: any) {
    console.error("[Users API Error - /users/logout POST]:", error);
    res.status(500).json({ 
      error: "Failed to logout.", 
      details: error.message 
    });
  }
});

// Get current user profile
router.get("/current", async (req: Request, res: Response) => {
  try {
    const systemDir = getSafePath("system");
    const currentUserPath = path.join(systemDir, "user.json");
    
    try {
      await fs.access(currentUserPath);
      const userData = JSON.parse(await fs.readFile(currentUserPath, 'utf-8'));
      // Remove sensitive data
      delete userData.passwordHash;
      delete userData.salt;
      res.json(userData);
    } catch (error) {
      res.status(404).json({ error: "No current user found" });
    }
  } catch (error: any) {
    console.error("[Users API Error - /users/current GET]:", error);
    res.status(500).json({ 
      error: "Failed to retrieve current user.", 
      details: error.message 
    });
  }
});

export default router;