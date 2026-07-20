// src/services/eligibility.service.ts
import prisma from '@/src/lib/prisma';
import { dateToEthiopian } from '@/src/lib/ethiopiancal';

interface EligibilityCheckResult {
  memberId: string;
  fullName: string | null;
  eligible: boolean;
  reasons: string[];
  attendances: {
    choreCount: number;
    sundayCount: number;
    totalCount: number;
    requiredChore: number;
    requiredSunday: number;
    lookbackMonths: number;
  };
}

interface EventEligibilityReport {
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
    }[];
  };
}

export class EligibilityService {
  static async checkMemberEligibility(
    memberId: string,
    criteria: {
      eventType: string;
      minAttendances: number;
      lookbackMonths: number;
    }[]
  ): Promise<EligibilityCheckResult> {
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, fullName: true }
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const reasons: string[] = [];
    const attendances = {
      choreCount: 0,
      sundayCount: 0,
      totalCount: 0,
      requiredChore: 0,
      requiredSunday: 0,
      lookbackMonths: 0
    };

    let maxLookbackMonths = 0;
    for (const c of criteria) {
      if (c.lookbackMonths > maxLookbackMonths) {
        maxLookbackMonths = c.lookbackMonths;
      }
      if (c.eventType === 'chore') {
        attendances.requiredChore = c.minAttendances;
      } else if (c.eventType === 'sunday') {
        attendances.requiredSunday = c.minAttendances;
      }
    }
    attendances.lookbackMonths = maxLookbackMonths;

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - maxLookbackMonths);

    const memberAttendances = await prisma.attendance.findMany({
      where: {
        memberId: memberId,
        event: {
          date: {
            gte: cutoffDate
          }
        },
        attendanceType: {
          name: {
            in: ['Attended', 'Present', 'Yes']
          }
        }
      },
      include: {
        event: true,
        attendanceType: true
      },
      orderBy: {
        event: {
          date: 'desc'
        }
      }
    });

    for (const criterion of criteria) {
      const count = memberAttendances.filter(a => {
        const eventDate = new Date(a.event.date);
        const lookbackDate = new Date();
        lookbackDate.setMonth(lookbackDate.getMonth() - criterion.lookbackMonths);
        
        if (eventDate < lookbackDate) return false;
        
        if (criterion.eventType === 'chore') {
          return a.event.title?.toLowerCase().includes('chore');
        } else if (criterion.eventType === 'sunday') {
          return a.event.title?.toLowerCase().includes('sunday');
        }
        return true;
      }).length;

      if (criterion.eventType === 'chore') {
        attendances.choreCount = count;
        if (count < criterion.minAttendances) {
          reasons.push(`Has ${count}/${criterion.minAttendances} chore attendances in last ${criterion.lookbackMonths} months`);
        }
      } else if (criterion.eventType === 'sunday') {
        attendances.sundayCount = count;
        if (count < criterion.minAttendances) {
          reasons.push(`Has ${count}/${criterion.minAttendances} Sunday attendances in last ${criterion.lookbackMonths} months`);
        }
      }
    }

    attendances.totalCount = memberAttendances.length;

    return {
      memberId: member.id,
      fullName: member.fullName,
      eligible: reasons.length === 0,
      reasons,
      attendances
    };
  }

  static async checkEventEligibility(
    eventId: string
  ): Promise<EventEligibilityReport> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eligibilityRule: {
          include: {
            rules: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const activeCriteria = event.eligibilityRule?.rules.map(rule => ({
      eventType: rule.eventType,
      minAttendances: rule.minAttendances,
      lookbackMonths: rule.lookbackMonths
    })) || [];

    const members = await prisma.user.findMany({
      where: { type: 'MEMBER' },
      select: { id: true, fullName: true }
    });

    const results: EligibilityCheckResult[] = [];
    for (const member of members) {
      const result = await this.checkMemberEligibility(member.id, activeCriteria);
      results.push(result);
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      totalMembers: members.length,
      eligibleMembers: results.filter(r => r.eligible),
      ineligibleMembers: results.filter(r => !r.eligible),
      eligibilityRule: {
        name: event.eligibilityRule?.name || 'Default Rule',
        description: event.eligibilityRule?.description || 'Standard eligibility criteria',
        criteria: activeCriteria
      }
    };
  }

  static async getNearestEventEligibility() {
    const now = new Date();
    const nearestEvent = await prisma.event.findFirst({
      where: {
        date: {
          gte: now
        }
      },
      include: {
        eligibilityRule: {
          include: {
            rules: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (!nearestEvent) {
      throw new Error('No upcoming events found');
    }

    return this.checkEventEligibility(nearestEvent.id);
  }
}