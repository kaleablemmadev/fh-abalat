// /members/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Edit, Users } from "lucide-react";

interface Member {
  id: string;
  fullName: string | null;
  gender: "MALE" | "FEMALE";
  age: number;
  christianName: string | null;
  registerDate: string | null;
  memberType: "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT" | null;
}

const memberTypeLabels: Record<string, string> = {
  COURSE_STUDENT: "Course Student",
  REGULAR_MEMBER: "Regular Member",
  YOUTH_STUDENT: "Youth Student",
};

const memberTypeColors: Record<string, string> = {
  COURSE_STUDENT: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  REGULAR_MEMBER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  YOUTH_STUDENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState("");

  useEffect(() => {
    async function fetchMembers() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/members", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load members");
        }

        const data = (await res.json()) as Member[];
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load members");
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return members.filter((member) => {
      const normalizedFields = [
        member.fullName ?? "",
        member.gender ?? "",
        member.memberType ?? "",
        member.christianName ?? "",
        member.registerDate ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesType = memberTypeFilter
        ? member.memberType === memberTypeFilter
        : true;

      return matchesSearch && matchesType;
    });
  }, [members, memberTypeFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredMembers.length,
      regular: filteredMembers.filter((m) => m.memberType === "REGULAR_MEMBER").length,
      course: filteredMembers.filter((m) => m.memberType === "COURSE_STUDENT").length,
      youth: filteredMembers.filter((m) => m.memberType === "YOUTH_STUDENT").length,
    }),
    [filteredMembers]
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Member Directory
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Browse and manage all registered members.
          </p>
        </div>

        <Link
          href="/members/new"
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0"
          style={{
            background: "hsl(160 70% 32%)",
            color: "#fff",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(160 70% 38%)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(160 70% 32%)")}
        >
          <Plus size={14} />
          Add Member
        </Link>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          className="px-4 py-3 space-y-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div
            className="flex flex-wrap items-center gap-3 text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <div className="flex items-center gap-1.5">
              <Users size={13} />
              <span
                className="font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {totals.total}
              </span>
              <span>shown</span>
            </div>

            <span style={{ color: "hsl(var(--border))" }}>|</span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
                {totals.regular}
              </span>{" "}
              regular
            </span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(200 55% 55%)" }}>
                {totals.course}
              </span>{" "}
              course
            </span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(38 55% 55%)" }}>
                {totals.youth}
              </span>{" "}
              youth
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                size={13}
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                className="h-8 w-full rounded border pl-8 pr-3 text-xs transition-all duration-150"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search name, gender, type, or Christian name…"
              />
            </div>

            <div className="relative w-full sm:w-44">
              <Filter
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                size={13}
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <select
                className="h-8 w-full rounded border pl-8 pr-3 text-xs appearance-none transition-all duration-150"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                value={memberTypeFilter}
                onChange={(event) => setMemberTypeFilter(event.target.value)}
              >
                <option value="">All member types</option>
                <option value="REGULAR_MEMBER">Regular Member</option>
                <option value="COURSE_STUDENT">Course Student</option>
                <option value="YOUTH_STUDENT">Youth Student</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="space-y-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded"
                  style={{
                    height: "52px",
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full shrink-0"
                    style={{ background: "hsl(var(--border))" }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2.5 rounded w-1/3"
                      style={{ background: "hsl(var(--border))" }}
                    />
                    <div
                      className="h-2 rounded w-1/5"
                      style={{ background: "hsl(var(--border))" }}
                    />
                  </div>
                  <div
                    className="h-5 w-20 rounded-full shrink-0"
                    style={{ background: "hsl(var(--border))" }}
                  />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="rounded p-6 text-center text-sm font-medium"
              style={{
                background: "hsl(0 40% 10%)",
                border: "1px dashed hsl(0 40% 22%)",
                color: "hsl(0 55% 60%)",
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          ) : members.length === 0 ? (
            <div className="emptyState">
              <Users
                size={20}
                className="mx-auto mb-2"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <p>No members available.</p>
              <p className="mt-1 text-xs">Add your first member to get started.</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="emptyState">
              <Search
                size={18}
                className="mx-auto mb-2"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <p>No members match your search.</p>
              <p className="mt-1 text-xs">
                Try a broader filter or clear your search.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredMembers.map((member) => {
                const colorClass =
                  member.memberType && memberTypeColors[member.memberType]
                    ? memberTypeColors[member.memberType]
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

                return (
                  <li
                    key={member.id}
                    className="group relative rounded border p-3 transition-all duration-150 flex flex-col justify-between"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "hsl(160 40% 25%)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "hsl(var(--border))")
                    }
                  >
                    <Link
                      href={`/members/${member.id}/edit`}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "hsl(160 60% 55%)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                      }
                    >
                      <Edit size={13} />
                    </Link>

                    <div className="mb-2.5 pr-5">
                      <h3
                        className="text-sm font-semibold leading-tight truncate"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {member.fullName ?? "Unnamed member"}
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {genderLabels[member.gender] ?? member.gender} · {member.age} yrs
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div
                        className="text-[11px]"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {member.christianName ? (
                          <span>
                            Christian name:{" "}
                            <span style={{ color: "hsl(var(--foreground))" }}>
                              {member.christianName}
                            </span>
                          </span>
                        ) : (
                          <span>Christian name not set</span>
                        )}
                      </div>

                      <div
                        className="text-[11px]"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {member.registerDate ? (
                          <span>
                            Registered:{" "}
                            <span style={{ color: "hsl(var(--foreground))" }}>
                              {member.registerDate}
                            </span>
                          </span>
                        ) : (
                          <span>Registration date not set</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}
                        >
                          {member.memberType
                            ? memberTypeLabels[member.memberType] ?? member.memberType
                            : "No type"}
                        </span>

                        <Link
                          href={`/members/${member.id}`}
                          className="text-[11px] font-medium transition-colors duration-150"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "hsl(160 60% 55%)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                          }
                        >
                          Details →
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}