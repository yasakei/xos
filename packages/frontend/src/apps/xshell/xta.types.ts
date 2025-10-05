// packages/frontend/src/apps/xshell/xta.types.ts
import { vfsApi } from "../file-manager/api";
import type { UserData } from "../../store/authStore";

export interface XShellAPI {
  // File System
  vfs: typeof vfsApi;
  resolvePath: (path: string) => string;
  getCWD: () => string;
  setCWD: (path: string) => Promise<boolean>;

  // I/O
  print: (output: string | React.ReactNode) => void;
  printError: (output: string) => void;
  clear: () => void;
  readLine: (prompt: string) => Promise<string>;
  promptPassword: (prompt: string) => Promise<string | null>;

  // App Management
  getCommands: () => Map<string, XTA_Command>;
  isSudo?: boolean;

  // User Context
  user: UserData | null;
}

export interface XTA_Command {
  name: string;
  description: string;
  usage?: string;
  run: (args: string[], api: XShellAPI) => Promise<void>;
}

export interface XTA_Definition {
  name: string;
  description: string;
  usage?: string;
  source: string;
}
