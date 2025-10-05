// packages/frontend/src/apps/settings/SettingsApp.tsx
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  User,
  Palette,
  AlignHorizontalJustifyCenter,
  Cpu,
  Plus,
  LoaderCircle,
  Trash2,
  MoveDown,
  Sun,
  Moon,
  Waves,
  Sunrise,
  MoveUp,
  Paintbrush,
  Minus,
  Square,
  Maximize,
  ArrowLeftToLine,
  ArrowRightToLine,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  useUiStore,
  BUILTIN_THEME_CONFIG,
  type BuiltInTheme,
  type DockPosition,
  type TaskbarSize,
  type XTF,
} from "../../core/theme-engine/themeStore";
import { vfsApi } from "../file-manager/api";

const defaultWallpapers = [
  { name: "Default", path: "/api/vfs/static/wallpapers/default.png" },
  { name: "Celebi", path: "/api/vfs/static/wallpapers/celebi.png" },
  { name: "Buneary", path: "/api/vfs/static/wallpapers/buneary.jpg" },
];

// --- PANELS ---

const AccountPanel = () => {
  const { userData } = useAuthStore();
  if (!userData)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Account</h2>
      <div className="p-4 bg-black/10 rounded-lg flex items-center space-x-4">
        {userData.pfp ? (
          <img
            src={userData.pfp}
            alt="pfp"
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-2xl">
            {userData.username.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-bold text-lg">{userData.username}</h3>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Standard User
          </p>
        </div>
      </div>
    </div>
  );
};

const themeIcons: Record<BuiltInTheme, React.ElementType> = {
  light: Sun,
  dark: Moon,
  ocean: Waves,
  sunset: Sunrise,
  graphite: Palette,
};

const AppearancePanel = () => {
  const {
    themeId,
    customThemes,
    reduceTransparency,
    updateUi,
    loadCustomThemes,
  } = useUiStore();
  const { userData, updateProfile } = useAuthStore();
  const [customWallpaperSrcs, setCustomWallpaperSrcs] = useState<
    { path: string; src: string }[]
  >([]);
  const [status, setStatus] = useState({ message: "", isLoading: false });

  useEffect(() => {
    loadCustomThemes();
  }, [loadCustomThemes]);

  const loadCustomWallpapers = useCallback(async () => {
    if (!userData?.customWallpapers?.length) {
      setCustomWallpaperSrcs([]);
      return;
    }

    const sources = await Promise.all(
      (userData.customWallpapers || []).map(async (path) => {
        try {
          const res = await fetch(
            `/api/vfs/read?path=${encodeURIComponent(path)}`,
          );
          if (!res.ok) throw new Error("Failed to fetch wallpaper");
          const blob = await res.blob();
          const reader = new FileReader();
          return new Promise<{ path: string; src: string }>((resolve) => {
            reader.onloadend = () =>
              resolve({ path, src: reader.result as string });
            reader.readAsDataURL(blob);
          });
        } catch {
          return { path, src: "" };
        }
      }),
    );
    setCustomWallpaperSrcs(sources.filter((s) => s.src));
    setStatus({ message: "", isLoading: false });
  }, [userData?.customWallpapers]);

  useEffect(() => {
    loadCustomWallpapers();
  }, [loadCustomWallpapers]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setStatus({ message: "Uploading...", isLoading: true });
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const filename = `wallpaper-${Date.now()}.${file.name.split(".").pop()}`;
        const vfsPath = `/.wallpapers/${filename}`;
        try {
          const { path: uploadedPath } = await vfsApi.uploadFile(
            vfsPath,
            base64,
          );
          const currentCustom = userData?.customWallpapers || [];
          const updatedCustom = [...currentCustom, uploadedPath];
          await updateProfile({
            customWallpapers: updatedCustom,
            wallpaper: base64,
          });
          setStatus({ message: "", isLoading: false });
        } catch (e: unknown) {
          setStatus({
            message: `Upload failed: ${e instanceof Error ? e.message : "An unknown error occurred."}`,
            isLoading: false,
          });
        }
      };
      reader.readAsDataURL(file);
    },
    [userData, updateProfile],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: { "image/*": [] },
  });

  const handleRemoveWallpaper = async (
    e: React.MouseEvent,
    wallpaperPath: string,
  ) => {
    e.stopPropagation();
    if (!userData) return;
    const newCustomWallpapers = userData.customWallpapers?.filter(
      (p) => p !== wallpaperPath,
    );
    const newWallpaper = defaultWallpapers[0].path;
    await updateProfile({
      customWallpapers: newCustomWallpapers,
      wallpaper: newWallpaper,
      wallpaperToRemove: wallpaperPath,
    });
  };

  const handleRemoveTheme = async (
    e: React.MouseEvent,
    themeIdToRemove: string,
  ) => {
    e.stopPropagation();
    if (!userData) return;
    const newCustomThemes = userData.customThemes?.filter(
      (id) => id !== themeIdToRemove,
    );
    await updateProfile({
      customThemes: newCustomThemes,
      themeToRemove: themeIdToRemove,
    });
  };

  const allWallpapers = [
    ...defaultWallpapers,
    ...customWallpaperSrcs.map((w) => ({
      ...w,
      name: "Custom",
      isCustom: true,
    })),
  ];

  if (!userData)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );

  return (
    <div
      {...getRootProps()}
      className="animate-fade-in focus:outline-none space-y-8"
    >
      <input {...getInputProps()} />
      <h2 className="text-2xl font-bold">Appearance</h2>
      <section>
        <h3 className="font-semibold mb-3 text-lg">Theme</h3>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4">
          Change the look and feel of the entire OS.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(BUILTIN_THEME_CONFIG).map(
            ([id, config]: [string, { name: string }]) => {
              const Icon = themeIcons[id as BuiltInTheme] || Palette;
              return (
                <button
                  key={id}
                  onClick={() => updateUi({ themeId: id })}
                  className={`p-4 rounded-lg border-2 ${themeId === id ? "border-[var(--primary)]" : "border-transparent"} bg-black/10 hover:border-[var(--primary)]/50 text-center flex flex-col items-center justify-center gap-2`}
                >
                  <Icon
                    size={20}
                    className={
                      id === "light"
                        ? "text-yellow-500"
                        : id === "dark"
                          ? "text-slate-300"
                          : `text-[var(--primary)]`
                    }
                  />
                  <span>{config.name}</span>
                </button>
              );
            },
          )}
          {customThemes.map((theme: XTF) => (
            <div key={theme.id} className="cursor-pointer group relative">
              <button
                onClick={() => updateUi({ themeId: theme.id })}
                className={`p-4 rounded-lg border-2 ${themeId === theme.id ? "border-[var(--primary)]" : "border-transparent"} bg-black/10 hover:border-[var(--primary)]/50 text-center flex flex-col items-center justify-center gap-2 w-full h-full`}
              >
                <Paintbrush
                  size={20}
                  style={{ color: theme.colors["--primary"] }}
                />
                <span>{theme.name}</span>
              </button>
              <button
                onClick={(e) => handleRemoveTheme(e, theme.id)}
                className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="font-semibold mb-3 text-lg">Transparency</h3>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4">
          Control transparency effects throughout the interface.
        </p>
        <div className="p-4 bg-black/10 rounded-lg flex justify-between items-center">
          <span>Reduce transparency</span>
          <button
            onClick={() => updateUi({ reduceTransparency: !reduceTransparency })}
            className={`w-14 h-8 rounded-full flex items-center transition-colors ${
              reduceTransparency ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <span
              className={`inline-block w-6 h-6 bg-white rounded-full transform transition-transform ${
                reduceTransparency ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>
      <section>
        <h3 className="font-semibold mb-3 text-lg">Wallpaper</h3>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4">
          Select a background for your desktop.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {allWallpapers.map(
            (
              wallpaper: {
                path: string;
                src?: string;
                name: string;
                isCustom?: boolean;
              },
              index,
            ) => (
              <div
                key={wallpaper.path || index}
                onClick={() =>
                  updateProfile({ wallpaper: wallpaper.src || wallpaper.path })
                }
                className="cursor-pointer group relative"
              >
                <img
                  src={wallpaper.src || wallpaper.path}
                  alt={wallpaper.name}
                  className={`w-full h-24 object-cover rounded-lg border-4 transition-all ${userData.wallpaper === (wallpaper.src || wallpaper.path) ? "border-[var(--primary)]" : "border-transparent group-hover:border-[var(--primary)]/50"}`}
                />
                {wallpaper.isCustom && (
                  <button
                    onClick={(e) => handleRemoveWallpaper(e, wallpaper.path)}
                    className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                )}
              </div>
            ),
          )}
          <div
            onClick={status.isLoading ? undefined : open}
            className="cursor-pointer group w-full h-24 rounded-lg border-2 border-dashed border-gray-500 hover:border-[var(--primary)] flex flex-col items-center justify-center"
          >
            {status.isLoading ? (
              <LoaderCircle size={24} className="animate-spin" />
            ) : (
              <Plus size={24} />
            )}
            <span className="text-xs mt-1">
              {status.isLoading ? "Uploading" : "Add"}
            </span>
          </div>
        </div>
      </section>
      <section>
        <h3 className="font-semibold mb-3 text-lg">Lock Screen</h3>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4">
          Customize your lock screen appearance.
        </p>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Wallpaper</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {allWallpapers.map(
                (
                  wallpaper: {
                    path: string;
                    src?: string;
                    name: string;
                    isCustom?: boolean;
                  },
                  index,
                ) => (
                  <div
                    key={wallpaper.path || index}
                    onClick={() =>
                      updateProfile({
                        lockScreenWallpaper: wallpaper.src || wallpaper.path,
                      })
                    }
                    className="cursor-pointer group relative"
                  >
                    <img
                      src={wallpaper.src || wallpaper.path}
                      alt={wallpaper.name}
                      className={`w-full h-24 object-cover rounded-lg border-4 transition-all ${userData.lockScreenWallpaper === (wallpaper.src || wallpaper.path) ? "border-[var(--primary)]" : "border-transparent group-hover:border-[var(--primary)]/50"}`}
                    />
                    {wallpaper.isCustom && (
                      <button
                        onClick={(e) =>
                          handleRemoveWallpaper(e, wallpaper.path)
                        }
                        className="absolute top-1 right-1 p-1 bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                ),
              )}
              <div
                onClick={status.isLoading ? undefined : open}
                className="cursor-pointer group w-full h-24 rounded-lg border-2 border-dashed border-gray-500 hover:border-[var(--primary)] flex flex-col items-center justify-center"
              >
                {status.isLoading ? (
                  <LoaderCircle size={24} className="animate-spin" />
                ) : (
                  <Plus size={24} />
                )}
                <span className="text-xs mt-1">
                  {status.isLoading ? "Uploading" : "Add"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Font</h4>
            <select
              value={userData.lockScreenFont || "default"}
              onChange={(e) =>
                updateProfile({
                  lockScreenFont:
                    e.target.value === "default" ? "" : e.target.value,
                })
              }
              className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="default">System Default</option>
              <option value="'Press Start 2P', cursive">Press Start 2P</option>
              <option value="'VT323', monospace">VT323</option>
              <option value="'Pacifico', cursive">Pacifico</option>
              <option value="'Indie Flower', cursive">Indie Flower</option>
              <option value="'Caveat', cursive">Caveat</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};

const DockPanel = () => {
  const { dockPosition, taskbarSize, enableAnimations, updateUi } =
    useUiStore();

  const sizeIcons = {
    small: Minus,
    medium: Square,
    large: Maximize,
  };

  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-2xl font-bold">Dock & Taskbar</h2>
      <section>
        <h3 className="font-semibold mb-3">Position on Screen</h3>
        <div className="p-4 bg-black/10 rounded-lg flex justify-around items-center">
          {(["top", "bottom"] as DockPosition[]).map((pos) => (
            <button
              key={pos}
              onClick={() => updateUi({ dockPosition: pos })}
              className={`p-3 rounded-lg flex items-center justify-center ${dockPosition === pos ? "bg-[var(--primary)]/30" : "hover:bg-white/10"}`}
            >
              {pos === "top" && <MoveUp size={20} />}
              {pos === "bottom" && <MoveDown size={20} />}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="font-semibold mb-3">Size</h3>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4">
          Adjust the size of the taskbar and its icons.
        </p>
        <div className="p-4 bg-black/10 rounded-lg flex justify-around items-center">
          {(["small", "medium", "large"] as TaskbarSize[]).map((size) => {
            const Icon = sizeIcons[size];
            return (
              <button
                key={size}
                onClick={() => updateUi({ taskbarSize: size })}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 ${taskbarSize === size ? "bg-[var(--primary)]/30" : "hover:bg-white/10"} transition-all duration-200`}
              >
                <Icon
                  size={size === "small" ? 16 : size === "medium" ? 20 : 24}
                />
                <span className="text-xs capitalize">{size}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h3 className="font-semibold mb-3">Animations</h3>
        <div className="p-4 bg-black/10 rounded-lg flex justify-between items-center">
          <span>Enable dock animations</span>
          <button
            onClick={() => updateUi({ enableAnimations: !enableAnimations })}
            className={`w-14 h-8 rounded-full flex items-center transition-colors ${
              enableAnimations ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <span
              className={`inline-block w-6 h-6 bg-white rounded-full transform transition-transform ${
                enableAnimations ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
};

const AboutPanel = () => {
  // Get basic system stats
  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.jsHeapSizeLimit / 1048576);
      return `${usedMB}MB / ${totalMB}MB`;
    }
    return "Not available";
  };

  const getFPS = () => {
    // Simple FPS estimation
    let fps = 0;
    if (typeof performance !== 'undefined' && performance.now) {
      const times: number[] = [];
      let lastTime = performance.now();
      
      const calculateFPS = () => {
        const now = performance.now();
        times.push(now);
        while (times.length > 10) times.shift();
        if (times.length > 1) {
          const duration = times[times.length - 1] - times[0];
          fps = Math.round((times.length - 1) * 1000 / duration);
        }
        lastTime = now;
      };
      
      calculateFPS();
    }
    return fps > 0 ? `${fps} FPS` : "Calculating...";
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-bold text-2xl mb-6">About XOS</h2>
      <div className="p-4 bg-black/10 rounded-lg text-sm space-y-2">
        <p>
          <strong>Version:</strong> 0.3.26 "Celebi"
        </p>
        <p>
          <strong>Channel:</strong> Developer Alpha
        </p>
        <p>
          <strong>Build Date:</strong> August 29, 2025
        </p>
        <div className="pt-4">
          <strong>System Information:</strong>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <div className="text-[color:var(--text-secondary)]">Memory Usage</div>
              <div>{getMemoryUsage()}</div>
            </div>
            <div>
              <div className="text-[color:var(--text-secondary)]">Performance</div>
              <div>{getFPS()}</div>
            </div>
          </div>
        </div>
        <p className="pt-4 text-xs text-[color:var(--text-secondary)]">
          Copyright © 2025 YAS Studios. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

const SettingsApp = () => {
  const [activeCategory, setActiveCategory] = useState<string>("appearance");

  const categories = [
    { id: "account", name: "Account", icon: User, panel: <AccountPanel /> },
    {
      id: "appearance",
      name: "Appearance",
      icon: Palette,
      panel: <AppearancePanel />,
    },
    {
      id: "dock",
      name: "Dock & Taskbar",
      icon: AlignHorizontalJustifyCenter,
      panel: <DockPanel />,
    },
    { id: "system", name: "About", icon: Cpu, panel: <AboutPanel /> },
  ];

  const activePanel = categories.find((c) => c.id === activeCategory)?.panel;

  return (
    <div className="w-full h-full flex text-[color:var(--text-primary)]">
      <div className="w-56 h-full p-4 flex-shrink-0 border-r border-white/10">
        <h1 className="text-xl font-bold mb-8 px-2">Settings</h1>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full flex items-center space-x-3 p-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === category.id ? "bg-[var(--primary)]/30" : "hover:bg-white/10"}`}
            >
              <category.icon size={18} />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">{activePanel}</div>
    </div>
  );
};

export default SettingsApp;
