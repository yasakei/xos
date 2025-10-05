// packages/frontend/src/core/api/systemApi.ts
import type { UserData } from "../../store/authStore";
import { apiFetch } from "./apiClient";

// We can expand this with more settings types later
interface SystemSettings {
  ui: {
    theme: string;
    dockPosition: string;
  };
  fileManager: {
    viewType: string;
    favorites: string[];
  };
}

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

export const systemApi = {
  async getUserProfile(): Promise<UserData> {
    const response = await apiFetch("/api/user-profile", { cache: "no-store" });
    return handleResponse(response);
  },
  async getSettings(): Promise<SystemSettings> {
    const response = await apiFetch("/api/settings");
    return handleResponse(response);
  },
};
