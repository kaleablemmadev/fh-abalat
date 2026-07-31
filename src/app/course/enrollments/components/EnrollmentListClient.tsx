// /course/enrollments/components/EnrollmentListClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Edit, User, Calendar } from "lucide-react";

interface Enrollment {
  id: string;
  status: string;
  enrolledDate: string;
  unenrollmentDate: Date | null;
  unenrollmentReason: string | null;
  student: {
    id: string;
    fullName: string | null;
  };
  courseClass: {
    id: string;
    name: string;
    year: string;
  } | null;
}

interface CourseClass {
  id: string;
  name: string;
  year: string;
}

interface Student {
  id: string;
  fullName: string | null;
}

interface EnrollmentListClientProps {
  enrollments: Enrollment[];
  courseClasses: CourseClass[];
  students: Student[];
  statusNames: Record<string, string>;
}

export default function EnrollmentListClient({ 
  enrollments, 
  courseClasses, 
  students, 
  statusNames 
}: EnrollmentListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredEnrollments = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      const normalizedFields = [
        enrollment.student.fullName || "",
        enrollment.courseClass?.name || "",
        enrollment.courseClass?.year || "",
        enrollment.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesClass = classFilter
        ? enrollment.courseClass?.id === classFilter
        : true;

      const matchesStatus = statusFilter
        ? enrollment.status === statusFilter
        : true;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [enrollments, classFilter, statusFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredEnrollments.length,
      active: filteredEnrollments.filter((e) => e.status === "ACTIVE").length,
      pending: filteredEnrollments.filter((e) => e.status === "PENDING").length,
      withdrew: filteredEnrollments.filter((e) => e.status === "WITHDREW").length,
    }),
    [filteredEnrollments]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "WITHDREW":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "CANCELLED":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
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
            <User size={13} />
            <span
              className="font-semibold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {totals.total}
            </span>
            <span>enrollments</span>
          </div>

          <span style={{ color: "hsl(var(--border))" }}>|</span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
              {totals.active}
            </span>{" "}
            active
          </span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(200 55% 55%)" }}>
              {totals.pending}
            </span>{" "}
            pending
          </span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(0 55% 55%)" }}>
              {totals.withdrew}
            </span>{" "}
            withdrew
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
              placeholder="Search by student name, class..."
            />
          </div>

          <div className="relative w-full sm:w-36">
            <select
              className="h-8 w-full rounded border pl-3 pr-3 text-xs appearance-none transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="">All classes</option>
              {courseClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.year}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-36">
            <select
              className="h-8 w-full rounded border pl-3 pr-3 text-xs appearance-none transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {Object.entries(statusNames).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/course/enrollments/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap"
            style={{
              background: "hsl(200 70% 32%)",
              color: "#fff",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(200 70% 38%)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(200 70% 32%)")}
          >
            <Plus size={14} />
            New Enrollment
          </Link>
        </div>
      </div>

      <div className="p-3">
        {enrollments.length === 0 ? (
          <div className="emptyState">
            <User
              size={20}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No enrollments available.</p>
            <p className="mt-1 text-xs">Enroll students to course classes to get started.</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="emptyState">
            <Search
              size={18}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No enrollments match your search.</p>
            <p className="mt-1 text-xs">
              Try a broader filter or clear your search.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredEnrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="group relative rounded border p-3 transition-all duration-150 flex flex-col justify-between"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "hsl(200 40% 25%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "hsl(var(--border))")
                }
              >
                <Link
                  href={`/course/enrollments/${enrollment.id}/edit`}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(200 60% 55%)")
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
                    {enrollment.student.fullName || "Unnamed student"}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {enrollment.courseClass?.name} - {enrollment.courseClass?.year}
                  </p>
                </div>

                <div className="space-y-2">
                  <div
                    className="text-[11px]"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <span>
                      Enrolled:{" "}
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        {enrollment.enrolledDate}
                      </span>
                    </span>
                  </div>

                  {enrollment.unenrollmentDate && (
                    <div
                      className="text-[11px]"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      <span>
                        Unenrolled:{" "}
                        <span style={{ color: "hsl(var(--foreground))" }}>
                          {new Date(enrollment.unenrollmentDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(enrollment.status)}`}
                    >
                      {statusNames[enrollment.status] || enrollment.status}
                    </span>

                    <Link
                      href={`/course/enrollments/${enrollment.id}`}
                      className="text-[11px] font-medium transition-colors duration-150"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "hsl(200 60% 55%)")
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
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
