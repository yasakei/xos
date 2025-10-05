// packages/frontend/src/hooks/usePerformanceOptimization.ts
import { useCallback, useRef, useEffect, useMemo } from 'react';

interface PerformanceConfig {
  enableRequestAnimationFrame?: boolean;
  throttleDelay?: number;
  enableBatching?: boolean;
  enableDebouncing?: boolean;
  debounceDelay?: number;
  enableVirtualization?: boolean;
}

interface PerformanceMetrics {
  frameTime: number;
  fps: number;
  memoryUsage: number;
  renderCount: number;
}

export const usePerformanceOptimization = (config: PerformanceConfig = {}) => {
  const {
    enableRequestAnimationFrame = true,
    throttleDelay = 16, // ~60fps
    enableBatching = true,
    enableDebouncing = false,
    debounceDelay = 300,
    enableVirtualization = false
  } = config;

  const rafRef = useRef<number | null>(null);
  const lastCallRef = useRef<number>(0);
  const batchedUpdatesRef = useRef<(() => void)[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metricsRef = useRef<PerformanceMetrics>({
    frameTime: 0,
    fps: 0,
    memoryUsage: 0,
    renderCount: 0
  });

  // Performance monitoring
  const updateMetrics = useCallback(() => {
    const now = performance.now();
    metricsRef.current.frameTime = now - lastCallRef.current;
    metricsRef.current.fps = 1000 / metricsRef.current.frameTime;
    metricsRef.current.renderCount++;
    
    // Memory usage (if available)
    if ('memory' in performance) {
      metricsRef.current.memoryUsage = (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }
    
    lastCallRef.current = now;
  }, []);

  // Advanced throttled callback with multiple optimization strategies
  const createOptimizedCallback = useCallback(<T extends (...args: any[]) => void>(
    callback: T,
    options: { 
      immediate?: boolean;
      priority?: 'high' | 'normal' | 'low';
      enableMetrics?: boolean;
    } = {}
  ) => {
    const { immediate = false, priority = 'normal', enableMetrics = false } = options;
    
    return ((...args: Parameters<T>) => {
      if (enableMetrics) {
        updateMetrics();
      }
      
      if (immediate || !enableRequestAnimationFrame) {
        callback(...args);
        return;
      }

      // Handle debouncing
      if (enableDebouncing) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
          callback(...args);
        }, debounceDelay);
        return;
      }

      const now = performance.now();
      
      // Throttle calls based on priority
      const effectiveThrottleDelay = priority === 'high' ? throttleDelay / 2 : 
                                   priority === 'low' ? throttleDelay * 2 : throttleDelay;
      
      if (now - lastCallRef.current < effectiveThrottleDelay) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      }

      // Use different scheduling based on priority
      if (priority === 'high') {
        // High priority - immediate RAF
        rafRef.current = requestAnimationFrame(() => {
          callback(...args);
          lastCallRef.current = now;
        });
      } else if (priority === 'low') {
        // Low priority - use scheduler if available
        if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
          (window as any).scheduler.postTask(() => {
            callback(...args);
            lastCallRef.current = now;
          }, { priority: 'background' });
        } else {
          // Fallback to setTimeout for low priority
          setTimeout(() => {
            callback(...args);
            lastCallRef.current = now;
          }, 0);
        }
      } else {
        // Normal priority - standard RAF
        rafRef.current = requestAnimationFrame(() => {
          callback(...args);
          lastCallRef.current = now;
        });
      }
    }) as T;
  }, [enableRequestAnimationFrame, throttleDelay, enableDebouncing, debounceDelay, updateMetrics]);

  // Enhanced batch update with priority queuing
  const batchUpdate = useCallback((
    updateFn: () => void, 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    if (!enableBatching) {
      updateFn();
      return;
    }

    // Insert based on priority
    if (priority === 'high') {
      batchedUpdatesRef.current.unshift(updateFn);
    } else {
      batchedUpdatesRef.current.push(updateFn);
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const updates = [...batchedUpdatesRef.current];
      batchedUpdatesRef.current = [];
      
      // Process high priority updates first
      updates.forEach(update => update());
    });
  }, [enableBatching]);

  // Virtual scrolling helper
  const createVirtualizedList = useCallback(<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    scrollTop: number
  ) => {
    if (!enableVirtualization) {
      return { visibleItems: items, startIndex: 0, endIndex: items.length - 1 };
    }

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);

    return {
      visibleItems,
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
      totalHeight: items.length * itemHeight
    };
  }, [enableVirtualization]);

  // Performance monitoring hook
  const getPerformanceMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Optimize images with lazy loading and WebP support
  const optimizeImage = useCallback((src: string, options: {
    lazy?: boolean;
    webp?: boolean;
    quality?: number;
  } = {}) => {
    const { lazy = true, webp = true, quality = 80 } = options;
    
    // Check WebP support
    const supportsWebP = webp && (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })();

    let optimizedSrc = src;
    
    if (supportsWebP && !src.endsWith('.webp')) {
      // Convert to WebP if supported
      optimizedSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    return {
      src: optimizedSrc,
      loading: lazy ? 'lazy' as const : 'eager' as const,
      decoding: 'async' as const,
    };
  }, []);

  // Memory management
  const optimizeMemory = useCallback(() => {
    // Force garbage collection if available (dev only)
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }
    
    // Clear any pending operations
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Clear batched updates
    batchedUpdatesRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      optimizeMemory();
    };
  }, [optimizeMemory]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    createOptimizedCallback,
    batchUpdate,
    createVirtualizedList,
    getPerformanceMetrics,
    optimizeImage,
    optimizeMemory,
    cleanup: optimizeMemory
  }), [
    createOptimizedCallback,
    batchUpdate,
    createVirtualizedList,
    getPerformanceMetrics,
    optimizeImage,
    optimizeMemory
  ]);
};