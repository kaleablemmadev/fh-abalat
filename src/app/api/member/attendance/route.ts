// /api/member/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    const attendances = await prisma.attendance.findMany({
      where: { memberId },
      include: {
        event: true,
        attendanceType: true,
      },
      orderBy: { event: { date: 'desc' } },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Member attendance error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
