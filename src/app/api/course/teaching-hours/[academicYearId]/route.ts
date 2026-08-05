import { NextResponse } from "next/server";
import { TeachingHoursService } from "@/src/services/teaching-hours.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ academicYearId: string }> }
) {
  try {
    const { academicYearId } = await params;

    const hoursData = await TeachingHoursService.calculateAcademicYearHours(academicYearId);

    return NextResponse.json(hoursData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to calculate teaching hours" },
      { status: 500 }
    );
  }
}
