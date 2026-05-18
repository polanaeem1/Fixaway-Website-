'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';



export default function AdminTechniciansPage() {
  const { accessToken } = useAuthStore();
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        if (accessToken) {
          const res = await adminApi.getTechnicians(accessToken);
          const rawTechs = Array.isArray(res.data) ? res.data : (res.data as any)?.technicians || [];
          
          const mapped = rawTechs.map((t: any) => ({
            id: t.userId, // use userId because /verify needs userId
            name: t.user?.name || 'Unknown',
            specialties: t.specialties,
            rating: t.rating,
            completedJobs: t.totalJobs,
            isOnline: t.isOnline,
            verificationStatus: t.isVerified ? 'VERIFIED' : 'PENDING',
          }));
          setTechs(mapped);
        }
      } catch (e) { console.error('Failed to load technicians', e); }
      finally { setLoading(false); }
    };
    load();
  }, [accessToken]);

  const handleApprove = async (techId: string) => {
    if (accessToken) {
      try { await adminApi.verifyTechnician(accessToken, techId); } catch { /* optimistic */ }
    }
    setTechs(prev => prev.map(t => t.id === techId ? { ...t, verificationStatus: 'VERIFIED' } : t));
  };

  const pending = techs.filter(t => t.verificationStatus === 'PENDING').length;
  const filtered = filter === 'ALL' ? techs : techs.filter(t => t.verificationStatus === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Technicians</h1>
          <p className="text-on-surface-variant mt-1">Review, verify, and manage service providers</p>
        </div>
        {pending > 0 && (
          <span className="bg-yellow-100 text-yellow-700 font-bold text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            {pending} Awaiting Verification
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'ALL', label: `All (${techs.length})` },
          { key: 'VERIFIED', label: `Verified (${techs.filter(t => t.verificationStatus === 'VERIFIED').length})` },
          { key: 'PENDING', label: `Pending (${pending})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === tab.key ? 'bg-primary text-white' : 'bg-white border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-lowest border-b border-outline-variant/10">
                <tr>
                  {['Technician', 'Specialty', 'Rating', 'Jobs', 'Status', 'Online', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((t: any) => (
                  <tr key={t.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {t.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{t.name}</p>
                          <p className="text-xs text-outline">{t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">{t.specialties?.[0] ?? t.specialty ?? '—'}</td>
                    <td className="px-5 py-4">
                      {t.rating > 0
                        ? <span className="flex items-center gap-1 font-bold text-yellow-600"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>{t.rating}</span>
                        : <span className="text-outline text-xs">N/A</span>}
                    </td>
                    <td className="px-5 py-4 font-semibold text-on-surface">{t.completedJobs ?? 0}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {t.verificationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${t.isOnline ? 'text-green-600' : 'text-outline'}`}>
                        <div className={`w-2 h-2 rounded-full ${t.isOnline ? 'bg-green-500' : 'bg-outline-variant'}`} />
                        {t.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {t.verificationStatus === 'PENDING' && (
                          <button onClick={() => handleApprove(t.id)}
                            className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Approve
                          </button>
                        )}
                        <button className="text-primary hover:bg-primary-container/20 p-1.5 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
