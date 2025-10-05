// packages/frontend/src/apps/xshell/XShell.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  initializeRegistry,
  getCommand,
  getAllCommands,
} from "./command.registry";
import { resolvePath } from "./path.utils";
import { vfsApi } from "../file-manager/api";
import type { XShellAPI } from "./xta.types";
import { useAuthStore } from "../../store/authStore";

type HistoryItem = {
  id: number;
  content: React.ReactNode;
};

type PromptRequest = {
  prompt: string;
  resolve: (value: string | null) => void;
};

const XShell = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [cwd, setCwd] = useState("/");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<PromptRequest | null>(
    null,
  );
  const [suggestion, setSuggestion] = useState<string>("");
  const [showSuggestion, setShowSuggestion] = useState<boolean>(false);

  const { userData } = useAuthStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await initializeRegistry();
      setIsInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (passwordPrompt) {
      passwordInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [passwordPrompt, isProcessing]);

  const addToHistory = (content: React.ReactNode) => {
    setHistory((prev) => {
      const newHistory = [...prev, { id: prev.length, content }];
      const HISTORY_LIMIT = 100;
      if (newHistory.length > HISTORY_LIMIT) {
        return newHistory.slice(newHistory.length - HISTORY_LIMIT);
      }
      return newHistory;
    });
  };

  const promptPassword = (prompt: string): Promise<string | null> => {
    setIsProcessing(true);
    return new Promise((resolve) => {
      setPasswordPrompt({ prompt, resolve });
    });
  };

  const handlePasswordSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = e.currentTarget.value;
      addToHistory(passwordPrompt!.prompt);
      passwordPrompt!.resolve(value);
      setPasswordPrompt(null);
      setIsProcessing(false);
    } else if (e.key === "Escape") {
      addToHistory(passwordPrompt!.prompt);
      passwordPrompt!.resolve(null);
      setPasswordPrompt(null);
      setIsProcessing(false);
    }
  };

  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    const [cmdName, ...args] = command.trim().split(" ").filter(Boolean);

    const prompt = (
      <div className="flex">
        <span className="text-cyan-400">xos</span>
        <span className="text-gray-500">:</span>
        <span className="text-purple-400">{cwd}</span>
        <span className="text-gray-500">$</span>
        <span className="ml-2 text-white">{command}</span>
      </div>
    );
    addToHistory(prompt);

    if (!cmdName) {
      setIsProcessing(false);
      return;
    }

    const cmd = getCommand(cmdName);

    if (cmd) {
      const api: XShellAPI = {
        vfs: vfsApi,
        print: (output) => addToHistory(output),
        printError: (output) =>
          addToHistory(<span className="text-red-500">{output}</span>),
        clear: () => setHistory([]),
        getCWD: () => cwd,
        setCWD: async (path) => {
          const newPath = resolvePath(cwd, path);
          try {
            const tree = await vfsApi.getTree();
            const parts = newPath.split("/").filter(Boolean);
            let node = tree;
            for (const part of parts) {
              const child = node.children?.find((c) => c.name === part);
              if (!child || child.kind !== "directory") throw new Error();
              node = child;
            }
            setCwd(newPath);
            return true;
          } catch {
            return false;
          }
        },
        resolvePath: (path: string) => resolvePath(cwd, path),
        readLine: () => new Promise(() => {}),
        promptPassword,
        getCommands: getAllCommands,
        user: userData,
      };

      try {
        await cmd.run(args, api);
      } catch (e: unknown) {
        api.printError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    } else {
      addToHistory(
        <span className="text-red-500">
          xshell: command not found: {cmdName}
        </span>,
      );
    }

    setInput("");
    if (!passwordPrompt) {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isProcessing) {
      handleCommand(input);
    } else if (e.key === "Tab" && showSuggestion && suggestion) {
      e.preventDefault();
      setInput(suggestion);
      setShowSuggestion(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInput(text);

    if (text.length > 0) {
      const matchingCommands = getAllCommands()
        .map((cmd) => cmd.name)
        .filter((cmdName) => cmdName.startsWith(text));

      if (matchingCommands.length > 0) {
        setSuggestion(matchingCommands[0]);
        setShowSuggestion(true);
      } else {
        setSuggestion("");
        setShowSuggestion(false);
      }
    } else {
      setSuggestion("");
      setShowSuggestion(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4 font-mono text-sm bg-black/50 text-white h-full backdrop-blur-md">
        Initializing Shell...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full p-4 bg-black/50 text-white font-mono text-sm leading-relaxed overflow-y-auto backdrop-blur-md"
      onClick={() =>
        passwordPrompt
          ? passwordInputRef.current?.focus()
          : inputRef.current?.focus()
      }
    >
      {history.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
      {!passwordPrompt && (
        <div className="flex relative">
          <span className="text-cyan-400">xos</span>
          <span className="text-gray-500">:</span>
          <span className="text-purple-400">{cwd}</span>
          <span className="text-gray-500">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1 ml-2 bg-transparent outline-none text-white"
            autoFocus
            spellCheck="false"
          />
          {showSuggestion && suggestion && input !== suggestion && (
            <span className="absolute left-0 top-0 ml-[calc(1ch*${`xos:${cwd}.length+2})] text-gray-500 pointer-events-none">
              {suggestion}
            </span>
          )}
        </div>
      )}
      {passwordPrompt && (
        <div className="flex">
          <span>{passwordPrompt.prompt}</span>
          <input
            ref={passwordInputRef}
            type="password"
            onKeyDown={handlePasswordSubmit}
            className="flex-1 ml-2 bg-transparent outline-none"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default XShell;
