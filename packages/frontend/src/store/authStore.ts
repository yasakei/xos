import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hashPassword } from "../core/crypto";
import { settingsApi } from "../core/api/settingsApi";
import { useUiStore } from "../core/theme-engine/themeStore";
import { useFileManagerStore } from "../apps/file-manager/fileManagerStore";

type AuthState = "initializing" | "login" | "create-account" | "locked" | "running";

export interface UserData {
  username: string;
  pfp: string | null;
  wallpaper: string;
  lockScreenWallpaper: string;
  lockScreenFont: string;
  customWallpapers: string[];
  customThemes: string[];
  salt?: string;
  passwordHash?: string;
}

interface UpdateProfilePayload
  extends Partial<Pick<UserData, "wallpaper" | "lockScreenWallpaper" | "lockScreenFont" | "customWallpapers" | "customThemes">> {
  wallpaperToRemove?: string;
  themeToRemove?: string;
}

interface AuthStore {
  state: AuthState;
  userData: UserData | null;
  setState: (state: { state: AuthState; userData: UserData | null }) => void;
  initializeApp: () => Promise<void>;
  completeSetup: (
    username: string,
    password: string,
    pfp: string | null,
  ) => Promise<{ success: boolean; error?: string }>;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lock: () => void;
  updateProfile: (updates: UpdateProfilePayload) => Promise<boolean>;
}

// Custom storage handler with error handling for QuotaExceededError
const createPersistentStorage = (name: string) => {
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn(`Failed to get item from localStorage: ${key}`, error);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error(`LocalStorage quota exceeded for key: ${key}. Clearing auth storage.`);
          // Clear the auth storage to prevent app from breaking
          localStorage.removeItem(name);
          // Try again after clearing
          try {
            localStorage.setItem(key, value);
          } catch (retryError) {
            console.error('Failed to set item even after clearing storage:', retryError);
          }
        } else {
          console.error('Failed to set item in localStorage:', error);
        }
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove item from localStorage: ${key}`, error);
      }
    },
  };
};

export const useAuthStore = create(
  persist<AuthStore>(
    (set, get) => ({
      state: "initializing",
      userData: null,
      
      setState: (newState) => set(newState),

      initializeApp: async () => {
        set({ state: "initializing", userData: null });

        try {
          const sessionRes = await fetch("/api/users/session", { cache: "no-store" });
          if (sessionRes.ok) {
            const { user } = await sessionRes.json();
            if (user) {
              set({ state: "locked", userData: user });
              return;
            }
          }
          
          const usersRes = await fetch("/api/users", { cache: "no-store" });
          if (usersRes.ok) {
            const users = await usersRes.json();
            if (users.length > 0) {
              set({ state: "login", userData: null });
            } else {
              set({ state: "create-account", userData: null });
            }
          } else {
            set({ state: "create-account", userData: null });
          }
        } catch (e) {
          set({ state: "login", userData: null });
        }
      },

      completeSetup: async (username, password, pfp) => {
        try {
          const { salt, hash: passwordHash } = hashPassword(password);
          const userData: UserData = {
            username,
            pfp,
            salt,
            passwordHash,
            wallpaper: "/api/vfs/static/wallpapers/default.png",
            lockScreenWallpaper: "/api/vfs/static/wallpapers/default.png",
            lockScreenFont: "",
            customWallpapers: [],
            customThemes: [],
          };

          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userData }),
          });
          
          if (!response.ok) {
            if (response.status === 409) {
              return { success: false, error: "Username already exists." };
            }
            const err = await response.json().catch(() => ({ error: "An unknown server error occurred." }));
            return { success: false, error: err.error || "An unknown error occurred." };
          }

          const loginResponse = await fetch("/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
            
          if (loginResponse.ok) {
            const result = await loginResponse.json();
            set({ userData: result.user, state: "locked" });
            return { success: true };
          } else {
            const err = await loginResponse.json().catch(() => ({ error: "Login after setup failed." }));
            return { success: false, error: err.error || "Login after setup failed." };
          }
        } catch (error) {
          console.error("Setup error:", error);
          return { success: false, error: "A network error occurred." };
        }
      },

      login: async (password) => {
        try {
          const { userData } = get();
          if (!userData?.username) return { success: false, error: "No user selected." };
          
          const response = await fetch("/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: userData.username, password }),
          });

          if (response.ok) {
            const result = await response.json();
            set({ state: "running", userData: result.user });

            (async () => {
              try {
                const settings = await settingsApi.getSettings();
                if (settings.ui) useUiStore.getState().initializeUi(settings.ui);
                if (settings.fileManager) useFileManagerStore.getState().initializeFileManager(settings.fileManager);
              } catch (e) {
                console.error("Error fetching settings post-login:", e);
              }
            })();

            return { success: true };
          } else {
            const err = await response.json().catch(() => ({ error: "Login failed." }));
            return { success: false, error: err.error || "Login failed." };
          }
        } catch (error) {
          console.error("Login error:", error);
          return { success: false, error: "A network error occurred." };
        }
      },

      logout: () => {
        fetch("/api/users/logout", { method: "POST" }).catch(console.error);
        set({ state: "login", userData: null });
      },

      lock: () => {
        set({ state: "locked" });
      },

      updateProfile: async (updates) => {
        const response = await fetch("/api/system/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });

        if (response.ok) {
          const { userData: newUserData } = await response.json();
          set({ userData: newUserData });
          return true;
        }
        return false;
      },
    }),
    {
      name: "xos-auth-storage",
      storage: createPersistentStorage("xos-auth-storage"),
      partialize: (state) => {
        // Only persist essential auth data to avoid localStorage quota issues
        return {
          state: state.state,
          userData: state.userData ? {
            username: state.userData.username,
            pfp: state.userData.pfp,
            // Only include essential fields, exclude potentially large arrays
            wallpaper: state.userData.wallpaper,
            lockScreenWallpaper: state.userData.lockScreenWallpaper,
            lockScreenFont: state.userData.lockScreenFont,
            // Note: Not including customWallpapers and customThemes which can be large
          } : null,
        };
      },
    },
  ),
);