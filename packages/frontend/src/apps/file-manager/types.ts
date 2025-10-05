// packages/frontend/src/apps/file-manager/types.ts

// This interface now lives in its own file to prevent circular dependencies.
export interface VFSNode {
  name: string;
  kind: "file" | "directory";
  content?: string;
  children?: VFSNode[];
}

// NEW: Add a shared props interface for view components
export interface FileViewProps {
  path: string;
  nodes: VFSNode[];
  onNavigate: (path: string) => void;
  onDoubleClick: (node: VFSNode) => void;
  onContextMenu: (event: React.MouseEvent, node: VFSNode | null) => void;
}
