'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'TECHNICIAN') return '/technician/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/customer/dashboard';
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-gutter w-full max-w-container-max mx-auto h-16">
        {/* Logo */}
        <Link href="/" className="font-h1 text-h1 text-primary dark:text-primary-fixed tracking-tight flex items-center gap-xs hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>handyman</span>
          Fixaway
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-lg items-center">
          <Link className="text-primary font-bold border-b-2 border-primary h-16 flex items-center px-sm" href="/">Home</Link>
          <Link className="text-on-surface-variant font-body-md hover:text-primary hover:bg-primary-container/10 transition-all h-16 flex items-center px-sm rounded" href={getDashboardHref()}>Dashboard</Link>
          {!isAuthenticated && (
            <Link className="text-on-surface-variant font-body-md hover:text-primary hover:bg-primary-container/10 transition-all h-16 flex items-center px-sm rounded" href="/login">Login</Link>
          )}
          {!isAuthenticated && (
            <Link className="text-on-surface-variant font-body-md hover:text-primary hover:bg-primary-container/10 transition-all h-16 flex items-center px-sm rounded" href="/register">Register</Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-sm">
          {isAuthenticated ? (
            <>
              <NotificationDropdown />
              <button className="text-on-surface-variant hover:bg-primary-container/10 p-2 rounded-full transition-colors">
                <span className="material-symbols-outlined">support_agent</span>
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-surface-container-low border border-outline-variant/30 transition-all">
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-sm font-medium text-on-surface hidden sm:block max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                  <span className="material-symbols-outlined text-outline text-[18px]">expand_more</span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-outline-variant/20 shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-outline-variant/10">
                    <p className="font-bold text-primary text-sm">{user?.name}</p>
                    <p className="text-xs text-on-surface-variant">{user?.email}</p>
                    <span className="text-[10px] bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-bold mt-1 inline-block">{user?.role}</span>
                  </div>
                  <Link href={getDashboardHref()} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-lowest text-sm text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">dashboard</span> Dashboard
                  </Link>
                  {user?.role === 'CUSTOMER' && (
                    <Link href="/customer/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-lowest text-sm text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span> Profile
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/5 text-sm text-error transition-colors">
                    <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-primary font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary-container/10 transition-colors">Sign In</Link>
              <Link href="/register" className="bg-primary text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-95">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
