'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi, ApiError } from '@/lib/api';

type RoleType = 'CUSTOMER' | 'TECHNICIAN';
const services = ['Plumbing', 'Electrical', 'AC & Cooling', 'Carpentry', 'Painting', 'Roadside Assistance'];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [role, setRole] = useState<RoleType>('CUSTOMER');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');

  const toggleService = (s: string) =>
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        password,
        role,
      });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      const redirect = role === 'CUSTOMER' ? '/customer/dashboard' : '/technician/dashboard';
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Server unavailable. Please check the backend is running.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-2/5 bg-primary flex-col justify-center items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="material-symbols-outlined text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>handyman</span>
            <span className="text-white font-bold text-3xl">Fixaway</span>
          </div>
          <h1 className="text-white text-4xl font-bold mb-4">Join Fixaway</h1>
          <p className="text-white/70 text-lg leading-relaxed">Whether you need a service or provide one — we have a place for you.</p>
          <div className="mt-12 space-y-4">
            {['Instant service matching', 'Verified & trusted professionals', 'Real-time job tracking', 'Secure in-app payments'].map(f => (
              <div key={f} className="flex items-center gap-3 text-white/80">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary w-8' : 'bg-outline-variant w-4'}`} />
              ))}
              <span className="text-xs text-outline ml-2">Step {step} of 2</span>
            </div>
            <h2 className="text-3xl font-bold text-primary">{step === 1 ? 'Create your account' : role === 'CUSTOMER' ? 'Almost done!' : 'Your expertise'}</h2>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm">
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {(['CUSTOMER', 'TECHNICIAN'] as RoleType[]).map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${role === r ? 'border-primary bg-primary-container' : 'border-outline-variant/40 bg-surface-container-low hover:border-primary/40'}`}>
                    <span className="material-symbols-outlined text-4xl mb-3 block text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {r === 'CUSTOMER' ? 'person' : 'engineering'}
                    </span>
                    <p className="font-bold text-primary text-lg">{r === 'CUSTOMER' ? 'Customer' : 'Technician'}</p>
                    <p className="text-on-surface-variant text-sm mt-1">{r === 'CUSTOMER' ? 'I need home services' : 'I provide services'}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} type="text" placeholder="John"
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} type="text" placeholder="Doe"
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">phone</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+20 1XX XXX XXXX"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                  <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Create a strong password"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <button onClick={() => setStep(2)}
                disabled={!firstName || !email || !password}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                Continue <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          )}

          {step === 2 && role === 'CUSTOMER' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Home Address <span className="text-outline font-normal">(optional)</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">location_on</span>
                  <input value={address} onChange={e => setAddress(e.target.value)} type="text" placeholder="e.g. New Cairo, 5th Settlement"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="bg-primary-container/30 rounded-2xl p-5 border border-primary/10">
                <p className="font-semibold text-primary mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">verified</span> Signing up as a Customer</p>
                <p className="text-sm text-on-surface-variant">You can request home maintenance and roadside assistance from verified technicians.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold hover:bg-surface-container-low transition-all">Back</button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && role === 'TECHNICIAN' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-3">Your Service Categories</label>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => (
                    <button key={s} onClick={() => toggleService(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedServices.includes(s) ? 'bg-primary text-white border-primary' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/40'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Years of Experience</label>
                <select className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Less than 1 year</option><option>1-3 years</option><option>3-5 years</option><option>5+ years</option>
                </select>
              </div>
              <div className="bg-secondary-container/30 rounded-2xl p-4 border border-secondary/10 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
                <p className="text-sm text-on-surface-variant">Your profile will be reviewed before activation. You will need to upload your national ID and certifications.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold hover:bg-surface-container-low transition-all">Back</button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-8">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
