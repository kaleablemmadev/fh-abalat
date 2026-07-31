// /mezmur/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function MezmurLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/mezmur/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const user = data.user;
      
      // Set session cookie
      document.cookie = `mode_session=${JSON.stringify({
        userId: user.id,
        userType: user.type,
        fullName: user.fullName,
        mode: 'MEZMUR',
        timestamp: Date.now(),
      })}; path=/; max-age=86400`; // 24 hours

      if (user.mustChangePassword) {
        setUserId(user.id);
        setShowChangePassword(true);
      } else {
        router.push('/mezmur');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/mezmur/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword: password,
          newPassword
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      // Password changed successfully, proceed to dashboard
      router.push('/mezmur');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const skipChangePassword = () => {
    router.push('/mezmur');
    router.refresh();
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              Update Password
            </h1>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              You are using a temporary password. Would you like to update it?
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                  style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                  style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded text-sm" style={{ background: 'hsl(0 40% 12%)', color: 'hsl(0 55% 55%)' }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={skipChangePassword}
                className="py-2 px-4 rounded border text-sm font-medium transition-colors"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{ background: 'hsl(25 70% 32%)', color: '#fff' }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Mezmur Mode
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Enter your credentials to access the system
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@mezmur.com"
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
            <label htmlFor="password" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'hsl(25 70% 32%)',
              color: '#fff',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            New admin? <a href="/mezmur/admin-registration" className="font-semibold underline" style={{ color: 'hsl(var(--primary))' }}>Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
