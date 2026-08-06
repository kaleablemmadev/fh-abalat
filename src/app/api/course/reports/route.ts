import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/src/services/report.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const academicYearId = searchParams.get("academicYearId");
    const eventId = searchParams.get("eventId");
    const studentIds = searchParams.get("studentIds")?.split(",") || undefined;
    const showAbsentDates = searchParams.get("showAbsentDates") === "true";

    let buffer: Buffer;
    let filename: string;

    switch (type) {
      case "marks-by-course":
        if (!academicYearId) throw new Error("academicYearId is required");
        buffer = await ReportService.generateMarksByCoursePDF(academicYearId);
        filename = "marks_by_course.pdf";
        break;

      case "marks-by-student":
        if (!academicYearId) throw new Error("academicYearId is required");
        buffer = await ReportService.generateMarksByStudentPDF(academicYearId, studentIds);
        filename = studentIds ? "selected_grade_sheets.pdf" : "all_grade_sheets.pdf";
        break;

      case "attendance-eligibility":
        if (!eventId) throw new Error("eventId is required");
        buffer = await ReportService.generateEligibilityReportPDF(eventId);
        filename = "eligibility_report.pdf";
        break;

      case "attendance-student":
        if (!academicYearId) throw new Error("academicYearId is required");
        buffer = await ReportService.generateAttendanceReportPDF(academicYearId, showAbsentDates);
        filename = "student_attendance_report.pdf";
        break;

      case "attendance-instructor":
        if (!academicYearId) throw new Error("academicYearId is required");
        buffer = await ReportService.generateInstructorReportPDF(academicYearId);
        filename = "instructor_attendance_report.pdf";
        break;

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
