'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';



const riskColors: Record<string, string> = {
  CRITICAL: 'bg-red-200 text-red-900',
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  LOW: 'bg-yellow-100 text-yellow-700',
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 60000;
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function AdminFraudPage() {
  const { accessToken } = useAuthStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Punishment choosing states
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [punishAction, setPunishAction] = useState<'WARNING' | 'BAN' | 'FINE'>('WARNING');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [fineAmount, setFineAmount] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (accessToken) {
          const res = await adminApi.getFraudAlerts(accessToken);
          const rawAlerts = Array.isArray(res.data) ? res.data : [];
          
          const mapped = rawAlerts.map((alert: any) => {
            let risk = 'MEDIUM';
            if (alert.type === 'LOCATION_MISMATCH') risk = 'HIGH';
            if (alert.type === 'FAKE_COMPLETION') risk = 'CRITICAL';
            if (alert.type === 'DOUBLE_BILLING') risk = 'HIGH';

            const custName = alert.order?.customer?.name || 'Customer';
            const techName = alert.order?.technician?.name || 'Technician';
            const entity = alert.orderId ? `Order #${alert.orderId.slice(-8)} (${custName} & ${techName})` : 'Platform Activity';

            return {
              ...alert,
              risk,
              entity,
            };
          });

          setAlerts(mapped);
        }
      } catch (e) { console.error('Failed to load fraud alerts', e); }
      finally { setLoading(false); }
    };
    load();
  }, [accessToken]);

  const openActionModal = (alert: any) => {
    setSelectedAlert(alert);
    setPunishAction('WARNING');
    setFineAmount(50);
    const custId = alert.order?.customerId || '';
    const techId = alert.order?.technicianId || '';
    setTargetUserId(techId || custId);
    setActionModalOpen(true);
  };

  const handleResolveAlert = async () => {
    if (!accessToken || !selectedAlert) return;
    setIsSubmitting(true);
    try {
      await adminApi.resolveFraudAlert(accessToken, selectedAlert.id, {
        action: punishAction,
        reportedUserId: punishAction !== 'WARNING' ? targetUserId : undefined,
        fineAmount: punishAction === 'FINE' ? fineAmount : undefined,
      });
      setAlerts(prev => prev.filter(a => a.id !== selectedAlert.id));
      setActionModalOpen(false);
    } catch (e) {
      console.error('Failed to resolve alert', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissDirect = async (alertId: string) => {
    if (!accessToken) return;
    try {
      await adminApi.resolveFraudAlert(accessToken, alertId, { action: 'WARNING' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (e) {
      console.error('Failed to dismiss alert', e);
    }
  };

  const active = alerts.filter(a => !a.resolvedAt).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-error flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            Fraud & Security
          </h1>
          <p className="text-on-surface-variant mt-1">Monitor and investigate suspicious platform activity</p>
        </div>
        {active > 0 && (
          <span className="flex items-center gap-2 bg-error/10 text-error border border-error/20 px-4 py-2 rounded-xl text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" /> {active} Active Alerts
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Alerts', value: loading ? '—' : active.toString(), icon: 'warning', color: 'bg-red-100 text-red-700' },
          { label: 'Resolved Today', value: '12', icon: 'verified_user', color: 'bg-green-100 text-green-700' },
          { label: 'Accounts Flagged', value: '28', icon: 'flag', color: 'bg-orange-100 text-orange-700' },
          { label: 'Fraud Prevented', value: 'EGP 14K', icon: 'savings', color: 'bg-blue-100 text-blue-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-white border border-outline-variant/20 rounded-2xl animate-pulse" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-5xl text-green-500 block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <p className="font-bold text-primary text-lg">All Clear</p>
          <p className="text-on-surface-variant mt-1">No active fraud alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${alert.risk === 'CRITICAL' ? 'border-red-300' : 'border-outline-variant/20'}`}>
              <div className={`p-5 ${alert.risk === 'CRITICAL' ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColors[alert.risk]}`}>{alert.risk}</span>
                        <span className="font-bold text-on-surface text-base">{alert.type}</span>
                        <span className="text-xs text-outline ml-auto">{timeAgo(alert.createdAt)}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant mb-1">{alert.entity}</p>
                      <p className="text-sm text-on-surface-variant">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={() => openActionModal(alert)}
                      className="px-4 py-2 bg-error text-white rounded-xl text-sm font-bold hover:bg-error/90 transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">gavel</span>
                      <span>Take Action</span>
                    </button>
                    <button 
                      onClick={() => dismissDirect(alert.id)} 
                      className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline-variant/20">
                  <span className="text-xs text-outline">Alert ID: <span className="font-mono font-bold text-on-surface-variant">{alert.id}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Punishment Choice Modal */}
      {actionModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-3xl">gavel</span>
              <h2 className="text-xl font-bold">Admin Panel: Sentence & Punishment</h2>
            </div>

            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">{selectedAlert.risk}</span>
                <span className="text-sm font-bold text-on-surface">{selectedAlert.type}</span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">{selectedAlert.id}</p>
              <p className="text-sm text-on-surface-variant italic">"{selectedAlert.description}"</p>
            </div>

            {selectedAlert.order && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Select User to Penalize</label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Customer Option */}
                  {selectedAlert.order.customer && (
                    <div 
                      onClick={() => setTargetUserId(selectedAlert.order.customerId)}
                      className={`cursor-pointer border-2 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                        targetUserId === selectedAlert.order.customerId 
                          ? 'border-error bg-error/5 text-error shadow-sm' 
                          : 'border-outline-variant/30 bg-surface hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-base">
                        {selectedAlert.order.customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-center">{selectedAlert.order.customer.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Customer</span>
                    </div>
                  )}

                  {/* Technician Option */}
                  {selectedAlert.order.technician && (
                    <div 
                      onClick={() => setTargetUserId(selectedAlert.order.technicianId)}
                      className={`cursor-pointer border-2 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                        targetUserId === selectedAlert.order.technicianId 
                          ? 'border-error bg-error/5 text-error shadow-sm' 
                          : 'border-outline-variant/30 bg-surface hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-base">
                        {selectedAlert.order.technician.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-center">{selectedAlert.order.technician.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Technician</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Select Punishment Path</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'WARNING', label: 'Warning Only', desc: 'No financial/ban penalties', icon: 'info' },
                  { value: 'FINE', label: 'Wallet Fine', desc: 'Deduct wallet balance', icon: 'payments' },
                  { value: 'BAN', label: 'Deactivate / Ban', desc: 'Suspend user account', icon: 'block' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setPunishAction(opt.value as any)}
                    className={`cursor-pointer border-2 p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all ${
                      punishAction === opt.value
                        ? 'border-error bg-error/5 text-error shadow-sm'
                        : 'border-outline-variant/20 bg-surface hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                    <span className="font-bold text-xs">{opt.label}</span>
                    <span className="text-[9px] opacity-70 leading-normal">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {punishAction === 'FINE' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fine Amount (EGP)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">EGP</span>
                  <input
                    type="number"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2.5 rounded-full hover:bg-surface-container-low text-on-surface-variant font-bold text-sm transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveAlert}
                className="bg-error text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md font-bold text-sm disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing sentence...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">done</span>
                    <span>Apply Sentence & Close</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
