// packages/frontend/src/core/api/themeApi.ts
import type { XTF } from "../theme-engine/themeStore";
import { apiFetch } from "./apiClient";

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
  return response.json();
}

export const themeApi = {
  async installTheme(themeData: XTF): Promise<{ message: string }> {
    return handleResponse(
      await apiFetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themeData),
      }),
    );
  },
  async getThemes(): Promise<XTF[]> {
    return handleResponse(await apiFetch("/api/themes"));
  },
};
