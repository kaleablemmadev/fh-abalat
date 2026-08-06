import prisma from "@/src/lib/prisma";
import MezmurMemberListClient from "./components/MezmurMemberListClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function MezmurMembersPage() {
  // Fetch members who are either:
  // 1. REGULAR_MEMBER (automatic core choir)
  // 2. Any other type with a manual Mezmur enrollment (Beginners/Continuous)
  const members = await prisma.user.findMany({
    where: {
      type: "MEMBER",
      isActive: true,
      OR: [
        { memberTypes: { has: "REGULAR_MEMBER" } },
        { mezmurEnrollments: { some: { status: "ACTIVE" } } }
      ]
    },
    include: {
      mezmurEnrollments: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            መዝሙር አጥኚ አባላት
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            መዝሙር አጥኚ አባላትን መከታተያ
          </p>
        </div>

        <Link
          href="/mezmur/members/new"
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0"
          style={{
            background: "hsl(25 70% 45%)",
            color: "#fff",
          }}
        >
          <Plus size={14} />
          ዐዲስ አባል
        </Link>
      </div>

      <MezmurMemberListClient members={members as any} />
    </div>
  );
}
