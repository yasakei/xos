// packages/frontend/core/dialog/dialogStore.ts
import { create } from "zustand";

type DialogType = "alert" | "confirm" | "prompt" | "password-prompt";

interface DialogRequest {
  type: DialogType;
  title: string;
  message: string;
  defaultValue?: string;
  resolve: (value: string | boolean | null) => void;
  reject: () => void;
}

interface DialogState {
  request: DialogRequest | null;
  alert: (title: string, message: string) => Promise<void>;
  confirm: (title: string, message: string) => Promise<boolean>;
  prompt: (
    title: string,
    message: string,
    defaultValue?: string,
  ) => Promise<string | null>;
  passwordPrompt: (title: string, message: string) => Promise<string | null>;
}

export const useDialogStore = create<DialogState>((set) => ({
  request: null,
  alert: (title, message) => {
    return new Promise((resolve, reject) => {
      set({ request: { type: "alert", title, message, resolve, reject } });
    });
  },
  confirm: (title, message) => {
    return new Promise((resolve, reject) => {
      set({ request: { type: "confirm", title, message, resolve, reject } });
    });
  },
  prompt: (title, message, defaultValue) => {
    return new Promise((resolve, reject) => {
      set({
        request: {
          type: "prompt",
          title,
          message,
          defaultValue,
          resolve,
          reject,
        },
      });
    });
  },
  passwordPrompt: (title, message) => {
    return new Promise((resolve, reject) => {
      set({
        request: { type: "password-prompt", title, message, resolve, reject },
      });
    });
  },
}));
