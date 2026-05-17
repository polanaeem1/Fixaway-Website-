'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function TechnicianSettingsPage() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.technicianProfile?.bio || '',
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
      setFormData(prev => ({ ...prev, password: '' })); // Clear password
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-md md:px-lg pb-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Settings & Profile</h1>
        <p className="text-on-surface-variant mt-1">Manage your professional profile and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-primary-container relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden bg-secondary-container shadow-lg flex items-center justify-center text-primary text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'T'}
            </div>
          </div>
        </div>
        <div className="pt-14 pb-6 px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-primary">{user?.name || 'Technician'}</h2>
              <p className="text-on-surface-variant text-sm">{user?.email || '—'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verified Technician
                </span>
                <span className="bg-yellow-50 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full">4.9 ★</span>
              </div>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="border border-outline-variant px-4 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="border border-outline-variant px-4 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={isSaving} className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? 'Saving...' : <><span className="material-symbols-outlined text-[16px]">save</span> Save</>}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">Bio / Description</label>
                <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[80px]" placeholder="Tell customers about your experience..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">New Password</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Leave blank to keep current" />
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-outline-variant/10">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase mb-2">About Me</h3>
              <p className="text-sm text-on-surface leading-relaxed">
                {user?.technicianProfile?.bio || 'No bio provided. Edit your profile to add one!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6">
        <h3 className="font-bold text-primary text-lg mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">fact_check</span>
          Verification Documents
        </h3>
        <div className="space-y-3">
          {[
            { label: 'National ID', status: 'Verified', icon: 'badge', ok: true },
            { label: 'Trade Certificate', status: 'Verified', icon: 'workspace_premium', ok: true },
            { label: 'Criminal Record', status: 'Pending Review', icon: 'gavel', ok: false },
          ].map(d => (
            <div key={d.label} className={`flex items-center justify-between p-4 rounded-xl border ${d.ok ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${d.ok ? 'text-green-600' : 'text-yellow-600'} text-[22px]`}>{d.icon}</span>
                <span className="font-semibold text-on-surface text-sm">{d.label}</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.ok ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {d.status}
              </span>
            </div>
          ))}
          <button className="w-full border-2 border-dashed border-outline-variant/50 rounded-xl py-4 text-on-surface-variant text-sm font-semibold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            Upload New Document
          </button>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6">
        <h3 className="font-bold text-primary text-lg mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">schedule</span>
          Working Hours
        </h3>
        <div className="space-y-3">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
            <div key={day} className="flex items-center justify-between">
              <div className="flex items-center gap-3 w-32">
                <div className={`w-3 h-3 rounded-full ${i < 5 ? 'bg-green-500' : 'bg-outline-variant'}`} />
                <span className="text-sm font-medium text-on-surface">{day}</span>
              </div>
              {i < 5 ? (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="bg-surface-container-low px-3 py-1 rounded-lg font-mono">09:00 AM</span>
                  <span>—</span>
                  <span className="bg-surface-container-low px-3 py-1 rounded-lg font-mono">06:00 PM</span>
                  <button className="text-primary ml-2 hover:underline text-xs">Edit</button>
                </div>
              ) : (
                <span className="text-sm text-on-surface-variant">Day Off</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="divide-y divide-outline-variant/10">
          {[
            { label: 'Sign Out', icon: 'logout', desc: 'Sign out of your account', danger: true, action: handleSignOut },
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
