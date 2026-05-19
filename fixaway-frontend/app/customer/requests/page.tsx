'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { requestsApi, quotationsApi } from '@/lib/api';
import { onUserEvent } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';
import ReviewModal from '@/components/ui/ReviewModal';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function CustomerRequestsPage() {
  const { accessToken, user } = useAuthStore();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<Record<string, boolean>>({});
  const [reviewModalData, setReviewModalData] = useState<{ orderId: string; techName: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await requestsApi.getMyRequests(accessToken);
      const reqs = (res.data as any)?.requests || res.data;
      setRequests(Array.isArray(reqs) ? reqs : []);
    } catch (e) { console.error('Failed to load requests', e); }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    if (accessToken && user) {
      const handleNewQuotation = async (quotation: any) => {
        showToast(`💬 New quote of EGP ${quotation.price} received!`, 'success');
        await fetchData();
      };
      
      const unsubQuote = onUserEvent(user.id, 'new_quotation', handleNewQuotation);
      
      return () => {
        unsubQuote();
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
    return () => { document.removeEventListener('visibilitychange', handleVisibility); };
  }, [accessToken, fetchData, showToast]);

  const handleAcceptQuote = async (quoteId: string) => {
    if (!accessToken) return;
    setIsAccepting(prev => ({ ...prev, [quoteId]: true }));
    try {
      await quotationsApi.accept(accessToken, quoteId);
      showToast('Quote accepted! The technician will be on their way.', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept quote', 'error');
      setIsAccepting(prev => ({ ...prev, [quoteId]: false }));
    }
  };



  const total = requests.length;
  const completed = requests.filter(r => r.status === 'COMPLETED').length;
  const active = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const spent = requests.reduce((s: number, r: any) => s + (r.order?.totalAmount || r.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Requests</h1>
          <p className="text-on-surface-variant mt-1">Track your service history and active jobs</p>
        </div>
        <a href="/customer/requests/new" className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 self-start sm:self-auto">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Request
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: loading ? '—' : total.toString(), icon: 'receipt_long', color: 'text-primary bg-primary-container/30' },
          { label: 'Completed', value: loading ? '—' : completed.toString(), icon: 'check_circle', color: 'text-green-700 bg-green-50' },
          { label: 'Active', value: loading ? '—' : active.toString(), icon: 'pending_actions', color: 'text-blue-700 bg-blue-50' },
          { label: 'Total Spent', value: loading ? '—' : `EGP ${spent.toLocaleString()}`, icon: 'payments', color: 'text-secondary bg-secondary-container/30' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3 flex-shrink-0`}>
              <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{c.value}</p>
              <p className="text-sm text-on-surface-variant mt-1">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-bold text-primary text-lg">Service History</h2>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-container-lowest border-b border-outline-variant/10 text-left">
                <tr>
                  {['Request ID', 'Service', 'Date', 'Technician', 'Status', 'Amount', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-4 font-mono text-sm text-on-surface-variant">{r.id.slice(-8)}</td>
                    <td className="px-5 py-4 font-semibold text-on-surface text-sm">{r.category?.name || r.title || r.serviceType || 'Service'}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-4 text-sm text-on-surface">{r.order?.technician?.name || 'Pending'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.status] ?? 'bg-surface-container text-on-surface'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-primary text-sm">{(r.order?.totalAmount || r.amount) ? `EGP ${r.order?.totalAmount || r.amount}` : 'TBD'}</td>
                    <td className="px-5 py-4">
                      {r.status === 'QUOTED' && r.quotations && r.quotations.length > 0 ? (
                        <button
                          onClick={() => handleAcceptQuote(r.quotations[0].id)}
                          disabled={isAccepting[r.quotations[0].id]}
                          className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          {isAccepting[r.quotations[0].id] ? '...' : `Accept EGP ${r.quotations[0].price}`}
                        </button>
                      ) : r.status === 'COMPLETED' && r.order && (!r.order.reviews || r.order.reviews.length === 0) ? (
                        <button
                          onClick={() => setReviewModalData({ orderId: r.order.id, techName: r.order?.technician?.name || 'Technician' })}
                          className="border border-secondary text-secondary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-secondary/5 transition-all flex items-center gap-1 whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          Rate
                        </button>
                      ) : (
                        <span className="text-sm text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalData && (
        <ReviewModal
          orderId={reviewModalData.orderId}
          technicianName={reviewModalData.techName}
          onClose={() => setReviewModalData(null)}
          onSuccess={() => {
            setReviewModalData(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
