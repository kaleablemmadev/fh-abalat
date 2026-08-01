import prisma from "@/src/lib/prisma";
import AcademicYearList from "./components/AcademicYearList";

export default async function AcademicYearsPage() {
  const years = await prisma.academicYear.findMany({
    include: {
      classes: true,
    },
    orderBy: { year: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Academic Years
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Manage academic terms and their associated classes.
        </p>
      </div>

      <AcademicYearList initialYears={years} />
    </div>
  );
}
