import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const permissionSchema = z.object({
  memberId: z.string().min(1),
  permissionTypeId: z.string().min(1),
  reason: z.string().optional(),
  ethiopianStartDate: z.string().optional(),
  ethiopianEndDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    const permissions = await prisma.permission.findMany({
      where: {
        mode: "MEZMUR",
        ...(memberId && { memberId }),
      },
      include: {
        member: true,
        permissionType: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(permissions);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load permissions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = permissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const permission = await prisma.permission.create({
      data: {
        ...validation.data,
        mode: "MEZMUR",
        status: "PENDING",
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 },
    );
  }
}
