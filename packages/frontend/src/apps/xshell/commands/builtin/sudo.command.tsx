// packages/frontend/src/apps/xshell/commands/builtin/sudo.command.tsx
import type { XTA_Command, XShellAPI } from "../../xta.types";
import { vfsApi } from "../../../file-manager/api";

const createSudoVfsApi = (): typeof vfsApi => {
  const sudoApi: Partial<typeof vfsApi> = {};
  for (const key in vfsApi) {
    if (Object.prototype.hasOwnProperty.call(vfsApi, key)) {
      const originalFunc = vfsApi[key as keyof typeof vfsApi];
      if (typeof originalFunc === 'function') {
        sudoApi[key as keyof typeof vfsApi] = (async (...args: Parameters<typeof originalFunc>) => {
          const originalFetch = window.fetch;
          window.fetch = (url, options) => {
            const newOptions = { ...options };
            newOptions.headers = { ...newOptions.headers, "X-Sudo-Token": "true" };
            return originalFetch(url, newOptions);
          };

          try {
            const result = await originalFunc(...args);
            return result;
          } finally {
            window.fetch = originalFetch;
          }
        }) as typeof originalFunc;
      }
    }
  }
  return sudoApi as typeof vfsApi;
};

export const sudoCommand: XTA_Command = {
  name: "sudo",
  description: "Execute a command as the superuser.",
  usage: "sudo <command> [args...]",
  async run(args, api) {
    if (args.length === 0) {
      api.printError("usage: sudo <command> [args...]");
      return;
    }
    const password = await api.promptPassword(
      `[sudo] password for ${api.user?.username}:`,
    );
    if (password === null) {
      return;
    }

    try {
      const response = await fetch("/api/system/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        api.printError("sudo: incorrect password");
        return;
      }

      const commandToRun = args[0];
      const commandArgs = args.slice(1);
      const cmd = api.getCommands().get(commandToRun);

      if (!cmd) {
        api.printError(`sudo: ${commandToRun}: command not found`);
        return;
      }

      const sudoApi: XShellAPI = {
        ...api,
        vfs: createSudoVfsApi(),
        isSudo: true,
      };

      await cmd.run(commandArgs, sudoApi);
    } catch (e: unknown) {
      api.printError(`sudo: an unexpected error occurred: ${e instanceof Error ? e.message : "An unknown error occurred."}`);
    }
  },
};
