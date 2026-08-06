import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ethMonthNames, getEthiopianToday } from "@/src/lib/ethiopiancal";
import { generateAccessCode } from "@/src/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recommendationId } = await params;
    const body = await request.json();
    const { studentId, fullName, gender, age, christianName, registerDateDay, registerDateMonth, registerDateYear } = body;

    const recommendation = await prisma.membershipRecommendation.findUnique({
      where: { id: recommendationId },
      include: { student: true }
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    // Build registration date string
    let registerDate: string | undefined;
    if (registerDateDay && registerDateMonth && registerDateYear) {
      const monthName = ethMonthNames[parseInt(registerDateMonth)];
      if (monthName) {
        registerDate = `${monthName} ${registerDateDay}, ${registerDateYear}`;
      }
    }

    // Generate FH code
    const ethToday = getEthiopianToday();
    const yearDigits = ethToday.year.toString().slice(-2);

    let privateId = generateAccessCode(yearDigits);
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findUnique({ where: { privateId } });
      if (!existing) isUnique = true;
      else {
        privateId = generateAccessCode(yearDigits);
        attempts++;
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user to include Regular Member role
      const user = await tx.user.update({
        where: { id: studentId },
        data: {
          fullName,
          gender,
          age,
          christianName,
          registerDate,
          privateId,
          memberTypes: {
             push: 'REGULAR_MEMBER'
          }
        }
      });

      // 2. Resolve recommendation
      await tx.membershipRecommendation.update({
        where: { id: recommendationId },
        data: { status: 'REGISTERED' }
      });

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register student as member" }, { status: 500 });
  }
}
