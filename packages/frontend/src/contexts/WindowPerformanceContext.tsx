// packages/frontend/src/contexts/WindowPerformanceContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WindowPerformanceData {
  windowId: string;
  averageFPS: number;
  dragDuration: number;
  frameCount: number;
  timestamp: number;
}

interface WindowPerformanceContextType {
  performanceData: WindowPerformanceData[];
  addPerformanceData: (data: WindowPerformanceData) => void;
  getPerformanceData: (windowId: string) => WindowPerformanceData | undefined;
  clearPerformanceData: () => void;
  getAveragePerformance: () => {
    averageFPS: number;
    totalDrags: number;
    averageDuration: number;
  };
}

const WindowPerformanceContext = createContext<WindowPerformanceContextType | undefined>(undefined);

interface WindowPerformanceProviderProps {
  children: ReactNode;
}

export const WindowPerformanceProvider: React.FC<WindowPerformanceProviderProps> = ({ children }) => {
  const [performanceData, setPerformanceData] = useState<WindowPerformanceData[]>([]);

  const addPerformanceData = (data: WindowPerformanceData) => {
    setPerformanceData(prev => {
      // Keep only the last 100 entries to prevent memory issues
      const newData = [...prev, data].slice(-100);
      return newData;
    });
  };

  const getPerformanceData = (windowId: string) => {
    return performanceData
      .filter(data => data.windowId === windowId)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  const clearPerformanceData = () => {
    setPerformanceData([]);
  };

  const getAveragePerformance = () => {
    if (performanceData.length === 0) {
      return { averageFPS: 0, totalDrags: 0, averageDuration: 0 };
    }

    const totalFPS = performanceData.reduce((sum, data) => sum + data.averageFPS, 0);
    const totalDuration = performanceData.reduce((sum, data) => sum + data.dragDuration, 0);

    return {
      averageFPS: totalFPS / performanceData.length,
      totalDrags: performanceData.length,
      averageDuration: totalDuration / performanceData.length,
    };
  };

  const value: WindowPerformanceContextType = {
    performanceData,
    addPerformanceData,
    getPerformanceData,
    clearPerformanceData,
    getAveragePerformance,
  };

  return (
    <WindowPerformanceContext.Provider value={value}>
      {children}
    </WindowPerformanceContext.Provider>
  );
};

export const useWindowPerformanceContext = () => {
  const context = useContext(WindowPerformanceContext);
  if (context === undefined) {
    throw new Error('useWindowPerformanceContext must be used within a WindowPerformanceProvider');
  }
  return context;
};