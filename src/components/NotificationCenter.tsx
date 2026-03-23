import React, { useEffect } from 'react';
import { X, Bell, AlertTriangle, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, NotificationType } from '../store/notificationStore';
import { format } from 'date-fns';

const NOTIFICATION_ICONS: Record<NotificationType, any> = {
  SUCCESS: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  CRITICAL_BLOCKER: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  EOD_REPORT: { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  INFO: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ERROR: { icon: X, color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

export const NotificationCenter = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { notifications, markAsRead, clearAll, pruneOldNotifications } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      pruneOldNotifications();
    }
  }, [isOpen, pruneOldNotifications]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-[#1C1C1C] border-l border-zinc-800 shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-zinc-400" />
                <h3 className="text-lg font-bold">Notifications</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Activity Feed Mockup */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-transparent">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-zinc-800/30 rounded-xl p-3 text-sm shadow-sm border border-zinc-200 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-900 dark:text-white">Sarah</span> commented on your API task.
                    <p className="text-xs text-zinc-500 mt-1">2 hours ago</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-800/30 rounded-xl p-3 text-sm shadow-sm border border-zinc-200 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-900 dark:text-white">Marcus</span> merged 4 PRs for Design System.
                    <p className="text-xs text-zinc-500 mt-1">4 hours ago</p>
                  </div>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Bell size={32} className="text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 font-medium">No notifications yet</p>
                  <p className="text-zinc-600 text-sm mt-1">We'll let you know when something important happens.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {notifications.map((notification) => {
                    const style = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.INFO;
                    const Icon = style.icon;
                    return (
                      <div 
                        key={notification.id} 
                        className={`p-6 transition-colors hover:bg-white/[0.02] cursor-pointer ${!notification.read ? 'bg-white/[0.03]' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 ${style.bg} rounded-xl flex items-center justify-center ${style.color} shrink-0`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium leading-tight ${!notification.read ? 'text-white' : 'text-zinc-400'}`}>
                                {notification.message}
                              </p>
                              <span className="text-[10px] text-zinc-600 whitespace-nowrap pt-0.5">
                                {notification.timestamp ? format(new Date(notification.timestamp), 'MMM d, HH:mm') : 'Just now'}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">
                              {notification.type.replace('_', ' ')}
                            </p>
                            {notification.type === 'EOD_REPORT' && notification.data?.text && (
                              <div className="mt-3 bg-black/20 rounded-lg p-3 border border-zinc-800/50">
                                <p className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">{notification.data.text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-zinc-800">
                <button 
                  onClick={clearAll}
                  className="w-full py-2.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
