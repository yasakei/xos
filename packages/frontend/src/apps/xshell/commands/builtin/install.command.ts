// packages/frontend/src/apps/xshell/commands/builtin/install.command.ts
import type { XTA_Command, XTA_Definition } from "../../xta.types";

const XTA_APPS_DIR = "/system/xta-apps";

export const installCommand: XTA_Command = {
  description: "XShell package manager.",
  usage: "xshell install -f <file.xta>",

  async run(args, api) {
    if (args[0] !== "install") {
      api.printError(`Unknown operation: ${args[0]}. Usage: ${this.usage}`);
      return;
    }

    const fileFlagIndex = args.indexOf("-f");
    if (fileFlagIndex === -1 || !args[fileFlagIndex + 1]) {
      api.printError(`File flag -f not provided. Usage: ${this.usage}`);
      return;
    }

    const xtaFilePath = api.resolvePath(args[fileFlagIndex + 1]);
    api.print(`Installing from ${xtaFilePath}...`);

    try {
      // 1. Read the .xta file content
      const { content } = await api.vfs.readFile(xtaFilePath);
      if (!content) throw new Error("File is empty or could not be read.");

      // 2. Parse and validate the definition
      const definition: XTA_Definition = JSON.parse(content);
      if (!definition.name || !definition.description || !definition.source) {
        throw new Error(
          "Invalid .xta format. Missing name, description, or source.",
        );
      }
      if (api.getCommands().has(definition.name)) {
        throw new Error(
          `Command "${definition.name}" is already installed or is a built-in.`,
        );
      }

      // 3. Save the definition to the apps directory
      const installPath = `${XTA_APPS_DIR}/${definition.name}.xta.json`;
      await api.vfs.createNode(XTA_APPS_DIR, "directory"); // Ensure dir exists
      await api.vfs.writeFile(installPath, JSON.stringify(definition, null, 2));

      api.print(`Successfully installed "${definition.name}".`);
      api.print("Please restart the terminal to use the new command.");
    } catch (e: unknown) {
      api.printError(`Installation failed: ${e instanceof Error ? e.message : "An unknown error occurred."}`);
    }
  },
};
