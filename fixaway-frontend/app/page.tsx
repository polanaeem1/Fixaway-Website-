'use client';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';

export default function LandingPage() {
  const { showToast } = useToast();
  return (
    <>
      <Navbar />
      <main className="pt-16 pb-24">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10"></div>
            <img className="w-full h-full object-cover" alt="Hero background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfRysUbWl1U0GGz4PYDfe_oS-CbbNdzC4WYiut9410_BP3wT-dH1k-i-rzfexcH6bbWpnYkNl2YqJbe_F6pcpin_psLfxBNqoo_mUtB74hPmNMb8hijuyzLlKr-ibIfjeN-ja7HVSXA_BxWoiRDTeJbDrZOGnHKGquZD_w0xOexRXXnuEpBcgu80JSrMdqzAk9q41e-mKuALo4pL2RFAR4gktQeK7Hq72CA2OLdIoRyGvvNy66glZc0Mteafs9TPNoVqbrw9y9cDk" />
          </div>
          <div className="container mx-auto px-gutter relative z-20 w-full max-w-container-max">
            <div className="max-w-2xl text-left">
              <span className="bg-primary-container text-white px-md py-xs rounded-full font-label-caps text-label-caps mb-lg inline-block">
                Fixaway Premium Services
              </span>
              <h1 className="font-display-lg text-display-lg text-primary mb-md leading-tight">
                Trusted Help, <br />Right When You Need It.
                <span className="block text-secondary-container mt-sm text-3xl">Reliable Assistance, Whenever You Need It</span>
              </h1>
              <p className="text-body-lg text-on-surface-variant mb-xl max-w-lg font-body-lg">
                Premium home maintenance and roadside assistance at your fingertips. Professional, verified technicians ready to serve you 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-md">
                <Link href="/customer/requests/new" className="bg-primary text-white px-xl py-md rounded-lg font-h2 text-body-md flex items-center justify-center gap-sm shadow-lg hover:bg-primary-container transition-all active:scale-95">
                  <span className="material-symbols-outlined">home_repair_service</span>
                  Book Home Service
                </Link>
                <Link href="/customer/emergency" className="bg-secondary-container text-primary px-xl py-md rounded-lg font-h2 text-body-md flex items-center justify-center gap-sm shadow-lg hover:bg-secondary-fixed transition-all active:scale-95">
                  <span className="material-symbols-outlined">tire_repair</span>
                  Roadside Assistance
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Service Categories Bento Grid */}
        <section className="py-xl px-gutter max-w-container-max mx-auto">
          <div className="text-center mb-xl">
            <h2 className="font-h1 text-h1 text-primary mb-sm">Our Specialized Services</h2>
            <div className="h-1 w-24 bg-secondary-container mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
            {/* Main Service: Plumbing */}
            <div className="md:col-span-8 bg-white rounded-xl p-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-xl transition-all">
              <div>
                <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined text-primary text-h1">plumbing</span>
                </div>
                <h3 className="font-h2 text-h2 text-primary mb-xs">Plumbing</h3>
                <p className="text-on-surface-variant font-body-md">Leak repairs, pipe installation, and water heater maintenance by certified experts.</p>
              </div>
              <div className="mt-xl flex justify-between items-center">
                <span className="text-secondary font-bold font-body-md">Starting from 150 EGP</span>
                <span className="material-symbols-outlined text-primary group-hover:-translate-x-2 transition-transform rtl:rotate-180">arrow_back</span>
              </div>
            </div>
            {/* Small Service: Electrical */}
            <div className="md:col-span-4 bg-white rounded-xl p-lg shadow-sm border border-outline-variant/30 flex flex-col group hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-primary text-h1">bolt</span>
              </div>
              <h3 className="font-h2 text-h2 text-primary mb-xs">Electrical</h3>
              <p className="text-on-surface-variant font-body-md">Wiring, lighting, and outlet repairs.</p>
            </div>
            {/* Small Service: AC */}
            <div className="md:col-span-4 bg-white rounded-xl p-lg shadow-sm border border-outline-variant/30 flex flex-col group hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-primary text-h1">ac_unit</span>
              </div>
              <h3 className="font-h2 text-h2 text-primary mb-xs">Air Conditioning</h3>
              <p className="text-on-surface-variant font-body-md">Cooling maintenance and installation.</p>
            </div>
            {/* Roadside Feature Card */}
            <div className="md:col-span-8 bg-primary text-white rounded-xl p-lg shadow-xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute left-0 top-0 w-1/2 h-full opacity-10 flex items-center">
                <span className="material-symbols-outlined text-[200px] absolute -left-10">minor_crash</span>
              </div>
              <div className="relative z-10 text-right">
                <h3 className="font-h1 text-h1 mb-md">Urgent Roadside Items</h3>
                <div className="flex flex-wrap gap-md justify-end">
                  <div className="flex items-center gap-xs bg-white/10 px-md py-sm rounded-full backdrop-blur-md">
                    <span className="material-symbols-outlined text-secondary-container">battery_charging_full</span>
                    <span className="font-label-caps">Battery Jumpstart</span>
                  </div>
                  <div className="flex items-center gap-xs bg-white/10 px-md py-sm rounded-full backdrop-blur-md">
                    <span className="material-symbols-outlined text-secondary-container">local_gas_station</span>
                    <span className="font-label-caps">Fuel Delivery</span>
                  </div>
                  <div className="flex items-center gap-xs bg-white/10 px-md py-sm rounded-full backdrop-blur-md">
                    <span className="material-symbols-outlined text-secondary-container">auto_towing</span>
                    <span className="font-label-caps">Towing Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-xl bg-surface-container-low">
          <div className="container mx-auto px-gutter max-w-container-max">
            <div className="text-center mb-xl">
              <h2 className="font-h1 text-h1 text-primary mb-sm">How It Works</h2>
              <p className="text-on-surface-variant font-body-md">Three simple steps to peace of mind</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl relative">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-lg shadow-lg group-hover:scale-110 transition-transform relative z-10">
                  <span className="material-symbols-outlined text-primary text-[40px]">app_registration</span>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-container text-primary font-bold rounded-full flex items-center justify-center">1</span>
                </div>
                <h4 className="font-h2 text-h2 text-primary mb-sm">Request</h4>
                <p className="text-on-surface-variant font-body-md">Choose your service and tell us what you need fixed.</p>
              </div>
              {/* Step 2 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-lg shadow-lg group-hover:scale-110 transition-transform relative z-10">
                  <span className="material-symbols-outlined text-primary text-[40px]">request_quote</span>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-container text-primary font-bold rounded-full flex items-center justify-center">2</span>
                </div>
                <h4 className="font-h2 text-h2 text-primary mb-sm">Quote</h4>
                <p className="text-on-surface-variant font-body-md">Receive a transparent, fair pricing quote instantly.</p>
              </div>
              {/* Step 3 */}
              <div className="text-center group">
                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-lg shadow-lg group-hover:scale-110 transition-transform relative z-10">
                  <span className="material-symbols-outlined text-primary text-[40px]">task_alt</span>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-container text-primary font-bold rounded-full flex items-center justify-center">3</span>
                </div>
                <h4 className="font-h2 text-h2 text-primary mb-sm">Solve</h4>
                <p className="text-on-surface-variant font-body-md">Your technician arrives and completes the job perfectly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-xl">
          <div className="container mx-auto px-gutter max-w-container-max">
            <div className="flex flex-wrap justify-around items-center gap-xl bg-white p-xl rounded-2xl shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div>
                  <p className="font-h2 text-h2 text-primary">Verified Technicians</p>
                  <p className="text-on-surface-variant font-body-md">Background checked professionals</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                </div>
                <div>
                  <p className="font-h2 text-h2 text-primary">Fair Pricing</p>
                  <p className="text-on-surface-variant font-body-md">No hidden fees, upfront quotes</p>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_searching</span>
                </div>
                <div>
                  <p className="font-h2 text-h2 text-primary">Real-time Tracking</p>
                  <p className="text-on-surface-variant font-body-md">Track your help live on map</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Promo */}
        <section className="py-xl overflow-hidden">
          <div className="container mx-auto px-gutter max-w-container-max">
            <div className="bg-primary-container rounded-[2rem] p-xl flex flex-col md:flex-row items-center justify-between gap-xl relative overflow-hidden">
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px]"></div>
              <div className="text-left md:w-1/2 z-10">
                <h2 className="font-display-lg text-display-lg text-white mb-md">Control everything from your phone.</h2>
                <p className="text-on-primary-container text-body-lg mb-xl font-body-lg">Download the Fixaway app for a faster experience, exclusive discounts, and prioritized service scheduling.</p>
                <div className="flex flex-wrap gap-md justify-end">
                  <button onClick={() => showToast('App coming soon!', 'info')} className="bg-black text-white px-lg py-sm rounded-lg flex items-center gap-md border border-white/20 hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-h1">phone_iphone</span>
                    <div className="text-right">
                      <p className="text-[10px] font-label-caps uppercase">Download on</p>
                      <p className="font-bold text-body-md">App Store</p>
                    </div>
                  </button>
                  <button onClick={() => showToast('App coming soon!', 'info')} className="bg-black text-white px-lg py-sm rounded-lg flex items-center gap-md border border-white/20 hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-h1">play_arrow</span>
                    <div className="text-right">
                      <p className="text-[10px] font-label-caps uppercase">Get it on</p>
                      <p className="font-bold text-body-md">Google Play</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center items-center z-10">
                <img className="w-full max-w-[400px] h-auto rounded-[3rem] shadow-2xl border-8 border-primary rotate-3" alt="App preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx_mjSkuYfW3NkEjCJoP0B6ZCvC_kjY-_P-Kv0-p3cSMhOZ7ayaS3CBsv2RJ31Ic3-DgBlr5RLdcgrpHqEbQR4p1mhVO-cHViXoMtfylIfkn6f2EwnNNGEiLeO4In-L-9COVVqGOnZsxujOU90BiLwoNV_AjIjiJ-LhgOglrtf0hzWQrEdoKnKY4KPzTy6-aKLVVFyrEyr7pMiT5C8YGXpjLPnRttBWw1YHp3RRX_d80dUbbyp9S6ylz25pm9agkFnzCDHNF83BuU" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-end pb-4 px-2 bg-surface/90 backdrop-blur-lg border-t border-white/50 shadow-[0px_-4px_20px_rgba(26,54,93,0.05)] z-50">
        <Link href="/" className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full w-12 h-12 mb-2 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[8px] font-label-caps mt-1">Explore</span>
        </Link>
        <Link href="/customer/requests" className="flex flex-col items-center justify-center text-on-surface-variant active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[8px] font-label-caps mt-1">Requests</span>
        </Link>
        <Link href="/customer/emergency" className="flex flex-col items-center justify-center text-on-surface-variant active:scale-90 transition-transform">
          <span className="material-symbols-outlined">emergency_share</span>
          <span className="text-[8px] font-label-caps mt-1">SOS</span>
        </Link>
        <Link href="/customer/profile" className="flex flex-col items-center justify-center text-on-surface-variant active:scale-90 transition-transform">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[8px] font-label-caps mt-1">Profile</span>
        </Link>
      </nav>

      {/* SOS FAB */}
      <Link href="/customer/emergency" className="fixed bottom-24 right-6 md:right-10 w-16 h-16 bg-secondary-container text-primary rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-all group border border-white/20">
        <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_share</span>
        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-sm py-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">SOS HELP</span>
      </Link>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-8 px-gutter bg-surface">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <p>© {new Date().getFullYear()} Fixaway. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <a href="mailto:support@fixaway.com" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
