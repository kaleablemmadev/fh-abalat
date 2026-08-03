// /api/member/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { EligibilityService } from '@/src/services/eligibility.service';
import { ethiopianDateToDate, getEthiopianMonthDaysCount, ethMonthNames } from '@/src/lib/ethiopiancal';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

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

    // Get month-specific attendance sum if month/year provided (Ethiopian dates)
    let monthlyAttendanceSum = 0;
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Convert Ethiopian month/year to Gregorian date range
      const daysInMonth = getEthiopianMonthDaysCount(yearNum, monthNum);
      const monthName = ethMonthNames[monthNum];
      
      const gregStartDate = ethiopianDateToDate({ year: yearNum, month: monthName, day: 1 });
      const gregEndDate = ethiopianDateToDate({ year: yearNum, month: monthName, day: daysInMonth });
      
      const monthAttendances = await prisma.attendance.findMany({
        where: {
          memberId,
          event: {
            date: {
              gte: gregStartDate,
              lte: gregEndDate,
            },
          },
        },
        include: {
          attendanceType: true,
          permission: true,
        },
      });

      monthlyAttendanceSum = monthAttendances.reduce((sum, att) => {
        const value = att.attendanceType?.value || 0;
        // Permission halves the attendance value
        return sum + (att.permissionId ? value * 0.5 : value);
      }, 0);
    }

    // Get closest events from both abalat and mezmur
    const abalatEvents = await prisma.event.findMany({
      where: {
        eventType: 'EVENT',
        isActive: true,
        eligibilityRuleId: { not: null },
        date: { gte: new Date() }
      },
      include: {
        eligibilityRule: {
          include: { criteria: true }
        }
      },
      orderBy: { date: 'asc' },
      take: 2
    });

    const mezmurEvents = await prisma.event.findMany({
      where: {
        eventType: 'MEZMUR_EVENT',
        isActive: true,
        eligibilityRuleId: { not: null },
        date: { gte: new Date() }
      },
      include: {
        eligibilityRule: {
          include: { criteria: true }
        }
      },
      orderBy: { date: 'asc' },
      take: 2
    });

    // Get detailed eligibility for closest events
    const closestEvents = [];
    
    for (const event of abalatEvents) {
      if (event.eligibilityRule) {
        const result = await EligibilityService.checkMemberEligibility(
          memberId,
          event.eligibilityRule.criteria.map(c => ({
            eventType: c.eventType,
            minAttendances: c.minAttendances,
            lookbackMonths: c.lookbackMonths,
            isTotalAttendance: c.isTotalAttendance
          })),
          event.date
        );
        
        closestEvents.push({
          id: event.id,
          title: event.title,
          date: event.date,
          mode: 'ABALAT',
          eligibilityRule: event.eligibilityRule,
          eligibilityCheck: result
        });
      }
    }

    for (const event of mezmurEvents) {
      if (event.eligibilityRule) {
        const result = await EligibilityService.checkMemberEligibility(
          memberId,
          event.eligibilityRule.criteria.map(c => ({
            eventType: c.eventType,
            minAttendances: c.minAttendances,
            lookbackMonths: c.lookbackMonths,
            isTotalAttendance: c.isTotalAttendance
          })),
          event.date
        );
        
        closestEvents.push({
          id: event.id,
          title: event.title,
          date: event.date,
          mode: 'MEZMUR',
          eligibilityRule: event.eligibilityRule,
          eligibilityCheck: result
        });
      }
    }

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
      closestEvents,
      monthlyAttendanceSum,
      notifications
    });
  } catch (error) {
    console.error('Member stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
