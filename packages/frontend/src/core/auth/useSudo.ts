// packages/frontend/core/auth/useSudo.ts
import { useDialog } from "../dialog/useDialog";

/**
 * A hook to handle the sudo password verification flow.
 * Returns an async function that, when called, will prompt for a password
 * and return a boolean indicating success.
 */
export const useSudo = () => {
  const { passwordPrompt } = useDialog();

  const acquireSudo = async (): Promise<boolean> => {
    const password = await passwordPrompt(
      "Administrator Privileges Required",
      "Please enter your password to continue.",
    );

    if (password === null) {
      // User cancelled the prompt
      return false;
    }

    try {
      const response = await fetch("/api/system/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        return true;
      }
      // If not ok, fall through to the catch block or return false
      return false;
    } catch {
      return false;
    }
  };

  return { acquireSudo };
};
