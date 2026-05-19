'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';



export default function AdminDashboardPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, onlineTechs: 0, fraudAlerts: 0 });
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (accessToken) {
          const [statsRes, techsRes] = await Promise.allSettled([
            adminApi.getStats(accessToken),
            adminApi.getTechnicians(accessToken),
          ]);
          if (statsRes.status === 'fulfilled' && statsRes.value.data) {
            const rawStats = statsRes.value.data;
            setStats({
              revenue: rawStats.totalRevenue ?? 0,
              activeOrders: rawStats.totalOrders ?? 0,
              onlineTechs: rawStats.activeTechnicians ?? 0,
              fraudAlerts: rawStats.fraudAlerts ?? 0,
            });
          }
          if (techsRes.status === 'fulfilled' && techsRes.value.data) {
            const rawTechs = Array.isArray(techsRes.value.data) ? techsRes.value.data : (techsRes.value.data as any)?.technicians || [];
            const pending = rawTechs
              .filter((t: any) => !t.isVerified)
              .map((t: any) => ({
                id: t.userId,
                name: t.user?.name || 'Unknown',
                specialty: t.specialties?.[0] || 'Technician',
                status: 'PENDING',
              }));
            setQueue(pending.slice(0, 5));
          }
        }
      } catch (e) { console.error('Admin stats fetch failed', e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [accessToken]);

  const kpis = [
    { label: 'Total Revenue', value: `EGP ${((stats?.revenue ?? 0) / 1000).toFixed(1)}K`, change: '+14.5%', up: true, icon: 'payments', color: 'text-primary' },
    { label: 'Active Orders', value: (stats?.activeOrders ?? 0).toLocaleString(), change: '+5.2%', up: true, icon: 'pending_actions', color: 'text-blue-600' },
    { label: 'Online Techs', value: (stats?.onlineTechs ?? 0).toString(), pct: 65, icon: 'engineering', color: 'text-green-600' },
    { label: 'Fraud Alerts', value: (stats?.fraudAlerts ?? 0).toString(), icon: 'warning', color: 'text-error', urgent: true },
  ];

  const barHeights = ['40%', '60%', '50%', '80%', '70%', '90%', '95%'];
  const barDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden group ${k.urgent ? 'border-error/30 bg-error/5' : 'border-outline-variant/20'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{k.label}</p>
                {loading
                  ? <div className="h-8 w-24 bg-surface-container-low rounded animate-pulse" />
                  : <h3 className={`text-2xl font-bold ${k.urgent ? 'text-error' : 'text-primary'}`}>{k.value}</h3>
                }
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.urgent ? 'bg-error text-white animate-pulse' : 'bg-surface-container-low'} ${k.color}`}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{k.icon}</span>
              </div>
            </div>
            {k.change && (
              <div className={`flex items-center gap-1 text-xs font-bold ${k.up ? 'text-green-600' : 'text-error'}`}>
                <span className="material-symbols-outlined text-[14px]">{k.up ? 'trending_up' : 'trending_down'}</span>
                {k.change} from last month
              </div>
            )}
            {k.pct !== undefined && (
              <div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3">
                  <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${k.pct}%` }} />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">{k.pct}% of workforce active</p>
              </div>
            )}
            {k.urgent && <p className="text-xs text-error mt-1 font-semibold">Requires immediate attention</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col">
          <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center">
            <h2 className="font-bold text-primary text-lg">Platform Activity</h2>
            <div className="flex gap-1.5">
              {['Today', 'Week', 'Month'].map((t, i) => (
                <button key={t} className={`px-3 py-1 rounded-lg text-xs font-semibold ${i === 0 ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="p-5 flex-1 min-h-[200px]">
            <div className="h-full flex items-end justify-between gap-2 border-b border-l border-outline-variant/20 pb-2 pl-2">
              {barHeights.map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer ${i === 6 ? 'bg-primary' : 'bg-primary-container/30'}`} style={{ height: h }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 px-2">
              {barDays.map(d => <span key={d} className="text-[10px] text-on-surface-variant">{d}</span>)}
            </div>
          </div>
        </div>

        {/* Verification Queue */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col">
          <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center">
            <h2 className="font-bold text-primary text-lg">Verification Queue</h2>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{queue.length} Pending</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {queue.map((tech: any) => (
              <div key={tech.id} className="p-4 border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {tech.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-primary text-sm">{tech.name}</p>
                    <p className="text-xs text-on-surface-variant">{tech.specialty ?? tech.specialties?.[0] ?? 'Technician'} · {tech.status}</p>
                  </div>
                </div>
                <Link href="/admin/technicians"
                  className="text-secondary hover:bg-secondary/10 p-1.5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </Link>
              </div>
            ))}
          </div>
          <Link href="/admin/technicians" className="p-3 text-center text-xs font-bold text-primary hover:bg-surface-container-lowest transition-colors border-t border-outline-variant/10">
            View All Approvals
          </Link>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/users', icon: 'group', label: 'Manage Users', count: '14.8K', color: 'bg-primary-container text-on-primary-container' },
          { href: '/admin/technicians', icon: 'engineering', label: 'Technicians', count: '527', color: 'bg-secondary-container text-on-secondary-container' },
          { href: '/admin/orders', icon: 'receipt_long', label: 'All Orders', count: '48.4K', color: 'bg-surface-container-high text-on-surface' },
          { href: '/admin/fraud', icon: 'security', label: 'Security Alerts', count: `${stats.fraudAlerts} Active`, color: 'bg-error/10 text-error' },
        ].map(card => (
          <Link key={card.href} href={card.href}
            className={`${card.color} rounded-2xl p-5 flex flex-col gap-3 hover:opacity-90 transition-all active:scale-95 shadow-sm border border-white/50`}>
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
            <div>
              <p className="font-bold text-lg">{card.count}</p>
              <p className="text-xs font-semibold opacity-80">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
