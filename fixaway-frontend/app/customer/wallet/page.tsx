'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { walletApi } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';



export default function CustomerWalletPage() {
  const { accessToken } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (accessToken) {
          const [balRes, txRes] = await Promise.allSettled([
            walletApi.getBalance(accessToken),
            walletApi.getTransactions(accessToken),
          ]);
          setBalance(balRes.status === 'fulfilled' ? (balRes.value.data?.balance ?? 0) : 0);
          if (txRes.status === 'fulfilled') {
            const txData = (txRes.value.data as any)?.transactions || txRes.value.data;
            setTransactions(Array.isArray(txData) ? txData : []);
          }
        }
      } catch (e) { console.error('Failed to load wallet', e); }
      finally { setLoading(false); }
    };
    load();
  }, [accessToken]);

  // Amount from DB: CREDIT transactions are positive, DEBIT are negative
  const getSignedAmount = (t: any) => t.type === 'CREDIT' ? t.amount : -t.amount;
  const totalSpent = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((s, t) => s + t.amount, 0);
  const totalLoaded = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((s, t) => s + t.amount, 0);

  const handleTopUp = async () => {
    if (!accessToken || !topUpAmount || Number(topUpAmount) <= 0) return;
    setIsProcessing(true);
    try {
      await walletApi.addFunds(accessToken, Number(topUpAmount));
      setIsTopUpOpen(false);
      // Refresh balance and transactions from the real DB
      const [balRes, txRes] = await Promise.allSettled([
        walletApi.getBalance(accessToken),
        walletApi.getTransactions(accessToken),
      ]);
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data?.balance ?? 0);
      if (txRes.status === 'fulfilled') {
        const txData = (txRes.value.data as any)?.transactions || txRes.value.data;
        setTransactions(Array.isArray(txData) ? txData : []);
      }
      setTopUpAmount('500');
      showToast('Funds added successfully!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Top-up failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      {/* Wallet Balance Card */}
      <div className="bg-primary rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl shadow-primary/30">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-20 w-40 h-40 bg-secondary/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70 mb-3">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span className="text-sm font-medium">Available Balance</span>
          </div>
          {loading
            ? <div className="h-12 w-48 bg-white/20 rounded-xl animate-pulse mb-1" />
            : <p className="text-white text-5xl font-bold mb-1">EGP {balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '—'}</p>
          }
          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => setIsTopUpOpen(true)}
              className="flex-1 bg-white/15 hover:bg-white/25 text-white rounded-xl py-3 px-4 font-semibold flex items-center justify-center gap-2 transition-all border border-white/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add_card</span> Add Funds
            </button>
            <button className="flex-1 bg-secondary-container text-on-secondary-container rounded-xl py-3 px-4 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">history</span> History
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Spent', value: `EGP ${totalSpent.toLocaleString()}`, icon: 'trending_down', color: 'text-red-600' },
          { label: 'Total Loaded', value: `EGP ${totalLoaded.toLocaleString()}`, icon: 'trending_up', color: 'text-green-600' },
          { label: 'Saved on Deals', value: 'EGP 350', icon: 'local_offer', color: 'text-secondary' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm text-center hover:shadow-md transition-shadow cursor-default">
            <span className={`material-symbols-outlined ${s.color} block mb-2 text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            <p className="font-bold text-primary text-lg">{loading ? '—' : s.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h2 className="font-bold text-primary text-lg">Recent Transactions</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {transactions.map((t: any) => {
              const signed = getSignedAmount(t);
              return (
              <div key={t.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-container-lowest transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${signed > 0 ? 'bg-green-50 text-green-600' : 'bg-primary-container text-primary'}`}>
                    <span className="material-symbols-outlined text-[22px]">{t.icon ?? (t.type === 'CREDIT' ? 'add_card' : 'receipt')}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{t.desc ?? t.description ?? (t.type === 'CREDIT' ? 'Credit' : 'Debit')}</p>
                    <p className="text-xs text-on-surface-variant">{new Date(t.date ?? t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {t.id}</p>
                  </div>
                </div>
                <span className={`font-bold text-base ${signed > 0 ? 'text-green-600' : 'text-on-surface'}`}>
                  {signed > 0 ? '+' : ''}{signed?.toLocaleString()} EGP
                </span>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Stripe Top-Up Modal Overlay */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-h2 text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                Secure Top Up
              </h3>
              <button 
                onClick={() => !isProcessing && setIsTopUpOpen(false)} 
                className="text-on-surface-variant hover:text-error transition-colors rounded-full p-1 hover:bg-error/10"
                disabled={isProcessing}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Glassmorphic Mock Credit Card */}
              <div className="h-48 w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-white/10 hover:scale-[1.02] transition-transform">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="material-symbols-outlined text-4xl opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>contactless</span>
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-red-500/80 mix-blend-screen"></div>
                    <div className="w-8 h-8 rounded-full bg-yellow-500/80 mix-blend-screen -ml-3"></div>
                  </div>
                </div>
                <div className="relative z-10 font-mono tracking-widest text-xl opacity-90 drop-shadow-md">
                  **** **** **** 4242
                </div>
                <div className="relative z-10 flex justify-between text-sm opacity-80 font-medium tracking-wide">
                  <span className="uppercase">Customer</span>
                  <span>12/28</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-on-surface-variant mb-2 block">Amount to Load (EGP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">EGP</span>
                    <input 
                      type="number" 
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      disabled={isProcessing}
                      className="w-full pl-16 pr-4 py-4 rounded-xl border-2 border-outline-variant/50 bg-surface focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xl font-bold text-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {/* Pay Button */}
                <button 
                  onClick={handleTopUp}
                  disabled={isProcessing || !topUpAmount || Number(topUpAmount) <= 0}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3 overflow-hidden relative group"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">lock</span>
                      Pay EGP {topUpAmount || '0'} Securely
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl"></div>
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Payments are securely processed via MockStripe™
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
