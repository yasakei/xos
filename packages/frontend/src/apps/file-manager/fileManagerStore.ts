// packages/frontend/src/apps/file-manager/fileManagerStore.ts
import { create } from 'zustand';
import { settingsApi } from '../../core/api/settingsApi';

type ViewType = 'grid' | 'list';



interface FileManagerState {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  viewType: ViewType;
  setViewType: (view: ViewType) => void;
  favorites: string[];
  toggleFavorite: (path: string) => void;
  initializeFileManager: (settings: { viewType: ViewType, favorites: string[] }) => void;
}

export const useFileManagerStore = create<FileManagerState>((set, get) => ({
  currentPath: '/',
  viewType: 'grid',
  favorites: ['/Downloads'],
  initializeFileManager: (settings) => {
    // Use setTimeout to prevent update loops during initialization
    // Only update if values have actually changed to prevent loops
    const currentState = get();
    console.log("[FileManagerStore] initializeFileManager called with settings:", settings);
    console.log("[FileManagerStore] Current state:", currentState);
    
    if (currentState.viewType !== settings.viewType || 
        JSON.stringify(currentState.favorites) !== JSON.stringify(settings.favorites)) {
      console.log("[FileManagerStore] State has changed, updating");
      setTimeout(() => {
        set({ viewType: settings.viewType, favorites: settings.favorites });
      }, 0);
    } else {
      console.log("[FileManagerStore] State unchanged, skipping update");
    }
  },
  setCurrentPath: (path) => set({ currentPath: path }),
  setViewType: (view) => {
    set({ viewType: view });
    settingsApi.updateSettings({ fileManager: { viewType: view } });
  },
  toggleFavorite: (path) => {
    const isFavorite = get().favorites.includes(path);
    const newFavorites = isFavorite
      ? get().favorites.filter(p => p !== path)
      : [...get().favorites, path];
    set({ favorites: newFavorites });
    settingsApi.updateSettings({ fileManager: { favorites: newFavorites } });
  },
}));