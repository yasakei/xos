// packages/frontend/src/hooks/useWindowPerformance.ts
import { useCallback, useRef } from 'react';

interface PerformanceMetrics {
  dragStartTime: number;
  dragEndTime: number;
  frameCount: number;
  averageFPS: number;
}

export const useWindowPerformance = () => {
  const metricsRef = useRef<PerformanceMetrics>({
    dragStartTime: 0,
    dragEndTime: 0,
    frameCount: 0,
    averageFPS: 0,
  });
  
  const frameTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const startPerformanceTracking = useCallback(() => {
    metricsRef.current.dragStartTime = performance.now();
    metricsRef.current.frameCount = 0;
    frameTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
  }, []);

  const trackFrame = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTimeRef.current;
    
    if (deltaTime > 0) {
      metricsRef.current.frameCount++;
      lastFrameTimeRef.current = currentTime;
    }
  }, []);

  const endPerformanceTracking = useCallback(() => {
    metricsRef.current.dragEndTime = performance.now();
    const totalTime = metricsRef.current.dragEndTime - metricsRef.current.dragStartTime;
    
    if (totalTime > 0 && metricsRef.current.frameCount > 0) {
      metricsRef.current.averageFPS = (metricsRef.current.frameCount / totalTime) * 1000;
    }

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Window Drag Performance:', {
        duration: `${totalTime.toFixed(2)}ms`,
        frames: metricsRef.current.frameCount,
        averageFPS: `${metricsRef.current.averageFPS.toFixed(2)} FPS`,
      });
    }

    return metricsRef.current;
  }, []);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  return {
    startPerformanceTracking,
    trackFrame,
    endPerformanceTracking,
    getMetrics,
  };
};