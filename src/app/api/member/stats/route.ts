// /api/member/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { EligibilityService } from '@/src/services/eligibility.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    // Get attendance stats
    const attendanceCount = await prisma.attendance.count({
      where: { memberId },
    });

    const recentAttendances = await prisma.attendance.findMany({
      where: { memberId },
      include: {
        event: true,
        attendanceType: true,
      },
      orderBy: { event: { date: 'desc' } },
      take: 5,
    });

    // Get eligibility summary
    const eligibilitySummary = await EligibilityService.getMemberEligibilitySummary(memberId);

    // Get personal notifications
    const notifications = await prisma.notification.findMany({
      where: {
        targetUserId: memberId,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      attendanceCount,
      recentAttendances,
      eligibilitySummary,
      notifications
    });
  } catch (error) {
    console.error('Member stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
