import { NextRequest, NextResponse } from "next/server";
import { StudentPDFService } from "@/src/services/student-pdf.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { academicYear, courseClass, students } = body;

    if (!academicYear || !courseClass || !students || !Array.isArray(students)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const pdfBuffer = await StudentPDFService.generateStudentIDPDF({
      academicYear,
      courseClass,
      students,
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="student_ids_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
