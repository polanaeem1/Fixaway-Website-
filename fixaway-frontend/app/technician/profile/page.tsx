'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function TechnicianProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto px-md pb-12 space-y-6">
      {/* Profile Header */}
      <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white text-4xl font-bold border-2 border-white/30">
            {user?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name || 'Technician'}</h1>
            <p className="text-white/70 text-sm mt-1">{user?.email}</p>
            <p className="text-white/70 text-sm">{user?.phone || 'No phone set'}</p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className="material-symbols-outlined text-yellow-300 text-[18px]" style={{ fontVariationSettings: `'FILL' 1` }}>star</span>
              ))}
              <span className="text-white/70 text-xs ml-1">New technician</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6">
        <h2 className="font-bold text-primary mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">person</span>
          Bio
        </h2>
        <p className="text-on-surface-variant text-sm">
          {user?.technicianProfile?.bio || 'No bio set. Add one in Settings to build trust with customers.'}
        </p>
        <Link href="/technician/settings" className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline">
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jobs Done', value: '0', icon: 'handyman' },
          { label: 'Rating', value: '—', icon: 'star' },
          { label: 'Response Rate', value: '—', icon: 'timer' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-5 text-center">
            <span className="material-symbols-outlined text-primary text-3xl block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            <p className="font-bold text-primary text-xl">{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm divide-y divide-outline-variant/10">
        {[
          { href: '/technician/settings', icon: 'settings', label: 'Account Settings' },
          { href: '/technician/wallet', icon: 'account_balance_wallet', label: 'Earnings & Wallet' },
          { href: '/technician/requests', icon: 'history', label: 'Job History' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-lowest transition-colors">
            <span className="material-symbols-outlined text-primary">{l.icon}</span>
            <span className="font-semibold text-on-surface text-sm">{l.label}</span>
            <span className="material-symbols-outlined text-outline ml-auto text-[18px]">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
