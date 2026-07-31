// /course/courses/components/CourseListClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Edit, BookOpen, User } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string | null;
  topics: string[];
  credits: number | null;
  isGiven: boolean;
  instructor: {
    id: string;
    fullName: string;
  };
  courseYears: Array<{
    id: string;
    courseClass: {
      id: string;
      name: string;
      year: string;
    };
  }>;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface CourseListClientProps {
  courses: Course[];
  instructors: Instructor[];
}

export default function CourseListClient({ courses, instructors }: CourseListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const normalizedFields = [
        course.name,
        course.description || "",
        course.topics.join(" "),
        course.instructor.fullName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesInstructor = instructorFilter
        ? course.instructor.id === instructorFilter
        : true;

      return matchesSearch && matchesInstructor;
    });
  }, [courses, instructorFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredCourses.length,
      given: filteredCourses.filter((c) => c.isGiven).length,
      notGiven: filteredCourses.filter((c) => !c.isGiven).length,
    }),
    [filteredCourses]
  );

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
            <BookOpen size={13} />
            <span
              className="font-semibold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {totals.total}
            </span>
            <span>courses</span>
          </div>

          <span style={{ color: "hsl(var(--border))" }}>|</span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
              {totals.given}
            </span>{" "}
            given
          </span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(200 55% 55%)" }}>
              {totals.notGiven}
            </span>{" "}
            not given
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
              placeholder="Search by name, topic, instructor..."
            />
          </div>

          <div className="relative w-full sm:w-44">
            <User
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
              value={instructorFilter}
              onChange={(event) => setInstructorFilter(event.target.value)}
            >
              <option value="">All instructors</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.fullName}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/course/courses/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap"
            style={{
              background: "hsl(200 70% 32%)",
              color: "#fff",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(200 70% 38%)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(200 70% 32%)")}
          >
            <Plus size={14} />
            New Course
          </Link>
        </div>
      </div>

      <div className="p-3">
        {courses.length === 0 ? (
          <div className="emptyState">
            <BookOpen
              size={20}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No courses available.</p>
            <p className="mt-1 text-xs">Create your first course to get started.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="emptyState">
            <Search
              size={18}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <p>No courses match your search.</p>
            <p className="mt-1 text-xs">
              Try a broader filter or clear your search.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredCourses.map((course) => (
              <li
                key={course.id}
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
                  href={`/course/courses/${course.id}/edit`}
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
                    {course.name}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {course.instructor.fullName}
                  </p>
                </div>

                <div className="space-y-2">
                  {course.description && (
                    <div
                      className="text-[11px] line-clamp-2"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {course.description}
                    </div>
                  )}

                  {course.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {course.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px]"
                          style={{
                            background: "hsl(var(--muted))",
                            color: "hsl(var(--foreground))",
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span
                          className="text-[10px]"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          +{course.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {course.credits && (
                        <span
                          className="text-[11px]"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {course.credits} credits
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          course.isGiven
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {course.isGiven ? "Given" : "Not Given"}
                      </span>
                    </div>

                    <Link
                      href={`/course/courses/${course.id}`}
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
