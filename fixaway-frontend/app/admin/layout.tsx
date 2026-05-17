import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest flex font-body-md text-on-surface" dir="ltr">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-primary text-white flex flex-col fixed h-full z-40 transition-all duration-300">
        <div className="p-lg border-b border-white/10">
          <h1 className="font-display-lg text-[24px] font-bold">Fixaway</h1>
          <p className="text-on-primary-container text-[12px] uppercase tracking-widest font-label-caps">Command Center</p>
        </div>

        <nav className="flex-1 py-lg px-sm space-y-sm overflow-y-auto">
          <div className="px-md mb-xs text-[10px] uppercase font-bold text-white/50 tracking-wider">Main</div>
          <Link href="/dashboard" className="flex items-center gap-md px-md py-sm rounded-lg bg-white/10 border-l-4 border-secondary-container">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/analytics" className="flex items-center gap-md px-md py-sm rounded-lg hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span>Analytics</span>
          </Link>
          <Link href="/map" className="flex items-center gap-md px-md py-sm rounded-lg hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">map</span>
            <span>Live Map</span>
          </Link>

          <div className="px-md mt-lg mb-xs text-[10px] uppercase font-bold text-white/50 tracking-wider">Management</div>
          <Link href="/users" className="flex items-center gap-md px-md py-sm rounded-lg hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Users</span>
          </Link>
          <Link href="/technicians" className="flex items-center justify-between px-md py-sm rounded-lg hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-[20px]">engineering</span>
              <span>Technicians</span>
            </div>
            <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-bold">12</span>
          </Link>
          <Link href="/orders" className="flex items-center gap-md px-md py-sm rounded-lg hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Orders</span>
          </Link>
          
          <div className="px-md mt-lg mb-xs text-[10px] uppercase font-bold text-white/50 tracking-wider">Security</div>
          <Link href="/fraud" className="flex items-center justify-between px-md py-sm rounded-lg hover:bg-white/5 transition-colors text-error-container">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-[20px]">security</span>
              <span>Fraud Alerts</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
          </Link>
        </nav>

        <div className="p-md border-t border-white/10">
          <div className="flex items-center gap-md">
            <img alt="Admin Avatar" className="w-10 h-10 rounded-full bg-white/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ9Vqwc4-rEi2stbk2LhdXY-aNypK_CaglztI__WMdgpKAyTE24yA9y8FqvjlwhEnV7HoVztSaKA9G46okOEJSx9-tg2EZ9x2TnGAjdZqF-37d7H3PO8OBUzGQFY-LiXmraOnJjJvjs7F3kTEcSN3DMI8vLuVtV-wIjE8MyGrP-Q7Nhv_qbqsl-_nTSm046GbX3yLhsCch5ATrcWp_k2HB-bogyjAwq_V7QmTykt-ZBoEY6ZOg6pzghlsVWAagmXworayZg38HHZg" />
            <div>
              <p className="text-[14px] font-bold text-white leading-tight">Super Admin</p>
              <p className="text-[11px] text-white/70">admin@fixaway.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-outline-variant/30 flex items-center justify-between px-lg sticky top-0 z-30">
          <div className="flex items-center gap-md w-96 relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
            <input type="text" placeholder="Search orders, users, technicians (Press '/')" className="w-full bg-surface-container-low border-none rounded-lg py-sm pl-10 pr-sm text-[14px] focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-md">
            <span className="bg-surface-container-low px-sm py-1 rounded text-[12px] font-bold text-on-surface-variant flex items-center gap-1 border border-outline-variant/20"><span className="w-2 h-2 rounded-full bg-green-500"></span> System Normal</span>
            <button className="relative w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-lg bg-surface flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
