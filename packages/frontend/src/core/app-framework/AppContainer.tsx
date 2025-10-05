// packages/frontend/src/core/app-framework/AppContainer.tsx
import React, { Suspense, memo, useMemo } from 'react';
import { getAppById } from './appRegistry';

interface AppContainerProps {
  appId: string;
  props: Record<string, unknown>;
}

const LoadingFallback = memo(() => (
  <div className="p-4 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2">Loading App...</span>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const ErrorFallback = memo(({ appId }: { appId: string }) => (
  <div className="p-4 text-red-500">
    <div className="font-bold">Error</div>
    <div>App "{appId}" not found.</div>
  </div>
));

ErrorFallback.displayName = 'ErrorFallback';

const AppContainer: React.FC<AppContainerProps> = memo(({ appId, props }) => {
  const app = useMemo(() => getAppById(appId), [appId]);

  // Memoize the component to prevent unnecessary re-renders
  const AppComponent = useMemo(() => {
    if (!app) return null;
    return <app.component {...props} />;
  }, [app, props]);

  if (!app) {
    return <ErrorFallback appId={appId} />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {AppComponent}
    </Suspense>
  );
});

AppContainer.displayName = 'AppContainer';

export default AppContainer;