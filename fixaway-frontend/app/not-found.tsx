import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-primary-container/20 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            search_off
          </span>
        </div>
        <h1 className="text-7xl font-black text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold text-on-surface mb-4">Page Not Found</h2>
        <p className="text-on-surface-variant mb-8">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Go Home
          </Link>
          <Link
            href="/customer/dashboard"
            className="border border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary-container/10 transition-all active:scale-95"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
