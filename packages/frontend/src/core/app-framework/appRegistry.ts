// packages/frontend/src/core/app-framework/appRegistry.ts
import React, { lazy, ComponentType } from "react";
import {
  Folder,
  Settings,
  FileText,
  FileType,
  Terminal,
  Code,
  Sigma,
  Code2,
  Edit3,
  BookOpen,
  Image,
  Music,
} from "lucide-react";

export interface XOSApp {
  id: string;
  name: string;
  Icon: React.ElementType;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  priority: 'high' | 'medium' | 'low';
  category: 'system' | 'productivity' | 'development' | 'media';
  preload?: boolean;
}

const createLazyComponent = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(importFn);
};

export const APPS: XOSApp[] = [
  {
    id: "file-manager",
    name: "File Manager",
    Icon: Folder,
    component: createLazyComponent(() => import("../../apps/file-manager/FileManagerApp")),
    priority: 'high',
    category: 'system',
    preload: true,
  },
  {
    id: "XImage",
    name: "XImage",
    Icon: Image,
    component: createLazyComponent(() => import("../../apps/XImage/XImageApp")),
    priority: 'medium',
    category: 'media',
  },
  {
    id: "XAudio",
    name: "XAudio",
    Icon: FileType,
    component: createLazyComponent(() => import("../../apps/XAudio/XAudioApp")),
    priority: 'medium',
    category: 'media',
  },
  {
    id: "settings",
    name: "Settings",
    Icon: Settings,
    component: createLazyComponent(() => import("../../apps/settings/SettingsApp")),
    priority: 'high',
    category: 'system',
    preload: true,
  },
  {
    id: "text-editor",
    name: "Xnote",
    Icon: BookOpen,
    component: createLazyComponent(() => import("../../apps/xnote/XnoteApp")),
    priority: 'medium',
    category: 'productivity',
  },
  {
    id: "xedit",
    name: "XEdit",
    Icon: Edit3,
    component: createLazyComponent(() => import("../../apps/xedit/XEditApp")),
    priority: 'medium',
    category: 'productivity',
  },
  {
    id: "pdf-viewer",
    name: "PDF Viewer",
    Icon: FileType,
    component: createLazyComponent(() => import("../../apps/pdf-viewer/XPDF")),
    priority: 'low',
    category: 'media',
  },
  {
    id: "x-shell",
    name: "XShell",
    Icon: Terminal,
    component: createLazyComponent(() => import("../../apps/xshell/XShell")),
    priority: 'medium',
    category: 'development',
  },
  {
    id: "xta-creator",
    name: "XTA Creator",
    Icon: Code,
    component: createLazyComponent(() => import("../../apps/xta-creator/XTACreatorApp")),
    priority: 'low',
    category: 'development',
  },
  {
    id: "calculator",
    name: "Calculator",
    Icon: Sigma,
    component: createLazyComponent(() => import("../../apps/calculator/CalculatorApp")),
    priority: 'medium',
    category: 'productivity',
  },
  {
    id: "developer-settings",
    name: "Developer Settings",
    Icon: Code2,
    component: createLazyComponent(() => import("../../apps/developer-settings/DeveloperSettingsApp")),
    priority: 'low',
    category: 'development',
  },
];

export const getAppById = (id: string) => APPS.find((app) => app.id === id);

export const getAppsByCategory = (category: XOSApp['category']) => 
  APPS.filter((app) => app.category === category);

export const getHighPriorityApps = () => 
  APPS.filter((app) => app.priority === 'high' || app.preload);

// A simple preloading strategy for high-priority apps
export const preloadApps = () => {
  const highPriorityApps = getHighPriorityApps();
  highPriorityApps.forEach(app => {
    try {
      // Trigger the lazy load by accessing the component
      const Comp = app.component;
      // Most React.lazy components will start loading when accessed
      // We don't need to do anything special here
    } catch (err) {
      console.warn(`Failed to preload ${app.name}`, err);
    }
  });
};

export const FILE_ASSOCIATIONS: Record<string, string> = {
  // Images
  'png': 'XImage',
  'jpg': 'XImage',
  'jpeg': 'XImage',
  'gif': 'XImage',
  'webp': 'XImage',
  'bmp': 'XImage',
  'svg': 'XImage',

  // Audio
  'mp3': 'XAudio',
  'wav': 'XAudio',
  'ogg': 'XAudio',
  'flac': 'XAudio',
  'm4a': 'XAudio',
  'aac': 'XAudio',

  // Text
  'txt': 'text-editor',
  'md': 'text-editor',
  'log': 'text-editor',

  // Code
  'js': 'xedit',
  'jsx': 'xedit',
  'ts': 'xedit',
  'tsx': 'xedit',
  'json': 'xedit',
  'css': 'xedit',
  'html': 'xedit',
  'py': 'xedit',
  'sh': 'xedit',
  'xta': 'xta-creator',

  // Documents
  'pdf': 'pdf-viewer',
};

export const getAppForFile = (filename: string): string | undefined => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? FILE_ASSOCIATIONS[extension] : undefined;
};