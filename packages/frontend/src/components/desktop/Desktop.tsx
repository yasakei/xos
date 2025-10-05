// packages/frontend/src/components/desktop/Desktop.tsx
import React, { memo, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';

interface DesktopProps {
  children: React.ReactNode;
}

const Desktop: React.FC<DesktopProps> = memo(({ children }) => {
  const wallpaper = useAuthStore(state => state.userData?.wallpaper);

  // Memoize background style to prevent recalculation
  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${wallpaper || '/api/vfs/static/wallpapers/default.png'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // Performance optimizations
    willChange: 'auto',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  }), [wallpaper]);

  return (
    <main
      className="h-screen w-screen overflow-hidden transition-all duration-300"
      style={backgroundStyle}
    >
      {children}
    </main>
  );
});

Desktop.displayName = 'Desktop';

export default Desktop;