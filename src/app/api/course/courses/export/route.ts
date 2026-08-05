import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

    // Create CSV header
    const headers = ["ID", "Course Name", "Credits", "Instructor", "Department", "Topics", "Description"];

    // Create CSV rows
    const rows = courses.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.credits || 0,
      `"${c.instructor.fullName.replace(/"/g, '""')}"`,
      `"${c.department.name.replace(/"/g, '""')}"`,
      `"${(c.topics || []).join(', ').replace(/"/g, '""')}"`,
      `"${(c.description || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const contentWithBom = "\uFEFF" + csvContent;

    return new NextResponse(contentWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=courses-export-${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
