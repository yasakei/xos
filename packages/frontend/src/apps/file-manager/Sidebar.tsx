// packages/frontend/src/apps/file-manager/Sidebar.tsx
import { Star, Download, Home, Folder } from 'lucide-react';
import { useFileManagerStore } from './fileManagerStore';

export const Sidebar = () => {
  const { currentPath, setCurrentPath, favorites } = useFileManagerStore();

  const locations = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Documents', path: '/Documents', icon: Folder },
    { name: 'Downloads', path: '/Downloads', icon: Download },
    { name: 'Pictures', path: '/Pictures', icon: Folder },
  ];

  return (
    <div className="w-56 h-full p-3 border-r border-white/10 flex-shrink-0">
      <div className="space-y-4">
        {/* Favorites Section */}
        <div>
          <h3 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Favorites</h3>
          <div className="space-y-1">
            {favorites.length === 0 && <p className="px-2 text-sm text-gray-500">Empty</p>}
            {favorites.map(favPath => {
              const name = favPath.split('/').pop() || 'Home';
              return (
                <button key={favPath} onClick={() => setCurrentPath(favPath)} className={`w-full flex items-center space-x-2 p-2 rounded-md text-sm transition-colors ${currentPath === favPath ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}>
                  <Star size={16} className="text-yellow-400" />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Locations Section */}
        <div>
          <h3 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Locations</h3>
          <div className="space-y-1">
            {locations.map(loc => (
              <button key={loc.path} onClick={() => setCurrentPath(loc.path)} className={`w-full flex items-center space-x-2 p-2 rounded-md text-sm transition-colors ${currentPath === loc.path ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}>
                <loc.icon size={16} className="text-gray-400" />
                <span>{loc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};