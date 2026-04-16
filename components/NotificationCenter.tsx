
import React, { useEffect, useState } from 'react';
import { Notification, NotificationType } from '../types';
import { NotificationService } from '../services/notificationService';
import { Bell, Check, Mail, Info, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const response = await NotificationService.getUserNotifications(user.id);
    if (response.success && response.data) {
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await NotificationService.markAllAsRead(user.id);
    fetchNotifications();
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BOOKING_STATUS: return <Clock className="h-4 w-4 text-ipb-blue" />;
      case NotificationType.SYSTEM: return <Info className="h-4 w-4 text-slate-400" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-ipb-accent hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-0 right-0 inline-flex h-5 w-5 translate-x-1/3 -translate-y-1/3 rounded-full bg-red-400 opacity-75 animate-ping"></span>
            <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-extrabold leading-none text-white translate-x-1/3 -translate-y-1/3 bg-red-500 rounded-full ring-2 ring-white shadow-lg">
              {unreadCount}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-ipb-blue hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Tidak ada notifikasi.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(n.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="h-2 w-2 bg-ipb-blue rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
