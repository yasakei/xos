// packages/frontend/src/core/window-manager/WindowManager.tsx
import React, { memo, useMemo } from 'react';
import { useWindowStore } from '../../store/windowStore';
import XWindow from '../../components/windows/XWindow';
import { shallow } from 'zustand/shallow';

class WindowManagerErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("WindowManager caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Window manager encountered an error. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}

export const WindowManager = memo(() => {
    // Correctly select the window state. The `windows` array itself is the dependency.
    // The `shallow` comparison will now work as expected because it compares the array reference.
    const windows = useWindowStore((state) => state.windows, shallow);

    // Memoize the list of rendered windows.
    // This will only re-compute when the `windows` array reference changes.
    const memoizedWindows = useMemo(() => {
        const windowIds = windows.map(w => w.id);
        
        // Limit the number of windows to prevent performance issues
        const maxWindows = 50;
        if (windowIds.length > maxWindows) {
            console.warn("Too many windows open, limiting render to prevent performance issues");
            return windowIds.slice(0, maxWindows).map((id) => (
                <XWindow key={id} id={id} />
            ));
        }
        
        return windowIds.map((id) => (
            <XWindow key={id} id={id} />
        ));
    }, [windows]);

    return (
      <WindowManagerErrorBoundary>
        {memoizedWindows}
      </WindowManagerErrorBoundary>
    );
});

WindowManager.displayName = 'WindowManager';