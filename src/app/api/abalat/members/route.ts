import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ethMonthNames } from "@/src/lib/ethiopiancal";
import { generateAccessCode } from "@/src/lib/utils";

type MemberPayload = {
  fullName: string;
  gender?: "MALE" | "FEMALE";
  age: number;
  christianName?: string;
  registerDateDay?: number;
  registerDateMonth?: string;
  registerDateYear?: number;
  memberType?: "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT";
  courseClassId?: string; // Optional field for initial enrollment
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

    // Build registration date string from Ethiopian calendar parts
    let registerDate: string | undefined;
    if (body.registerDateDay && body.registerDateMonth && body.registerDateYear) {
      const monthName = ethMonthNames[parseInt(body.registerDateMonth)];
      if (monthName) {
        registerDate = `${monthName} ${body.registerDateDay}, ${body.registerDateYear}`;
      }
    }

    // Generate a unique privateId
    let privateId = generateAccessCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { privateId },
      });
      if (!existing) {
        isUnique = true;
      } else {
        privateId = generateAccessCode();
        attempts++;
      }
    }

    const member = await prisma.user.create({
      data: {
        fullName: body.fullName.trim(),
        gender: body.gender ?? "MALE",
        age: body.age,
        christianName: body.christianName,
        registerDate: registerDate,
        memberType: body.memberType ?? "REGULAR_MEMBER",
        type: "MEMBER",
        privateId,
        ...(body.courseClassId && {
            enrollments: {
                create: {
                    courseClassId: body.courseClassId,
                    enrolledDate: new Date().toLocaleDateString(),
                    status: "ACTIVE"
                }
            }
        })
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