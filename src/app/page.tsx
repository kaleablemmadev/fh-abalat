// /src/app/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Settings,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';

export default function MemberAccessPage() {
  const router = useRouter();
  const [part1, setPart1] = useState(''); // 4 random digits
  const [part2, setPart2] = useState(''); // 2 year digits
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const part2Ref = useRef<HTMLInputElement>(null);

  const handleAccess = async (context: 'ABALAT' | 'COURSE') => {
    if (part1.length !== 4 || part2.length !== 2) {
      setError('እባክዎ ትክክለኛውን 6 ቁጥር ኮድ ያስገቡ');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/member/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part1, part2, context }),
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
        memberTypes: user.memberTypes,
        mode: 'MEMBER',
        privateId: user.privateId,
        coursePrivateId: user.coursePrivateId,
        activeRole: context,
        timestamp: Date.now(),
      })}; path=/; max-age=86400`; // 24 hours

      router.push('/member');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onPart1Change = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    setPart1(numeric);
    if (numeric.length === 4) {
      part2Ref.current?.focus();
    }
  };

  const onPart2Change = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    setPart2(numeric);
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
            የግል ኮድዎን ያስገቡ (ምሳሌ፡ "0098 76")
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Access Code
              </label>
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={part1}
                    onChange={(e) => onPart1Change(e.target.value)}
                    placeholder="XXXX"
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-800 tracking-widest text-center"
                    required
                    autoFocus
                  />
                </div>
                <div className="text-slate-700 font-bold">-</div>
                <div className="w-24">
                  <input
                    ref={part2Ref}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={part2}
                    onChange={(e) => onPart2Change(e.target.value)}
                    placeholder="YY"
                    className="w-full px-4 py-4 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-800 tracking-widest text-center"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-900/30 border border-red-800/50 text-red-400 text-center animate-shake">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
               <button
                  onClick={() => handleAccess('ABALAT')}
                  disabled={isLoading || part1.length < 4 || part2.length < 2}
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : "የአባልነት መግቢያ (Abalat Member)"}
                </button>
                <button
                  onClick={() => handleAccess('COURSE')}
                  disabled={isLoading || part1.length < 4 || part2.length < 2}
                  className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : "የተማሪነት መግቢያ (Course Student)"}
                </button>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="w-full py-3 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                አዲስ ተማሪ? እዚህ ይመዝገቡ
                <UserPlus size={14} />
              </Link>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-800">
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
