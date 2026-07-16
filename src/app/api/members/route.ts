import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type MemberPayload = {
  fullName: string;
  gender?: "MALE" | "FEMALE";
  age: number;
  memberType?: "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT";
};

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      where: { type: "MEMBER" },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load members" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<MemberPayload>;

    if (
      !body.fullName ||
      typeof body.fullName !== "string" ||
      typeof body.age !== "number"
    ) {
      return NextResponse.json(
        { error: "fullName and age are required" },
        { status: 400 },
      );
    }

    const member = await prisma.user.create({
      data: {
        fullName: body.fullName.trim(),
        gender: body.gender ?? "MALE",
        age: body.age,
        memberType: body.memberType ?? "REGULAR_MEMBER",
        type: "MEMBER",
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 },
    );
  }
}
