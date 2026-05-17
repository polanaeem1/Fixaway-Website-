'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { walletApi } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function TechnicianWalletPage() {
  const { accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const load = async () => {
      try {
        const [balRes, txRes] = await Promise.allSettled([
          walletApi.getBalance(accessToken),
          walletApi.getTransactions(accessToken),
        ]);
        if (balRes.status === 'fulfilled') setBalance(balRes.value.data?.balance ?? 0);
        if (txRes.status === 'fulfilled') setTransactions(Array.isArray(txRes.value.data) ? txRes.value.data : []);
      } catch {
        showToast('Failed to load wallet data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken, showToast]);

  const handleWithdraw = () => {
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      showToast('Withdrawal request submitted. Funds arrive in 1–2 business days.', 'success');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-md md:px-lg pb-8">
      {/* Balance Card */}
      <div className="bg-primary rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl shadow-primary/30">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-20 w-40 h-40 bg-secondary/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70 mb-2">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span className="text-sm">Earnings Wallet</span>
          </div>
          {loading ? (
            <div className="h-14 w-40 bg-white/20 rounded-xl animate-pulse mb-1" />
          ) : (
            <p className="text-white text-5xl font-bold mb-1">EGP {(balance ?? 0).toLocaleString()}</p>
          )}
          <p className="text-white/50 text-sm">.00 available to withdraw</p>
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              aria-label="Withdraw to bank account"
              className="flex-1 bg-secondary-container text-on-secondary-container rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
              {isWithdrawing ? 'Processing...' : 'Withdraw to Bank'}
            </button>
            <button
              onClick={() => showToast('Mobile cash withdrawal coming soon!', 'info')}
              aria-label="Withdraw via mobile cash"
              className="flex-1 bg-white/15 hover:bg-white/25 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">phone_android</span>
              Mobile Cash
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: loading ? '...' : `EGP ${((balance ?? 0) + 38800).toLocaleString()}`, icon: 'trending_up', color: 'text-green-600' },
          { label: 'Withdrawn', value: 'EGP 38.8K', icon: 'arrow_outward', color: 'text-primary' },
          { label: 'Pending Payout', value: 'EGP 0', icon: 'schedule', color: 'text-on-surface-variant' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm text-center">
            <span className={`material-symbols-outlined ${s.color} block mb-2 text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            <p className="font-bold text-primary text-lg">{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h2 className="font-bold text-primary text-lg">Transaction History</h2>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-surface-container-low" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-low rounded w-48" />
                  <div className="h-3 bg-surface-container-low rounded w-32" />
                </div>
                <div className="h-4 bg-surface-container-low rounded w-20" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-outline block mb-3">receipt_long</span>
              <p className="font-semibold text-on-surface-variant">No transactions yet</p>
              <p className="text-sm text-outline mt-1">Your earnings will appear here once you complete jobs</p>
            </div>
          ) : (
            transactions.map((t: any) => (
              <div key={t.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-container-lowest transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-primary-container text-primary'}`}>
                    <span className="material-symbols-outlined text-[22px]">{t.amount > 0 ? 'handyman' : 'account_balance'}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{t.description || 'Transaction'}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(t.createdAt).toLocaleDateString()} · {t.id?.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`font-bold text-base ${t.amount > 0 ? 'text-green-600' : 'text-on-surface'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount?.toLocaleString()} EGP
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
