'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { adminApi } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (accessToken) {
          const [statsRes, techsRes, ordersRes] = await Promise.allSettled([
            adminApi.getStats(accessToken),
            adminApi.getTechnicians(accessToken),
            adminApi.getOrders(accessToken),
          ]);

          if (statsRes.status === 'fulfilled' && statsRes.value.data) {
            setStats(statsRes.value.data);
          }

          if (techsRes.status === 'fulfilled' && techsRes.value.data) {
            const rawTechs = Array.isArray(techsRes.value.data) ? techsRes.value.data : (techsRes.value.data as any)?.technicians || [];
            setTechs(rawTechs);
          }

          if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
            const rawOrders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : (ordersRes.value.data as any)?.orders || [];
            setOrders(rawOrders);
          }
        }
      } catch (e) {
        console.error('Failed to load analytics data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken]);

  // Calculations
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;
  const avgOrderValue = completedOrders.length > 0 ? Math.round(completedOrders.reduce((a, o) => a + (o.totalAmount ?? 0), 0) / completedOrders.length) : 0;

  // Group orders by category or service type for chart
  const categoriesMap: Record<string, number> = {};
  orders.forEach(o => {
    const cat = o.request?.category?.name || o.request?.type || 'Other';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = sortedCategories.length > 0 ? Math.max(...sortedCategories.map(c => c[1])) : 1;

  // Ranked techs
  const topTechs = [...techs]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.totalJobs ?? 0) - (a.totalJobs ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-primary">Analytics & Reports</h1>
        <p className="text-on-surface-variant mt-1">Deep insights into platforms operations, revenue, and performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: `EGP ${totalRevenue.toLocaleString()}`, icon: 'payments', desc: '15% platform fee applied', color: 'text-primary bg-primary-container/30' },
          { label: 'Completed Jobs', value: completedOrders.length.toString(), icon: 'task_alt', desc: `${completionRate}% completion rate`, color: 'text-green-600 bg-green-50' },
          { label: 'Avg Order Value', value: `EGP ${avgOrderValue}`, icon: 'receipt', desc: 'Across all completed orders', color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Services Requested', value: totalOrders.toString(), icon: 'trending_up', desc: 'Orders created all time', color: 'text-purple-600 bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{k.label}</p>
                {loading ? (
                  <div className="h-8 w-24 bg-surface-container-low rounded animate-pulse" />
                ) : (
                  <h3 className="text-2xl font-bold text-primary">{k.value}</h3>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.color}`}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{k.icon}</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">{k.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Service Popularity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-primary text-lg mb-6">Service Popularity</h3>
          {loading ? (
            <div className="space-y-4 flex-1 justify-center flex flex-col">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-surface-container-low rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm font-semibold py-12">
              No service category data available.
            </div>
          ) : (
            <div className="space-y-5 flex-1 flex flex-col justify-center">
              {sortedCategories.map(([cat, count]) => {
                const percentage = Math.round((count / maxCategoryCount) * 100);
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-primary">{cat}</span>
                      <span className="text-on-surface-variant">{count} orders ({Math.round((count / totalOrders) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Performing Technicians */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-primary text-lg mb-6">Top Performers</h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-surface-container-low rounded-xl animate-pulse" />
              ))
            ) : topTechs.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm font-semibold">
                No technician profiles loaded.
              </div>
            ) : (
              topTechs.map((t, idx) => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-primary text-sm truncate">{t.user?.name || 'Technician'}</p>
                    <p className="text-xs text-on-surface-variant">{t.specialties?.[0] || 'Specialist'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-bold text-yellow-600 text-sm">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {t.rating > 0 ? t.rating.toFixed(1) : 'N/A'}
                    </div>
                    <p className="text-[10px] text-on-surface-variant">{t.totalJobs ?? 0} jobs done</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
