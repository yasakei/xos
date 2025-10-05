// packages/frontend/src/apps/file-manager/Toolbar.tsx
import { ArrowLeft, LayoutGrid, List, Upload } from "lucide-react";
import { useFileManagerStore } from "./fileManagerStore";

interface ToolbarProps {
  onNavigateUp: () => void;
  onImportFile: () => void; // New prop for triggering import
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNavigateUp,
  onImportFile,
}) => {
  const { currentPath, viewType, setViewType } = useFileManagerStore();

  return (
    <div className="flex-shrink-0 h-12 px-3 flex items-center border-b border-white/10">
      <button
        onClick={onNavigateUp}
        disabled={currentPath === "/"}
        className="p-1 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft size={20} />
      </button>

      {/* NEW: Import Button */}
      <button
        onClick={onImportFile}
        className="p-1 ml-2 rounded-md hover:bg-white/10"
        title="Import file from host"
      >
        <Upload size={20} />
      </button>

      <div className="font-mono text-sm ml-4 text-gray-400">
        ~/
        <span className="text-[color:var(--text-primary)]">{currentPath}</span>
      </div>
      <div className="flex-grow" />
      <div className="flex items-center space-x-1 bg-black/20 p-1 rounded-lg">
        <button
          onClick={() => setViewType("grid")}
          className={`p-1 rounded ${viewType === "grid" ? "bg-[var(--primary)]/50" : "hover:bg-white/10"}`}
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={() => setViewType("list")}
          className={`p-1 rounded ${viewType === "list" ? "bg-[var(--primary)]/50" : "hover:bg-white/10"}`}
        >
          <List size={18} />
        </button>
      </div>
    </div>
  );
};
