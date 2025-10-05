// packages/frontend/src/core/notification/NotificationManager.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useNotificationStore, type Notification, type NotificationType } from "./notificationStore";
import { useUiStore } from "../theme-engine/themeStore";

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconProps = { size: 20 };
  
  switch (type) {
    case "success":
      return <CheckCircle {...iconProps} className="text-green-400" />;
    case "warning":
      return <AlertTriangle {...iconProps} className="text-orange-400" />;
    case "error":
      return <AlertCircle {...iconProps} className="text-red-400" />;
    case "info":
    default:
      return <Info {...iconProps} className="text-blue-400" />;
  }
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { removeNotification } = useNotificationStore();
  const { surfaceStyle, reduceTransparency } = useUiStore();
  
  const getTypeStyles = (type: NotificationType) => {
    const baseStyles = "border shadow-lg";
    const transparencyClass = reduceTransparency ? "bg-[color:var(--surface-bg-solid)]" : 
                             surfaceStyle === "glass" ? "liquid-glass" : "solid-surface";
    
    switch (type) {
      case "success":
        return `${baseStyles} ${transparencyClass} border-green-500/30 text-green-100`;
      case "warning":
        return `${baseStyles} ${transparencyClass} border-orange-500/30 text-orange-100`;
      case "error":
        return `${baseStyles} ${transparencyClass} border-red-500/30 text-red-100`;
      case "info":
      default:
        return `${baseStyles} ${transparencyClass} border-blue-500/30 text-blue-100`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`
        relative max-w-sm w-full p-4 rounded-lg
        ${getTypeStyles(notification.type)}
        text-[color:var(--text-primary)]
      `}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs font-medium text-[color:var(--primary)] hover:underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => removeNotification(notification.id)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Progress bar for timed notifications */}
      {notification.duration && notification.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-[color:var(--primary)]/50 rounded-b-lg"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: notification.duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
};

export const NotificationManager = () => {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem notification={notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};