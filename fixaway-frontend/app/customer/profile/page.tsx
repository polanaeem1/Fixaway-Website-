'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function CustomerProfilePage() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: ''
  });

  const handleSignOut = () => {
    clearAuth();
    router.replace('/login');
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const { data } = await authApi.updateProfile(accessToken, formData);
      setAuth(data, accessToken, useAuthStore.getState().refreshToken || '');
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' })); // Clear password field
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary to-primary-container relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-2xl border-4 border-white bg-primary-container shadow-lg flex items-center justify-center text-primary text-4xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">edit</span> Edit
            </button>
          ) : (
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => setIsEditing(false)} className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving} className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSaving ? 'Saving...' : <><span className="material-symbols-outlined text-[16px]">save</span> Save</>}
              </button>
            </div>
          )}
        </div>
        <div className="pt-16 pb-6 px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">{user?.name || 'Customer'}</h2>
              <p className="text-on-surface-variant mt-1">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verified Customer
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Account Role</p>
              <p className="font-bold text-primary">Customer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6">
        <h3 className="font-bold text-primary text-lg mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">person</span>
          Personal Information
        </h3>
        
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Full Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Phone Number</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">New Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Leave blank to keep current" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: user?.name || '—', icon: 'person' },
              { label: 'Phone Number', value: user?.phone || 'Not set', icon: 'phone' },
              { label: 'Email Address', value: user?.email || '—', icon: 'mail' },
              { label: 'Role', value: 'Customer', icon: 'badge' },
            ].map(f => (
              <div key={f.label} className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface-variant">{f.label}</p>
                  <p className="font-semibold text-on-surface text-sm truncate">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10">
          <h3 className="font-bold text-primary text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Account Settings
          </h3>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {[
            { label: 'Sign Out', icon: 'logout', desc: 'Sign out of all devices', danger: true, action: handleSignOut },
          ].map(item => (
            <button key={item.label} onClick={item.action} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-lowest transition-colors text-left">
              <span className={`material-symbols-outlined ${item.danger ? 'text-error' : 'text-on-surface-variant'} text-[22px]`}>{item.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${item.danger ? 'text-error' : 'text-on-surface'}`}>{item.label}</p>
                <p className="text-xs text-on-surface-variant">{item.desc}</p>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
