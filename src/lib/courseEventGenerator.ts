// lib/courseEventGenerator.ts
// Parameterized event generator for course schedules

import { EthDateWords, ethiopianDateToDate, ethiopianToGregorianDate, gregorianToEthiopianDate } from "./ethiopiancal";

export interface ScheduleRule {
  name: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface CourseEvent {
  title: string;
  description?: string;
  date: Date;
  ethiopianYear: number;
  ethiopianMonth: number;
  ethiopianDay: number;
  eventType: string;
  courseClassId: string;
  createdById: string;
  targetRoles: string[];
}

// Schedule rules for each course class type
export const COURSE_SCHEDULE_RULES: Record<string, ScheduleRule> = {
  KEDAMAY: {
    name: "Kedamay",
    daysOfWeek: [0, 6], // Saturday + Sunday
  },
  KALEAY: {
    name: "Kale'ay",
    daysOfWeek: [0, 6], // Saturday + Sunday
  },
  SALSAY: {
    name: "Salsay",
    daysOfWeek: [0, 6], // Saturday + Sunday
  },
  RABEAY: {
    name: "Rabe'ay",
    daysOfWeek: [0, 6], // Saturday + Sunday
  },
  KEREMT: {
    name: "Keremt",
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday through Saturday
  },
};

/**
 * Generate course events for a given schedule rule and term date range
 * 
 * @param scheduleRule - The schedule rule defining which days of the week
 * @param termStart - Ethiopian start date of the term
 * @param termEnd - Ethiopian end date of the term
 * @param courseClassId - ID of the course class
 * @param createdById - ID of the user creating the events
 * @param targetRoles - Member types this event applies to
 * @param eventTitle - Title for the generated events (defaults to "Class")
 * @returns Array of course events to be created
 */
export function generateCourseEvents(
  scheduleRule: ScheduleRule,
  termStart: EthDateWords,
  termEnd: EthDateWords,
  courseClassId: string,
  createdById: string,
  targetRoles: string[] = ["COURSE_STUDENT"],
  eventTitle: string = "Class"
): CourseEvent[] {
  const events: CourseEvent[] = [];
  
  // Convert Ethiopian dates to Gregorian for iteration
  const startDate = ethiopianDateToDate(termStart);
  const endDate = ethiopianDateToDate(termEnd);
  
  // Iterate through each day in the term
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this day matches the schedule rule
    if (scheduleRule.daysOfWeek.includes(dayOfWeek)) {
      // Convert to Ethiopian date for storage
      const ethDate = gregorianToEthiopianDate({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      });
      
      events.push({
        title: eventTitle,
        description: `${scheduleRule.name} class session`,
        date: new Date(currentDate),
        ethiopianYear: ethDate.year,
        ethiopianMonth: ethDate.month,
        ethiopianDay: ethDate.day,
        eventType: "CHORE", // Reuse CHORE type for course attendance
        courseClassId,
        createdById,
        targetRoles,
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return events;
}

/**
 * Get schedule rule for a course class type
 * 
 * @param classType - The course class type (KEDAMAY, KALEAY, etc.)
 * @returns The schedule rule for that class type
 */
export function getScheduleRule(classType: string): ScheduleRule {
  return COURSE_SCHEDULE_RULES[classType] || COURSE_SCHEDULE_RULES.KEDAMAY;
}

/**
 * Calculate the number of required attendance days for a course year
 * 
 * @param scheduleRule - The schedule rule for the class
 * @param termStart - Ethiopian start date of the term
 * @param termEnd - Ethiopian end date of the term
 * @returns Number of required attendance days
 */
export function calculateRequiredAttendanceDays(
  scheduleRule: ScheduleRule,
  termStart: EthDateWords,
  termEnd: EthDateWords
): number {
  const events = generateCourseEvents(
    scheduleRule,
    termStart,
    termEnd,
    "placeholder", // Not used for counting
    "placeholder",
    [],
    "Class"
  );
  
  return events.length;
}
