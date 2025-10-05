// packages/frontend/src/apps/xshell/commands/builtin/commands.tsx
import React from "react";
import type { XTA_Command } from "../../xta.types";
import { helpCommand } from "./help.command.tsx";
import { installCommand } from "./install.command.ts";
import { sudoCommand } from "./sudo.command.tsx";
import neofetchCommand from "./neofetch.command.tsx";

const ls: XTA_Command = {
  name: "ls",
  description: "Lists contents of a directory.",
  usage: "ls [path]",
  async run(args, api) {
    const targetPath = args[0] || ".";
    const absolutePath = api.resolvePath(targetPath);

    try {
      const tree = await api.vfs.getTree();

      const parts = absolutePath.split("/").filter(Boolean);
      let currentNode = tree;
      for (const part of parts) {
        const child = currentNode.children?.find(
          (c) => c.name === part && c.kind === "directory",
        );
        if (!child) {
          api.printError(
            `ls: cannot access '${targetPath}': No such file or directory`,
          );
          return;
        }
        currentNode = child;
      }

      if (!currentNode.children || currentNode.children.length === 0) {
        return;
      }

      const output = currentNode.children.map((node) => (
        <span
          key={node.name}
          className={node.kind === "directory" ? "text-blue-400" : "text-white"}
        >
          {node.name}
        </span>
      ));
      api.print(<div className="flex flex-wrap gap-x-4 gap-y-1">{output}</div>);
    } catch (e: unknown) {
      api.printError(e instanceof Error ? e.message : "An unknown error occurred.");
    }
  },
};

const cd: XTA_Command = {
  name: "cd",
  description: "Changes the current working directory.",
  usage: "cd <path>",
  async run(args, api) {
    if (args.length === 0) {
      await api.setCWD("/");
      return;
    }
    const targetPath = args[0];
    const success = await api.setCWD(targetPath);
    if (!success) {
      api.printError(`cd: no such file or directory: ${targetPath}`);
    }
  },
};

const cat: XTA_Command = {
  name: "cat",
  description: "Concatenate and print files.",
  usage: "cat <file>",
  async run(args, api) {
    if (args.length === 0) {
      api.printError("cat: missing file operand");
      return;
    }
    const filePath = api.resolvePath(args[0]);
    try {
      const { content } = await api.vfs.readFile(filePath);
      api.print(<pre className="whitespace-pre-wrap">{content}</pre>);
    } catch (e: unknown) {
      api.printError(`cat: ${args[0]}: ${e instanceof Error ? e.message : "An unknown error occurred."}`);
    }
  },
};

const mkdir: XTA_Command = {
  name: "mkdir",
  description: "Create a directory.",
  usage: "mkdir <directory_name>",
  async run(args, api) {
    if (args.length === 0) {
      api.printError("mkdir: missing operand");
      return;
    }
    const dirPath = api.resolvePath(args[0]);
    try {
      await api.vfs.createNode(dirPath, "directory");
    } catch (e: unknown) {
      api.printError(
        `mkdir: cannot create directory '${args[0]}': ${e instanceof Error ? e.message : "An unknown error occurred."}`,
      );
    }
  },
};

const touch: XTA_Command = {
  name: "touch",
  description: "Create an empty file.",
  usage: "touch <file_name>",
  async run(args, api) {
    if (args.length === 0) {
      api.printError("touch: missing file operand");
      return;
    }
    const filePath = api.resolvePath(args[0]);
    try {
      await api.vfs.createNode(filePath, "file");
    } catch (e: unknown) {
      api.printError(`touch: cannot create file '${args[0]}': ${e instanceof Error ? e.message : "An unknown error occurred."}`);
    }
  },
};

const rm: XTA_Command = {
  name: "rm",
  description: "Removes a file or directory.",
  usage: "rm <path>",
  async run(args, api) {
    const pathArg = args.find((a) => !a.startsWith("-"));
    if (!pathArg) {
      api.printError("rm: missing operand");
      return;
    }
    const targetPath = api.resolvePath(pathArg);
    if (targetPath === "/") {
      api.printError("rm: it is dangerous to operate on `/`");
      return;
    }
    try {
      await api.vfs.deleteNode(targetPath);
    } catch (e: unknown) {
      api.printError(`rm: cannot remove '${pathArg}': ${e instanceof Error ? e.message : "An unknown error occurred."}`);
    }
  },
};

const echo: XTA_Command = {
  name: "echo",
  description: "Prints text to the console.",
  usage: "echo [text...]",
  async run(args, api) {
    api.print(args.join(" "));
  },
};

const clear: XTA_Command = {
  name: "clear",
  description: "Clears the terminal screen.",
  async run(_, api) {
    api.clear();
  },
};

const pwd: XTA_Command = {
  name: "pwd",
  description: "Print name of current/working directory.",
  async run(_, api) {
    api.print(api.getCWD());
  },
};

export const BUILTIN_COMMANDS: XTA_Command[] = [
  helpCommand,
  ls,
  cd,
  cat,
  mkdir,
  touch,
  rm,
  echo,
  clear,
  pwd,
  installCommand,
  sudoCommand,
  neofetchCommand,
];
