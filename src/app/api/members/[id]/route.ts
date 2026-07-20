// /api/members/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type MemberUpdatePayload = Partial<{
  fullName: string;
  gender: "MALE" | "FEMALE";
  age: number;
  christianName: string;
  registerDate: string;
  memberType: "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT";
}>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const routeParams = await params;
    const member = await prisma.user.findUnique({ where: { id: routeParams.id } });

    if (!member || member.type !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load member" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const routeParams = await params;
    const body = (await request.json()) as MemberUpdatePayload;

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 },
      );
    }

    const member = await prisma.user.findUnique({ where: { id: routeParams.id } });
    if (!member || member.type !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updatedMember = await prisma.user.update({
      where: { id: routeParams.id },
      data: body,
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const routeParams = await params;
    const member = await prisma.user.findUnique({ where: { id: routeParams.id } });
    if (!member || member.type !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: routeParams.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 },
    );
  }
}