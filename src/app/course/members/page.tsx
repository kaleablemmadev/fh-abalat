import prisma from "@/src/lib/prisma";
import MemberListClient from "./components/MemberListClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CourseMembersPage() {
  // Fetch students (simplified to avoid timeout)
  const students = await prisma.user.findMany({
    where: {
      type: "MEMBER",
      roles: { has: "COURSE_STUDENT" },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  // Fetch all course classes for filtering
  const courseClasses = await prisma.courseClass.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { year: "desc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            ኮርሰኛ አባላት
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            የተማሪዎችን ዝርዝርና መረጃዎች ተመልከቱ
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/course/members/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 hover:bg-[hsl(217_70%_38%)]"
            style={{
              background: "hsl(217 70% 32%)",
              color: "#fff",
            }}
          >
            <Plus size={14} />
            ዐዲስ ተማሪ
          </Link>
          <Link
            href="/course/members/bulk-new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
          >
            <Plus size={14} />
            ብዙ ተማሪዎች
          </Link>
        </div>
      </div>

      <MemberListClient
        students={students as any}
        courseClasses={courseClasses as any}
      />
    </div>
  );
}
