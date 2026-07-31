// /course/course-classes/new/page.tsx
import CourseClassForm from "../components/CourseClassForm";

export default function NewCourseClassPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          New Course Class
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Create a new course class instance for a specific year
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <CourseClassForm />
      </div>
    </div>
  );
}
