// /members/components/MemberDetailClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Edit2, ArrowLeft } from "lucide-react";

interface Member {
  id: string;
  fullName: string | null;
  christianName: string | null;
  gender: "MALE" | "FEMALE";
  age: number;
  memberType: "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT" | null;
  type: string;
  registerDate: string | null;
}

const memberTypeLabels: Record<string, string> = {
  COURSE_STUDENT: "ኮርሰኛ አባል",
  REGULAR_MEMBER: "ወጣት አባል",
  YOUTH_STUDENT: "ማዕከላዊ አባል",
};

const memberTypeColors: Record<string, string> = {
  COURSE_STUDENT: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  REGULAR_MEMBER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  YOUTH_STUDENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const genderLabels: Record<string, string> = {
  MALE: "ወንድ",
  FEMALE: "ሴት",
};

export default function MemberDetailClient({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(memberId ? null : "Member ID is missing.");
  const [isLoading, setIsLoading] = useState(!!memberId);

  useEffect(() => {
    if (!memberId) {
      return;
    }

    async function loadMember() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/members/${memberId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.error || `Unable to load member (${res.status})`
          );
        }

        const data = (await res.json()) as Member;
        setMember(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load member");
        setMember(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadMember();
  }, [memberId]);

  const badgeClass = member?.memberType
    ? memberTypeColors[member.memberType] ??
      "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      <nav
        className="flex items-center gap-1.5 text-xs"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <Link
          href="/"
          className="transition-colors duration-150 hover:text-zinc-200"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Home
        </Link>
        <span style={{ color: "hsl(var(--border))" }}>/</span>
        <Link
          href="/members"
          className="transition-colors duration-150 hover:text-zinc-200"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Members
        </Link>
        <span style={{ color: "hsl(var(--border))" }}>/</span>
        <span style={{ color: "hsl(var(--foreground))" }}>Profile</span>
      </nav>

      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: "hsl(160 55% 50%)" }}
        >
          የአባላት ዝርዝር ገጽ
        </p>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {member?.fullName ?? "Member profile"}
        </h1>
      </div>

      <section
        className="rounded-lg animate-slide-in overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {isLoading ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div
                  className="h-4 w-1/2 rounded"
                  style={{ background: "hsl(var(--border))" }}
                />
                <div
                  className="h-3 w-1/4 rounded"
                  style={{ background: "hsl(var(--border))" }}
                />
              </div>
              <div
                className="h-5 w-20 rounded-full shrink-0"
                style={{ background: "hsl(var(--border))" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div
                className="h-14 rounded"
                style={{ background: "hsl(var(--border))" }}
              />
              <div
                className="h-14 rounded"
                style={{ background: "hsl(var(--border))" }}
              />
            </div>

            <div
              className="h-12 rounded"
              style={{ background: "hsl(var(--border))" }}
            />
          </div>
        ) : error ? (
          <div
            className="m-4 rounded p-5 text-center text-sm font-medium"
            style={{
              background: "hsl(0 40% 10%)",
              border: "1px dashed hsl(0 40% 22%)",
              color: "hsl(0 55% 60%)",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        ) : !member ? (
          <div
            className="m-4 rounded p-5 text-center text-sm"
            style={{
              border: "1px dashed hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Member not found.
          </div>
        ) : (
          <div>
            <div
              className="flex items-start justify-between gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}
            >
              <div className="space-y-0.5">
                <h2
                  className="text-base font-semibold leading-tight"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.fullName ?? "Unnamed member"}
                </h2>
                <p
                  className="text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {genderLabels[member.gender] ?? member.gender}
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                  badgeClass
                }`}
              >
                {member.memberType
                  ? memberTypeLabels[member.memberType] ?? member.memberType
                  : "No type"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  ዕድሜ
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.age}
                </p>
              </div>

              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Member ID
                </p>
                <p
                  className="text-xs font-medium font-mono break-all leading-relaxed"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.id}
                </p>
              </div>

              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  የክርስትና ስም
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.christianName ?? "-"}
                </p>
              </div>

              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  የምዝገባ ቀን
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.registerDate ?? "-"}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              <Link
                href="/members"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                style={{ color: "hsl(var(--muted-foreground))" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "hsl(var(--foreground))")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                }
              >
                <ArrowLeft size={12} />
                ወደኋላ ተመለስ
              </Link>

              <Link
                href={`/members/${memberId}/edit`}
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                style={{
                  background: "hsl(160 70% 32%)",
                  color: "#fff",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "hsl(160 70% 38%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "hsl(160 70% 32%)")
                }
              >
                <Edit2 size={12} />
                አስተካክል
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}