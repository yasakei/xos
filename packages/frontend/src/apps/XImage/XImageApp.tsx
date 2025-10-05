// packages/frontend/src/apps/XImage/XImageApp.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  Download,
  Info,
  Move,
} from "lucide-react";

interface XImageAppProps {
  filePath: string;
  windowId: string;
  onClose: () => void;
}

const XImageApp: React.FC<XImageAppProps> = ({
  filePath,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    name: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Fetch image data
  useEffect(() => {
    const fetchImage = async () => {
      if (!filePath) return;
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch image directly from VFS read endpoint
        const response = await fetch(`/api/vfs/read?path=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
        }
        
        // Convert response to blob
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Received empty image data');
        }
        
        // Create object URL
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        
        // Get file info
        const fileName = filePath ? filePath.split("/").pop() || "Unknown" : "Unknown";
        const sizeKB = Math.round(blob.size / 1024);
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageInfo({
            name: fileName,
            size: `${sizeKB} KB`,
            dimensions: `${img.naturalWidth} × ${img.naturalHeight}`
          });
        };
        img.onerror = () => {
          // Fallback if image doesn't load properly
          setImageInfo({
            name: fileName,
            size: `${sizeKB} KB`,
            dimensions: "Unknown"
          });
        };
        img.src = objectUrl;
        
      } catch (err) {
        console.error("Image loading error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (filePath) {
      fetchImage();
    }

    // Cleanup function
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [filePath]);

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    if (scale <= 1) return; // Only pan when zoomed in
    
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
    e.preventDefault();
  };

  // Handle mouse move for panning
  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  // Handle mouse up for panning
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, panStart]);

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.max(0.1, Math.min(s * delta, 5)));
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const handleZoomIn = () => {
    setScale((s) => Math.min(s * 1.2, 5)); // Max 5x zoom
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s / 1.2, 0.1)); // Min 0.1x zoom
  };

  const resetTransformations = () => {
    setScale(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
  };

  const rotateLeft = () => {
    setRotation((r) => r - 90);
  };

  const rotateRight = () => {
    setRotation((r) => r + 90);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filePath ? filePath.split("/").pop() || "image" : "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download image");
    }
  };

  const filename = filePath ? filePath.split("/").pop() || "Unknown" : "Unknown";

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black/90 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-2 bg-gray-900/50 border-b border-white/10">
        <div className="flex items-center">
          <Move size={14} className="text-white/60 mr-2" />
          <div className="text-white/90 font-medium truncate max-w-xs text-sm">
            {filename}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {isLoading && (
          <div className="text-white text-lg flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div>Loading image...</div>
          </div>
        )}
        
        {error && (
          <div className="text-red-400 text-center p-4 bg-red-900/30 rounded-lg max-w-md">
            <div className="font-medium mb-2">Failed to load image</div>
            <div className="text-sm opacity-80">{error}</div>
          </div>
        )}
        
        {imageUrl && !isLoading && !error && (
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="cursor-move select-none"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isPanning ? 'none' : 'transform 0.2s ease',
                cursor: scale > 1 ? 'move' : 'default'
              }}
              onMouseDown={handleMouseDown}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={filename}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-2 bg-gray-900/50 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.1}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              scale <= 0.1
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            }`}
          >
            <ZoomOut size={16} />
          </button>
          <div className="text-white/80 text-xs min-w-[30px] text-center">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              scale >= 5
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            }`}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={resetTransformations}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <Maximize size={16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={rotateLeft}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={rotateRight}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <RotateCw size={16} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button
            onClick={downloadImage}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Image Info Panel */}
      {showInfo && imageInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 right-2 w-48 p-3 bg-gray-900/80 backdrop-blur-md rounded-lg border border-white/10 text-white text-xs"
        >
          <div className="font-medium mb-2 flex items-center">
            <Info size={12} className="mr-1" />
            Image Info
          </div>
          <div className="space-y-1">
            <div>
              <div className="text-white/60">Name</div>
              <div className="truncate">{imageInfo.name}</div>
            </div>
            <div>
              <div className="text-white/60">Size</div>
              <div>{imageInfo.size}</div>
            </div>
            <div>
              <div className="text-white/60">Dimensions</div>
              <div>{imageInfo.dimensions}</div>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-white/10"
          >
            <Info size={12} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default XImageApp;