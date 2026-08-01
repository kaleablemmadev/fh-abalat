// /src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function MemberAccessPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/member/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Access denied');
      }

      const user = data.user;

      // Set session cookie for the identified member
      document.cookie = `mode_session=${JSON.stringify({
        userId: user.id,
        userType: 'MEMBER',
        fullName: user.fullName,
        memberType: user.memberType,
        mode: 'MEMBER',
        timestamp: Date.now(),
      })}; path=/; max-age=86400`; // 24 hours

      if (user.memberType === 'COURSE_STUDENT') {
        router.push('/student');
      } else {
        router.push('/member');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-8 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            ፍሬ ሃይማኖት አባላት
          </h1>
          <p className="text-slate-400">
            የግል ቁጥር ያስገቡ (ምሳሌ፡ "FH-0001 [የግል ቁጥሮን]")
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleAccess} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Access Code
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ምሳሌ... FH-0001"
                  className="w-full ml-4 pl-12 pr-4 py-4 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700 tracking-widest"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-900/30 border border-red-800/50 text-red-400 text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  ግባ
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Your access code is unique to you. <br />
              If you don't have one, please contact your administrator.
            </p>

            <Link
              href="/admin-portal"
              className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors py-2 px-3 rounded hover:bg-slate-800/50"
            >
              <Settings size={12} />
              Administrator Access
            </Link>
          </div>
        </div>

        <div className="text-center">
           <p className="text-[10px] text-slate-700 font-medium uppercase tracking-[0.2em]">
             Participation Management System
           </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
