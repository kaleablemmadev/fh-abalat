"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Edit, Users, GraduationCap } from "lucide-react";

interface Student {
  id: string;
  fullName: string | null;
  gender: "MALE" | "FEMALE";
  age: number | null;
  phoneNumber: string | null;
  address: string | null;
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

  return (
    <div className="space-y-4">
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
              <GraduationCap size={13} />
              <span
                className="font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {totals.total}
              </span>
              <span>students shown</span>
            </div>

            <span style={{ color: "hsl(var(--border))" }}>|</span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
                {totals.active}
              </span>{" "}
              active
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
                placeholder="በስም፣ በስልክ፣ በአድራሻ ፈልግ"
              />
            </div>

            <div className="relative w-full sm:w-48">
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
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">ሁሉም ክፍሎች</option>
                {courseClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.year})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-3">
          {students.length === 0 ? (
            <div className="rounded p-12 text-center">
              <Users
                size={24}
                className="mx-auto mb-2 opacity-20"
                style={{ color: "hsl(var(--foreground))" }}
              />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                No students enrolled in courses yet.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded p-12 text-center">
              <Search
                size={24}
                className="mx-auto mb-2 opacity-20"
                style={{ color: "hsl(var(--foreground))" }}
              />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                No students match your search or filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredStudents.map((student) => {
                const enrollment = student.enrollments[0];
                const courseClass = enrollment?.courseClass;

                return (
                  <div
                    key={student.id}
                    className="group relative rounded border p-3 transition-all duration-150 flex flex-col justify-between"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <Link
                      href={`/course/members/${student.id}`}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      <Edit size={13} />
                    </Link>

                    <div className="mb-2.5">
                      <h3
                        className="text-sm font-semibold leading-tight truncate pr-5"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {student.fullName ?? "Unnamed student"}
                      </h3>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {genderLabels[student.gender] ?? student.gender} · {student.age ?? "?"} ዓመት
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] flex items-center justify-between">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Class:</span>
                        <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {courseClass ? `${courseClass.name} (${courseClass.year})` : "Not enrolled"}
                        </span>
                      </div>

                      <div className="text-[11px] flex items-center justify-between">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Phone:</span>
                        <span style={{ color: "hsl(var(--foreground))" }}>
                          {student.phoneNumber ?? "-"}
                        </span>
                      </div>

                      <div className="pt-1.5 flex items-center justify-between border-t" style={{ borderColor: "hsl(var(--border))" }}>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                            enrollment?.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {enrollment?.status ?? "NONE"}
                        </span>

                        <Link
                          href={`/course/members/${student.id}`}
                          className="text-[10px] font-medium transition-colors duration-150"
                          style={{ color: "hsl(var(--primary))" }}
                        >
                          Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
