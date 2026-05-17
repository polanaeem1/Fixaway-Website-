'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { requestsApi, quotationsApi, reviewsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function CustomerRequestsPage() {
  const { accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<Record<string, boolean>>({});
  const [reviewModal, setReviewModal] = useState<{ orderId: string; techName: string; rating: number; comment: string } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
    if (accessToken) {
      const socket = getSocket(accessToken);
      const handleNewQuotation = async (quotation: any) => {
        showToast(`💬 New quote of EGP ${quotation.price} received!`, 'success');
        await fetchData();
      };
      socket.on('new_quotation', handleNewQuotation);
      return () => {
        socket.off('new_quotation', handleNewQuotation);
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

  const handleSubmitReview = async () => {
    if (!accessToken || !reviewModal) return;
    if (reviewModal.rating === 0) { showToast('Please select a star rating', 'error'); return; }
    setIsSubmittingReview(true);
    try {
      await reviewsApi.submit(accessToken, reviewModal.orderId, reviewModal.rating, reviewModal.comment);
      showToast('Review submitted! Thank you for your feedback.', 'success');
      setReviewModal(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const total = requests.length;
  const completed = requests.filter(r => r.status === 'COMPLETED').length;
  const active = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const spent = requests.reduce((s: number, r: any) => s + (r.order?.totalAmount || r.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Requests</h1>
          <p className="text-on-surface-variant mt-1">Track your service history and active jobs</p>
        </div>
        <a href="/customer/requests/new" className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Request
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: loading ? '—' : total.toString(), icon: 'receipt_long', color: 'text-primary bg-primary-container/30' },
          { label: 'Completed', value: loading ? '—' : completed.toString(), icon: 'check_circle', color: 'text-green-700 bg-green-50' },
          { label: 'Active', value: loading ? '—' : active.toString(), icon: 'pending_actions', color: 'text-blue-700 bg-blue-50' },
          { label: 'Total Spent', value: loading ? '—' : `EGP ${spent.toLocaleString()}`, icon: 'payments', color: 'text-secondary bg-secondary-container/30' },
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
                      ) : r.status === 'COMPLETED' && r.order ? (
                        <button
                          onClick={() => setReviewModal({ orderId: r.order.id, techName: r.order?.technician?.name || 'Technician', rating: 0, comment: '' })}
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
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-bold text-primary text-lg">Rate Your Experience</h2>
              <button onClick={() => setReviewModal(null)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-sm text-on-surface-variant mb-1">How was your experience with</p>
                <p className="font-bold text-primary text-lg">{reviewModal.techName}?</p>
              </div>
              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewModal(prev => prev ? { ...prev, rating: star } : null)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <span
                      className={`material-symbols-outlined text-4xl transition-colors ${star <= reviewModal.rating ? 'text-yellow-400' : 'text-outline-variant'}`}
                      style={{ fontVariationSettings: star <= reviewModal.rating ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
              {reviewModal.rating > 0 && (
                <p className="text-center text-sm font-semibold text-on-surface-variant">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][reviewModal.rating]}
                </p>
              )}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Comment (optional)</label>
                <textarea
                  value={reviewModal.comment}
                  onChange={e => setReviewModal(prev => prev ? { ...prev, comment: e.target.value } : null)}
                  placeholder="Share details about your experience..."
                  className="w-full px-4 py-3 border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low resize-none min-h-[80px] text-sm"
                />
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant/10 bg-surface-container-lowest flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-3 text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewModal.rating === 0}
                className="flex-1 py-3 text-sm font-semibold bg-yellow-400 text-yellow-900 rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingReview
                  ? <><span className="w-4 h-4 border-2 border-yellow-900/30 border-t-yellow-900 rounded-full animate-spin" /> Submitting...</>
                  : <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> Submit Review</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
