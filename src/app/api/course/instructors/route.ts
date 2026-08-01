import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        department: true,
        _count: {
          select: { courses: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });
    return NextResponse.json(instructors);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load instructors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, departmentId } = body;

    if (!fullName || !departmentId) {
      return NextResponse.json({ error: "Full Name and Department are required" }, { status: 400 });
    }

    // Check for existing instructor with same name
    const existingName = await prisma.instructor.findUnique({
      where: { fullName: fullName.trim() }
    });

    if (existingName) {
      return NextResponse.json({ error: "An instructor with this name is already registered" }, { status: 409 });
    }

    // Check for existing instructor with same email if provided
    if (email) {
      const existingEmail = await prisma.instructor.findUnique({
        where: { email: email.trim() }
      });

      if (existingEmail) {
        return NextResponse.json({ error: "This email address is already in use by another instructor" }, { status: 409 });
      }
    }

    const instructor = await prisma.instructor.create({
      data: {
        fullName: fullName.trim(),
        email: email ? email.trim() : null,
        phoneNumber,
        departmentId
      },
      include: { department: true }
    });

    return NextResponse.json(instructor, { status: 201 });
  } catch (error: any) {
    console.error("Instructor creation error:", error);

    // Handle Prisma unique constraint violation (P2002) just in case
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json({ error: `A unique constraint failed on ${field}` }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create instructor" }, { status: 500 });
  }
}
