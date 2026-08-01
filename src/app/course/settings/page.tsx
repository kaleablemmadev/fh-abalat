// /course/settings/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function CourseSettingsPage() {
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
      const response = await fetch('/api/course/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          mode: 'COURSE',
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
    router.push('/course/login');
    router.refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-10">
      <Breadcrumb
        items={[
          { label: 'ዋና ገጽ', href: '/course' },
          { label: 'ቅንብሮች' },
        ]}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Course Settings
          </h1>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Manage your account security and application preferences.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8 space-y-8 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
              <Lock size={20} className="text-[hsl(var(--primary))]" />
              Change Mode Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Verify with current password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[hsl(var(--border))]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={16} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-xs font-medium bg-[hsl(0,40%,10%)] text-[hsl(0,55%,62%)] border border-[hsl(0,40%,22%)] animate-slide-in">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg text-xs font-medium bg-[hsl(160,40%,12%)] text-[hsl(160,60%,55%)] border border-[hsl(160,30%,20%)] animate-slide-in">
                  Password changed successfully
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-[0.98] shadow-md shadow-[hsl(var(--primary)/0.2)] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>

          <div className="pt-8 border-t border-[hsl(var(--border))] flex justify-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
            >
              <ArrowLeft size={16} />
              Logout from Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
