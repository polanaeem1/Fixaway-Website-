const activeTechs = [
  { id: 'T-001', name: 'Ahmed Hassan', specialty: 'Plumbing', status: 'On Job', lat: '30.0444', lng: '31.2357' },
  { id: 'T-002', name: 'Mahmoud Ali', specialty: 'AC', status: 'Available', lat: '30.0600', lng: '31.2600' },
  { id: 'T-003', name: 'Khaled Samir', specialty: 'Electrical', status: 'On Job', lat: '30.0200', lng: '31.2100' },
  { id: 'T-004', name: 'Omar Youssef', specialty: 'Roadside', status: 'Available', lat: '30.0800', lng: '31.3000' },
];

export default function AdminMapPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Map Panel */}
      <div className="flex-1 bg-surface-container-low rounded-2xl overflow-hidden relative border border-outline-variant/20 shadow-sm">
        {/* Placeholder map */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_40%,#002045_0%,transparent_50%),radial-gradient(circle_at_70%_60%,#fe9743_0%,transparent_40%)]" />
          {/* Mock technician pins */}
          {activeTechs.map((t, i) => (
            <div
              key={t.id}
              className="absolute group cursor-pointer"
              style={{ top: `${20 + i * 18}%`, left: `${15 + i * 20}%` }}
            >
              <div className={`w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 ${t.status === 'On Job' ? 'bg-secondary' : 'bg-green-500'}`}>
                <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
              </div>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-xl px-3 py-2 min-w-40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-outline-variant/20">
                <p className="font-bold text-primary text-sm">{t.name}</p>
                <p className="text-xs text-on-surface-variant">{t.specialty}</p>
                <span className={`text-xs font-bold mt-1 block ${t.status === 'On Job' ? 'text-secondary' : 'text-green-600'}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Overlay Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow border border-outline-variant/20 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-green-700">Available</span>
            </div>
            <div className="w-px h-4 bg-outline-variant" />
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="text-secondary">On Job</span>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow border border-outline-variant/20 text-sm font-semibold text-on-surface">
            342 Technicians Online
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-outline-variant/20 shadow z-10 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Live map — updates every 5 seconds</span>
          <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Sidebar Tech List */}
      <div className="w-72 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-4">
          <h3 className="font-bold text-primary mb-3">Active Technicians</h3>
          <div className="space-y-3">
            {activeTechs.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/10">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${t.status === 'On Job' ? 'bg-secondary' : 'bg-green-500'}`}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm truncate">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.specialty}</p>
                </div>
                <span className={`text-xs font-bold ${t.status === 'On Job' ? 'text-secondary' : 'text-green-600'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-primary">Live Stats</h3>
          {[
            { label: 'Active Orders', value: '1,204', color: 'text-primary' },
            { label: 'Available Techs', value: '198', color: 'text-green-600' },
            { label: 'On-Job Techs', value: '144', color: 'text-secondary' },
            { label: 'Avg Wait Time', value: '12 min', color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">{s.label}</span>
              <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
