// packages/frontend/src/components/windows/XWindow.tsx
import React, { useCallback, useRef, useState, useEffect, memo } from "react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "framer-motion";
import {
  X as CloseIcon,
  Minus,
  Maximize,
  Minimize as RestoreIcon,
} from "lucide-react";
import { type XWindow as XWindowType } from "../../types/system";
import { useWindowStore } from "../../store/windowStore";
import { useUiStore } from "../../core/theme-engine/themeStore";
import AppContainer from "../../core/app-framework/AppContainer";

interface XWindowProps {
  id: string;
}

const XWindow: React.FC<XWindowProps> = memo(({ id }) => {
  const {
    closeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    toggleMaximize,
    setWindowState,
    setDragState,
  } = useWindowStore();

  const window = useWindowStore(
    useCallback((state: any) => state.windows.find((w: any) => w.id === id), [id])
  );
  const surfaceStyle = useUiStore((state) => state.surfaceStyle);
  
  // Optimized state management
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  if (!window) {
    return null;
  }

  const isFullscreen = window.state === "fullscreen";
  const isMinimized = window.state === "minimized";

  const surfaceClass =
    surfaceStyle === "glass" ? "liquid-glass" : "solid-surface";

  // Optimized drag handlers with requestAnimationFrame
  const handleDragStart = useCallback((e: any) => {
    setIsDragging(true);
    setDragState(true, window.id, { x: window.position.x, y: window.position.y });
    focusWindow(window.id);
  }, [focusWindow, window.id, window.position, setDragState]);

  const handleDrag = useCallback((_e: any, d: { x: number; y: number }) => {
    if (!isDragging) return;
    
    // Cancel previous frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Batch updates with requestAnimationFrame for 60fps performance
    animationFrameRef.current = requestAnimationFrame(() => {
      const newX = Math.round(d.x);
      const newY = Math.round(Math.max(0, d.y));
      
      // Only update if position actually changed
      if (!lastUpdateRef.current || 
          lastUpdateRef.current.x !== newX || 
          lastUpdateRef.current.y !== newY) {
        updateWindowPosition(window.id, { x: newX, y: newY });
        lastUpdateRef.current = { 
          ...lastUpdateRef.current, 
          x: newX, 
          y: newY 
        };
      }
    });
  }, [isDragging, updateWindowPosition, window.id]);

  const handleDragStop = useCallback((_e: any, d: { x: number; y: number }) => {
    setIsDragging(false);
    setDragState(false);
    
    // Final position update
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const newX = Math.round(d.x);
    const newY = Math.round(Math.max(0, d.y));
    updateWindowPosition(window.id, { x: newX, y: newY });
  }, [updateWindowPosition, window.id, setDragState]);

  // Fixed resize handlers to prevent elastic behavior
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    focusWindow(window.id);
  }, [focusWindow, window.id]);

  const handleResize = useCallback(
    (_e: any, _direction: any, ref: HTMLElement, _delta: any, position: { x: number; y: number }) => {
      // Cancel previous frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Batch updates for smooth resizing
      animationFrameRef.current = requestAnimationFrame(() => {
        const newWidth = ref.offsetWidth;
        const newHeight = ref.offsetHeight;
        const newX = Math.round(position.x);
        const newY = Math.round(Math.max(0, position.y));
        
        // Only update if values actually changed
        if (!lastUpdateRef.current || 
            lastUpdateRef.current.width !== newWidth || 
            lastUpdateRef.current.height !== newHeight ||
            lastUpdateRef.current.x !== newX || 
            lastUpdateRef.current.y !== newY) {
          
          updateWindowSize(window.id, { width: newWidth, height: newHeight });
          updateWindowPosition(window.id, { x: newX, y: newY });
          
          lastUpdateRef.current = { x: newX, y: newY, width: newWidth, height: newHeight };
        }
      });
    },
    [updateWindowSize, updateWindowPosition, window.id]
  );

  const handleResizeStop = useCallback(
    (_e: any, _direction: any, ref: HTMLElement, _delta: any, position: { x: number; y: number }) => {
      setIsResizing(false);
      
      // Final update
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      updateWindowSize(window.id, {
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
      updateWindowPosition(window.id, { 
        x: Math.round(position.x), 
        y: Math.round(Math.max(0, position.y)) 
      });
    },
    [updateWindowSize, updateWindowPosition, window.id]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Memoized title bar handlers
  const handleMinimize = useCallback(() => {
    setWindowState(window.id, "minimized");
  }, [setWindowState, window.id]);

  const handleToggleMaximize = useCallback(() => {
    toggleMaximize(window.id);
  }, [toggleMaximize, window.id]);

  const handleClose = useCallback(() => {
    closeWindow(window.id);
  }, [closeWindow, window.id]);

  const handleTitleBarDoubleClick = useCallback(() => {
    toggleMaximize(window.id);
  }, [toggleMaximize, window.id]);

  // Performance optimization: only render content when window is visible
  const shouldRenderContent = !isMinimized && window.state !== "hidden";

  return (
    <AnimatePresence>
      {!isMinimized && (
        <Rnd
          size={
            isFullscreen ? { width: "100vw", height: "100vh" } : window.size
          }
          position={isFullscreen ? { x: 0, y: 0 } : window.position}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragStop={handleDragStop}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          minWidth={300}
          minHeight={200}
          maxWidth={window.innerWidth}
          maxHeight={window.innerHeight}
          dragHandleClassName="title-bar"
          disableDragging={isFullscreen}
          enableResizing={!isFullscreen}
          // FIXED: Prevent elastic behavior
          resizeHandleStyles={{
            bottom: { cursor: 'ns-resize' },
            right: { cursor: 'ew-resize' },
            bottomRight: { cursor: 'nwse-resize' },
            bottomLeft: { cursor: 'nesw-resize' },
            top: { cursor: 'ns-resize' },
            left: { cursor: 'ew-resize' },
            topRight: { cursor: 'nesw-resize' },
            topLeft: { cursor: 'nwse-resize' },
          }}
          style={{ 
            zIndex: window.zIndex,
            // Performance optimizations
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            willChange: isDragging || isResizing ? 'transform' : 'auto',
            // FIXED: Prevent elastic behavior
            transition: isDragging || isResizing ? 'none' : 'all 0.1s ease-out',
          }}
          className={`flex flex-col overflow-hidden ${surfaceClass} ${
            isFullscreen ? "rounded-none" : "rounded-lg"
          } ${window.isFocused ? "ring-2 ring-blue-500" : "ring-1 ring-black/20"} ${
            isDragging ? "cursor-grabbing" : ""
          }`}
          // FIXED: Performance and behavior optimizations
          dragGrid={[1, 1]}
          resizeGrid={[1, 1]}
          bounds="parent"
          // CRITICAL: Disable elastic behavior
          default={{
            x: window.position.x,
            y: window.position.y,
            width: window.size.width,
            height: window.size.height,
          }}
        >
          <motion.div
            className="w-full h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div
              className="title-bar h-8 px-2 flex items-center justify-between flex-shrink-0 cursor-move"
              onDoubleClick={handleTitleBarDoubleClick}
            >
              <span className="font-bold text-sm text-[color:var(--text-primary)] select-none">
                {window.title}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMinimize}
                  className="w-5 h-5 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-black/60 transition-colors duration-150"
                  aria-label="Minimize"
                >
                  <Minus size={12} />
                </button>
                <button
                  onClick={handleToggleMaximize}
                  className="w-5 h-5 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-black/60 transition-colors duration-150"
                  aria-label={isFullscreen ? "Restore" : "Maximize"}
                >
                  {isFullscreen ? (
                    <RestoreIcon size={10} />
                  ) : (
                    <Maximize size={10} />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-black/60 transition-colors duration-150"
                  aria-label="Close"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            </div>
            <div className="flex-grow bg-transparent overflow-auto rounded-b-lg">
              {/* Only render content when window is visible for performance */}
              {shouldRenderContent && <AppContainer appId={window.appId} props={window.props} />}
            </div>
          </motion.div>
        </Rnd>
      )}
    </AnimatePresence>
  );
});

XWindow.displayName = 'XWindow';

export default XWindow;