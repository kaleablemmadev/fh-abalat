import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Mic2, Calendar, User, Phone, MapPin, Edit, ArrowLeft, CheckCircle2 } from "lucide-react";

const groupLabels: Record<string, string> = {
  BEGINNERS: "ጀማሪ (Beginners)",
  CONTINUOUS: "ቀጣይ (Continuous)",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  WITHDREW: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function MezmurSingerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      mezmurEnrollments: {
        orderBy: { createdAt: "desc" }
      },
      attendances: {
        where: {
            event: {
                eventType: { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] }
            }
        },
        include: { event: true, attendanceType: true },
        orderBy: { event: { date: "desc" } },
        take: 5
      }
    }
  });

  if (!member) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-6">
      <div className="flex items-center justify-between">
        <Link href="/mezmur/members" className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> Back to Singers
        </Link>
        <Link
          href={`/mezmur/members/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-bold hover:bg-[hsl(var(--accent))] transition-all"
        >
          <Edit size={16} /> Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] p-6 text-center" style={{ background: "hsl(var(--card))" }}>
            <div className="w-20 h-20 rounded-full bg-[hsl(25_70%_45%)]/10 text-[hsl(25_70%_45%)] flex items-center justify-center mx-auto mb-4 border-2 border-[hsl(25_70%_45%)]/20">
              <User size={40} />
            </div>
            <h2 className="text-xl font-bold">{member.fullName || "Unnamed"}</h2>
            <p className="text-xs opacity-50 uppercase tracking-widest mt-1 font-bold">Singer Profile</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Contact Details</h3>

            <div className="flex items-center gap-3">
              <Phone size={14} className="opacity-40" />
              <div className="min-w-0">
                <p className="text-[10px] opacity-40 uppercase font-bold">Phone</p>
                <p className="text-sm font-medium truncate">{member.phoneNumber || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={14} className="opacity-40" />
              <div className="min-w-0">
                <p className="text-[10px] opacity-40 uppercase font-bold">Address</p>
                <p className="text-sm font-medium truncate">{member.address || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={14} className="opacity-40" />
              <div className="min-w-0">
                <p className="text-[10px] opacity-40 uppercase font-bold">Age</p>
                <p className="text-sm font-medium">{member.age ? `${member.age} years` : "Unknown"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Group & History */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
              <Mic2 size={18} className="opacity-50" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Group Enrollment</h3>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {member.mezmurEnrollments.map((en) => (
                <div key={en.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{groupLabels[en.groupType]}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">Enrolled on {en.enrolledDate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${statusColors[en.status]}`}>
                    {en.status}
                  </span>
                </div>
              ))}
              {member.mezmurEnrollments.length === 0 && (
                <div className="p-12 text-center opacity-30 text-sm italic">Not enrolled in any groups.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
              <CheckCircle2 size={18} className="opacity-50" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Recent Attendance</h3>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {member.attendances.map((at) => (
                <div key={at.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{at.event.title}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">{new Date(at.event.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-medium opacity-60">
                    {at.attendanceType.name}
                  </span>
                </div>
              ))}
              {member.attendances.length === 0 && (
                <div className="p-12 text-center opacity-30 text-sm italic">No recent attendance records.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
