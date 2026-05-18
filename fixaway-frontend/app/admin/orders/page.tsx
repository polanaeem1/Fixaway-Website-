'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';



const statusColor: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

export default function AdminOrdersPage() {
  const { accessToken } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (accessToken) {
          const res = await adminApi.getOrders(accessToken);
          setOrders(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) { console.error('Failed to load orders', e); }
      finally { setLoading(false); }
    };
    load();
  }, [accessToken]);

  const filtered = orders.filter(o =>
    o.id?.toLowerCase().includes(search.toLowerCase()) ||
    o.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const active = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const completed = orders.filter(o => o.status === 'COMPLETED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          <p className="text-on-surface-variant mt-1">Monitor all platform service orders in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..." className="pl-9 pr-4 py-2.5 bg-white border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
          </div>
          <button className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: loading ? '—' : orders.length.toLocaleString(), icon: 'receipt_long', color: 'bg-primary-container/30 text-primary' },
          { label: 'Active Now', value: loading ? '—' : active.toString(), icon: 'pending_actions', color: 'bg-blue-50 text-blue-700' },
          { label: 'Completed', value: loading ? '—' : completed.toString(), icon: 'check_circle', color: 'bg-green-50 text-green-700' },
          { label: 'Cancelled', value: loading ? '—' : cancelled.toString(), icon: 'cancel', color: 'bg-red-50 text-red-700' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{c.value}</p>
            <p className="text-sm text-on-surface-variant mt-1">{c.label}</p>
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
                  {['Order ID', 'Service', 'Customer', 'Technician', 'Amount', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((o: any) => (
                  <tr key={o.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{o.id.slice(-8)}</td>
                    <td className="px-5 py-4 font-semibold text-on-surface">{o.request?.category?.name || o.request?.type || o.serviceType || 'Service'}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{o.customer?.name ?? o.customerName ?? '—'}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{o.technician?.name ?? o.technicianName ?? 'Pending'}</td>
                    <td className="px-5 py-4 font-bold text-primary">{o.totalAmount || o.totalPrice ? `EGP ${o.totalAmount || o.totalPrice}` : 'TBD'}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[o.status] ?? 'bg-surface-container text-on-surface'}`}>
                        {o.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="text-primary hover:bg-primary-container/20 p-1.5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 flex items-center justify-between border-t border-outline-variant/10">
          <p className="text-sm text-on-surface-variant">Showing {filtered.length} of {orders.length} orders</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-surface-container-low rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Previous</button>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
