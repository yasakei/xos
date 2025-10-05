// packages/frontend/src/hooks/useSystemStats.ts
import { useState, useEffect, useRef } from 'react';

interface SystemStats {
  cpu: number; // CPU usage percentage (0-100)
  memory: number; // Memory usage percentage (0-100)
  disk: number; // Disk I/O percentage (0-100)
  network: number; // Network usage percentage (0-100)
}

export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const previousNetworkRef = useRef<{ timestamp: number; bytes: number }>({ 
    timestamp: Date.now(), 
    bytes: 0 
  });

  useEffect(() => {
    let animationFrame: number;
    let interval: NodeJS.Timeout;
    
    const updateStats = () => {
      try {
        // Get memory usage if available
        let memoryUsage = 0;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
        }
        
        // Simulate CPU usage based on frame rate
        // In a real implementation, this would come from performance monitoring
        const cpuUsage = Math.min(100, Math.max(0, Math.floor(Math.random() * 30) + 20));
        
        // Simulate disk I/O (in a real app, this might come from file system operations)
        const diskUsage = Math.min(100, Math.max(0, Math.floor(Math.random() * 20) + 5));
        
        // Simulate network usage based on fetch activity
        // In a real implementation, we might monitor actual network requests
        const networkUsage = Math.min(100, Math.max(0, Math.floor(Math.random() * 40) + 10));
        
        setStats({
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
          network: networkUsage
        });
        
        setIsLoading(false);
      } catch (error) {
        console.warn('Failed to get system stats:', error);
      }
      
      animationFrame = requestAnimationFrame(updateStats);
    };
    
    // For a more realistic implementation, we could also track actual metrics
    const trackRealMetrics = () => {
      // This would be enhanced in a real implementation with actual system monitoring
    };
    
    animationFrame = requestAnimationFrame(updateStats);
    interval = setInterval(trackRealMetrics, 1000);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
  
  return { stats, isLoading };
};