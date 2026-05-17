export default function CustomerEmergencyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Alert Banner */}
      <div className="bg-error text-white rounded-2xl p-6 mb-8 flex items-center gap-4 shadow-xl shadow-error/20">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Roadside Emergency Assistance</h1>
          <p className="text-white/80 text-sm mt-1">Tap the button below — a verified technician will reach you within 15 minutes.</p>
        </div>
      </div>

      {/* SOS Button */}
      <div className="flex flex-col items-center justify-center py-10">
        <button className="w-48 h-48 bg-error rounded-full shadow-2xl shadow-error/40 flex flex-col items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200 border-8 border-error-container relative">
          <div className="absolute inset-0 rounded-full border-4 border-error animate-ping opacity-30" />
          <span className="material-symbols-outlined text-6xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_share</span>
          <span className="text-2xl font-black tracking-widest">SOS</span>
        </button>
        <p className="mt-6 text-on-surface-variant text-sm text-center">Press and hold the button to send your location and alert nearby technicians</p>
      </div>

      {/* Current Location */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-primary">Your Current Location</h3>
          <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            Update
          </button>
        </div>
        <div className="bg-surface-container-low rounded-xl h-40 flex items-center justify-center text-outline relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-secondary-container/10" />
          <div className="relative z-10 text-center">
            <span className="material-symbols-outlined text-4xl text-primary block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            <p className="text-sm font-semibold text-primary">New Cairo, 5th Settlement</p>
            <p className="text-xs text-on-surface-variant mt-1">30.0444° N, 31.2357° E</p>
          </div>
        </div>
      </div>

      {/* Emergency Options */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[
          { icon: 'car_repair', label: 'Flat Tyre', desc: 'Tyre change & inflation' },
          { icon: 'battery_alert', label: 'Dead Battery', desc: 'Jump start or replacement' },
          { icon: 'local_gas_station', label: 'Out of Fuel', desc: 'Fuel delivery' },
          { icon: 'car_crash', label: 'Accident', desc: 'Emergency support & tow' },
        ].map(opt => (
          <button key={opt.label} className="bg-white border border-outline-variant/20 rounded-2xl p-4 text-left hover:border-primary hover:bg-primary-container/5 transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-primary text-3xl mb-2 block">{opt.icon}</span>
            <p className="font-bold text-on-surface">{opt.label}</p>
            <p className="text-xs text-on-surface-variant">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-surface-container-low rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">call</span>
          <div>
            <p className="font-semibold text-on-surface text-sm">Emergency Hotline</p>
            <p className="text-xs text-on-surface-variant">Available 24/7</p>
          </div>
        </div>
        <a href="tel:+201001234567" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
          Call Now
        </a>
      </div>
    </div>
  );
}
