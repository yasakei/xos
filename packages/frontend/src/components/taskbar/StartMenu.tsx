// packages/frontend/src/components/taskbar/StartMenu.tsx
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Power, LogOut } from "lucide-react";
import { APPS } from "../../core/app-framework/appRegistry";
import { useWindowStore } from "../../store/windowStore";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../core/theme-engine/themeStore";

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLDivElement | null;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  onClose,
  anchorElement,
}) => {
  const { openWindow } = useWindowStore();
  const { userData, lock } = useAuthStore();
  const { dockPosition, surfaceStyle } = useUiStore();
  const [searchTerm, setSearchTerm] = useState("");

  const handleAppClick = (appId: string, appName: string) => {
    openWindow(appId, appName);
    onClose();
  };

  const filteredApps = useMemo(() => {
    const sortedApps = [...APPS].sort((a, b) => a.name.localeCompare(b.name));
    if (!searchTerm) {
      return sortedApps;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sortedApps.filter((app) =>
      app.name.toLowerCase().includes(lowercasedTerm),
    );
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSearchTerm(""), 300);
    }
  }, [isOpen]);

  const surfaceClass =
    surfaceStyle === "glass" ? "liquid-glass" : "solid-surface";

  // FIX: New, robust positioning logic for all 4 dock positions
  const getMenuPosition = () => {
    if (!anchorElement) return {};
    const rect = anchorElement.getBoundingClientRect();
    const margin = 8;
    const menuWidth = 340;

    switch (dockPosition) {
      case "top": {
        const centerPoint = rect.left + rect.width / 2;
        return {
          top: `${rect.bottom + margin}px`,
          left: `${centerPoint - menuWidth / 2}px`,
        };
      }
      case "left":
        return { top: `${rect.top}px`, left: `${rect.right + margin}px` };
      case "right":
        return {
          top: `${rect.top}px`,
          right: `${window.innerWidth - rect.left + margin}px`,
        };
      case "bottom":
      default: {
        const centerPoint = rect.left + rect.width / 2;
        return {
          bottom: `${window.innerHeight - rect.top + margin}px`,
          left: `${centerPoint - menuWidth / 2}px`,
        };
      }
    }
  };

  const transformOrigin = {
    top: "top center",
    bottom: "bottom center",
    left: "top left",
    right: "top right",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            style={{
              ...getMenuPosition(),
              transformOrigin: transformOrigin[dockPosition],
            }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`fixed w-[360px] h-[480px] flex flex-col p-4 rounded-2xl shadow-2xl ${surfaceClass} border border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 z-[9999]`}
          >
            {/* Search Bar */}
            <div className="w-full relative mb-4 flex-shrink-0">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]"
                size={18}
              />
              <input
                type="text"
                placeholder="Type here to search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/20 text-sm text-[color:var(--text-primary)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)] border border-white/10 focus:border-[var(--primary)]/50 transition-all duration-200"
                autoFocus
              />
            </div>

            {/* Apps List */}
            <div className="flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-1">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => handleAppClick(app.id, app.name)}
                    className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 cursor-pointer transition-all duration-200 group border border-transparent hover:border-white/10"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 group-hover:from-[var(--primary)]/30 group-hover:to-[var(--primary)]/20 transition-all duration-200">
                      <app.Icon
                        size={20}
                        className="text-[color:var(--primary)] group-hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <span className="text-sm text-[color:var(--text-primary)] font-medium">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
              {filteredApps.length === 0 && (
                <p className="text-center text-sm text-[color:var(--text-secondary)] mt-12 opacity-60">
                  No results for "{searchTerm}"
                </p>
              )}
            </div>

            {/* Bottom User/Power Bar */}
            <div
              className={`flex-shrink-0 mt-4 pt-4 border-t border-white/20 flex items-center justify-between`}
            >
              <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 transition-all duration-200 group">
                {userData?.pfp ? (
                  <img
                    src={userData.pfp}
                    alt="pfp"
                    className="w-8 h-8 rounded-full ring-2 ring-[var(--primary)]/30 group-hover:ring-[var(--primary)]/50 transition-all duration-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                    {userData?.username.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-sm text-[color:var(--text-primary)]">
                  {userData?.username}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={lock}
                  className="p-3 rounded-xl hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 transition-all duration-200 group"
                  title="Lock Screen & Logout"
                >
                  <LogOut size={18} className="text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)] transition-colors duration-200" />
                </button>
                <button
                  className="p-3 rounded-xl hover:bg-gradient-to-br hover:from-red-500/20 hover:to-red-500/10 transition-all duration-200 group"
                  title="Power Off"
                >
                  <Power size={18} className="text-[color:var(--text-secondary)] group-hover:text-red-400 transition-colors duration-200" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
