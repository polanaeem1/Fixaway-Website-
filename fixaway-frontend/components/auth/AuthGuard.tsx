'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/store/auth.store';
import { authApi } from '@/lib/api';

interface Props {
  children: React.ReactNode;
  requiredRole?: Role;
}

export default function AuthGuard({ children, requiredRole }: Props) {
  const { isAuthenticated, user, accessToken, updateUser, clearAuth } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Sync state and live data
  useEffect(() => {
    setIsMounted(true);

    if (isAuthenticated && accessToken) {
      authApi.getMe(accessToken)
        .then(res => {
          if (res.data) updateUser(res.data);
        })
        .catch(err => {
          if (err?.status === 401) {
            clearAuth();
          }
        });
    }
  }, [isAuthenticated, accessToken, updateUser, clearAuth]);

  // Handle redirects
  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      // Preserve destination for post-login redirect
      const next = typeof window !== 'undefined' ? window.location.pathname : '';
      const redirectPath = next && next !== '/login' ? `/login?next=${encodeURIComponent(next)}` : '/login';
      router.replace(redirectPath);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      const roleRedirects: Record<Role, string> = {
        CUSTOMER: '/customer/dashboard',
        TECHNICIAN: '/technician/dashboard',
        ADMIN: '/admin/dashboard',
      };
      router.replace(roleRedirects[user?.role as Role] || '/login');
    }
  }, [isMounted, isAuthenticated, user, requiredRole, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}
