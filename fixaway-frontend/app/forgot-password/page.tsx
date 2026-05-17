'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      // Call backend reset endpoint (or gracefully handle if not implemented yet)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStep('sent');
    } catch {
      // Show success anyway for security
      setStep('sent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-lowest via-surface to-primary-container/10 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>handyman</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Fixaway</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-primary/10 border border-outline-variant/20 p-8">
          {step === 'input' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-primary">Forgot Password</h2>
                <p className="text-sm text-on-surface-variant mt-1">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Email Address</label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] transition-colors ${error ? 'text-error' : 'text-outline'}`}>mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      className={`w-full pl-10 pr-4 py-3 bg-surface-container-low border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-error/50 focus:ring-error' : 'border-outline-variant/50 focus:ring-primary'}`}
                    />
                  </div>
                  {error && (
                    <p className="text-error text-xs font-semibold flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-[14px]">error</span> {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">send</span> Send Reset Link</>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Check your inbox</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
              </p>
              <button onClick={() => { setStep('input'); setEmail(''); }} className="text-sm text-primary font-semibold hover:underline">
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
