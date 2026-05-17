'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { notificationsApi } from '@/lib/api';

const typeIcons: Record<string, { icon: string; color: string }> = {
  QUOTATION_RECEIVED: { icon: 'request_quote', color: 'text-secondary' },
  ORDER_UPDATE: { icon: 'local_shipping', color: 'text-blue-500' },
  ORDER_COMPLETED: { icon: 'check_circle', color: 'text-green-500' },
  WALLET_CREDIT: { icon: 'account_balance_wallet', color: 'text-primary' },
  NEW_REQUEST: { icon: 'home_repair_service', color: 'text-orange-500' },
  DEFAULT: { icon: 'notifications', color: 'text-on-surface-variant' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationDropdown() {
  const { accessToken } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await notificationsApi.getAll(accessToken);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpen = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    try {
      await notificationsApi.markAllRead(accessToken);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleMarkOneRead = async (id: string) => {
    if (!accessToken) return;
    try {
      await notificationsApi.markOneRead(accessToken, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className={`p-2 rounded-full transition-colors relative ${isOpen ? 'bg-primary-container/20 text-primary' : 'text-primary hover:bg-primary-container/10'}`}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-bold text-primary text-sm flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-error/10 text-error text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-secondary hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/5">
            {loading ? (
              <div className="p-6 text-center text-on-surface-variant text-sm">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline block mb-2">notifications_off</span>
                <p className="text-sm text-on-surface-variant">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const { icon, color } = typeIcons[notif.type] || typeIcons.DEFAULT;
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkOneRead(notif.id)}
                    className={`p-4 hover:bg-surface-container-lowest transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-surface-container flex-shrink-0 ${color}`}>
                      <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface">{notif.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] font-medium text-on-surface-variant/70 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-outline-variant/10 bg-surface-container-lowest text-center">
            <Link href="/customer/dashboard" onClick={() => setIsOpen(false)} className="text-xs font-bold text-primary hover:underline p-2 block">
              View All Activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
