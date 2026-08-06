import { NextRequest, NextResponse } from "next/server";
import { ExcelService, ImportType } from "@/src/services/excel.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let result;

    if (type === "instructors") {
      result = await ExcelService.importInstructors(buffer);
    } else if (type === "courses") {
      result = await ExcelService.importCourses(buffer);
    } else if (type === "marks") {
      result = await ExcelService.importMarks(buffer);
    } else {
      return NextResponse.json({ error: "Invalid import type" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
