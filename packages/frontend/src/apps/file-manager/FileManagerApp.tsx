// packages/frontend/src/apps/file-manager/FileManagerApp.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import type { VFSNode } from "./types";
import { vfsApi } from "./api";
import { themeApi } from "../../core/api/themeApi";
import { useFileManagerStore } from "./fileManagerStore";
import { useDialog } from "../../core/dialog/useDialog";
import {
  LoaderCircle,
  Trash2,
  Edit,
  FolderPlus,
  FilePlus,
  RefreshCw,
  Star,
} from "lucide-react";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { FileGrid } from "./FileGrid"; // Correctly import child component
import { ListView } from "./ListView"; // Correctly import child component
import { useUiStore, type XTF } from "../../core/theme-engine/themeStore";
import { useWindowStore } from "../../store/windowStore"; // Import useWindowStore
import { getAppForFile } from "../../core/app-framework/appRegistry";

const FileManagerApp = () => {
  const appContainerRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const { currentPath, setCurrentPath, viewType, favorites, toggleFavorite } =
    useFileManagerStore();
  
  // Guard against undefined currentPath
  if (currentPath === undefined) {
    return <div>Loading...</div>;
  }
  
  const [rootNode, setRootNode] = useState<VFSNode | null>(null);
  const { addCustomTheme, setTheme } = useUiStore();
  const { openWindow } = useWindowStore(); // Get openWindow function
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);
  const { confirm, prompt, alert } = useDialog();

  const createUniqueName = (baseName: string, existingNodes: VFSNode[]) => {
    let newName = baseName;
    let counter = 1;
    const existingNames = new Set(existingNodes.map((n) => n.name));
    while (existingNames.has(newName)) {
      const parts = baseName.split(".");
      const hasExt = parts.length > 1;
      const ext = hasExt ? "." + parts.pop() : "";
      const base = hasExt ? parts.join(".") : baseName;
      newName = `${base} (${counter})${ext}`;
      counter++;
    }
    return newName;
  };

  const fetchTree = useCallback(async () => {
    if (!rootNode) setIsLoading(true);
    setError(null);
    try {
      const tree = await vfsApi.getTree();
      setRootNode(tree);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load file system.");
    } finally {
      setIsLoading(false);
    }
  }, [rootNode]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleOperation = useCallback(
    async (operation: Promise<unknown>): Promise<boolean> => {
      setError(null);
      try {
        await operation;
        await fetchTree();
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
        return false;
      }
    },
    [fetchTree],
  );

  const constructPath = (fileName: string) => {
    if (!currentPath) return `/${fileName}`;
    if (currentPath === "/") return `/${fileName}`;
    return `${currentPath}/${fileName}`;
  };

  const handleInstallTheme = useCallback(
    async (path: string) => {
      const confirmed = await confirm(
        "Install Theme",
        "Do you want to install this theme? The new theme will be applied immediately.",
      );
      if (!confirmed) return;

      try {
        const fileContent = await vfsApi.readFile(path);
        const themeData: XTF = JSON.parse(fileContent.content);

        if (!themeData.id || !themeData.name || !themeData.colors) {
          throw new Error("Invalid theme file format.");
        }

        await themeApi.installTheme(themeData);
        addCustomTheme(themeData);
        setTheme(themeData.id);
        await alert(
          "Success",
          `Theme "${themeData.name}" has been installed and applied.`,
        );
      } catch (e: unknown) {
        await alert("Installation Failed", e instanceof Error ? e.message : "An unknown error occurred.");
      }
    },
    [confirm, alert, addCustomTheme, setTheme],
  );

  const handleDoubleClick = (node: VFSNode) => {
    const newPath = constructPath(node.name);
    if (node.kind === "directory") {
      setCurrentPath(newPath);
    } else {
      // Handle file types with dedicated apps
      const appId = getAppForFile(node.name);
      if (appId) {
        openWindow(appId, node.name, { filePath: newPath });
      } else {
        // Fallback for unknown file types
        openWindow("xedit", node.name, { filePath: newPath });
      }
    }
  };

  const handleImportFile = () => {
    importFileRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const filePath = constructPath(file.name);
      const success = await handleOperation(
        vfsApi.uploadFile(filePath, base64Data),
      );
      if (success) {
        await alert(
          "Success",
          `File "${file.name}" was imported successfully.`,
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getNodeFromPath = useCallback((path: string): VFSNode | null => {
    if (!rootNode) return null;
    if (path === "/") return rootNode;
    const parts = path.split("/").filter(Boolean);
    let currentNode: VFSNode = rootNode;
    for (const part of parts) {
      const child = currentNode.children?.find((c) => c.name === part);
      if (!child) return null;
      currentNode = child;
    }
    return currentNode;
  }, [rootNode]);

  const handleRename = useCallback(
    async (node: VFSNode) => {
      const newName = await prompt(
        "Rename Item",
        `Enter a new name for "${node.name}":`,
        node.name,
      );
      if (newName && newName !== node.name) {
        const oldPath = constructPath(node.name);
        const newPath = constructPath(newName);
        await handleOperation(vfsApi.renameNode(oldPath, newPath));
      }
    },
    [prompt, handleOperation, constructPath],
  );

  const handleNewItem = useCallback(
    async (type: "file" | "directory") => {
      const nodes = getNodeFromPath(currentPath)?.children || [];
      const baseName = type === "file" ? "New File.txt" : "New Folder";
      const uniqueName = createUniqueName(baseName, nodes);
      const newPath = constructPath(uniqueName);

      const success = await handleOperation(vfsApi.createNode(newPath, type));

      if (success) {
        setTimeout(async () => {
          const tree = await vfsApi.getTree();
          setRootNode(tree);
          const refreshedNodes = getNodeFromPath(currentPath)?.children || [];
          const newNode = refreshedNodes.find((n) => n.name === uniqueName);
          if (newNode) handleRename(newNode);
        }, 100);
      }
    },
    [handleOperation, handleRename, constructPath, getNodeFromPath, currentPath],
  );

  const handleDelete = useCallback(
    async (node: VFSNode) => {
      const isConfirmed = await confirm(
        "Delete Item",
        `Are you sure you want to permanently delete "${node.name}"? This cannot be undone.`,
      );
      if (isConfirmed) {
        const nodePath = constructPath(node.name);
        await handleOperation(vfsApi.deleteNode(nodePath));
      }
    },
    [confirm, handleOperation, constructPath],
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, node: VFSNode | null) => {
      event.preventDefault();
      event.stopPropagation();

      const appBounds = appContainerRef.current?.getBoundingClientRect();
      if (!appBounds) return;

      const x = event.clientX - appBounds.left;
      const y = event.clientY - appBounds.top;

      const items: MenuItem[] = [];
      if (node) {
        const nodePath =
          currentPath === "/" ? `/${node.name}` : `${currentPath}/${node.name}`;
        const isFavorite = favorites.includes(nodePath);
        items.push({
          label: "Rename",
          icon: Edit,
          action: () => handleRename(node),
        });
        if (node.kind === "directory") {
          items.push({
            label: isFavorite ? "Remove from Favorites" : "Add to Favorites",
            icon: Star,
            action: () => toggleFavorite(nodePath),
          });
        }
        items.push({
          label: "Delete",
          icon: Trash2,
          action: () => handleDelete(node),
        });
      } else {
        items.push({
          label: "New Folder",
          icon: FolderPlus,
          action: () => handleNewItem("directory"),
        });
        items.push({
          label: "New Text File",
          icon: FilePlus,
          action: () => handleNewItem("file"),
        });
        items.push({ label: "Refresh", icon: RefreshCw, action: fetchTree });
      }

      setContextMenu({ x, y, items });
    },
    [
      currentPath,
      favorites,
      handleRename,
      handleDelete,
      handleNewItem,
      fetchTree,
      toggleFavorite,
    ],
  );

  const currentNode = getNodeFromPath(currentPath);
  const nodes = currentNode?.children || [];

  return (
    <div
      ref={appContainerRef}
      className="w-full h-full flex bg-black/20 text-white rounded-lg relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      <input
        type="file"
        ref={importFileRef}
        onChange={onFileSelected}
        className="hidden"
      />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          onNavigateUp={() =>
            setCurrentPath(
              currentPath.substring(0, currentPath.lastIndexOf("/")) || "/",
            )
          }
          onImportFile={handleImportFile}
        />
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoaderCircle className="animate-spin mr-2" />
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center text-red-400 p-4 text-center">
              {error}
            </div>
          ) : viewType === "grid" ? (
            <FileGrid
              path={currentPath}
              nodes={nodes}
              onNavigate={setCurrentPath}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
            />
          ) : (
            <ListView
              path={currentPath}
              nodes={nodes}
              onNavigate={setCurrentPath}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
            />
          )}
        </main>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default FileManagerApp;
