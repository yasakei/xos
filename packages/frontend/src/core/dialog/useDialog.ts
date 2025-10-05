// packages/frontend/core/dialog/useDialog.ts
import { useDialogStore } from "./dialogStore";

// This hook now directly exposes the promise-based functions from the store.
export const useDialog = () => {
  const { alert, confirm, prompt, passwordPrompt } = useDialogStore();
  return { alert, confirm, prompt, passwordPrompt };
};
