import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { Users, Phone, ArrowRight, CheckSquare, Clock } from "lucide-react";
import { formatEthiopianDate } from "@/src/lib/ethiopiancal";

export const dynamic = 'force-dynamic';

export default async function AbalatRecommendationsPage() {
  const recommendations = await prisma.membershipRecommendation.findMany({
    where: { status: 'PENDING' },
    include: {
      student: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { courseClass: true }
          }
        }
      },
      recommendedBy: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Membership Recommendations</h1>
        <p className="text-sm mt-0.5 text-[hsl(var(--muted-foreground))]">
          Students from the Course module recommended for Regular Membership.
        </p>
      </div>

      <div className="grid gap-4">
        {recommendations.map(rec => (
          <div key={rec.id} className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl flex items-center justify-between shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xl">
                {rec.student.fullName?.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{rec.student.fullName}</h3>
                <div className="flex items-center gap-4 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                   <span className="flex items-center gap-1"><Phone size={14} /> {rec.student.phoneNumber || "No Phone"}</span>
                   <span className="flex items-center gap-1"><Clock size={14} /> Recommended on {formatEthiopianDate(rec.createdAt)}</span>
                </div>
                <div className="pt-1">
                   <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase">
                     Current Level: {rec.student.enrollments[0]?.courseClass?.name}
                   </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/abalat/members/new?recommendationId=${rec.id}&studentId=${rec.studentId}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                Register as Member <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed rounded-3xl opacity-30 italic text-sm">
            No pending recommendations found.
          </div>
        )}
      </div>
    </div>
  );
}
