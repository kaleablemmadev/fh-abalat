import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { courses: true, instructors: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load departments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Department Name is required" }, { status: 400 });
    }

    // Check for existing department with same name
    const existingName = await prisma.department.findUnique({
      where: { name: name.trim() }
    });

    if (existingName) {
      return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
    }

    // Check for existing department with same code if provided
    if (code) {
      const existingCode = await prisma.department.findUnique({
        where: { code: code.trim() }
      });

      if (existingCode) {
        return NextResponse.json({ error: "This department code is already assigned to another department" }, { status: 409 });
      }
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code ? code.trim() : null,
        description
      }
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error("Department creation error:", error);

    // Handle Prisma unique constraint violation (P2002) just in case
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json({ error: `A unique constraint failed on ${field}` }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
