'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';



export default function AdminUsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (accessToken) {
          const res = await adminApi.getUsers(accessToken);
          setUsers(Array.isArray(res.data) ? res.data : (res.data as any)?.users || []);
        }
      } catch (e) { console.error('Failed to load users', e); }
      finally { setLoading(false); }
    };
    load();
  }, [accessToken]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Customers</h1>
          <p className="text-on-surface-variant mt-1">Manage all registered customers on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..." className="pl-9 pr-4 py-2.5 bg-white border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
          </div>
          <button className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span> Export
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Customers', value: loading ? '—' : users.length.toLocaleString(), icon: 'group' },
          { label: 'Active Today', value: '1,204', icon: 'person_check' },
          { label: 'New This Month', value: '342', icon: 'person_add' },
          { label: 'Suspended', value: loading ? '—' : users.filter(u => !u.isActive).length.toString(), icon: 'block' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-container/30 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-lowest border-b border-outline-variant/10">
                <tr>
                  {['Customer', 'Email', 'Phone', 'Joined', 'Requests', 'Total Spent', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                          {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{u.name}</p>
                          <p className="text-xs text-outline">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">{u.email}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{u.phone}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{new Date(u.joinedAt ?? u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-4 font-semibold text-on-surface">{u.requestCount ?? u._count?.requests ?? 0}</td>
                    <td className="px-5 py-4 font-bold text-primary">EGP {(u.totalSpent ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-primary hover:bg-primary-container/20 p-1.5 rounded-lg transition-colors" title="View">
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </button>
                        <button className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors" title={u.isActive ? 'Suspend' : 'Reactivate'}>
                          <span className="material-symbols-outlined text-[18px]">{u.isActive ? 'block' : 'check_circle'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 flex items-center justify-between border-t border-outline-variant/10">
          <p className="text-sm text-on-surface-variant">Showing {filtered.length} of {users.length} customers</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-surface-container-low rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Previous</button>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
