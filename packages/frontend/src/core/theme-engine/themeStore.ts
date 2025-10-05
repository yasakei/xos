import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import { settingsApi } from "../api/settingsApi";
import { themeApi } from "../api/themeApi";

export type ThemeId = "light" | "dark" | "auto" | string;
export type SurfaceStyle = "glass" | "solid";
export type DockPosition = "top" | "bottom";
export type TaskbarSize = "small" | "medium" | "large";

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
}

// Added back for SettingsApp
export type BuiltInTheme = "light" | "dark" | "ocean" | "sunset" | "graphite";
export const BUILTIN_THEME_CONFIG: Record<string, { name: string }> = {
  light: { name: "Light" },
  dark: { name: "Dark" },
  ocean: { name: "Ocean" },
  sunset: { name: "Sunset" },
  graphite: { name: "Graphite" },
};
export type XTF = CustomTheme; // Alias for compatibility

interface UiState {
  themeId: ThemeId;
  surfaceStyle: SurfaceStyle;
  dynamicThemeColors: CustomTheme["colors"] | null;
  customThemes: CustomTheme[];
  enableAnimations: boolean;
  dockPosition: DockPosition;
  taskbarSize: TaskbarSize;
  reduceTransparency: boolean;
}

interface UiStore extends UiState {
  initializeUi: (settings: Partial<UiState>) => void;
  updateUi: (updates: Partial<UiState>) => Promise<void>;
  loadCustomThemes: () => Promise<void>;
  // Performance optimization method
  setPerformanceMode: (enableAnimations: boolean, reduceTransparency: boolean) => void;
}

const initialState: UiState = {
  themeId: "dark",
  surfaceStyle: "glass",
  dynamicThemeColors: null,
  customThemes: [],
  enableAnimations: true,
  dockPosition: "bottom",
  taskbarSize: "medium",
  reduceTransparency: false,
};

export const useUiStore = create(
  persist<UiStore>(
    (set, get) => ({
      ...initialState,

      initializeUi: (settings) => {
        console.log("[UiStore] initializeUi called with settings:", settings);
        const currentState = get();
        const hasChanged = Object.keys(settings).some(
          (key) =>
            settings[key as keyof UiState] !==
            currentState[key as keyof UiState],
        );

        if (hasChanged) {
          console.log("[UiStore] State has changed, updating");
          set(
            produce((state) => {
              Object.assign(state, settings);
            }),
          );
        } else {
          console.log("[UiStore] State unchanged, skipping update");
        }
      },

      updateUi: async (updates) => {
        const currentState = get();
        const newState = { ...currentState, ...updates };

        set(
          produce((state) => {
            Object.assign(state, newState);
          }),
        );

        try {
          await settingsApi.updateSettings({ ui: newState });
        } catch (error) {
          console.error("Failed to save UI settings:", error);
          // Optionally revert state on failure
          set(
            produce((state) => {
              Object.assign(state, currentState);
            }),
          );
        }
      },

      loadCustomThemes: async () => {
        try {
          const themes = await themeApi.getThemes();
          set({ customThemes: themes });
        } catch (error) {
          console.error("Failed to load custom themes:", error);
        }
      },
      
      // Performance optimization method
      setPerformanceMode: (enableAnimations, reduceTransparency) => {
        set({ enableAnimations, reduceTransparency });
      },
    }),
    {
      name: "xos-ui-store",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loadCustomThemes();
        }
      },
    },
  ),
);
