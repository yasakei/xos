// packages/frontend/src/types/system.ts

export type WindowState = 'normal' | 'minimized' | 'fullscreen';

export interface XWindow {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: WindowState;
  zIndex: number;
  isFocused: boolean;
  // FIX: Add a dedicated props object for app-specific data
  props: Record<string, unknown>; 
  
  lastState?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface AppSettings {
  ui: {
    theme: string;
    dockPosition: string;
    taskbarSize?: string;
    enableAnimations?: boolean;
    reduceTransparency?: boolean;
  };
  fileManager: {
    viewType: string;
    favorites: string[];
  };
}

// --- File System Types (unchanged) ---
export type FSNodeType = 'file' | 'directory';

export interface FSNode {
  id: string;
  name: string;
  type: FSNodeType;
  children?: FSNode[];
  content?: string;
  path: string;
}