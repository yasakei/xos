// packages/frontend/src/components/debug/PerformanceMonitor.tsx
import React, { memo, useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCount: number;
}

const PerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderCount: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);

  useEffect(() => {
    let animationFrame: number;
    
    const updateMetrics = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      frameCountRef.current++;
      renderCountRef.current++;
      
      // Update metrics every second
      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        const frameTime = delta / frameCountRef.current;
        
        // Get memory usage if available
        const memoryUsage = (performance as any).memory 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) // Convert to MB
          : 0;
        
        setMetrics({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          memoryUsage,
          renderCount: renderCountRef.current
        });
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationFrame = requestAnimationFrame(updateMetrics);
    };
    
    animationFrame = requestAnimationFrame(updateMetrics);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 right-4 z-[99999] bg-black/80 text-white p-3 rounded-lg font-mono text-sm backdrop-blur-sm border border-white/20">
      <div className="flex flex-col space-y-1">
        <div className="text-blue-400 font-bold">Performance Monitor</div>
        <div className={`${getFPSColor(metrics.fps)}`}>
          FPS: {metrics.fps}
        </div>
        <div className="text-gray-300">
          Frame: {metrics.frameTime}ms
        </div>
        <div className="text-gray-300">
          Memory: {metrics.memoryUsage}MB
        </div>
        <div className="text-gray-300">
          Renders: {metrics.renderCount}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;