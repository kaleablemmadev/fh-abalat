"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  fullName: string | null;
  gender: "MALE" | "FEMALE";
  age: number;
  memberType: string | null;
  type: string;
}

const memberTypeLabels: Record<string, string> = {
  COURSE_STUDENT: "Course Student",
  REGULAR_MEMBER: "Regular Member",
  YOUTH_STUDENT: "Youth Student",
};

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export default function MemberDetailClient({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!memberId) {
      setError("Member ID is missing.");
      setIsLoading(false);
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
            errorData?.error || `Unable to load member (${res.status})`,
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

  return (
    <div className="space-y-8 animate-fade-in p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link 
          href="/" 
          className="transition-colors hover:text-foreground"
        >
          Home
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <Link 
          href="/members" 
          className="transition-colors hover:text-foreground"
        >
          Members
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">Profile</span>
      </nav>

      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">
          Member profile
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {member?.fullName ?? "Member profile"}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          A focused member summary with profile details and membership type.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm animate-slide-in">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading member details…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/10 p-8 text-center text-sm text-destructive">
            <strong className="text-destructive">Error:</strong> {error}
          </div>
        ) : !member ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            Member not found.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {member.fullName ?? "Unnamed member"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {genderLabels[member.gender] ?? member.gender}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm border border-primary/20">
                {memberTypeLabels[member.memberType ?? ""] ?? member.memberType}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Age
                </p>
                <p className="text-base font-medium text-foreground">{member.age}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Member ID
                </p>
                <p className="text-base font-medium text-foreground font-mono break-all">{member.id}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <Link 
                href="/members" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary w-full sm:w-auto text-center"
              >
                &larr; Back to roster
              </Link>
              <Link 
                href={`/members/${memberId}/edit`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
