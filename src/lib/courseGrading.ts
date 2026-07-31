// lib/courseGrading.ts
// Course attendance and grading calculations

export interface AttendanceRecord {
  value: number; // Attendance type value (1 = attended, 0.5 = permission, 0 = absent)
}

export interface CourseYearWeights {
  attendanceWeight: number;
  midExamWeight: number;
  assignmentWeight: number;
  finalExamWeight: number;
}

export interface MarkScores {
  midExamScore?: number;
  assignmentScore?: number;
  finalExamScore?: number;
}

/**
 * Calculate course attendance score for a student
 * 
 * Given a student's course-attendance records for a CourseYear's term,
 * compute their attendance percentage (capped at the attendanceWeight).
 * 
 * Required days count normally; any additional attendance marked as a bonus
 * day pushes the score up but never above the weight cap.
 * 
 * @param attendances - Array of attendance records with values
 * @param requiredDays - Number of required attendance days for the term
 * @param attendanceWeight - Maximum points for attendance (e.g., 10)
 * @returns Attendance score (0 to attendanceWeight)
 */
export function calculateCourseAttendanceScore(
  attendances: AttendanceRecord[],
  requiredDays: number,
  attendanceWeight: number
): number {
  if (requiredDays === 0) return 0;

  // Sum all attendance values
  const totalAttendanceValue = attendances.reduce((sum, record) => sum + record.value, 0);

  // Calculate the attendance percentage
  const attendancePercentage = (totalAttendanceValue / requiredDays) * 100;

  // Convert to weighted score and cap at the weight
  const weightedScore = (attendancePercentage / 100) * attendanceWeight;

  return Math.min(weightedScore, attendanceWeight);
}

/**
 * Calculate final mark for a student
 * 
 * Given a Mark record + its CourseYear's weights + the computed attendance score,
 * return the weighted total out of 100.
 * 
 * @param markScores - Raw scores (mid-exam, assignment, final-exam)
 * @param weights - CourseYear assessment weights
 * @param attendanceScore - Computed attendance score
 * @returns Weighted total score (0 to 100)
 */
export function calculateFinalMark(
  markScores: MarkScores,
  weights: CourseYearWeights,
  attendanceScore: number
): number {
  const { midExamScore = 0, assignmentScore = 0, finalExamScore = 0 } = markScores;
  const { attendanceWeight, midExamWeight, assignmentWeight, finalExamWeight } = weights;

  // Calculate weighted components
  const attendanceComponent = (attendanceScore / attendanceWeight) * attendanceWeight;
  const midExamComponent = (midExamScore / 100) * midExamWeight;
  const assignmentComponent = (assignmentScore / 100) * assignmentWeight;
  const finalExamComponent = (finalExamScore / 100) * finalExamWeight;

  // Sum all components
  return attendanceComponent + midExamComponent + assignmentComponent + finalExamComponent;
}

/**
 * Get letter grade from numeric score
 * 
 * Implements the exact scale:
 * 95–100 → A+     70–74 → B+     55–59 → C+
 * 80–94  → A      65–69 → B      50–54 → C
 * 75–79  → A-     60–64 → B-     ≤49   → C-
 * 
 * Note: The gaps between 94/95, 79/80, 74/75, 69/70, 64/65, 59/60, 54/55, 49/50
 * are intentional per the specification, not bugs.
 * 
 * @param score - Numeric score (0 to 100)
 * @returns Letter grade
 */
export function getLetterGrade(score: number): string {
  // Ordered array of thresholds checked top-down
  const gradeThresholds = [
    { min: 95, grade: 'A+' },
    { min: 80, grade: 'A' },
    { min: 75, grade: 'A-' },
    { min: 70, grade: 'B+' },
    { min: 65, grade: 'B' },
    { min: 60, grade: 'B-' },
    { min: 55, grade: 'C+' },
    { min: 50, grade: 'C' },
    { min: 0, grade: 'C-' },
  ];

  for (const threshold of gradeThresholds) {
    if (score >= threshold.min) {
      return threshold.grade;
    }
  }

  return 'C-';
}

/**
 * Check if a student passed based on their letter grade
 * 
 * C- is considered failing. Only C and above are passing grades.
 * 
 * @param letterGrade - Letter grade (A+, A, A-, B+, B, B-, C+, C, C-)
 * @returns True if passed, false if failed
 */
export function hasPassed(letterGrade: string): boolean {
  const passingGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
  return passingGrades.includes(letterGrade);
}

/**
 * Get pass/fail status from letter grade
 * 
 * @param letterGrade - Letter grade
 * @returns "PASSED" or "FAILED"
 */
export function getPassStatus(letterGrade: string): "PASSED" | "FAILED" {
  return hasPassed(letterGrade) ? "PASSED" : "FAILED";
}
