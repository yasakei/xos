// packages/frontend/src/apps/file-manager/components/FloatingImageViewer.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  X,
  Download,
  Info,
} from "lucide-react";

interface FloatingImageViewerProps {
  filePath: string;
  isVisible: boolean;
  onClose: () => void;
}

const FloatingImageViewer: React.FC<FloatingImageViewerProps> = ({
  filePath,
  isVisible,
  onClose,
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
  const [isHovering, setIsHovering] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Reset transformations when a new image is loaded
  useEffect(() => {
    if (filePath) {
      setScale(1);
      setRotation(0);
      setImageUrl(null);
      setIsLoading(true);
      setError(null);
      setImageInfo(null);
    }
  }, [filePath]);

  // Fetch image data
  useEffect(() => {
    if (!filePath || !isVisible) return;

    const fetchImage = async () => {
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
        const fileName = filePath.split("/").pop() || "Unknown";
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

    fetchImage();

    // Cleanup function
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [filePath, isVisible]);

  const handleZoomIn = () => {
    setScale((s) => Math.min(s * 1.2, 5)); // Max 5x zoom
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s / 1.2, 0.1)); // Min 0.1x zoom
  };

  const resetTransformations = () => {
    setScale(1);
    setRotation(0);
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
      link.download = filePath.split("/").pop() || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download image");
    }
  };

  const filename = filePath.split("/").pop() || "Unknown";

  // Auto-hide toolbar when not hovering
  const showToolbar = isHovering || showInfo;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={viewerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            // Close when clicking outside the image
            if (e.target === viewerRef.current) {
              onClose();
            }
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white transition-all z-[10000]"
          >
            <X size={24} />
          </button>

          {/* Main Content */}
          <div 
            className="relative flex items-center justify-center w-full h-full"
            onMouseMove={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isLoading && (
              <div className="text-white text-lg flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                Loading image...
              </div>
            )}
            
            {error && (
              <div className="text-red-400 text-lg max-w-md text-center p-6 bg-red-900/30 rounded-xl backdrop-blur-sm">
                <div className="font-medium mb-2">Failed to load image</div>
                <div className="text-sm opacity-80 mb-4">{error}</div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}
            
            {imageUrl && !isLoading && !error && (
              <div className="flex items-center justify-center">
                <div 
                  className="flex items-center justify-center cursor-move"
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={filename}
                    className="max-w-[90vw] max-h-[90vh] object-contain select-none"
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {/* Floating Toolbar */}
            <AnimatePresence>
              {showToolbar && imageUrl && !isLoading && !error && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 p-3 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-lg flex items-center gap-2 border border-white/10"
                >
                  <button
                    onClick={handleZoomOut}
                    disabled={scale <= 0.1}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      scale <= 0.1
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
                    }`}
                  >
                    <ZoomOut size={20} />
                  </button>
                  <div className="text-white/80 text-sm min-w-[40px] text-center">
                    {Math.round(scale * 100)}%
                  </div>
                  <button
                    onClick={handleZoomIn}
                    disabled={scale >= 5}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      scale >= 5
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
                    }`}
                  >
                    <ZoomIn size={20} />
                  </button>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  <button
                    onClick={resetTransformations}
                    className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all"
                  >
                    <Maximize size={20} />
                  </button>
                  <button
                    onClick={rotateLeft}
                    className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={rotateRight}
                    className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all"
                  >
                    <RotateCw size={20} />
                  </button>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  <button
                    onClick={downloadImage}
                    className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-all"
                  >
                    <Info size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Info Panel */}
            <AnimatePresence>
              {showInfo && imageInfo && (
                <motion.div
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="absolute top-16 right-4 w-64 p-4 bg-gray-900/80 backdrop-blur-md rounded-lg border border-white/10 text-white"
                >
                  <div className="font-medium mb-3 flex items-center">
                    <Info size={16} className="mr-2" />
                    Image Information
                  </div>
                  <div className="space-y-2 text-sm">
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
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingImageViewer;