// packages/frontend/src/apps/file-manager/ContextMenu.tsx
import React from 'react';

export interface MenuItem {
  label: string;
  action: () => void;
  icon?: React.ElementType;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  return (
    <>
      <div className="absolute inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}/>
      <div
        style={{ top: y, left: x }}
        className="absolute w-52 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-50 p-1"
      >
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => { item.action(); onClose(); }}
            className="flex items-center space-x-3 px-3 py-1.5 text-sm text-white hover:bg-blue-500 rounded cursor-pointer"
          >
            {item.icon && <item.icon size={16} className="text-gray-300" />}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );
};