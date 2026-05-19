'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { ordersApi } from '@/lib/api';

export default function TechnicianRequestsPage() {
  const { accessToken } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await ordersApi.getMyOrders(accessToken);
      const fetchedOrders = (res.data as any)?.orders || res.data;
      setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const total = orders.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const thisMonthEarned = thisMonthOrders.reduce((sum, o: any) => sum + (o.status === 'COMPLETED' ? (o.totalAmount || 0) * 0.85 : 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-md md:px-lg pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">My Jobs</h1>
        <p className="text-on-surface-variant mt-1">Track all your completed and active service jobs</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: loading ? '—' : total.toString(), icon: 'work_history', color: 'bg-primary-container/30 text-primary' },
          { label: 'This Month', value: loading ? '—' : thisMonthOrders.length.toString(), icon: 'calendar_today', color: 'bg-blue-50 text-blue-700' },
          { label: 'Avg Rating', value: '4.9 ★', icon: 'star', color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Monthly Earned', value: loading ? '—' : `EGP ${thisMonthEarned.toLocaleString()}`, icon: 'payments', color: 'bg-secondary-container/30 text-secondary' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3 flex-shrink-0`}>
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{c.value}</p>
              <p className="text-sm text-on-surface-variant mt-1">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Job History Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-bold text-primary text-lg">Job History</h2>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-lowest border-b border-outline-variant/10 text-left">
              <tr>
                {['Job ID', 'Service', 'Customer', 'Date', 'Status', 'Earned', 'Rating', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                      Loading jobs...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-on-surface-variant">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                orders.map((j: any) => (
                  <tr key={j.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4 font-mono text-sm text-on-surface-variant">{j.id.slice(-8)}</td>
                    <td className="px-5 py-4 font-semibold text-on-surface text-sm">{j.request?.category?.name || j.request?.title || 'Service'}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{j.customer?.name || 'Customer'}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{new Date(j.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="px-2 py-1 bg-surface-container-low text-on-surface rounded font-bold text-xs">
                        {j.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-primary text-sm">
                      {j.status === 'COMPLETED' ? `EGP ${(j.totalAmount * 0.85).toFixed(2)}` : 'Pending'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex">
                        <span className="text-on-surface-variant text-xs">—</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                        View <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
