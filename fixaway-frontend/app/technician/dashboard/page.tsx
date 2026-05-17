'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { walletApi, requestsApi, technicianApi, quotationsApi, ordersApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/ui/LiveMap'), { ssr: false });



export default function TechnicianDashboardPage() {
  const { user, accessToken } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [quoteModal, setQuoteModal] = useState<{ request: any; price: string; note: string } | null>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [earningsData, setEarningsData] = useState({
    barHeights: ['0%', '0%', '0%', '0%', '0%', '0%', '0%'],
    todayTotal: 0
  });

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [walletRes, nearbyRes, earningsRes, ordersRes] = await Promise.allSettled([
        walletApi.getBalance(accessToken),
        requestsApi.getNearby(accessToken, 30.0444, 31.2357),
        walletApi.getEarnings(accessToken),
        ordersApi.getMyOrders(accessToken)
      ]);
      if (walletRes.status === 'fulfilled') setWalletBalance(walletRes.value.data?.balance ?? 0);
      if (nearbyRes.status === 'fulfilled') setRequests(nearbyRes.value.data ?? []);
      else setRequests([]);
      if (earningsRes.status === 'fulfilled' && earningsRes.value.data) {
        setEarningsData(earningsRes.value.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        setActiveOrders(ordersRes.value.data.orders.filter((o: any) => ['CONFIRMED', 'TECHNICIAN_EN_ROUTE', 'IN_PROGRESS'].includes(o.status)));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();

    // Re-fetch when user switches back to this tab
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);

    if (accessToken) {
      const socket = getSocket(accessToken);

      const handleNewRequest = (newRequest: any) => {
        setRequests(prev => {
          // Avoid duplicate if already in list
          if (prev.find((r: any) => r.id === newRequest.id)) return prev;
          return [newRequest, ...prev];
        });
        showToast('🔔 New service request nearby!', 'info');
      };

      const handleQuotationAccepted = (order: any) => {
        console.log('[Socket] quotation_accepted:', order);
        showToast('✅ Your quote was accepted! A new job is ready.', 'success');
        fetchData();
      };

      socket.on('new_request', handleNewRequest);
      socket.on('quotation_accepted', handleQuotationAccepted);

      return () => {
        socket.off('new_request', handleNewRequest);
        socket.off('quotation_accepted', handleQuotationAccepted);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    return () => { document.removeEventListener('visibilitychange', handleVisibility); };
  }, [accessToken, fetchData, showToast]);

  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    if (accessToken) {
      try { await technicianApi.setOnlineStatus(accessToken, next); } catch { /* fallback ok */ }
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    // Open quote modal instead of hardcoding price
    const req = requests.find((r: any) => r.id === requestId);
    if (req) setQuoteModal({ request: req, price: '', note: '' });
  };

  const handleSubmitQuote = async () => {
    if (!accessToken || !quoteModal) return;
    const price = parseFloat(quoteModal.price);
    if (!price || price <= 0) { showToast('Please enter a valid price', 'error'); return; }
    setIsSubmittingQuote(true);
    try {
      await quotationsApi.send(accessToken, quoteModal.request.id, price, quoteModal.note || 'I can fix this for you.');
      const res = await requestsApi.getNearby(accessToken, 30.0444, 31.2357);
      setRequests(res.data ?? []);
      showToast(`Quote of EGP ${price} sent! Waiting for customer approval.`, 'success');
      setQuoteModal(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to send quote', 'error');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleCompleteJob = async (orderId: string) => {
    if (!accessToken) return;
    setIsCompleting(true);
    try {
      await ordersApi.updateStatus(accessToken, orderId, 'COMPLETED');
      showToast('Job completed! Earnings added to your wallet.', 'success');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete job', 'error');
      setIsCompleting(false);
    }
  };

  const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // We can keep static days for now or calculate them, but for UI sake it's fine.

  return (
    <div className="px-md md:px-lg max-w-container-max mx-auto min-h-screen pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
        <h1 className="text-2xl font-bold text-primary">Welcome, {user?.name?.split(' ')[0] || 'Technician'}</h1>
          <p className="text-on-surface-variant mt-1">Here is your performance overview for today.</p>
        </div>
        {/* Availability Toggle */}
        <button onClick={toggleOnline}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all ${isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-surface-container border-outline-variant text-on-surface-variant'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-outline-variant'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Daily Earnings Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-primary text-lg">Daily Earnings</h2>
              <span className="text-secondary font-bold text-xl">EGP {earningsData.todayTotal.toLocaleString()}</span>
            </div>
            <div className="h-36 flex items-end gap-1.5 justify-between px-1">
              {earningsData.barHeights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t-sm transition-all ${i === 6 ? 'bg-secondary-container' : 'bg-primary-container/30'}`} style={{ height: h }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-on-surface-variant opacity-60">
              {days.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-primary p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1 opacity-80 text-sm">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>Earnings Wallet</span>
              </div>
              {loading
                ? <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
                : <p className="text-4xl font-bold">EGP {walletBalance?.toLocaleString() ?? '—'}</p>
              }
            </div>
            <div className="flex gap-2 mt-6 relative z-10">
              <Link href="/technician/wallet" className="flex-1 bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">account_balance</span> Withdraw
              </Link>
              <Link href="/technician/wallet" className="bg-white/15 hover:bg-white/25 transition-all p-2.5 rounded-xl border border-white/20">
                <span className="material-symbols-outlined">history</span>
              </Link>
            </div>
          </div>

          {/* Active Job Map */}
          <div className="md:col-span-2 bg-white rounded-2xl overflow-hidden min-h-[260px] flex flex-col border border-outline-variant/10 shadow-sm">
            <div className="p-4 flex flex-row justify-between items-center bg-surface-container-lowest border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">distance</span>
                <div>
                  <p className="font-bold text-primary">
                    {activeOrders.length > 0 ? `Current Job: ${activeOrders[0].request?.category?.name || 'Active Service'}` : 'No active jobs'}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {activeOrders.length > 0 ? (activeOrders[0].request?.address || 'Nearby location') : 'Standby for new jobs'}
                  </p>
                </div>
              </div>
              {activeOrders.length > 0 ? (
                <button onClick={() => handleCompleteJob(activeOrders[0].id)} disabled={isCompleting} className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span> {isCompleting ? '...' : 'Complete Job'}
                </button>
              ) : (
                <button disabled className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-semibold opacity-50">
                  <span className="material-symbols-outlined text-[18px]">navigation</span> Navigate
                </button>
              )}
            </div>
            <div className="flex-1 relative bg-surface-container-low">
              {activeOrders.length > 0 ? (
                <LiveMap lat={activeOrders[0].request?.lat || 30.0444} lng={activeOrders[0].request?.lng || 31.2357} label={activeOrders[0].request?.title || 'Job Location'} />
              ) : (
                <LiveMap lat={30.0444} lng={31.2357} label="Waiting for jobs..." />
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 space-y-5">

          {/* Incoming Requests */}
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
            <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-bold text-primary">Incoming Requests</h3>
              <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{requests.length} New</span>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-surface-container-low rounded-xl animate-pulse" />)}
                </div>
              ) : requests.slice(0, 3).map((r: any) => (
                <div key={r.id} className="p-4 hover:bg-surface-container-lowest transition-colors">
                  <div className="flex justify-between mb-1.5">
                    <p className="font-bold text-primary text-sm">{r.category?.name || r.title || r.type || 'Request'}</p>
                    <span className="text-xs text-on-surface-variant">
                      {new Date(r.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{r.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedRequest(r)} className="flex-1 border border-primary text-primary text-xs font-semibold py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                      View Details
                    </button>
                    <button 
                      onClick={() => handleAcceptRequest(r.id)}
                      disabled={isAccepting[r.id]}
                      className="flex-1 bg-secondary-container text-on-secondary-container text-xs font-semibold py-1.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50">
                      {isAccepting[r.id] ? '...' : 'Send Quote (500 EGP)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/technician/requests" className="block text-center p-3 text-sm font-semibold text-primary hover:bg-surface-container-lowest transition-colors border-t border-outline-variant/10">
              View All Requests
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'This Month', value: '14 Jobs', icon: 'work_history', color: 'bg-primary-container/30 text-primary' },
              { label: 'Avg Rating', value: '4.9 ★', icon: 'star', color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Completion', value: '98%', icon: 'check_circle', color: 'bg-green-50 text-green-600' },
              { label: 'Response', value: '< 5 min', icon: 'speed', color: 'bg-secondary-container/30 text-secondary' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <p className="font-bold text-primary">{s.value}</p>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            {[
              { href: '/technician/wallet', icon: 'account_balance_wallet', label: 'Wallet & Earnings' },
              { href: '/technician/requests', icon: 'receipt_long', label: 'Job History' },
              { href: '/technician/settings', icon: 'settings', label: 'Profile & Settings' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/10 last:border-0">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{item.icon}</span>
                <span className="font-medium text-on-surface text-sm">{item.label}</span>
                <span className="material-symbols-outlined text-outline text-[18px] ml-auto">chevron_right</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-bold text-primary text-lg">{selectedRequest.category?.name || selectedRequest.title || 'Request Details'}</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Description</h3>
                <p className="text-on-surface text-sm leading-relaxed">{selectedRequest.description || 'No additional details provided.'}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Location</h3>
                <p className="text-on-surface text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">location_on</span>
                  {selectedRequest.address || 'Location not provided'}
                </p>
              </div>

              {selectedRequest.mediaUrls && selectedRequest.mediaUrls.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Photos & Videos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRequest.mediaUrls.map((url: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden aspect-square border border-outline-variant/20 shadow-sm">
                        {url.includes('.mp4') ? (
                          <video src={url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} alt="Issue" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-outline-variant/10 bg-surface-container-lowest flex gap-3">
              <button onClick={() => setSelectedRequest(null)} className="flex-1 py-3 text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors">
                Close
              </button>
              <button 
                onClick={() => {
                  handleAcceptRequest(selectedRequest.id);
                  setSelectedRequest(null);
                }}
                disabled={isAccepting[selectedRequest.id]}
                className="flex-1 py-3 text-sm font-semibold bg-secondary-container text-on-secondary-container rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-secondary-container/20 disabled:opacity-50">
                {isAccepting[selectedRequest.id] ? 'Opening...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Price Modal */}
      {quoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-bold text-primary text-lg">Send a Quote</h2>
              <button onClick={() => setQuoteModal(null)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Request</p>
                <p className="font-semibold text-on-surface text-sm">{quoteModal.request.category?.name || quoteModal.request.title || 'Service Request'}</p>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{quoteModal.request.description}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Your Price (EGP) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">EGP</span>
                  <input
                    type="number" min="1"
                    value={quoteModal.price}
                    onChange={e => setQuoteModal(prev => prev ? { ...prev, price: e.target.value } : null)}
                    placeholder="e.g. 350"
                    className="w-full pl-14 pr-4 py-3 border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low text-lg font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">Note to Customer (optional)</label>
                <textarea
                  value={quoteModal.note}
                  onChange={e => setQuoteModal(prev => prev ? { ...prev, note: e.target.value } : null)}
                  placeholder="Describe what's included in your quote..."
                  className="w-full px-4 py-3 border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low resize-none min-h-[80px] text-sm"
                />
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant/10 bg-surface-container-lowest flex gap-3">
              <button onClick={() => setQuoteModal(null)} className="flex-1 py-3 text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors">Cancel</button>
              <button
                onClick={handleSubmitQuote}
                disabled={isSubmittingQuote || !quoteModal.price}
                className="flex-1 py-3 text-sm font-semibold bg-secondary-container text-on-secondary-container rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingQuote
                  ? <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Sending...</>
                  : <><span className="material-symbols-outlined text-[18px]">send</span> Send Quote{quoteModal.price ? ` (EGP ${quoteModal.price})` : ''}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
