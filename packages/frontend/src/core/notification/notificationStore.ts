// packages/frontend/src/core/notification/notificationStore.ts
import { create } from "zustand";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Convenience methods
  info: (title: string, message: string, duration?: number) => string;
  success: (title: string, message: string, duration?: number) => string;
  warning: (title: string, message: string, duration?: number) => string;
  error: (title: string, message: string, duration?: number) => string;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 5000, // Default 5 seconds
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  },
  
  info: (title, message, duration) => {
    return get().addNotification({ type: "info", title, message, duration });
  },
  
  success: (title, message, duration) => {
    return get().addNotification({ type: "success", title, message, duration });
  },
  
  warning: (title, message, duration) => {
    return get().addNotification({ type: "warning", title, message, duration });
  },
  
  error: (title, message, duration) => {
    return get().addNotification({ type: "error", title, message, duration: duration ?? 0 }); // Errors persist by default
  },
}));