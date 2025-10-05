// packages/frontend/src/hooks/useTheme.ts
import { useEffect } from "react";
import { useUiStore } from "../core/theme-engine/themeStore";

export const useTheme = () => {
  const themeId = useUiStore((state) => state.themeId);
  const dynamicThemeColors = useUiStore((state) => state.dynamicThemeColors);
  const reduceTransparency = useUiStore((state) => state.reduceTransparency);

  useEffect(() => {
    const body = window.document.body;
    const root = document.documentElement;

    // Clear all static theme classes first
    const themeClasses = ["light", "dark", "ocean", "sunset", "graphite"];
    body.classList.remove(...themeClasses);

    // Handle transparency setting
    if (reduceTransparency) {
      body.classList.add("reduce-transparency");
    } else {
      body.classList.remove("reduce-transparency");
    }

    // Always clear old dynamic styles before applying new ones
    const styleKeys = [
      "--primary",
      "--background",
      "--text-primary",
      "--text-secondary",
      "--surface-bg-solid",
      "--surface-bg-glass",
    ];
    styleKeys.forEach((key) => root.style.removeProperty(key));

    if (dynamicThemeColors) {
      // Apply dynamic theme via inline CSS variables
      for (const [key, value] of Object.entries(dynamicThemeColors)) {
        root.style.setProperty(key, value);
      }
    } else {
      // Apply static theme via CSS class
      body.classList.add(themeId);
    }
  }, [themeId, dynamicThemeColors, reduceTransparency]); // Only run when these values change
};
