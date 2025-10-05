// packages/frontend/src/apps/xta-creator/XTACreatorApp.tsx
import React, { useState } from "react";
import { vfsApi } from "../file-manager/api";
import type { XTA_Definition } from "../xshell/xta.types";
import { LoaderCircle } from "lucide-react";

const defaultSource = `// The 'run' function is the entry point for your command.
// See the XTA Developer Docs for the full API reference.
api.print("Hello, " + (args[0] || "world") + "!");
`;

const XTACreatorApp = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [source, setSource] = useState(defaultSource);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const handleGenerateAndSave = async () => {
    setStatus({ type: "loading", message: "Saving..." });
    if (!name.match(/^[a-z0-9_-]+$/i)) {
      setStatus({
        type: "error",
        message: "Name must be alphanumeric with no spaces.",
      });
      return;
    }
    if (!description || !source) {
      setStatus({
        type: "error",
        message: "Description and Source cannot be empty.",
      });
      return;
    }

    const definition: XTA_Definition = {
      name,
      description,
      usage: usage || name,
      source,
    };

    const fileContent = JSON.stringify(definition, null, 2);
    const savePath = `/Downloads/${name}.xta.json`;

    try {
      await vfsApi.writeFile(savePath, fileContent);
      setStatus({
        type: "success",
        message: `Successfully saved to ${savePath}`,
      });
    } catch (e: unknown) {
      setStatus({ type: "error", message: `Failed to save: ${e instanceof Error ? e.message : "An unknown error occurred."}` });
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-gray-800 text-white font-sans">
      <h1 className="text-xl font-bold mb-4">XTA Creator</h1>
      <p className="text-sm text-gray-400 mb-6">
        Create a new X Terminal Application (.xta.json) file.
      </p>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Command Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., my-app"
            className="w-full p-2 bg-gray-900 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief summary of what the app does."
            className="w-full p-2 bg-gray-900 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Usage (Optional)
          </label>
          <input
            type="text"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            placeholder="e.g., my-app [options] <file>"
            className="w-full p-2 bg-gray-900 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Source Code (for the async run function)
          </label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={15}
            className="w-full p-2 bg-gray-900 rounded-md font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck="false"
          />
        </div>
      </div>

      <div className="flex-shrink-0 pt-4">
        {status.type !== "idle" && (
          <p
            className={`text-sm mb-2 ${status.type === "error" ? "text-red-400" : "text-green-400"}`}
          >
            {status.message}
          </p>
        )}
        <button
          onClick={handleGenerateAndSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
          disabled={status.type === "loading"}
        >
          {status.type === "loading" && (
            <LoaderCircle className="animate-spin mr-2" size={20} />
          )}
          Save to /Downloads
        </button>
      </div>
    </div>
  );
};

export default XTACreatorApp;
