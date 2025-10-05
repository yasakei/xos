// packages/frontend/src/hooks/useThrottledUpdate.ts
import { useCallback, useRef } from 'react';

interface ThrottledUpdateOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

export const useThrottledUpdate = <T extends (...args: any[]) => void>(
  callback: T,
  options: ThrottledUpdateOptions = {}
) => {
  const { delay = 16, leading = true, trailing = true } = options; // Default to ~60fps
  
  const lastCallTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;

    lastArgsRef.current = args;

    // Leading edge call
    if (leading && timeSinceLastCall >= delay) {
      lastCallTimeRef.current = now;
      callback(...args);
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trailing edge call
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        lastCallTimeRef.current = Date.now();
        if (lastArgsRef.current) {
          callback(...lastArgsRef.current);
        }
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay, leading, trailing]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [throttledCallback, cleanup] as const;
};