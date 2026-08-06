import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { studentId, adminId } = await request.json();

    if (!studentId || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if recommendation already exists
    const existing = await prisma.membershipRecommendation.findFirst({
      where: { studentId, status: 'PENDING' }
    });

    if (existing) {
      return NextResponse.json({ error: "Recommendation already sent" }, { status: 400 });
    }

    const recommendation = await prisma.membershipRecommendation.create({
      data: {
        studentId,
        recommendedById: adminId,
        status: 'PENDING'
      }
    });

    // Notify Abalat Admins
    const abalatAdmins = await prisma.user.findMany({
      where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, mode: 'ABALAT' }
    });

    const notifications = abalatAdmins.map(admin => prisma.notification.create({
      data: {
        title: 'New Membership Recommendation',
        message: `A course student has been recommended for regular membership.`,
        type: 'RECOMMENDATION',
        mode: 'ABALAT',
        targetUserId: admin.id
      }
    }));

    await Promise.all(notifications);

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send recommendation" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const recommendations = await prisma.membershipRecommendation.findMany({
      where: { status: 'PENDING' },
      include: {
        student: true,
        recommendedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
