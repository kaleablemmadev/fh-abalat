import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.user.findMany({
      where: { memberTypes: { has: "COURSE_STUDENT" }, type: "MEMBER" },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { courseClass: true }
        }
      },
      orderBy: { fullName: "asc" },
    });

    const headers = ["ID", "Full Name", "Grandfather Name", "Code", "Gender", "Age", "Phone", "Address", "Current Class", "Year"];

    const rows = students.map(s => {
      const activeClass = s.enrollments[0]?.courseClass;
      return [
        s.id,
        `"${(s.fullName || "").replace(/"/g, '""')}"`,
        `"${(s.grandfatherName || "").replace(/"/g, '""')}"`,
        s.privateId || "",
        s.gender,
        s.age || "",
        s.phoneNumber || "",
        `"${(s.address || "").replace(/"/g, '""')}"`,
        `"${(activeClass?.name || "None").replace(/"/g, '""')}"`,
        activeClass?.year || ""
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    // Prepend UTF-8 BOM for Excel Amharic support
    const contentWithBom = "\uFEFF" + csvContent;

    return new NextResponse(contentWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=students-export-${Date.now()}.csv`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
