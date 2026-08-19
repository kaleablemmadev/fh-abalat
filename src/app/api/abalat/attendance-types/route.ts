// /api/abalat/attendance-types/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const attendanceTypes = await prisma.attendanceType.findMany({
      where: {
        mode: 'ABALAT'
      },
      orderBy: {
        value: 'desc',
      },
    });
    return NextResponse.json(attendanceTypes);
  } catch (error) {
    console.error("GET /api/abalat/attendance-types error:", error);
    return NextResponse.json(
      { error: "Failed to load attendance types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, isDefault } = body;

    // Validate
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (typeof value !== 'number') {
      return NextResponse.json(
        { error: "Value must be a number" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim().toLowerCase();
    const normalizedValue = normalizedName.includes('permission') || normalizedName.includes('excused')
      ? 0.5
      : value;

    // If setting as default, remove default from other types
    if (isDefault) {
      await prisma.attendanceType.updateMany({
        where: { mode: 'ABALAT' },
        data: { isDefault: false },
      });
    }

    const attendanceType = await prisma.attendanceType.create({
      data: {
        name: name.trim(),
        value: normalizedValue,
        isDefault: isDefault || false,
        mode: 'ABALAT',
      },
    });

    return NextResponse.json(attendanceType, { status: 201 });
  } catch (error) {
    console.error("POST /api/abalat/attendance-types error:", error);
    return NextResponse.json(
      { error: "Failed to create attendance type" },
      { status: 500 }
    );
  }
}
