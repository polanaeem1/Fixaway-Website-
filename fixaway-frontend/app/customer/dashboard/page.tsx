'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { walletApi, requestsApi, ordersApi, quotationsApi } from '@/lib/api';
import { onUserEvent, onTechnicianEvent } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const serviceIcons: Record<string, string> = {
  Plumbing: 'plumbing', Electrical: 'bolt', 'AC Maintenance': 'ac_unit',
  Carpentry: 'carpenter', Painting: 'format_paint', Roadside: 'car_repair',
};

export default function CustomerDashboardPage() {
  const { user, accessToken } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAcceptingQuote, setIsAcceptingQuote] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [walletRes, requestsRes, orderRes] = await Promise.allSettled([
        walletApi.getBalance(accessToken),
        requestsApi.getMyRequests(accessToken),
        ordersApi.getActive(accessToken),
      ]);
      if (walletRes.status === 'fulfilled') setWalletBalance(walletRes.value.data?.balance ?? 0);
      if (requestsRes.status === 'fulfilled') {
        const reqs = (requestsRes.value.data as any)?.requests || requestsRes.value.data;
        setRequests(Array.isArray(reqs) ? reqs : []);
      }
      if (orderRes.status === 'fulfilled') {
        const orders = (orderRes.value.data as any)?.orders || orderRes.value.data;
        if (Array.isArray(orders)) {
          setActiveOrder(orders.find((o: any) => ['CONFIRMED', 'TECHNICIAN_EN_ROUTE', 'IN_PROGRESS'].includes(o.status)) || null);
        } else {
          setActiveOrder(orderRes.value.data ?? null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();

    // Re-fetch when tab becomes visible (e.g. navigated back from new-request page)
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);

    // Socket: listen for new quotations from technicians
    if (accessToken && user) {
      const handleNewQuotation = async (quotation: any) => {
        console.log('[Socket] new_quotation received:', quotation);
        showToast(`💬 New quote of EGP ${quotation.price} received! Check your requests.`, 'success');
        // Full re-fetch so the Accept button appears with correct data
        await fetchData();
      };

      const handleNewRequest = (newRequest: any) => {
        console.log('[Socket] new_request echo:', newRequest);
        fetchData();
      };

      const unsubQuote = onUserEvent(user.id, 'new_quotation', handleNewQuotation);
      const unsubReq = onTechnicianEvent('new_request', handleNewRequest);

      return () => {
        unsubQuote();
        unsubReq();
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    return () => { document.removeEventListener('visibilitychange', handleVisibility); };
  }, [accessToken, fetchData, showToast]);

  const handleAcceptQuote = async (quoteId: string) => {
    if (!accessToken) return;
    setIsAcceptingQuote(prev => ({ ...prev, [quoteId]: true }));
    try {
      await quotationsApi.accept(accessToken, quoteId);
      showToast('Quote accepted! The technician will be on their way.', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept quote', 'error');
      setIsAcceptingQuote(prev => ({ ...prev, [quoteId]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
        <p className="text-on-surface-variant mt-1">Here&apos;s what&apos;s happening with your services today.</p>
      </div>

      {/* Top Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 mb-6">

        {/* Wallet Card */}
        <div className="col-span-1 lg:col-span-4 bg-primary rounded-3xl p-7 relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/70 mb-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              Wallet Balance
            </div>
            {loading
              ? <div className="h-10 w-36 bg-white/20 rounded-xl animate-pulse mb-1" />
              : <p className="text-white text-4xl font-bold mb-1">EGP {walletBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '—'}</p>
            }
            <div className="flex gap-2 mt-5">
              <Link href="/customer/wallet" className="flex-1 bg-white/15 hover:bg-white/25 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all border border-white/20">
                <span className="material-symbols-outlined text-[18px]">add_card</span> Top Up
              </Link>
              <Link href="/customer/wallet" className="flex-1 bg-secondary-container text-on-secondary-container rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">history</span> History
              </Link>
            </div>
          </div>
        </div>

        {/* Active Order Status */}
        <div className="col-span-1 lg:col-span-5 bg-white rounded-3xl border border-outline-variant/20 shadow-sm p-7">
          {activeOrder ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-primary text-lg">Active Service</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> In Progress
                </span>
              </div>
              <p className="font-semibold text-on-surface">{activeOrder.request?.category?.name || activeOrder.serviceType || 'Active Service'}</p>
              <p className="text-sm text-on-surface-variant mt-1">Tech: {activeOrder.technician?.name || activeOrder.technicianName || 'Assigned'}</p>
              <div className="mt-4 w-full bg-surface-container-high rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-[60%] transition-all duration-500" />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-on-surface-variant">
                <span>Technician en route</span><span>~12 min away</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <Link href={`/chat/${activeOrder.id}`} className="w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20">
                  <span className="material-symbols-outlined text-[18px]">forum</span> Chat
                </Link>
                <Link href="/customer/requests" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  <span className="material-symbols-outlined text-[18px]">location_on</span> Track Live
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-4">
              <div className="w-16 h-16 bg-primary-container/30 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">handyman</span>
              </div>
              <div>
                <p className="font-bold text-primary text-lg">No active service</p>
                <p className="text-sm text-on-surface-variant mt-1">Book a technician to get started</p>
              </div>
              <Link href="/customer/requests/new" className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span> Book Now
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
          {[
            { href: '/customer/requests/new', icon: 'home_repair_service', label: 'Home Service', color: 'bg-primary-container text-on-primary-container' },
            { href: '/customer/emergency', icon: 'emergency_share', label: 'SOS Roadside', color: 'bg-error text-white' },
            { href: '/customer/requests', icon: 'receipt_long', label: 'My Requests', color: 'bg-secondary-container text-on-secondary-container' },
            { href: '/customer/profile', icon: 'person', label: 'Profile', color: 'bg-surface-container-high text-on-surface' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className={`${a.color} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 text-center aspect-square`}>
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
              <span className="text-xs font-bold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Plumbing', icon: 'plumbing', href: '/customer/requests/new?type=plumbing' },
          { label: 'Electrical', icon: 'bolt', href: '/customer/requests/new?type=electrical' },
          { label: 'AC & Cooling', icon: 'ac_unit', href: '/customer/requests/new?type=ac' },
          { label: 'Carpentry', icon: 'carpenter', href: '/customer/requests/new?type=carpentry' },
          { label: 'Painting', icon: 'format_paint', href: '/customer/requests/new?type=painting' },
          { label: 'Roadside', icon: 'car_repair', href: '/customer/emergency' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white border border-outline-variant/20 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary-container/5 transition-all active:scale-95 shadow-sm group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">{s.icon}</span>
            <span className="text-xs font-semibold text-on-surface">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="font-bold text-primary text-lg">Recent Requests</h2>
          <Link href="/customer/requests" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            View All <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl block mb-2 text-outline">receipt_long</span>
            No requests yet. <Link href="/customer/requests/new" className="text-primary font-semibold hover:underline">Book your first service</Link>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {requests.slice(0, 4).map((r: any) => (
              <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-lowest transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{serviceIcons[r.category?.name || r.serviceType] ?? 'handyman'}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{r.category?.name || r.title || r.serviceType || 'Service Request'}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-outline-variant/10 sm:border-t-0 pt-3 sm:pt-0">
                  {r.status === 'QUOTED' && r.quotations && r.quotations.length > 0 ? (
                    <button 
                      onClick={() => handleAcceptQuote(r.quotations[0].id)}
                      disabled={isAcceptingQuote[r.quotations[0].id]}
                      className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                    >
                      {isAcceptingQuote[r.quotations[0].id] ? '...' : `Accept Quote (EGP ${r.quotations[0].price})`}
                    </button>
                  ) : (
                    <>
                      {r.amount && <span className="font-bold text-primary text-sm">EGP {r.amount}</span>}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.status] ?? 'bg-surface-container text-on-surface'}`}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
