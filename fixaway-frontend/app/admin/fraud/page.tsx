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

  useEffect(() => {
    const load = async () => {
      try {
        if (accessToken) {
          const res = await adminApi.getFraudAlerts(accessToken);
          setAlerts(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) { console.error('Failed to load fraud alerts', e); }
      finally { setLoading(false); }
    };
    load();
  }, [accessToken]);

  const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));
  const active = alerts.filter(a => !a.resolved).length;

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
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                      Investigate
                    </button>
                    <button onClick={() => dismiss(alert.id)} className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors">
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
    </div>
  );
}
