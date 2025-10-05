// packages/frontend/src/store/windowStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type XWindow, type WindowState } from '../types/system';

interface WindowStoreState {
  windows: XWindow[];
  nextZIndex: number;
  dragState: {
    isDragging: boolean;
    windowId: string | null;
    startPosition: { x: number; y: number } | null;
  };
  
  // Performance tracking
  performanceMode: 'high' | 'balanced' | 'low';
  maxWindows: number;
  
  // Window management
  openWindow: (appId: string, title: string, props?: Record<string, unknown>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  
  // Optimized position and size updates with batching
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  batchUpdateWindow: (id: string, updates: Partial<Pick<XWindow, 'position' | 'size' | 'state'>>) => void;
  
  // Window state management
  setWindowState: (id: string, state: WindowState) => void;
  toggleMaximize: (id: string) => void;
  
  // Drag state management
  setDragState: (isDragging: boolean, windowId?: string, startPosition?: { x: number; y: number }) => void;
  
  // Performance optimization methods
  setPerformanceMode: (mode: 'high' | 'balanced' | 'low') => void;
  optimizeWindows: () => void;
  
  // Utility functions
  getWindow: (id: string) => XWindow | undefined;
  getFocusedWindow: () => XWindow | undefined;
  getWindowsByZIndex: () => XWindow[];
}

let windowIdCounter = 0;
let updateQueue: Array<() => void> = [];
let isUpdating = false;

// Batched update system for better performance
const batchUpdates = (updateFn: () => void) => {
  updateQueue.push(updateFn);
  
  if (!isUpdating) {
    isUpdating = true;
    requestAnimationFrame(() => {
      const updates = [...updateQueue];
      updateQueue = [];
      isUpdating = false;
      
      updates.forEach(update => update());
    });
  }
};

export const useWindowStore = create<WindowStoreState>()(
  subscribeWithSelector((set, get) => ({
    windows: [],
    nextZIndex: 100,
    performanceMode: 'balanced',
    maxWindows: 20, // Prevent memory issues
    dragState: {
      isDragging: false,
      windowId: null,
      startPosition: null,
    },

    openWindow: (appId, title, props = {}) => {
      // Performance check - limit max windows
      const currentWindows = get().windows.length;
      if (currentWindows >= get().maxWindows) {
        console.warn('Maximum window limit reached. Closing oldest window.');
        const oldestWindow = get().windows.reduce((oldest, current) =>
          oldest.zIndex < current.zIndex ? oldest : current
        );
        get().closeWindow(oldestWindow.id);
      }

      // Prevent opening multiple instances of apps that don't need it
      const isSingleInstance = ['settings', 'studio'].includes(appId);
      if (isSingleInstance) {
          const existingWindow = get().windows.find(w => w.appId === appId);
          if (existingWindow) {
            get().focusWindow(existingWindow.id);
            if (existingWindow.state === 'minimized') {
              get().setWindowState(existingWindow.id, 'normal');
            }
            return;
          }
      }

      const defaultSize = { width: 720, height: 500 };
      const x = window.innerWidth / 2 - defaultSize.width / 2 + (Math.random() - 0.5) * 80;
      const y = window.innerHeight / 2 - defaultSize.height / 2 - 40;

      const newWindow: XWindow = {
        id: `window-${windowIdCounter++}`,
        appId,
        title,
        position: { x: Math.round(x), y: Math.round(y) },
        size: defaultSize,
        state: 'normal',
        zIndex: get().nextZIndex,
        isFocused: true,
        props,
      };

      batchUpdates(() => {
        set((state) => ({
          windows: [
            ...state.windows.map(w => ({ ...w, isFocused: false })),
            newWindow
          ],
          nextZIndex: state.nextZIndex + 1,
        }));
      });
    },

    closeWindow: (id) => {
      batchUpdates(() => {
        set((state) => {
          const filteredWindows = state.windows.filter((w) => w.id !== id);
          
          // Focus the topmost remaining window
          if (filteredWindows.length > 0) {
            const topWindow = filteredWindows.reduce((prev, current) =>
              prev.zIndex > current.zIndex ? prev : current
            );
            return {
              windows: filteredWindows.map((w) => ({
                ...w,
                isFocused: w.id === topWindow.id,
              })),
            };
          }
          
          return { windows: [] };
        });
      });
    },
    
    focusWindow: (id) => {
      const win = get().windows.find(w => w.id === id);
      if (win && win.state === 'minimized') return;
      if (win && win.isFocused) return; // Already focused, no update needed

      batchUpdates(() => {
        set((state) => ({
          windows: state.windows.map((w) => ({
            ...w,
            isFocused: w.id === id,
            zIndex: w.id === id ? state.nextZIndex : w.zIndex,
          })),
          nextZIndex: state.nextZIndex + 1,
        }));
      });
    },

    // Ultra-optimized position update with micro-optimization and batching
    updateWindowPosition: (id, position) => {
      const state = get();
      const windowIndex = state.windows.findIndex((w) => w.id === id);
      if (windowIndex === -1) return;
      
      const window = state.windows[windowIndex];
      // Round positions to prevent micro-movements and improve performance
      const roundedX = Math.round(position.x);
      const roundedY = Math.round(Math.max(0, position.y));
      
      // Skip update if position hasn't changed significantly
      if (Math.abs(window.position.x - roundedX) < 1 && Math.abs(window.position.y - roundedY) < 1) {
        return;
      }

      // Only update if performance mode allows frequent updates
      const performanceMode = state.performanceMode;
      if (performanceMode === 'low') {
        // Throttle updates in low performance mode
        batchUpdates(() => {
          set((state) => {
            const newWindows = [...state.windows];
            const windowIndex = newWindows.findIndex((w) => w.id === id);
            if (windowIndex !== -1) {
              newWindows[windowIndex] = {
                ...newWindows[windowIndex],
                position: { x: roundedX, y: roundedY },
              };
            }
            return { windows: newWindows };
          });
        });
      } else {
        // Direct update for high performance mode
        set((state) => {
          const newWindows = [...state.windows];
          const windowIndex = newWindows.findIndex((w) => w.id === id);
          if (windowIndex !== -1) {
            newWindows[windowIndex] = {
              ...newWindows[windowIndex],
              position: { x: roundedX, y: roundedY },
            };
          }
          return { windows: newWindows };
        });
      }
    },

    // Optimized size update with minimal re-renders
    updateWindowSize: (id, size) => {
      batchUpdates(() => {
        set((state) => {
          const windowIndex = state.windows.findIndex((w) => w.id === id);
          if (windowIndex === -1) return state;
          
          const window = state.windows[windowIndex];
          // Skip update if size hasn't changed significantly
          if (Math.abs(window.size.width - size.width) < 1 && Math.abs(window.size.height - size.height) < 1) {
            return state;
          }

          const newWindows = [...state.windows];
          newWindows[windowIndex] = {
            ...window,
            size: { ...size },
          };

          return { windows: newWindows };
        });
      });
    },

    // Batch multiple updates for better performance
    batchUpdateWindow: (id, updates) => {
      batchUpdates(() => {
        set((state) => {
          const windowIndex = state.windows.findIndex((w) => w.id === id);
          if (windowIndex === -1) return state;

          const newWindows = [...state.windows];
          newWindows[windowIndex] = {
            ...newWindows[windowIndex],
            ...updates,
          };

          return { windows: newWindows };
        });
      });
    },

    setWindowState: (id, newState) => {
      get().focusWindow(id);
      batchUpdates(() => {
        set(state => ({
            windows: state.windows.map(w => w.id === id ? { ...w, state: newState } : w)
        }));
      });
    },

    toggleMaximize: (id) => {
      get().focusWindow(id);
      const win = get().windows.find(w => w.id === id);
      if (!win) return;
      
      batchUpdates(() => {
        if (win.state === 'fullscreen') {
          set(state => ({
            windows: state.windows.map(w => w.id === id ? {
              ...w,
              state: 'normal',
              position: w.lastState?.position ?? { x: 50, y: 50 },
              size: w.lastState?.size ?? { width: 640, height: 480 },
            } : w)
          }));
        } else {
          set(state => ({
            windows: state.windows.map(w => w.id === id ? {
              ...w,
              state: 'fullscreen',
              lastState: { position: w.position, size: w.size }, 
            } : w)
          }));
        }
      });
    },

    // Drag state management for performance optimization
    setDragState: (isDragging, windowId, startPosition) => {
      set((state) => ({
        dragState: {
          isDragging,
          windowId: windowId || null,
          startPosition: startPosition || null,
        },
      }));
    },

    // Performance optimization methods
    setPerformanceMode: (mode) => {
      set({ performanceMode: mode });
      
      // Adjust max windows based on performance mode
      const maxWindows = mode === 'high' ? 30 : mode === 'balanced' ? 20 : 10;
      set({ maxWindows });
    },

    optimizeWindows: () => {
      const state = get();
      
      // Close minimized windows if too many are open
      if (state.windows.length > state.maxWindows) {
        const minimizedWindows = state.windows.filter(w => w.state === 'minimized');
        minimizedWindows.slice(0, state.windows.length - state.maxWindows).forEach(w => {
          get().closeWindow(w.id);
        });
      }
    },

    // Utility functions
    getWindow: (id) => {
      return get().windows.find((w) => w.id === id);
    },

    getFocusedWindow: () => {
      return get().windows.find((w) => w.isFocused);
    },

    getWindowsByZIndex: () => {
      return [...get().windows].sort((a, b) => a.zIndex - b.zIndex);
    },
  }))
);