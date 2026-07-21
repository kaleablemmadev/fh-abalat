// src/app/api/reports/monthly-attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { ethiopianToGregorianDate, ethMonthNames, EthDate } from '@/src/lib/ethiopiancal';

interface MonthSelection {
  month: string; // Ethiopian month name
  year: number; // Ethiopian year
}

interface MemberAttendanceData {
  id: string;
  fullName: string | null;
  monthlyAttendances: Record<string, number>; // Key: "Month Year", Value: count
  total: number;
}

// Helper to get month number from Amharic name
function getMonthNumber(monthName: string): number {
  const monthEntries = Object.entries(ethMonthNames);
  for (const [num, name] of monthEntries) {
    if (name === monthName) return parseInt(num);
  }
  return 1; // Default to Meskerem
}

// Helper to convert GregorianDate to Date object
function gregorianDateToDate(gregDate: { year: number; month: number; day: number }): Date {
  return new Date(gregDate.year, gregDate.month - 1, gregDate.day);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { months, attendanceType }: { months: MonthSelection[]; attendanceType?: 'CHORE' | 'SUNDAY' | 'ALL' } = body;

    if (!months || months.length === 0) {
      return NextResponse.json(
        { error: 'At least one month must be selected' },
        { status: 400 }
      );
    }

    // Get all members
    const members = await prisma.user.findMany({
      where: { type: 'MEMBER' },
      orderBy: { fullName: 'asc' },
    });

    // Calculate attendance for each member for each selected month
    const memberAttendanceData: MemberAttendanceData[] = [];

    for (const member of members) {
      const monthlyAttendances: Record<string, number> = {};
      let total = 0;

      for (const monthSelection of months) {
        const monthNumber = getMonthNumber(monthSelection.month);

        // Convert Ethiopian month to Gregorian date range
        const ethStart: EthDate = { year: monthSelection.year, month: monthNumber, day: 1 };
        const ethEnd: EthDate = { year: monthSelection.year, month: monthNumber, day: 30 };
        
        const gregorianStart = ethiopianToGregorianDate(ethStart);
        const gregorianEnd = ethiopianToGregorianDate(ethEnd);

        // Convert to Date objects for Prisma
        const startDate = gregorianDateToDate(gregorianStart);
        const endDate = gregorianDateToDate(gregorianEnd);

        // Build where clause for attendance type filtering
        const eventWhere: any = {
          date: {
            gte: startDate,
            lte: endDate,
          },
        };

        if (attendanceType === 'CHORE') {
          eventWhere.eventType = 'CHORE';
        } else if (attendanceType === 'SUNDAY') {
          eventWhere.eventType = 'SUNDAY';
        }

        // Get all attendances for this member in this month
        const attendances = await prisma.attendance.findMany({
          where: {
            memberId: member.id,
            event: eventWhere,
          },
          include: {
            attendanceType: true,
          },
        });

        // Calculate weighted attendance (attended=1, excused=0.5, absent=0)
        let weightedScore = 0;
        for (const attendance of attendances) {
          const value = attendance.attendanceType?.value || 0;
          weightedScore += value;
        }

        const monthKey = `${monthSelection.month} ${monthSelection.year}`;
        monthlyAttendances[monthKey] = weightedScore;
        total += weightedScore;
      }

      memberAttendanceData.push({
        id: member.id,
        fullName: member.fullName,
        monthlyAttendances,
        total,
      });
    }

    // Sort by total attendance (descending)
    memberAttendanceData.sort((a, b) => b.total - a.total);

    return NextResponse.json({
      months,
      data: memberAttendanceData,
      attendanceType: attendanceType || 'ALL',
    });
  } catch (error) {
    console.error('Error generating monthly attendance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
