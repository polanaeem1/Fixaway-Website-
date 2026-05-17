const withdrawals = [
  { id: 'WD-441', desc: 'Withdrawal to CIB Bank', date: 'May 6, 2026', amount: -3000, icon: 'account_balance' },
  { id: 'TXN-882', desc: 'Job payment: AC Maintenance', date: 'May 5, 2026', amount: 850, icon: 'handyman' },
  { id: 'TXN-881', desc: 'Job payment: Plumbing Fix', date: 'May 4, 2026', amount: 450, icon: 'plumbing' },
  { id: 'WD-440', desc: 'Withdrawal to Vodafone Cash', date: 'May 1, 2026', amount: -1500, icon: 'phone_android' },
  { id: 'TXN-879', desc: 'Job payment: Heater Install', date: 'Apr 30, 2026', amount: 1200, icon: 'handyman' },
];

export default function TechnicianWalletPage() {
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
          <p className="text-white text-5xl font-bold mb-1">EGP 8,420</p>
          <p className="text-white/50 text-sm">.00 available to withdraw</p>
          <div className="flex gap-3 mt-8">
            <button className="flex-1 bg-secondary-container text-on-secondary-container rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
              Withdraw to Bank
            </button>
            <button className="flex-1 bg-white/15 hover:bg-white/25 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">phone_android</span>
              Mobile Cash
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: 'EGP 47.2K', icon: 'trending_up', color: 'text-green-600' },
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

      {/* Payout Methods */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-primary text-lg">Payout Methods</h3>
          <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add New
          </button>
        </div>
        <div className="space-y-3">
          {[
            { label: 'CIB Bank', detail: '**** **** **** 4821', icon: 'account_balance', primary: true },
            { label: 'Vodafone Cash', detail: '+20 100 *** 4567', icon: 'phone_android', primary: false },
          ].map(m => (
            <div key={m.label} className={`flex items-center gap-4 p-4 rounded-xl border ${m.primary ? 'border-primary bg-primary-container/10' : 'border-outline-variant/20 bg-surface-container-low'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.primary ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-sm">{m.label}</p>
                <p className="text-xs text-on-surface-variant">{m.detail}</p>
              </div>
              {m.primary && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Default</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h2 className="font-bold text-primary text-lg">Transaction History</h2>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {withdrawals.map(t => (
            <div key={t.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-container-lowest transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-primary-container text-primary'}`}>
                  <span className="material-symbols-outlined text-[22px]">{t.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-sm">{t.desc}</p>
                  <p className="text-xs text-on-surface-variant">{t.date} · {t.id}</p>
                </div>
              </div>
              <span className={`font-bold text-base ${t.amount > 0 ? 'text-green-600' : 'text-on-surface'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} EGP
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
