// /course/course-classes/components/CourseClassListClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Calendar, Users } from "lucide-react";

interface CourseClass {
  id: string;
  name: string;
  year: string;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  courseYears: Array<{
    id: string;
    course: {
      id: string;
      name: string;
    };
  }>;
}

interface CourseClassListClientProps {
  courseClasses: CourseClass[];
  displayNames: Record<string, string>;
}

export default function CourseClassListClient({ courseClasses, displayNames }: CourseClassListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const filteredClasses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return courseClasses.filter((courseClass) => {
      const normalizedFields = [
        courseClass.name,
        courseClass.year,
        displayNames[courseClass.name] || courseClass.name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesYear = yearFilter
        ? courseClass.year === yearFilter
        : true;

      return matchesSearch && matchesYear;
    });
  }, [courseClasses, yearFilter, searchText, displayNames]);

  const availableYears = useMemo(() => {
    const years = new Set(courseClasses.map((c) => c.year));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [courseClasses]);

  const totals = useMemo(
    () => ({
      total: filteredClasses.length,
      withCourses: filteredClasses.filter((c) => c.courseYears.length > 0).length,
    }),
    [filteredClasses]
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
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
            <Calendar size={13} />
            <span
              className="font-semibold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {totals.total}
            </span>
            <span>classes</span>
          </div>

          <span style={{ color: "hsl(var(--border))" }}>|</span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(200 55% 55%)" }}>
              {totals.withCourses}
            </span>{" "}
            with courses
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
              placeholder="Search by class name or year..."
            />
          </div>

          <div className="relative w-full sm:w-44">
            <select
              className="h-8 w-full rounded border pl-3 pr-3 text-xs appearance-none transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
            >
              <option value="">All years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/course/course-classes/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap"
            style={{
              background: "hsl(200 70% 32%)",
              color: "#fff",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(200 70% 38%)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(200 70% 32%)")}
          >
            <Plus size={14} />
            New Class
          </Link>
        </div>
      </div>

      <div className="p-3">
        {courseClasses.length === 0 ? (
          <div className="emptyState">
            <Calendar
              size={20}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No course classes available.</p>
            <p className="mt-1 text-xs">Create your first class to get started.</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="emptyState">
            <Search
              size={18}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No classes match your search.</p>
            <p className="mt-1 text-xs">
              Try a broader filter or clear your search.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredClasses.map((courseClass) => (
              <li
                key={courseClass.id}
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
                  href={`/course/course-classes/${courseClass.id}/edit`}
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
                    {displayNames[courseClass.name] || courseClass.name}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Year: {courseClass.year}
                  </p>
                </div>

                <div className="space-y-2">
                  <div
                    className="text-[11px]"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <span>
                      Term:{" "}
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        {formatDate(courseClass.startDate)} - {formatDate(courseClass.endDate)}
                      </span>
                    </span>
                  </div>

                  <div
                    className="text-[11px]"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <span>
                      Courses:{" "}
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        {courseClass.courseYears.length}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Users size={12} />
                      <span>{courseClass.courseYears.length} courses</span>
                    </div>

                    <Link
                      href={`/course/course-classes/${courseClass.id}`}
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
