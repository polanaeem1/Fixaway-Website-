'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/ui/ToastProvider';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <AuthGuard requiredRole="CUSTOMER">
      <ToastProvider>
        <div className="min-h-screen bg-background pb-24 lg:pb-0">
          {/* TopAppBar */}
          <header className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-outline-variant/30 fixed top-0 w-full z-50 shadow-sm">
            <div className="flex flex-row-reverse justify-between items-center px-gutter w-full max-w-container-max mx-auto h-16">
              <div className="flex items-center gap-md">
                <button className="text-on-surface-variant hover:bg-primary-container/10 p-sm rounded-full transition-colors active:scale-95 duration-200 flex items-center justify-center">
              <span className="material-symbols-outlined">support_agent</span>
            </button>
            <div className="relative group">
              <div className="w-10 h-10 rounded-full border-2 border-primary-fixed bg-primary-container flex items-center justify-center text-primary font-bold text-sm cursor-pointer">
                {user?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="absolute left-0 top-full mt-2 w-40 bg-surface rounded-xl shadow-xl border border-outline-variant/30 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
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
          </div>
          <div className="flex-1 max-w-md mx-lg hidden md:block relative group">
            <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className="w-full bg-surface-container-low border-none rounded-full py-sm pr-12 pl-md focus:ring-2 focus:ring-primary text-body-md transition-all" 
              placeholder="Search services..." 
              type="text"
            />
          </div>
          <div className="font-h1 text-h1 text-primary tracking-tight">Fixaway</div>
        </div>
      </header>

      {/* SideNavBar (Desktop) */}
      <aside className="h-screen w-64 fixed right-0 top-0 bg-surface shadow-xl hidden lg:flex flex-col p-md z-40 pt-20">
        <div className="mb-xl px-sm">
          <div className="flex items-center gap-md p-md bg-surface-container-low rounded-xl">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-primary font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <p className="font-h2 text-body-md text-primary m-0 truncate max-w-[120px]">{user?.name || 'Customer'}</p>
              <p className="text-on-surface-variant text-label-caps m-0">{user?.email?.split('@')[0]}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-sm">
          <Link href="/customer/dashboard" className="flex items-center gap-md p-md bg-primary-container text-on-primary-container rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">home</span>
            <span className="font-body-md">Home</span>
          </Link>
          <Link href="/customer/requests" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">history</span>
            <span className="font-body-md">My Requests</span>
          </Link>
          <Link href="/customer/emergency" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">emergency_home</span>
            <span className="font-body-md">Emergency</span>
          </Link>
          <Link href="/customer/wallet" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="font-body-md">Wallet</span>
          </Link>
          <Link href="/customer/profile" className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all duration-300">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md">Profile</span>
          </Link>
        </nav>
        <div className="mt-auto p-md space-y-2">
          <button className="w-full py-md bg-secondary-container text-on-secondary-container rounded-xl font-h2 text-body-md hover:shadow-lg transition-shadow">
            Upgrade to Gold
          </button>
          <button onClick={handleLogout} className="w-full py-sm flex items-center justify-center gap-2 text-sm text-error hover:bg-error/10 rounded-xl transition-colors">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:mr-64 pt-24 pb-32 px-gutter">
        {children}
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-end pb-4 px-2 bg-surface/90 backdrop-blur-lg border-t border-white/50 shadow-[0px_-4px_20px_rgba(26,54,93,0.05)] z-50 rounded-t-xl">
        <Link href="/customer/dashboard" className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full w-12 h-12 mb-2 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">explore</span>
          <span className="font-label-caps text-[10px] hidden">Explore</span>
        </Link>
        <Link href="/customer/requests" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-label-caps text-[10px] mt-1">Requests</span>
        </Link>
        <Link href="/customer/emergency" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">emergency_share</span>
          <span className="text-label-caps text-[10px] mt-1">SOS</span>
        </Link>
        <Link href="/customer/profile" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary active:scale-90 transition-transform">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-caps text-[10px] mt-1">Profile</span>
        </Link>
      </nav>

      {/* Roadside Emergency FAB */}
      <button className="fixed bottom-24 right-6 lg:bottom-10 lg:right-auto lg:left-10 w-16 h-16 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-3xl">emergency</span>
      </button>
      </div>
      </ToastProvider>
    </AuthGuard>
  );
}
