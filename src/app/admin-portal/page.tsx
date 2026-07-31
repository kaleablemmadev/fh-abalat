import Link from 'next/link';
import { ChevronRight, Users, GraduationCap, Music, ArrowLeft } from 'lucide-react';

export default function AdminPortalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-zinc-950">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to Member Access
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Administrative Portal
          </h1>
          <p className="text-zinc-400">
            Select a management mode to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Abalat Card */}
          <Link
            href="/abalat"
            className="group relative rounded-xl p-8 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl bg-zinc-900 border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <div className="flex items-start justify-between mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500"
              >
                <Users size={28} />
              </div>
              <ChevronRight
                size={22}
                className="transition-transform duration-200 group-hover:translate-x-1 text-emerald-500/50"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">
              Abalat
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Member management, events, attendance tracking, and eligibility rules
            </p>
          </Link>

          {/* Course Card */}
          <Link
            href="/course"
            className="group relative rounded-xl p-8 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl bg-zinc-900 border border-sky-500/20 hover:border-sky-500/40"
          >
            <div className="flex items-start justify-between mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-sky-500/10 text-sky-500"
              >
                <GraduationCap size={28} />
              </div>
              <ChevronRight
                size={22}
                className="transition-transform duration-200 group-hover:translate-x-1 text-sky-500/50"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">
              Course
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Course attendance, marks management, and student eligibility
            </p>
          </Link>

          {/* Mezmur Card */}
          <Link
            href="/mezmur"
            className="group relative rounded-xl p-8 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl bg-zinc-900 border border-amber-500/20 hover:border-amber-500/40"
          >
            <div className="flex items-start justify-between mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500"
              >
                <Music size={28} />
              </div>
              <ChevronRight
                size={22}
                className="transition-transform duration-200 group-hover:translate-x-1 text-amber-500/50"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">
              Mezmur
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Ethiopian Orthodox hymn management, songs, and service scheduling
            </p>
          </Link>
        </div>

        <div className="text-center pt-8">
           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
             Authorized Personnel Only
           </p>
        </div>
      </div>
    </div>
  );
}
