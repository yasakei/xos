// packages/frontend/src/components/taskbar/Taskbar.tsx
import React, { useState, useRef, useMemo, useCallback, memo } from "react";
import { LayoutGrid } from "lucide-react";
import { useUiStore } from "../../core/theme-engine/themeStore";
import { useWindowStore } from "../../store/windowStore";
import { getAppById } from "../../core/app-framework/appRegistry";
import { Clock } from "./Clock";
import { SystemTray } from "./SystemTray";
import { StartMenu } from "./StartMenu";
import { motion, AnimatePresence } from "framer-motion";

const iconVariants = {
  hover: { scale: 1.2, y: -4 },
  initial: { scale: 1, y: 0 },
  tap: { scale: 0.95 },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
};

const MotionComponent = memo(({
  children,
  as = "div",
  ...props
}: {
  children: React.ReactNode;
  as?: "div" | "button";
  [key: string]: any;
}) => {
  const { enableAnimations } = useUiStore();
  const Component = motion[as];

  return (
    <Component
      variants={enableAnimations ? iconVariants : undefined}
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </Component>
  );
});

MotionComponent.displayName = 'MotionComponent';

export const Taskbar = memo(() => {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const { windows, setWindowState, focusWindow } = useWindowStore();
  const { dockPosition, taskbarSize, enableAnimations } = useUiStore();
  const taskbarRef = useRef<HTMLDivElement>(null);

  // Memoized calculations for performance
  const isAnyWindowFullscreen = useMemo(
    () => windows.some((w) => w.state === "fullscreen"),
    [windows],
  );
  
  const openApps = useMemo(
    () =>
      windows
        .map((win) => ({ ...win, app: getAppById(win.appId) }))
        .filter((win) => win.app),
    [windows],
  );

  // Memoized callbacks
  const handleTaskbarIconClick = useCallback((
    windowId: string,
    state: "minimized" | "normal" | "fullscreen",
  ) => {
    if (state !== "minimized") {
      setWindowState(windowId, "minimized");
    } else {
      setWindowState(windowId, "normal");
      focusWindow(windowId);
    }
  }, [setWindowState, focusWindow]);

  const toggleStartMenu = useCallback(() => {
    setIsStartMenuOpen(prev => !prev);
  }, []);

  const closeStartMenu = useCallback(() => {
    setIsStartMenuOpen(false);
  }, []);

  // Size configurations
  const sizeConfig = useMemo(() => ({
    small: {
      height: "h-16",
      padding: "px-4 py-2",
      spacing: "space-x-2",
      buttonSize: "w-10 h-10",
      iconSize: 20,
      separatorHeight: "h-8",
      borderRadius: "rounded-2xl",
    },
    medium: {
      height: "h-20",
      padding: "px-6 py-3",
      spacing: "space-x-4",
      buttonSize: "w-14 h-14",
      iconSize: 26,
      separatorHeight: "h-12",
      borderRadius: "rounded-3xl",
    },
    large: {
      height: "h-24",
      padding: "px-8 py-4",
      spacing: "space-x-6",
      buttonSize: "w-16 h-16",
      iconSize: 32,
      separatorHeight: "h-16",
      borderRadius: "rounded-3xl",
    },
  }), []);

  const config = sizeConfig[taskbarSize];

  // Memoized position classes
  const positionClasses = useMemo(() => ({
    top: "top-0 justify-center",
    bottom: "bottom-0 justify-center",
  }), []);

  const dockAnimation = useMemo(() => enableAnimations
    ? {
        initial: { y: dockPosition === "bottom" ? 30 : -30, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { type: "spring", damping: 20, stiffness: 150 },
      }
    : {}, [enableAnimations, dockPosition]);

  // Performance optimization: limit number of taskbar icons
  const maxTaskbarIcons = 15;
  const displayedApps = openApps.slice(0, maxTaskbarIcons);
  
  if (isAnyWindowFullscreen) return null;

  return (
    <>
      <StartMenu
        isOpen={isStartMenuOpen}
        onClose={closeStartMenu}
        anchorElement={taskbarRef.current}
      />

      <div
        className={`absolute left-0 right-0 z-[99999] flex p-4 ${positionClasses[dockPosition]}`}
      >
        <motion.div
          ref={taskbarRef}
          layout
          {...dockAnimation}
          layoutRoot
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          className={`flex items-center ${config.height} ${config.padding} ${config.spacing} ${config.borderRadius} liquid-glass border border-white/20 shadow-2xl backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 transition-all duration-300`}
        >
          <MotionComponent
            as="button"
            onClick={toggleStartMenu}
            className={`${config.buttonSize} flex items-center justify-center ${config.borderRadius} transition-all duration-300 shadow-lg ${
              isStartMenuOpen
                ? "bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white shadow-[var(--primary)]/30"
                : "hover:bg-gradient-to-br hover:from-white/25 hover:to-white/15 hover:shadow-xl"
            }`}
            title="Start"
            aria-label="Start Menu"
          >
            <LayoutGrid size={config.iconSize} />
          </MotionComponent>

          <div className={`w-px ${config.separatorHeight} bg-gradient-to-b from-transparent via-white/30 to-transparent`} />

          <div className={`flex items-center ${config.spacing.replace('space-x-4', 'space-x-3')}`}>
            <AnimatePresence mode="popLayout">
              {displayedApps.map((win) => (
                <MotionComponent
                  key={win.id}
                  className="flex flex-col items-center"
                  layout
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1, transition: { type: "spring", damping: 15, stiffness: 200 } }}
                  exit={{ opacity: 0, scale: 0.5, transition: { type: "spring", duration: 0.3 } }}
                >
                  <button
                    onClick={() => handleTaskbarIconClick(win.id, win.state)}
                    className={`${config.buttonSize} flex items-center justify-center ${config.borderRadius} relative hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:shadow-lg group`}
                    title={win.title}
                    aria-label={`Window: ${win.title}`}
                  >
                    <win.app.Icon
                      size={config.iconSize + 8}
                      className="text-[color:var(--text-primary)] drop-shadow-lg group-hover:scale-110 transition-transform duration-200"
                    />
                    {win.state === "minimized" && (
                      <div className={`absolute inset-0 bg-black/20 ${config.borderRadius}`} />
                    )}
                  </button>
                  {(win.isFocused || win.state !== "minimized") && (
                    <motion.div
                      layoutId={`activeDot-${win.id}`}
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/70 shadow-lg shadow-[var(--primary)]/50 mt-1"
                    />
                  )}
                </MotionComponent>
              ))}
            </AnimatePresence>
          </div>

          {displayedApps.length > 0 && <div className={`w-px ${config.separatorHeight} bg-gradient-to-b from-transparent via-white/30 to-transparent`} />}

          <div className={`flex items-center ${config.spacing}`}>
            <MotionComponent className="hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 rounded-xl p-2 transition-all duration-300">
              <SystemTray size={taskbarSize} />
            </MotionComponent>
            <MotionComponent className="hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 rounded-xl p-2 transition-all duration-300">
              <Clock size={taskbarSize} />
            </MotionComponent>
          </div>
        </motion.div>
      </div>
    </>
  );
});

Taskbar.displayName = 'Taskbar';