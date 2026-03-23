import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'SUCCESS' | 'WARNING' | 'CRITICAL_BLOCKER' | 'EOD_REPORT';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  data?: any;
  timestamp: string | Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, data?: any) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  pruneOldNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (type, message, data) => set((state) => ({
        notifications: [
          {
            id: Math.random().toString(36).substring(7),
            type,
            message,
            data,
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ],
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      clearAll: () => set({ notifications: [] }),
      pruneOldNotifications: () => set((state) => {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        return {
          notifications: state.notifications.filter(n => new Date(n.timestamp) > fourteenDaysAgo)
        };
      })
    }),
    { name: 'notification-storage' }
  )
);
