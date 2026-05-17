'use client';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import { technicianApi } from '@/lib/api';

function SupportChatButton() {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast('Support Chat coming soon!', 'info')} className="hover:bg-primary-container/10 transition-colors p-2 rounded-lg active:scale-95 duration-200">
      <span className="material-symbols-outlined">support_agent</span>
    </button>
  );
}

export default function TechnicianLayout({ children }: { children: ReactNode }) {
  const { user, clearAuth, accessToken } = useAuthStore();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  const toggleOnline = async () => {
    if (!accessToken || isTogglingStatus) return;
    const next = !isOnline;
    setIsOnline(next);
    setIsTogglingStatus(true);
    try {
      await technicianApi.setOnlineStatus(accessToken, next);
    } catch {
      // Revert on failure
      setIsOnline(!next);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <AuthGuard requiredRole="TECHNICIAN">
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        {/* TopAppBar */}
      <header className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-outline-variant/30 fixed top-0 w-full z-50 shadow-sm">
        <div className="flex flex-row-reverse justify-between items-center px-gutter w-full max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-md">
            <div className="relative group">
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-secondary-container flex items-center justify-center text-primary font-bold text-sm cursor-pointer">
                {user?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div className="absolute left-0 top-full mt-2 w-44 bg-surface rounded-xl shadow-xl border border-outline-variant/30 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                <div className="px-3 py-2 border-b border-outline-variant/20">
                  <p className="text-xs font-semibold text-primary truncate">{user?.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors rounded-b-xl">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-h2 text-h2 text-primary leading-none">Fixaway</span>
              <span className="font-label-caps text-label-caps text-secondary">Technician Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-lg">
            {/* Availability Toggle */}
            <button
              onClick={toggleOnline}
              disabled={isTogglingStatus}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-sm transition-all active:scale-95 disabled:opacity-70 ${
                isOnline
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-outline-variant'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </button>
            
            <div className="flex items-center gap-md text-primary">
              <SupportChatButton />
              <NotificationDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="hidden md:flex h-screen w-64 fixed right-0 top-0 bg-surface shadow-xl flex-col p-md z-40 pt-20">
        <div className="mb-lg p-md bg-primary-container/5 rounded-xl border border-primary/10">
          <h3 className="font-h2 text-h2 text-primary mb-1 truncate">{user?.name || 'Technician'}</h3>
          <p className="font-body-md text-on-surface-variant opacity-70 truncate">{user?.email?.split('@')[0]}</p>
          <button className="mt-md w-full bg-secondary-container text-on-secondary-container font-label-caps py-2 rounded-lg hover:bg-secondary transition-all duration-300">Upgrade to Gold</button>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center justify-center gap-2 py-sm text-sm text-error hover:bg-error/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          <Link href="/technician/dashboard" className="flex items-center gap-md p-md bg-primary-container text-on-primary-container rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">home</span>
            <span className="font-body-md text-body-md">Home</span>
          </Link>
          <Link href="/technician/requests" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">history</span>
            <span className="font-body-md text-body-md">My Requests</span>
          </Link>
          <Link href="/technician/wallet" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="font-body-md text-body-md">Wallet</span>
          </Link>
          <Link href="/technician/settings" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md text-body-md">Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="md:pr-64 pt-24 pb-32">
        {children}
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-lg flex justify-around items-end pb-4 px-2 z-50 rounded-t-xl border-t border-white/50 shadow-[0px_-4px_20px_rgba(26,54,93,0.05)]">
        <Link href="/technician/dashboard" className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full w-12 h-12 mb-2 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">explore</span>
          <span className="hidden font-label-caps text-label-caps">Explore</span>
        </Link>
        <Link href="/technician/requests" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
          <span className="font-label-caps text-label-caps mt-1">Requests</span>
        </Link>
        <Link href="/technician/wallet" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="font-label-caps text-label-caps mt-1">Wallet</span>
        </Link>
        <Link href="/technician/settings" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-caps text-label-caps mt-1">Settings</span>
        </Link>
      </nav>

      {/* Emergency FAB */}
      <Link href="/technician/requests" className="fixed bottom-24 left-6 md:bottom-10 md:left-10 w-16 h-16 bg-secondary-container text-primary rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-transform group">
        <span className="material-symbols-outlined text-[32px]">work_history</span>
        <span className="absolute left-full ml-4 bg-primary px-4 py-2 rounded-lg text-white font-bold text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">My Jobs</span>
      </Link>
      </div>
    </AuthGuard>
  );
}
