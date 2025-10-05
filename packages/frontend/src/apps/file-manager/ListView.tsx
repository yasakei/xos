// packages/frontend/src/apps/file-manager/ListView.tsx
import React from "react";
import type { VFSNode, FileViewProps } from "./types";
import { 
  Folder, 
  FileText, 
  FileType, 
  FileJson, 
  Palette,
  Image,
  Music,
  Video,
  Archive,
  FileCode,
  FileSpreadsheet,
  FileDigit,
  FileKey,
  FileLock,
  FileSearch,
  FileQuestion
} from "lucide-react";

// FIX: Use the shared props interface
export const ListView: React.FC<FileViewProps> = ({
  nodes,
  onDoubleClick,
  onContextMenu,
}) => {
  const getIcon = (node: VFSNode) => {
    const ext = node.name.split(".").pop()?.toLowerCase();
    
    if (node.kind === "directory")
      return <Folder size={18} className="text-yellow-400" />;
    
    // Image files
    if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico", "tiff", "tif"].includes(ext || ""))
      return <Image size={18} className="text-purple-400" />;
    
    // Audio files
    if (["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma", "opus"].includes(ext || ""))
      return <Music size={18} className="text-pink-400" />;
    
    // Video files
    if (["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "m4v"].includes(ext || ""))
      return <Video size={18} className="text-red-400" />;
    
    // Document files
    if (["pdf", "doc", "docx", "odt", "rtf"].includes(ext || ""))
      return <FileType size={18} className="text-red-400" />;
    
    // Presentation files
    if (["ppt", "pptx", "odp", "key", "pps", "ppsx"].includes(ext || ""))
      return <FileType size={18} className="text-orange-400" />;
    
    // Spreadsheet files
    if (["xls", "xlsx", "ods", "csv", "tsv", "numbers"].includes(ext || ""))
      return <FileSpreadsheet size={18} className="text-green-400" />;
    
    // Code files
    if (["js", "jsx", "ts", "tsx", "html", "css", "scss", "sass", "php", "py", "java", "cpp", "c", "cs", "rb", "go", "rs", "swift"].includes(ext || ""))
      return <FileCode size={18} className="text-blue-400" />;
    
    // Configuration files
    if (["json", "xml", "yaml", "yml", "toml", "ini", "cfg"].includes(ext || ""))
      return <FileJson size={18} className="text-blue-400" />;
    
    // Archive files
    if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext || ""))
      return <Archive size={18} className="text-gray-400" />;
    
    // Executable files
    if (["exe", "msi", "app", "bat", "sh", "cmd"].includes(ext || ""))
      return <FileDigit size={18} className="text-green-500" />;
    
    // Database files
    if (["db", "sql", "sqlite", "mdb"].includes(ext || ""))
      return <FileSearch size={18} className="text-blue-500" />;
    
    // Security files
    if (["key", "pem", "cert", "crt", "pgp", "gpg"].includes(ext || ""))
      return <FileKey size={18} className="text-yellow-500" />;
    
    // Encrypted files
    if (["enc", "encrypted", "vault"].includes(ext || ""))
      return <FileLock size={18} className="text-red-500" />;
    
    // Text files
    if (["txt", "md", "log", "text"].includes(ext || ""))
      return <TxtFile size={18} className="text-gray-400" />;
    
    // Theme files
    if (ext === "xtf.json")
      return <Palette size={18} className="text-pink-400" />;
    
    // Default file icon
    return <FileText size={18} className="text-gray-400" />;
  };

  return (
    <div
      className="p-2 space-y-1 w-full h-full"
      onContextMenu={(e) => onContextMenu(e, null)}
    >
      {nodes.map((node) => (
        <div
          key={node.name}
          className="flex items-center p-2 rounded hover:bg-[var(--primary)]/20 cursor-pointer space-x-3"
          onDoubleClick={() => onDoubleClick(node)}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          {getIcon(node)}
          <span className="text-sm">{node.name}</span>
        </div>
      ))}
    </div>
  );
};
