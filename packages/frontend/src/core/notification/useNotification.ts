// packages/frontend/src/core/notification/useNotification.ts
import { useNotificationStore } from "./notificationStore";

export const useNotification = () => {
  const { info, success, warning, error, addNotification, removeNotification, clearAll } = useNotificationStore();
  
  return {
    // Basic notification methods
    info,
    success,
    warning,
    error,
    
    // Advanced methods
    addNotification,
    removeNotification,
    clearAll,
    
    // Convenience methods with common use cases
    notify: (title: string, message: string) => info(title, message),
    
    showSuccess: (message: string, title = "Success") => success(title, message),
    
    showError: (message: string, title = "Error") => error(title, message),
    
    showWarning: (message: string, title = "Warning") => warning(title, message),
    
    showInfo: (message: string, title = "Info") => info(title, message),
    
    // Persistent notifications
    showPersistent: (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
      return addNotification({ type, title, message, duration: 0 });
    },
    
    // Notifications with actions
    showWithAction: (
      title: string, 
      message: string, 
      actionLabel: string, 
      actionCallback: () => void,
      type: "info" | "success" | "warning" | "error" = "info"
    ) => {
      return addNotification({
        type,
        title,
        message,
        action: {
          label: actionLabel,
          onClick: actionCallback
        }
      });
    }
  };
};