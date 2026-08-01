"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Users, GraduationCap, Download, Loader2 } from "lucide-react";

interface Student {
  id: string;
  fullName: string | null;
  gender: "MALE" | "FEMALE";
  age: number | null;
  phoneNumber: string | null;
  address: string | null;
  privateId: string | null;
  enrollments: {
    id: string;
    status: string;
    courseClass: {
      id: string;
      name: string;
      year: string;
    } | null;
  }[];
}

interface MemberListClientProps {
  students: Student[];
  courseClasses: { id: string; name: string; year: string }[];
}

const genderLabels: Record<string, string> = {
  MALE: "ወንድ",
  FEMALE: "ሴት",
};

export default function MemberListClient({ students, courseClasses }: MemberListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return students.filter((student) => {
      const activeEnrollment = student.enrollments[0];
      const className = activeEnrollment?.courseClass?.name ?? "";
      const classYear = activeEnrollment?.courseClass?.year ?? "";

      const normalizedFields = [
        student.fullName ?? "",
        student.phoneNumber ?? "",
        student.address ?? "",
        student.privateId ?? "",
        className,
        classYear,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesClass = classFilter
        ? activeEnrollment?.courseClass?.id === classFilter
        : true;

      return matchesSearch && matchesClass;
    });
  }, [students, classFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredStudents.length,
      active: filteredStudents.filter((s) => s.enrollments[0]?.status === "ACTIVE").length,
    }),
    [filteredStudents]
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      window.location.href = '/api/course/members/export';
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div
        className="rounded-xl overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
      >
        <div
          className="px-4 py-4 space-y-4 border-b border-[hsl(var(--border))]"
        >
          <div
            className="flex flex-wrap items-center gap-4 text-xs font-medium text-[hsl(var(--muted-foreground))]"
          >
            <div className="flex items-center gap-2 bg-[hsl(var(--accent)/0.5)] px-2.5 py-1 rounded-full border border-[hsl(var(--border))]">
              <GraduationCap size={14} className="text-[hsl(217,70%,32%)]" />
              <span className="text-[hsl(var(--foreground))] font-bold">
                {totals.total}
              </span>
              <span>Students</span>
            </div>

            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-[hsl(var(--foreground))]">{totals.active}</span> Active
              </span>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all disabled:opacity-50 border border-[hsl(var(--border))]"
            >
              {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Export CSV
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]"
                size={16}
              />
              <input
                className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(217,70%,32%)/0.2] focus:border-[hsl(217,70%,32%)] transition-all"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by name, code, phone..."
              />
            </div>

            <div className="relative w-full md:w-64">
              <Users
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]"
                size={16}
              />
              <select
                className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none appearance-none"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">All Classes</option>
                {courseClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.year})
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/course/members/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all bg-[hsl(217,70%,32%)] text-white hover:bg-[hsl(217,70%,36%)] active:scale-95 shadow-md shadow-[hsl(217,70%,32%)/0.2]"
            >
              <Plus size={18} />
              New Student
            </Link>
          </div>
        </div>

        <div className="p-4">
          {students.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">No students enrolled yet.</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Register your first student to get started.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">No students match your search.</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your filters.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const enrollment = student.enrollments[0];
                const courseClass = enrollment?.courseClass;

                return (
                  <li
                    key={student.id}
                    className="group relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all duration-200 flex flex-col hover:border-[hsl(217,70%,32%)/0.4] hover:shadow-lg"
                  >
                    <Link
                      href={`/course/members/${student.id}/edit`}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-all hover:text-[hsl(217,70%,32%)] hover:bg-[hsl(217,70%,32%)/0.1] shadow-sm"
                    >
                      <Edit size={16} />
                    </Link>

                    <div className="mb-4 pr-8">
                      <h3
                        className="text-base font-bold text-[hsl(var(--foreground))] leading-tight truncate"
                      >
                        {student.fullName ?? "Unnamed student"}
                      </h3>
                      <p
                        className="text-xs mt-1 font-medium text-[hsl(var(--muted-foreground))]"
                      >
                        {genderLabels[student.gender] ?? student.gender} · {student.age ?? "?"} ዓመት
                      </p>
                    </div>

                    <div className="space-y-3 flex-1">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <span>Student Code</span>
                          <span className="font-mono font-bold text-sky-500">{student.privateId ?? "None"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <span>Current Class</span>
                          <span className="text-[hsl(var(--foreground))]">{courseClass ? `${courseClass.name} (${courseClass.year})` : "Not enrolled"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <span>Phone Number</span>
                          <span className="text-[hsl(var(--foreground))]">{student.phoneNumber ?? "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-[hsl(var(--border))]">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            enrollment?.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {enrollment?.status ?? "NONE"}
                        </span>

                        <Link
                          href={`/course/members/${student.id}`}
                          className="text-xs font-bold text-[hsl(217,70%,32%)] hover:underline underline-offset-4 decoration-2 transition-all"
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
