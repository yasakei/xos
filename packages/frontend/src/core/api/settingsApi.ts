// packages/frontend/src/core/api/settingsApi.ts
import { apiFetch } from "./apiClient";

// A safe set of default settings to use when the file is missing or corrupt.
const defaultSettings = {
  ui: { theme: "dark", dockPosition: "bottom" },
  fileManager: { viewType: "grid", favorites: ["/Downloads"] },
};

// Prevent infinite loops by tracking if we've already applied defaults
let hasAppliedDefaults = false;
let isSavingSettings = false;
let saveErrorCount = 0;
const MAX_SAVE_ERRORS = 3;

// --- API Response Handler ---
async function handleResponse(response: Response) {
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
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// --- Debounced Update Logic (to prevent file corruption) ---
let pendingUpdates: Partial<AppSettings> = {};
let debounceTimeout: NodeJS.Timeout | null = null;

async function sendUpdateRequest(updates: object) {
  // Prevent multiple simultaneous save attempts
  if (isSavingSettings) {
    console.warn("Settings save already in progress, queuing update");
    pendingUpdates = { ...pendingUpdates, ...updates };
    return;
  }
  
  // Prevent too many save errors
  if (saveErrorCount >= MAX_SAVE_ERRORS) {
    console.warn("Too many save errors, skipping update to prevent infinite loops");
    return;
  }
  
  isSavingSettings = true;
  try {
    console.log("[Settings API] Sending settings update:", updates);
    const response = await apiFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    
    if (!response.ok) {
      saveErrorCount++;
      console.error("Failed to save settings, error count:", saveErrorCount);
    } else {
      // Reset error count on successful save
      console.log("[Settings API] Settings saved successfully");
      saveErrorCount = 0;
    }
  } catch (error) {
    saveErrorCount++;
    console.error("Failed to save settings:", error, "Error count:", saveErrorCount);
  } finally {
    isSavingSettings = false;
  }
}

function updateSettingsDebounced(newUpdates: object) {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  pendingUpdates = { ...pendingUpdates, ...newUpdates };
  debounceTimeout = setTimeout(() => {
    if (Object.keys(pendingUpdates).length > 0) {
      sendUpdateRequest(pendingUpdates);
      pendingUpdates = {};
    }
  }, 400);
}

// --- Public API Object ---
export const settingsApi = {
  async getSettings() {
    try {
      console.log("[Settings API] Fetching settings from server");
      const response = await apiFetch("/api/settings");
      // If fetching fails (e.g., 404 Not Found), the catch block will be executed.
      const settings = await handleResponse(response);
      console.log("[Settings API] Retrieved settings:", settings);
      return settings;
    } catch (error) {
      // Prevent infinite loop by checking if we've already applied defaults
      if (hasAppliedDefaults) {
        throw error; // Re-throw if we've already tried to apply defaults
      }
      
      console.warn(
        "Could not load settings from server. This is expected on first login.",
        "Applying and saving default settings.",
        error,
      );
      // SELF-HEAL: The file is missing or corrupt.
      // 1. Immediately return the safe defaults so the app can continue.
      // 2. In the background, trigger a save to create a valid file for next time.
      hasAppliedDefaults = true;
      this.updateSettings(defaultSettings);
      return defaultSettings;
    }
  },
  updateSettings(updates: object) {
    // Prevent updates if we've had too many errors
    if (saveErrorCount >= MAX_SAVE_ERRORS) {
      console.warn("Skipping settings update due to too many errors");
      return;
    }
    updateSettingsDebounced(updates);
  },
};
