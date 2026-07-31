// /course/course-years/components/CourseYearListClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Calendar, BookOpen, Users } from "lucide-react";

interface CourseYear {
  id: string;
  year: string;
  startDate: Date;
  endDate: Date;
  attendanceWeight: number;
  midExamWeight: number;
  assignmentWeight: number;
  finalExamWeight: number;
  isActive: boolean;
  course: {
    id: string;
    name: string;
    instructor: {
      fullName: string;
    };
  };
  courseClass: {
    id: string;
    name: string;
    year: string;
  };
  marks: Array<{
    id: string;
    student: {
      id: string;
      fullName: string | null;
    };
  }>;
}

interface Course {
  id: string;
  name: string;
}

interface CourseClass {
  id: string;
  name: string;
  year: string;
}

interface CourseYearListClientProps {
  courseYears: CourseYear[];
  courses: Course[];
  courseClasses: CourseClass[];
}

export default function CourseYearListClient({ 
  courseYears, 
  courses, 
  courseClasses 
}: CourseYearListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const filteredCourseYears = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return courseYears.filter((courseYear) => {
      const normalizedFields = [
        courseYear.course.name,
        courseYear.course.instructor.fullName,
        courseYear.courseClass.name,
        courseYear.courseClass.year,
        courseYear.year,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesCourse = courseFilter
        ? courseYear.course.id === courseFilter
        : true;

      const matchesClass = classFilter
        ? courseYear.courseClass.id === classFilter
        : true;

      return matchesSearch && matchesCourse && matchesClass;
    });
  }, [courseYears, courseFilter, classFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredCourseYears.length,
      withMarks: filteredCourseYears.filter((cy) => cy.marks.length > 0).length,
    }),
    [filteredCourseYears]
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const weightSum = (cy: CourseYear) => {
    return cy.attendanceWeight + cy.midExamWeight + cy.assignmentWeight + cy.finalExamWeight;
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
            <span>course years</span>
          </div>

          <span style={{ color: "hsl(var(--border))" }}>|</span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
              {totals.withMarks}
            </span>{" "}
            with marks
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
              placeholder="Search by course, instructor, class..."
            />
          </div>

          <div className="relative w-full sm:w-36">
            <BookOpen
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
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-36">
            <Users
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
              <option value="">All classes</option>
              {courseClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.year}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/course/course-years/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap"
            style={{
              background: "hsl(200 70% 32%)",
              color: "#fff",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(200 70% 38%)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(200 70% 32%)")}
          >
            <Plus size={14} />
            New Course Year
          </Link>
        </div>
      </div>

      <div className="p-3">
        {courseYears.length === 0 ? (
          <div className="emptyState">
            <Calendar
              size={20}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No course years available.</p>
            <p className="mt-1 text-xs">Assign courses to classes to get started.</p>
          </div>
        ) : filteredCourseYears.length === 0 ? (
          <div className="emptyState">
            <Search
              size={18}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No course years match your search.</p>
            <p className="mt-1 text-xs">
              Try a broader filter or clear your search.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredCourseYears.map((courseYear) => (
              <li
                key={courseYear.id}
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
                  href={`/course/course-years/${courseYear.id}/edit`}
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
                    {courseYear.course.name}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {courseYear.courseClass.name} - {courseYear.courseClass.year}
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
                        {formatDate(courseYear.startDate)} - {formatDate(courseYear.endDate)}
                      </span>
                    </span>
                  </div>

                  <div
                    className="text-[11px]"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <span>
                      Weights:{" "}
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        A:{courseYear.attendanceWeight} M:{courseYear.midExamWeight} As:{courseYear.assignmentWeight} F:{courseYear.finalExamWeight}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Users size={12} />
                      <span>{courseYear.marks.length} students</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold ${
                        Math.abs(weightSum(courseYear) - 100) < 0.01
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {weightSum(courseYear)}%
                    </span>
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
