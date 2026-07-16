"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Edit, User } from "lucide-react";

interface Member {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  age: number;
  memberType: string;
}

const memberTypeLabels: Record<string, string> = {
  COURSE_STUDENT: "Course Student",
  REGULAR_MEMBER: "Regular Member",
  YOUTH_STUDENT: "Youth Student",
};

const memberTypeColors: Record<string, string> = {
  COURSE_STUDENT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  REGULAR_MEMBER: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  YOUTH_STUDENT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState("");

  useEffect(() => {
    async function fetchMembers() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/members");

        if (!res.ok) {
          throw new Error("Failed to load members");
        }

        const data = (await res.json()) as Member[];
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load members");
        setMembers(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!members) return [];

    const normalizedSearch = searchText.trim().toLowerCase();

    return members.filter((member) => {
      const normalizedFields = [
        member.fullName,
        member.gender,
        member.memberType,
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
      regular: filteredMembers.filter(
        (member) => member.memberType === "REGULAR_MEMBER",
      ).length,
      course: filteredMembers.filter(
        (member) => member.memberType === "COURSE_STUDENT",
      ).length,
      youth: filteredMembers.filter(
        (member) => member.memberType === "YOUTH_STUDENT",
      ).length,
    }),
    [filteredMembers],
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Member Directory</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage all registered members.
          </p>
        </div>
        <Link 
          href="/members/new"
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 whitespace-nowrap"
        >
          <Plus size={16} />
          Add Member
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm animate-slide-in">
        <div className="p-6 border-b border-border space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between text-sm">
             <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User size={16} />
                  <span className="font-medium text-foreground">{totals.total}</span> total
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="flex gap-3">
                  <span><span className="font-medium text-emerald-500">{totals.regular}</span> regular</span>
                  <span><span className="font-medium text-blue-500">{totals.course}</span> course</span>
                  <span><span className="font-medium text-amber-500">{totals.youth}</span> youth</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search name, gender, or member type..."
              />
            </div>

            <div className="relative w-full sm:w-[200px]">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all appearance-none"
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

        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl border border-border bg-muted/20 animate-pulse"></div>
               ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/10 p-8 text-center text-sm text-destructive">
              <strong>Error:</strong> {error}
            </div>
          ) : !members || members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No members available.
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No members match your search. Try a broader filter.
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => {
                const colorClass = memberTypeColors[member.memberType] || "bg-muted text-muted-foreground border-border";
                
                return (
                <li 
                  key={member.id} 
                  className="group relative rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:bg-accent/30 flex flex-col justify-between"
                >
                  <Link href={`/members/${member.id}/edit`} className="absolute top-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                    <Edit size={16} />
                  </Link>

                  <div className="mb-4 pr-6">
                    <h3 className="font-semibold tracking-tight text-foreground truncate">
                      {member.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {genderLabels[member.gender] ?? member.gender} • {member.age} yrs
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm ${colorClass}`}>
                      {memberTypeLabels[member.memberType] ?? member.memberType}
                    </span>
                    <Link 
                      href={`/members/${member.id}`} 
                      className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </li>
              )})}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
