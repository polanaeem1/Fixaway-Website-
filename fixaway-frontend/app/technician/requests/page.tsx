const jobs = [
  { id: 'JOB-551', service: 'Plumbing - Kitchen Leak', customer: 'Ahmed R.', date: 'May 6', duration: '2h', earned: 'EGP 450', rating: 5, status: 'COMPLETED' },
  { id: 'JOB-550', service: 'AC Maintenance & Refill', customer: 'Sara M.', date: 'May 5', duration: '3h', earned: 'EGP 850', rating: 5, status: 'COMPLETED' },
  { id: 'JOB-549', service: 'Electrical Panel Check', customer: 'Khaled F.', date: 'May 4', duration: '1h', earned: 'EGP 320', rating: 4, status: 'COMPLETED' },
  { id: 'JOB-548', service: 'Water Heater Installation', customer: 'Omar T.', date: 'May 3', duration: '4h', earned: 'EGP 1,200', rating: 5, status: 'COMPLETED' },
  { id: 'JOB-547', service: 'Pipe Replacement', customer: 'Rania H.', date: 'May 2', duration: '2h', earned: 'EGP 600', rating: 4, status: 'COMPLETED' },
];

export default function TechnicianRequestsPage() {
  return (
    <div className="max-w-5xl mx-auto px-md md:px-lg pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">My Jobs</h1>
        <p className="text-on-surface-variant mt-1">Track all your completed and active service jobs</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs', value: '128', icon: 'work_history', color: 'bg-primary-container/30 text-primary' },
          { label: 'This Month', value: '14', icon: 'calendar_today', color: 'bg-blue-50 text-blue-700' },
          { label: 'Avg Rating', value: '4.9 ★', icon: 'star', color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Monthly Earned', value: 'EGP 9.4K', icon: 'payments', color: 'bg-secondary-container/30 text-secondary' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{c.value}</p>
            <p className="text-sm text-on-surface-variant mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Job History Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-bold text-primary text-lg">Job History</h2>
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-lowest border-b border-outline-variant/10 text-left">
              <tr>
                {['Job ID', 'Service', 'Customer', 'Date', 'Duration', 'Earned', 'Rating', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-5 py-4 font-mono text-sm text-on-surface-variant">{j.id}</td>
                  <td className="px-5 py-4 font-semibold text-on-surface text-sm">{j.service}</td>
                  <td className="px-5 py-4 text-sm text-on-surface-variant">{j.customer}</td>
                  <td className="px-5 py-4 text-sm text-on-surface-variant">{j.date}</td>
                  <td className="px-5 py-4 text-sm text-on-surface-variant">{j.duration}</td>
                  <td className="px-5 py-4 font-bold text-primary text-sm">{j.earned}</td>
                  <td className="px-5 py-4">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[16px] ${i < j.rating ? 'text-yellow-400' : 'text-outline-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                      View <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
