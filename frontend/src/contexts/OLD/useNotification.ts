import { useCallback } from 'react';
import { useNotificationStore } from '@stores/OLD/notification.store';
import type { NotificationType } from '@stores/OLD/notification.store';

export function useNotification() {
  const { addNotification, removeNotification, clearAllNotifications, notifications } =
    useNotificationStore();

  const show = useCallback(
    (message: string, type: NotificationType = 'info', duration: number = 5000) => {
      addNotification({ message, type, duration });
    },
    [addNotification]
  );

  const showSuccess = useCallback(
    (message: string|null, duration?: number) => {
      if(!message) return;
      show(message, 'success', duration);
    },
    [show]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      show(message, 'error', duration ?? 7000);
    },
    [show]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      show(message, 'warning', duration);
    },
    [show]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      show(message, 'info', duration);
    },
    [show]
  );

  return {
    notifications,
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
  };
}
