// /mezmur/settings/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function MezmurSettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/mezmur/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          mode: 'MEZMUR',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'mode_session=; path=/; max-age=0';
    router.push('/mezmur/login');
    router.refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/mezmur' },
          { label: 'Settings' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Settings
        </h1>

        <div className="rounded border p-6 space-y-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Change Mode Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded text-sm" style={{ background: 'hsl(0 40% 12%)', color: 'hsl(0 55% 55%)' }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded text-sm" style={{ background: 'hsl(160 40% 12%)', color: 'hsl(160 60% 55%)' }}>
                  Password changed successfully
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'hsl(160 70% 32%)',
                  color: '#fff',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <ArrowLeft size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
