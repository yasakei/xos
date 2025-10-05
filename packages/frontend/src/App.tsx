import React, { memo, useEffect, startTransition } from "react";
import Desktop from "./components/desktop/Desktop";
import { Taskbar } from "./components/taskbar/Taskbar";
import { WindowManager } from "./core/window-manager/WindowManager";
import { useTheme } from "./hooks/useTheme";
import { useAuthStore } from "./store/authStore";
import { UserSelector } from "./components/setup/UserSelector";
import { LockScreen } from "./components/setup/LockScreen";
import { CreateAccount } from "./components/setup/CreateAccount";
import { DialogManager } from "./core/dialog/DialogManager";
import { NotificationManager } from "./core/notification/NotificationManager";
import { preloadApps } from "./core/app-framework/appRegistry";
import { WindowPerformanceProvider } from "./contexts/WindowPerformanceContext";
import PerformanceMonitor from "./components/debug/PerformanceMonitor";

const MainInterface = memo(() => (
  <WindowPerformanceProvider>
    <div className="font-sans">
      <Desktop>
        <WindowManager />
      </Desktop>
      <Taskbar />
      <DialogManager />
      <NotificationManager />
      <PerformanceMonitor />
    </div>
  </WindowPerformanceProvider>
));

MainInterface.displayName = 'MainInterface';

function App() {
  useTheme();
  const { state, initializeApp } = useAuthStore();
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      startTransition(() => {
        initializeApp();
        setTimeout(() => {
          preloadApps();
        }, 100);
      });
    }
  }, [initializeApp]);

  if (state === "initializing") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <div className="text-xl font-semibold">Initializing XOS...</div>
        </div>
      </div>
    );
  }

  if (state === "login") {
    return <UserSelector />;
  }
  
  if (state === "create-account") {
    return <CreateAccount />;
  }

  if (state === "locked") {
    return <LockScreen />;
  }

  if (state === "running") {
    return <MainInterface />;
  }

  // Fallback to login if no state matches, which is safer than showing a blank screen.
  return <UserSelector />;
}

export default App;