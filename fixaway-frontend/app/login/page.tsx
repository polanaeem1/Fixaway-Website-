'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/store/auth.store';
import { authApi, ApiError } from '@/lib/api';
import { useEffect } from 'react';

const roleRedirects: Record<Role, string> = {
  CUSTOMER: '/customer/dashboard',
  TECHNICIAN: '/technician/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect already-logged-in users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleRedirects[user.role as Role] || '/customer/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      router.push(roleRedirects[user.role as Role] || '/customer/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to connect to server. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>handyman</span>
            <span className="text-white font-bold text-3xl tracking-tight">Fixaway</span>
          </div>
          <h1 className="text-white text-5xl font-bold leading-tight mb-6">
            Your Home.<br />Our Expertise.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Connect with verified, professional technicians for home maintenance and roadside assistance — anytime, anywhere.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: 'verified', label: '5,000+', sub: 'Verified Techs' },
            { icon: 'star', label: '4.9★', sub: 'Avg Rating' },
            { icon: 'speed', label: '<15 min', sub: 'Avg Response' },
          ].map(b => (
            <div key={b.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
              <span className="material-symbols-outlined text-secondary mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
              <p className="text-white font-bold text-lg">{b.label}</p>
              <p className="text-white/60 text-xs">{b.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>handyman</span>
            <span className="text-primary font-bold text-2xl">Fixaway</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">Welcome back</h2>
            <p className="text-on-surface-variant">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm">
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                  className="w-full pl-10 pr-12 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span className="material-symbols-outlined text-[20px]">login</span> Sign In</>
              }
            </button>

          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
