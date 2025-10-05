// packages/frontend/src/components/ui/XAuthWindow.tsx
import React from 'react';
import { X, Minus, Square } from 'lucide-react';

interface XAuthWindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  showMaximizeButton?: boolean;
}

const XAuthWindow: React.FC<XAuthWindowProps> = ({ 
  title, 
  children, 
  onClose,
  onMinimize,
  onMaximize,
  showCloseButton = false,
  showMinimizeButton = false,
  showMaximizeButton = false
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Window Container */}
      <div className="relative z-10 w-full max-w-md liquid-glass rounded-lg shadow-2xl border border-white/10">
        {/* Title Bar */}
        <div className="h-8 px-2 flex items-center justify-between flex-shrink-0 rounded-t-lg bg-black/20">
          <span className="font-medium text-sm text-white select-none truncate pr-2">
            {title}
          </span>
          <div className="flex items-center space-x-2">
            {showMinimizeButton && (
              <button
                onClick={onMinimize}
                className="w-5 h-5 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-black/60 transition-colors duration-150"
                aria-label="Minimize"
              >
                <Minus size={12} />
              </button>
            )}
            {showMaximizeButton && (
              <button
                onClick={onMaximize}
                className="w-5 h-5 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-black/60 transition-colors duration-150"
                aria-label="Maximize"
              >
                <Square size={10} />
              </button>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-black/60 transition-colors duration-150"
                aria-label="Close"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default XAuthWindow;