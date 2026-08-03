// /mezmur/admin-registration/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, UserPlus } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function MezmurAdminRegistrationPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/mezmur/admin-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/mezmur/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in p-6 max-w-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'ዋና ገጽ', href: '/' },
          { label: 'መዝሙር', href: '/mezmur' },
          { label: 'አድሚን ምዝገባ' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          የመዝሙር አድሚን ምዝገባ
        </h1>

        <div className="rounded border p-6 space-y-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            ለመዝሙር ክፍል እንደ አድሚን (ክፍል አባል) ተመዝገቡ። ከተመዘገባችሁ በኋላ የክፍል ኀላፊ ዐይቶ ያስገባችኋል።
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ሙሉ ስም አስገባ"
                className="w-full px-4 py-2 rounded border text-sm"
                style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ኢሜይል ጻፍ"
                className="w-full px-4 py-2 rounded border text-sm"
                style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                  style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
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

            {success && (
              <div className="p-3 rounded text-sm" style={{ background: 'hsl(160 40% 12%)', color: 'hsl(160 60% 55%)' }}>
                Registration submitted successfully. Redirecting to login...
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              style={{ background: 'hsl(25 70% 32%)', color: '#fff' }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> Submit Application</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
