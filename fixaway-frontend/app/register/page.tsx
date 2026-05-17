'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi, ApiError } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (!phone) errs.phone = "Phone number is required";
    else if (!/^\+?[0-9\s\-]{8,15}$/.test(phone)) errs.phone = "Invalid phone format";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (role === 'TECHNICIAN' && selectedServices.length === 0) {
      errs.services = "Please select at least one service";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep1()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setStep(2);
  };

  const toggleService = (s: string) =>
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleCreate = async () => {
    if (!validateStep2()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
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
          <motion.div
            animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
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
                  <input value={firstName} onChange={e => { setFirstName(e.target.value); if (fieldErrors.firstName) setFieldErrors(prev => ({...prev, firstName: undefined})); }} type="text" placeholder="John"
                    className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl focus:outline-none focus:ring-2 transition-all ${fieldErrors.firstName ? 'border-error/50 focus:ring-error text-error' : 'border-outline-variant/50 focus:ring-primary'}`} />
                  <AnimatePresence>
                    {fieldErrors.firstName && (
                      <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-error text-xs font-semibold flex items-center gap-1 overflow-hidden">
                        <span className="material-symbols-outlined text-[14px]">error</span> {fieldErrors.firstName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Last Name</label>
                  <input value={lastName} onChange={e => { setLastName(e.target.value); if (fieldErrors.lastName) setFieldErrors(prev => ({...prev, lastName: undefined})); }} type="text" placeholder="Doe"
                    className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl focus:outline-none focus:ring-2 transition-all ${fieldErrors.lastName ? 'border-error/50 focus:ring-error text-error' : 'border-outline-variant/50 focus:ring-primary'}`} />
                  <AnimatePresence>
                    {fieldErrors.lastName && (
                      <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-error text-xs font-semibold flex items-center gap-1 overflow-hidden">
                        <span className="material-symbols-outlined text-[14px]">error</span> {fieldErrors.lastName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Email Address</label>
                <div className="relative">
                  <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] transition-colors ${fieldErrors.email ? 'text-error' : 'text-outline'}`}>mail</span>
                  <input value={email} onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: undefined})); }} type="email" placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 bg-surface-container-low border rounded-xl focus:outline-none focus:ring-2 transition-all ${fieldErrors.email ? 'border-error/50 focus:ring-error text-error' : 'border-outline-variant/50 focus:ring-primary'}`} />
                </div>
                <AnimatePresence>
                  {fieldErrors.email && (
                    <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-error text-xs font-semibold flex items-center gap-1 overflow-hidden">
                      <span className="material-symbols-outlined text-[14px]">error</span> {fieldErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Phone Number</label>
                <div className="relative">
                  <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] transition-colors ${fieldErrors.phone ? 'text-error' : 'text-outline'}`}>phone</span>
                  <input value={phone} onChange={e => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors(prev => ({...prev, phone: undefined})); }} type="tel" placeholder="+20 1XX XXX XXXX"
                    className={`w-full pl-10 pr-4 py-3 bg-surface-container-low border rounded-xl focus:outline-none focus:ring-2 transition-all ${fieldErrors.phone ? 'border-error/50 focus:ring-error text-error' : 'border-outline-variant/50 focus:ring-primary'}`} />
                </div>
                <AnimatePresence>
                  {fieldErrors.phone && (
                    <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-error text-xs font-semibold flex items-center gap-1 overflow-hidden">
                      <span className="material-symbols-outlined text-[14px]">error</span> {fieldErrors.phone}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Password</label>
                <div className="relative">
                  <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] transition-colors ${fieldErrors.password ? 'text-error' : 'text-outline'}`}>lock</span>
                  <input value={password} onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: undefined})); }} type="password" placeholder="Create a strong password"
                    className={`w-full pl-10 pr-4 py-3 bg-surface-container-low border rounded-xl focus:outline-none focus:ring-2 transition-all ${fieldErrors.password ? 'border-error/50 focus:ring-error text-error' : 'border-outline-variant/50 focus:ring-primary'}`} />
                </div>
                <AnimatePresence>
                  {fieldErrors.password && (
                    <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-error text-xs font-semibold flex items-center gap-1 overflow-hidden">
                      <span className="material-symbols-outlined text-[14px]">error</span> {fieldErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={handleNextStep}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
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
                    <button key={s} onClick={() => { toggleService(s); if (fieldErrors.services) setFieldErrors(prev => ({...prev, services: undefined})); }}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedServices.includes(s) ? 'bg-primary text-white border-primary' : fieldErrors.services ? 'border-error/50 text-error' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/40'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {fieldErrors.services && (
                    <motion.p initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-error text-xs font-semibold flex items-center gap-1 overflow-hidden">
                      <span className="material-symbols-outlined text-[14px]">error</span> {fieldErrors.services}
                    </motion.p>
                  )}
                </AnimatePresence>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
