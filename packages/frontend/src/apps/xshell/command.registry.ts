// packages/frontend/src/apps/xshell/command.registry.ts
import React from "react"; // <-- Import React
import { BUILTIN_COMMANDS } from "./commands/builtin/commands.tsx";
import type { XTA_Command, XTA_Definition } from "./xta.types";
import { vfsApi } from "../file-manager/api";
import { systemApi } from "../../core/api/systemApi"; // <-- Import our new system API

const commandRegistry = new Map<string, XTA_Command>();
const XTA_APPS_DIR = "/system/xta-apps";

// This is an object containing all the modules we want to expose to XTA apps.
const XTA_DEPENDENCIES = { React, systemApi };

function registerCommand(command: XTA_Command) {
  commandRegistry.set(command.name, command);
}

function loadBuiltinCommands() {
  BUILTIN_COMMANDS.forEach(registerCommand);
}

async function loadInstalledCommands() {
  try {
    const tree = await vfsApi.getTree();
    const systemDir = tree.children?.find((c) => c.name === "system");
    const appsDir = systemDir?.children?.find((c) => c.name === "xta-apps");

    if (!appsDir || !appsDir.children) {
      return;
    }

    for (const appFile of appsDir.children) {
      if (appFile.name.endsWith(".xta.json")) {
        try {
          const path = `${XTA_APPS_DIR}/${appFile.name}`;
          const { content } = await vfsApi.readFile(path);
          const definition: XTA_Definition = JSON.parse(content);

          // FIX: The Function constructor now takes dependencies as arguments.
          // The XTA source code can now use `React` and `systemApi` as if they were global.
          const runFn = new Function(
            "args",
            "api",
            "React",
            "systemApi",
            definition.source,
          );

          const command: XTA_Command = {
            name: definition.name,
            description: definition.description,
            usage: definition.usage,
            // FIX: We wrap the raw function to inject our dependencies when it's called.
            run: (args, api) =>
              runFn(
                args,
                api,
                XTA_DEPENDENCIES.React,
                XTA_DEPENDENCIES.systemApi,
              ),
          };
          registerCommand(command);
        } catch (e) {
          console.error(
            `[XShell] Failed to load command from ${appFile.name}:`,
            e,
          );
        }
      }
    }
  } catch (e) {
    console.error("[XShell] Could not load installed commands:", e);
  }
}

export async function initializeRegistry() {
  commandRegistry.clear();
  loadBuiltinCommands();
  await loadInstalledCommands();
}

export function getCommand(name: string): XTA_Command | undefined {
  return commandRegistry.get(name);
}

export function getAllCommands(): Map<string, XTA_Command> {
  return commandRegistry;
}
