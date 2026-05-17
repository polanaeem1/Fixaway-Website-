'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Order Confirmed', body: 'Technician Ahmed accepted your request.', time: '2m ago', read: false, icon: 'check_circle', color: 'text-green-500' },
    { id: 2, title: 'Quotation Received', body: 'You have a new quotation for AC Maintenance.', time: '1h ago', read: false, icon: 'request_quote', color: 'text-secondary' },
    { id: 3, title: 'Wallet Top Up', body: 'EGP 500 added to your wallet securely.', time: '2h ago', read: false, icon: 'account_balance_wallet', color: 'text-primary' },
    { id: 4, title: 'Welcome to Fixaway!', body: 'Complete your profile to get started.', time: '1d ago', read: true, icon: 'waving_hand', color: 'text-orange-400' },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Mark as read when opened
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-outline-variant/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-bold text-primary text-sm flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-error/10 text-error text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
              )}
            </h3>
            <button onClick={handleMarkAllRead} className="text-xs font-semibold text-secondary hover:underline">Mark all as read</button>
          </div>
          
          <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/5">
            {notifications.map(notif => (
              <div key={notif.id} className={`p-4 hover:bg-surface-container-lowest transition-colors cursor-pointer flex gap-3 ${!notif.read && unreadCount > 0 ? 'bg-primary/5' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-surface-container flex-shrink-0 ${notif.color}`}>
                  <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-on-surface">{notif.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-[10px] font-medium text-on-surface-variant/70 mt-1">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-2 border-t border-outline-variant/10 bg-surface-container-lowest text-center">
            <Link href="/customer/dashboard" className="text-xs font-bold text-primary hover:underline p-2 block">
              View All Activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
