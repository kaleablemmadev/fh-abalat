import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ethMonthNames, getEthiopianToday } from "@/src/lib/ethiopiancal";
import { generateAccessCode } from "@/src/lib/utils";

async function notifyDuplicateName(name: string) {
  const admins = await prisma.user.findMany({
    where: { type: "SUPERADMIN", mode: "ABALAT" },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      title: "Duplicate member name needs review",
      message: `The member name "${name}" is duplicated. Please review the records and change the duplicate name(s).`,
      type: "DUPLICATE_NAME",
      mode: "ABALAT" as const,
      targetUserId: admin.id,
    })),
  });
}

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
      where: {
        type: "MEMBER",
        roles: { has: "REGULAR_MEMBER" },
        NOT: { roles: { has: "COURSE_STUDENT" } },
      },
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

    const duplicateName = await prisma.user.findFirst({
      where: { type: "MEMBER", fullName: body.fullName.trim() },
      select: { id: true },
    });
    if (duplicateName) {
      await notifyDuplicateName(body.fullName.trim());
      return NextResponse.json({ error: "A member with this full name already exists" }, { status: 409 });
    }

    // Build registration date string from Ethiopian calendar parts
    let registerDate: string | undefined;
    if (body.registerDateDay && body.registerDateMonth && body.registerDateYear) {
      const monthName = ethMonthNames[parseInt(body.registerDateMonth)];
      if (monthName) {
        registerDate = `${monthName} ${body.registerDateDay}, ${body.registerDateYear}`;
      }
    }

    // Generate a unique privateId with new FH-XXXX-YY format
    const ethToday = getEthiopianToday();
    const yearDigits = ethToday.year.toString().slice(-2);

    let privateId = generateAccessCode(yearDigits);
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { privateId },
      });
      if (!existing) {
        isUnique = true;
      } else {
        privateId = generateAccessCode(yearDigits);
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
        roles: { set: ["REGULAR_MEMBER"] },
        type: "MEMBER",
        privateId,
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