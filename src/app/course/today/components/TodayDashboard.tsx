"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, Phone, UserX, Trash2,
  AlertTriangle, Bell, Calendar, Clock, ArrowRight,
  Loader2, CheckSquare, Users
} from "lucide-react";
import { formatEthiopianDate } from "@/src/lib/ethiopiancal";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TodayDashboardProps {
  initialData: {
    todayEvents: any[];
    pendingFollowUps: any[];
    recentNotifications: any[];
    activeYear: any;
  }
}

export default function TodayDashboard({ initialData }: TodayDashboardProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResolveFollowUp = async (id: string, status: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/course/follow-ups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        setData(prev => ({
          ...prev,
          pendingFollowUps: prev.pendingFollowUps.filter(f => f.id !== id)
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date();
  const ethToday = formatEthiopianDate(today);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header with Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">የዛሬ ተግባራት</h1>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">
            Today's Dashboard • {ethToday}
          </p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <Calendar className="text-blue-500" size={20} />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase opacity-40 leading-none">Gregorian</p>
            <p className="text-sm font-bold">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column: Classes and Follow-ups */}
        <div className="lg:col-span-2 space-y-8">

          {/* Today's Classes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckSquare size={20} className="text-blue-500" />
                የዛሬ ክፍሎች (Today's Classes)
              </h2>
            </div>

            <div className="grid gap-3">
              {data.todayEvents.length > 0 ? (
                data.todayEvents.map(event => {
                  const isRecorded = event.attendances?.length > 0 || event.instructorAttendances?.length > 0;
                  return (
                    <div
                      key={event.id}
                      className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                        !isRecorded
                          ? "bg-amber-500/5 border-amber-500/20 ring-1 ring-amber-500/10"
                          : "bg-[hsl(var(--card))] border-[hsl(var(--border))]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black">{event.title}</span>
                            {!isRecorded && (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full font-bold animate-pulse">
                                UNRECORDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs opacity-50 font-bold uppercase tracking-tighter">
                            {event.courseClass?.name} • {event.courseClass?.year}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/course/attendance/${event.courseClassId}?eventId=${event.id}`}
                            className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                          >
                            Student Attendance
                          </Link>
                          <Link
                            href={`/course/instructor-attendance?eventId=${event.id}`}
                            className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                          >
                            Instructor Attendance
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-10 text-center border-2 border-dashed rounded-3xl opacity-30 italic text-sm">
                  ዛሬ ምንም አይነት የታቀዱ ክፍሎች የሉም (No classes scheduled for today)
                </div>
              )}
            </div>
          </section>

          {/* Student Call List */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Phone size={20} className="text-emerald-500" />
              መደወል ያለባቸው ተማሪዎች (Call List)
            </h2>
            <div className="grid gap-3">
              {data.pendingFollowUps.length > 0 ? (
                data.pendingFollowUps.map(followUp => (
                  <div key={followUp.id} className="p-5 bg-white border border-[hsl(var(--border))] rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                        {followUp.student.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{followUp.student.fullName}</p>
                        <p className="text-xs text-blue-600 font-bold">{followUp.student.phoneNumber || "No Phone"}</p>
                        <p className="text-[10px] opacity-40 font-bold uppercase">{followUp.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveFollowUp(followUp.id, 'CALLED')}
                        className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                        title="Mark as Called"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        onClick={() => handleResolveFollowUp(followUp.id, 'REMOVED')}
                        className="p-2.5 bg-zinc-100 text-zinc-400 rounded-xl hover:bg-zinc-200 hover:text-zinc-600 transition-all"
                        title="Remove from List"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => handleResolveFollowUp(followUp.id, 'INACTIVE')}
                        className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        title="Deem Inactive"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center border-2 border-dashed rounded-3xl opacity-30 italic text-sm">
                  ምንም ክትትል የሚገባቸው ተማሪዎች የሉም (No students require immediate follow-up)
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Notifications & Info */}
        <div className="space-y-8">

          {/* Recent Notifications */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Bell size={14} />
              Recent Alerts
            </h2>
            <div className="space-y-3">
              {data.recentNotifications.map(note => (
                <div key={note.id} className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-black uppercase leading-tight">{note.title}</p>
                    {note.type === 'PERFORMANCE' && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs opacity-60 leading-normal">{note.message}</p>
                  <p className="text-[8px] font-bold opacity-30 uppercase pt-1">
                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {data.recentNotifications.length === 0 && (
                <p className="text-xs opacity-30 italic text-center py-4">No recent notifications</p>
              )}
            </div>
          </section>

          {/* Quick Stats / Info */}
          <section className="p-6 bg-zinc-900 text-white rounded-3xl space-y-4 shadow-xl">
             <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Current Term</h3>
             <div className="space-y-1">
               <p className="text-lg font-bold">{data.activeYear?.year || "None Active"}</p>
               <p className="text-[10px] font-medium opacity-50 uppercase tracking-tighter">
                 {data.activeYear ? `${formatEthiopianDate(new Date(data.activeYear.startDate))} - ${formatEthiopianDate(new Date(data.activeYear.endDate))}` : ""}
               </p>
             </div>

             <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black opacity-40 uppercase">Enrolled Students</p>
                  <p className="text-xl font-black">---</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black opacity-40 uppercase">Total Classes</p>
                  <p className="text-xl font-black">{data.activeYear?.classes?.length || 0}</p>
                </div>
             </div>

             <Link
              href="/course/academic-years"
              className="flex items-center justify-between w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
             >
                <span className="text-[10px] font-bold uppercase">Academic Settings</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
