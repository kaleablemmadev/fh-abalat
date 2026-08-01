import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = statusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        status: validation.data.status,
        reviewNote: validation.data.reviewNote,
        reviewedAt: new Date(),
        // Note: In a real app, I'd get the adminId from the session
      },
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update permission" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.permission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete permission" },
      { status: 500 },
    );
  }
}
