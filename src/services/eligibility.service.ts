// src/services/eligibility.service.ts
import prisma from '@/src/lib/prisma';
import { dateToEthiopian } from '@/src/lib/ethiopiancal';

export interface EligibilityCheckResult {
  memberId: string;
  fullName: string | null;
  eligible: boolean;
  reasons: string[];
  scores: {
    choreScore: number;
    sundayScore: number;
    totalScore: number;
    requiredChore: number;
    requiredSunday: number;
    requiredTotal: number;
    lookbackMonths: number;
  };
  attendanceDetails?: {
    eventId: string;
    eventTitle: string;
    eventDate: Date;
    attendanceType: string;
    value: number;
  }[];
}

export interface EventEligibilityReport {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  totalMembers: number;
  eligibleMembers: EligibilityCheckResult[];
  ineligibleMembers: EligibilityCheckResult[];
  eligibilityRule: {
    name: string;
    description: string | null;
    criteria: {
      eventType: string;
      minAttendances: number;
      lookbackMonths: number;
      isTotalAttendance: boolean;
    }[];
  };
}

export class EligibilityService {
  /**
   * Calculate the score for a member based on attendance records
   * This queries the Attendance table directly through Prisma
   */
  static async calculateMemberScore(
    memberId: string,
    lookbackMonths: number,
    targetDate: Date
  ): Promise<{ 
    choreScore: number; 
    sundayScore: number; 
    totalScore: number;
    attendanceDetails: any[];
  }> {
    const cutoffDate = new Date(targetDate);
    cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

    // Query the Attendance table directly
    const attendances = await prisma.attendance.findMany({
      where: {
        memberId: memberId,
        event: {
          date: {
            gte: cutoffDate,
            lt: targetDate,
          },
        },
      },
      include: {
        event: true,
        attendanceType: true,
      },
      orderBy: {
        event: {
          date: 'desc',
        },
      },
    });

    let choreScore = 0;
    let sundayScore = 0;
    let totalScore = 0;
    const attendanceDetails: any[] = [];

    for (const attendance of attendances) {
      const value = attendance.attendanceType?.value || 0;
      totalScore += value;

      const eventTitle = attendance.event?.title || '';
      const eventType = attendance.event?.eventType || '';

      attendanceDetails.push({
        eventId: attendance.eventId,
        eventTitle: eventTitle,
        eventDate: attendance.event?.date,
        attendanceType: attendance.attendanceType?.name || 'Unknown',
        value: value,
      });

      if (eventType === 'CHORE') {
        choreScore += value;
      } else if (eventType === 'SUNDAY') {
        sundayScore += value;
      }
    }

    return { choreScore, sundayScore, totalScore, attendanceDetails };
  }

  /**
   * Check if a member is eligible based on the criteria
   */
  static async checkMemberEligibility(
    memberId: string,
    criteria: {
      eventType: string;
      minAttendances: number;
      lookbackMonths: number;
      isTotalAttendance: boolean;
    }[],
    targetDate: Date
  ): Promise<EligibilityCheckResult> {
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, fullName: true }
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const reasons: string[] = [];
    let maxLookbackMonths = 0;
    let requiredChore = 0;
    let requiredSunday = 0;
    let requiredTotal = 0;

    for (const c of criteria) {
      if (c.lookbackMonths > maxLookbackMonths) {
        maxLookbackMonths = c.lookbackMonths;
      }
      if (c.eventType === 'chore' && !c.isTotalAttendance) {
        requiredChore = c.minAttendances;
      } else if (c.eventType === 'sunday' && !c.isTotalAttendance) {
        requiredSunday = c.minAttendances;
      } else if (c.isTotalAttendance) {
        requiredTotal = c.minAttendances;
      }
    }

    const { choreScore, sundayScore, totalScore, attendanceDetails } = 
      await this.calculateMemberScore(memberId, maxLookbackMonths, targetDate);

    // Check chore criteria
    if (requiredChore > 0 && choreScore < requiredChore) {
      reasons.push(`Has ${choreScore}/${requiredChore} chore attendances in last ${maxLookbackMonths} months`);
    }

    // Check sunday criteria
    if (requiredSunday > 0 && sundayScore < requiredSunday) {
      reasons.push(`Has ${sundayScore}/${requiredSunday} Sunday attendances in last ${maxLookbackMonths} months`);
    }

    // Check total attendance criteria
    if (requiredTotal > 0 && totalScore < requiredTotal) {
      reasons.push(`Has ${totalScore}/${requiredTotal} total attendances in last ${maxLookbackMonths} months`);
    }

    return {
      memberId: member.id,
      fullName: member.fullName,
      eligible: reasons.length === 0,
      reasons,
      scores: {
        choreScore,
        sundayScore,
        totalScore,
        requiredChore,
        requiredSunday,
        requiredTotal,
        lookbackMonths: maxLookbackMonths,
      },
      attendanceDetails,
    };
  }

  /**
   * Check eligibility for all members for a specific event
   */
  static async checkEventEligibility(eventId: string): Promise<EventEligibilityReport> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eligibilityRule: {
          include: {
            criteria: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.eligibilityRule || event.eligibilityRule.criteria.length === 0) {
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        totalMembers: 0,
        eligibleMembers: [],
        ineligibleMembers: [],
        eligibilityRule: {
          name: 'No Rule',
          description: 'No eligibility rule configured for this event',
          criteria: [],
        },
      };
    }

    const activeCriteria = event.eligibilityRule.criteria.map(c => ({
      eventType: c.eventType,
      minAttendances: c.minAttendances,
      lookbackMonths: c.lookbackMonths,
      isTotalAttendance: c.isTotalAttendance || false,
    }));

    const members = await prisma.user.findMany({
      where: {
        type: 'MEMBER',
        ...(event.targetMemberTypes.length > 0 ? {
          memberType: { in: event.targetMemberTypes },
        } : {}),
      },
      select: { id: true, fullName: true }
    });

    const results: EligibilityCheckResult[] = [];
    for (const member of members) {
      try {
        const result = await this.checkMemberEligibility(
          member.id,
          activeCriteria,
          event.date
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to check eligibility for member ${member.id}:`, error);
        results.push({
          memberId: member.id,
          fullName: member.fullName,
          eligible: false,
          reasons: ['Failed to check eligibility'],
          scores: {
            choreScore: 0,
            sundayScore: 0,
            totalScore: 0,
            requiredChore: 0,
            requiredSunday: 0,
            requiredTotal: 0,
            lookbackMonths: 0,
          },
        });
      }
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      totalMembers: members.length,
      eligibleMembers: results.filter(r => r.eligible),
      ineligibleMembers: results.filter(r => !r.eligible),
      eligibilityRule: {
        name: event.eligibilityRule.name,
        description: event.eligibilityRule.description,
        criteria: activeCriteria,
      },
    };
  }

  /**
   * Check eligibility with a specific rule (not necessarily attached to the event)
   */
  static async checkEventEligibilityWithRule(
    eventId: string,
    rule: any
  ): Promise<EventEligibilityReport> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!rule || rule.criteria.length === 0) {
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        totalMembers: 0,
        eligibleMembers: [],
        ineligibleMembers: [],
        eligibilityRule: {
          name: 'No Rule',
          description: 'No eligibility rule configured for this event',
          criteria: [],
        },
      };
    }

    const activeCriteria = rule.criteria.map((c: any) => ({
      eventType: c.eventType,
      minAttendances: c.minAttendances,
      lookbackMonths: c.lookbackMonths,
      isTotalAttendance: c.isTotalAttendance || false,
    }));

    const members = await prisma.user.findMany({
      where: {
        type: 'MEMBER',
        ...(event.targetMemberTypes.length > 0 ? {
          memberType: { in: event.targetMemberTypes },
        } : {}),
      },
      select: { id: true, fullName: true }
    });

    const results: EligibilityCheckResult[] = [];
    for (const member of members) {
      try {
        const result = await this.checkMemberEligibility(
          member.id,
          activeCriteria,
          event.date
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to check eligibility for member ${member.id}:`, error);
        results.push({
          memberId: member.id,
          fullName: member.fullName,
          eligible: false,
          reasons: ['Failed to check eligibility'],
          scores: {
            choreScore: 0,
            sundayScore: 0,
            totalScore: 0,
            requiredChore: 0,
            requiredSunday: 0,
            requiredTotal: 0,
            lookbackMonths: 0,
          },
        });
      }
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      totalMembers: members.length,
      eligibleMembers: results.filter(r => r.eligible),
      ineligibleMembers: results.filter(r => !r.eligible),
      eligibilityRule: {
        name: rule.name,
        description: rule.description,
        criteria: activeCriteria,
      },
    };
  }

  /**
   * Get eligibility for the nearest upcoming event
   */
  static async getNearestEventEligibility() {
    const now = new Date();
    const nearestEvent = await prisma.event.findFirst({
      where: {
        date: {
          gte: now,
        },
        eventType: 'EVENT',
      },
      include: {
        eligibilityRule: {
          include: {
            criteria: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (!nearestEvent) {
      throw new Error('No upcoming events found');
    }

    return this.checkEventEligibility(nearestEvent.id);
  }
}