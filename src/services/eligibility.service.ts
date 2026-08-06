// src/services/eligibility.service.ts
import prisma from '@/src/lib/prisma';
import { dateToEthiopian } from '@/src/lib/ethiopiancal';
import { checkMemberPermission, getMemberPermissions } from './permission.service';

export interface EligibilityCheckResult {
  memberId: string;
  fullName: string | null;
  eligible: boolean;
  reasons: string[];
  scores: {
    choreScore: number;
    sundayScore: number;
    mezmurScore: number;
    totalScore: number;
    requiredChore: number;
    requiredSunday: number;
    requiredMezmur: number;
    requiredTotal: number;
    lookbackMonths: number;
  };
  attendanceDetails?: {
    eventId: string;
    eventTitle: string;
    eventDate: Date;
    attendanceType: string;
    value: number;
    excused?: boolean;
    permissionType?: string;
  }[];
  activePermissions?: {
    permissionType: string;
    reason?: string;
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
    mezmurScore: number;
    totalScore: number;
    attendanceDetails: any[];
    activePermissions: any[];
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
        permission: {
          include: {
            permissionType: true,
          },
        },
      },
      orderBy: {
        event: {
          date: 'desc',
        },
      },
    });

    const activePermissionsRecords = await getMemberPermissions(memberId);
    const activePermissions = activePermissionsRecords.map(p => ({
      permissionType: p.permissionType.name,
      reason: p.reason,
    }));

    let choreScore = 0;
    let sundayScore = 0;
    let mezmurScore = 0;
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
        excused: !!attendance.permissionId,
        permissionType: attendance.permission?.permissionType?.name,
      });

      if (eventType === 'CHORE') {
        choreScore += value;
      } else if (eventType === 'SUNDAY') {
        sundayScore += value;
      } else if (eventType.startsWith('MEZMUR_')) {
        mezmurScore += value;
      }
    }

    return { choreScore, sundayScore, mezmurScore, totalScore, attendanceDetails, activePermissions };
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
    let requiredMezmur = 0;
    let requiredTotal = 0;

    for (const c of criteria) {
      if (c.lookbackMonths > maxLookbackMonths) {
        maxLookbackMonths = c.lookbackMonths;
      }
      if (c.eventType === 'chore' && !c.isTotalAttendance) {
        requiredChore = c.minAttendances;
      } else if (c.eventType === 'sunday' && !c.isTotalAttendance) {
        requiredSunday = c.minAttendances;
      } else if (c.eventType.startsWith('mezmur') && !c.isTotalAttendance) {
        requiredMezmur = c.minAttendances;
      } else if (c.isTotalAttendance) {
        requiredTotal = c.minAttendances;
      }
    }

    const { choreScore, sundayScore, mezmurScore, totalScore, attendanceDetails, activePermissions } =
      await this.calculateMemberScore(memberId, maxLookbackMonths, targetDate);

    // Check chore criteria
    if (requiredChore > 0 && choreScore < requiredChore) {
      reasons.push(`Has ${choreScore}/${requiredChore} chore attendances in last ${maxLookbackMonths} months`);
    }

    // Check sunday criteria
    if (requiredSunday > 0 && sundayScore < requiredSunday) {
      reasons.push(`Has ${sundayScore}/${requiredSunday} Sunday attendances in last ${maxLookbackMonths} months`);
    }

    // Check mezmur criteria
    if (requiredMezmur > 0 && mezmurScore < requiredMezmur) {
      reasons.push(`Has ${mezmurScore}/${requiredMezmur} Mezmur attendances in last ${maxLookbackMonths} months`);
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
        mezmurScore,
        totalScore,
        requiredChore,
        requiredSunday,
        requiredMezmur,
        requiredTotal,
        lookbackMonths: maxLookbackMonths,
      },
      attendanceDetails,
      activePermissions,
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
        } : {
          memberType: 'REGULAR_MEMBER',
        }),
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
            mezmurScore: 0,
            totalScore: 0,
            requiredChore: 0,
            requiredSunday: 0,
            requiredMezmur: 0,
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
        } : {
          memberType: 'REGULAR_MEMBER',
        }),
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
            mezmurScore: 0,
            totalScore: 0,
            requiredChore: 0,
            requiredSunday: 0,
            requiredMezmur: 0,
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

  /**
   * Get detailed eligibility status for a specific member across all their relevant rules
   */
  static async getMemberEligibilitySummary(memberId: string) {
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        enrollments: {
          include: {
            courseClass: {
              include: {
                events: {
                  include: {
                    eligibilityRule: {
                      include: { criteria: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!member) throw new Error('Member not found');

    // Get all events that the member is targeted for
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { targetMemberTypes: { has: member.memberType as any } },
          { courseClassId: member.courseClassId || undefined }
        ],
        isActive: true,
        eligibilityRuleId: { not: null }
      },
      include: {
        eligibilityRule: {
          include: { criteria: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    const summaries = [];
    for (const event of events) {
      if (event.eligibilityRule) {
        const result = await this.checkMemberEligibility(
          memberId,
          event.eligibilityRule.criteria.map(c => ({
            eventType: c.eventType,
            minAttendances: c.minAttendances,
            lookbackMonths: c.lookbackMonths,
            isTotalAttendance: c.isTotalAttendance
          })),
          new Date() // Check as of today
        );

        // Calculate "near losing" status
        // A member is "Near" if their score is exactly the minimum required or just above it
        let isNearLosing = false;
        for (const c of event.eligibilityRule.criteria) {
            const score = c.eventType === 'chore' ? result.scores.choreScore :
                         c.eventType === 'sunday' ? result.scores.sundayScore :
                         result.scores.totalScore;

            if (result.eligible && score <= c.minAttendances + 1) {
                isNearLosing = true;
                break;
            }
        }

        summaries.push({
          eventId: event.id,
          eventTitle: event.title,
          ruleName: event.eligibilityRule.name,
          ...result,
          isNearLosing
        });
      }
    }

    return summaries;
  }
}