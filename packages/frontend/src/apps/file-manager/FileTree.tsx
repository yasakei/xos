// packages/frontend/src/apps/file-manager/FileTree.tsx
// This component is not currently used in the main FileManagerApp,
// but is left here for potential future use in a split-pane view.
// It has been updated to work with the new store and types.
import { useState } from 'react';
import type { VFSNode } from './types';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useFileManagerStore } from './fileManagerStore';

interface FileTreeProps {
  node: VFSNode;
  path: string;
  level?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ node, path, level = 0 }) => {
  const { currentPath, setCurrentPath } = useFileManagerStore();
  const [isOpen, setIsOpen] = useState(level === 0);

  if (node.kind !== 'directory') return null;

  const isSelected = currentPath === path;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setCurrentPath(path);
  };

  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      <div
        onClick={handleToggle}
        className={`flex items-center p-1 rounded cursor-pointer ${isSelected ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}
      >
        {node.children && node.children.length > 0 && (
          isOpen ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />
        )}
        <Folder size={18} className={`mr-2 text-yellow-400 ${node.children && node.children.length > 0 ? '' : 'ml-[17px]'}`} />
        <span>{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileTree 
              key={child.name} 
              node={child} 
              path={`${path === '/' ? '' : path}/${child.name}`} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};