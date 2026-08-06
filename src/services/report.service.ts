import prisma from '@/src/lib/prisma';
import fs from 'fs';
import path from 'path';
import { calculateFinalMark, getLetterGrade, getPassStatus } from '@/src/lib/courseGrading';
import { CourseAttendanceService } from './course-attendance.service';
import { EligibilityService } from './eligibility.service';

export class ReportService {
  /**
   * Loads the NotoSansEthiopic font into the jsPDF document
   */
  private static async loadFont(doc: any): Promise<boolean> {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansEthiopic-VariableFont_wdth,wght.ttf');
    if (fs.existsSync(fontPath)) {
      const fontData = fs.readFileSync(fontPath);
      doc.addFileToVFS('NotoSansEthiopic.ttf', fontData.toString('base64'));
      doc.addFont('NotoSansEthiopic.ttf', 'NotoSansEthiopic', 'normal');
      doc.setFont('NotoSansEthiopic');
      return true;
    }
    console.warn('Amharic font not found at:', fontPath);
    return false;
  }

  /**
   * Helper to aggregate all student performance data for an academic year
   */
  private static async aggregatePerformanceData(academicYearId: string) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        classes: {
          include: {
            courseYears: {
              include: {
                course: { include: { instructor: true } },
                instructor: true,
                marks: { include: { student: true } }
              }
            }
          }
        }
      }
    });

    if (!academicYear) throw new Error('Academic year not found');

    const students = await prisma.user.findMany({
      where: {
        enrollments: {
          some: {
            courseClass: { academicYearId },
            status: 'ACTIVE'
          }
        }
      },
      include: {
        enrollments: {
          where: { courseClass: { academicYearId }, status: 'ACTIVE' },
          include: { courseClass: true }
        }
      }
    });

    const performanceMap: Map<string, {
      student: any,
      courses: any[],
      totalScoreSum: number,
      average: number,
      globalRank: number
    }> = new Map();

    for (const student of students) {
      const studentCourses: any[] = [];
      let totalScoreSum = 0;

      // Find all courseYears for this student's classes
      for (const enrollment of student.enrollments) {
        const courseYears = await prisma.courseYear.findMany({
          where: { courseClassId: enrollment.courseClassId || undefined, year: academicYear.year },
          include: { course: true, instructor: true }
        });

        for (const cy of courseYears) {
          const attendanceScore = await CourseAttendanceService.calculateStudentAttendanceScore(
            student.id,
            cy.courseClassId,
            cy.attendanceWeight
          );

          const mark = await prisma.mark.findUnique({
            where: { studentId_courseYearId: { studentId: student.id, courseYearId: cy.id } }
          });

          const weightedTotal = calculateFinalMark(
            {
              midExamScore: mark?.midExamScore || 0,
              assignmentScore: mark?.assignmentScore || 0,
              finalExamScore: mark?.finalExamScore || 0,
            },
            {
              attendanceWeight: cy.attendanceWeight,
              midExamWeight: cy.midExamWeight,
              assignmentWeight: cy.assignmentWeight,
              finalExamWeight: cy.finalExamWeight,
            },
            attendanceScore
          );

          const grade = getLetterGrade(weightedTotal);

          studentCourses.push({
            courseYear: cy,
            mark,
            attendanceScore,
            weightedTotal,
            grade,
            passStatus: getPassStatus(grade)
          });

          totalScoreSum += weightedTotal;
        }
      }

      performanceMap.set(student.id, {
        student,
        courses: studentCourses,
        totalScoreSum,
        average: studentCourses.length > 0 ? totalScoreSum / studentCourses.length : 0,
        globalRank: 0 // To be calculated
      });
    }

    // Calculate Global Ranks
    const sortedStudents = Array.from(performanceMap.values()).sort((a, b) => b.average - a.average);
    sortedStudents.forEach((data, index) => {
      data.globalRank = index + 1;
    });

    return { academicYear, performanceMap };
  }

  /**
   * Type 1: Marks by Course
   */
  static async generateMarksByCoursePDF(academicYearId: string): Promise<Buffer> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { academicYear, performanceMap } = await this.aggregatePerformanceData(academicYearId);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fontLoaded = await this.loadFont(doc);

    // Group performance data by Course
    const courseToStudentsMap: Map<string, any[]> = new Map();
    performanceMap.forEach((pData) => {
      pData.courses.forEach((c) => {
        if (!courseToStudentsMap.has(c.courseYear.id)) {
          courseToStudentsMap.set(c.courseYear.id, []);
        }
        courseToStudentsMap.get(c.courseYear.id)!.push({
          ...c,
          studentName: pData.student.fullName,
          globalRank: pData.globalRank
        });
      });
    });

    let isFirstPage = true;
    for (const [courseYearId, studentList] of Array.from(courseToStudentsMap.entries())) {
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const firstRecord = studentList[0];
      const cy = firstRecord.courseYear;
      const instructorName = cy.instructor?.fullName || cy.course.instructor.fullName;

      // Header
      doc.setFontSize(16);
      doc.text(`${cy.course.name} (${cy.courseClass.name})`, 14, 20);
      doc.setFontSize(10);
      doc.text(`መምህር (Instructor): ${instructorName}`, 14, 27);
      doc.text(`አመት (Year): ${academicYear.year}`, 14, 32);

      // Table
      const head = [['ተ.ቁ.', 'ተማሪ ስም (Student Name)', 'አቴንዳንስ', 'አሳይመንት', 'ሚድ ፈተና', 'ፋይናል', 'ጠቅላላ (100%)', 'አማካይ', 'ግሬድ', 'ደረጃ (Rank)']];

      // Sort studentList by Global Rank (based on average of all courses)
      const sortedByRank = [...studentList].sort((a, b) => a.globalRank - b.globalRank);

      const body = sortedByRank.map((s, idx) => [
        idx + 1,
        s.studentName,
        s.attendanceScore.toFixed(1),
        s.mark?.assignmentScore?.toFixed(1) || '-',
        s.mark?.midExamScore?.toFixed(1) || '-',
        s.mark?.finalExamScore?.toFixed(1) || '-',
        s.weightedTotal.toFixed(1),
        (performanceMap.get(s.studentId)?.average.toFixed(1) || '-') + '%',
        s.grade,
        s.globalRank
      ]);

      autoTable(doc, {
        startY: 38,
        head,
        body,
        styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica', fontSize: 8 },
        headStyles: { fillColor: [21, 101, 192] },
        theme: 'grid'
      });
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Type 2 & 3: Marks by Student
   */
  static async generateMarksByStudentPDF(academicYearId: string, studentIds?: string[]): Promise<Buffer> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { academicYear, performanceMap } = await this.aggregatePerformanceData(academicYearId);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fontLoaded = await this.loadFont(doc);

    let list = Array.from(performanceMap.values());
    if (studentIds && studentIds.length > 0) {
      list = list.filter(p => studentIds.includes(p.student.id));
      // Sort by global rank for selected students
      list.sort((a, b) => a.globalRank - b.globalRank);
    } else {
      // Sort by name for all students report
      list.sort((a, b) => (a.student.fullName || '').localeCompare(b.student.fullName || ''));
    }

    let isFirstPage = true;
    for (const pData of list) {
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const className = pData.student.enrollments[0]?.courseClass?.name || 'Unknown';

      // Header
      doc.setFontSize(16);
      doc.text(`የተማሪ ውጤት (Student Grade Sheet)`, 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`ተማሪ (Student): ${pData.student.fullName}`, 14, 35);
      doc.text(`ክፍል (Class): ${className}`, 14, 42);
      doc.text(`አመት (Year): ${academicYear.year}`, 14, 49);

      // Table
      const head = [['የኮርስ ስም (Course Name)', 'አሳይመንት', 'ሚድ ፈተና', 'ፋይናል', 'አማካይ (Total)', 'ግሬድ']];
      const body = pData.courses.map(c => [
        c.courseYear.course.name,
        c.mark?.assignmentScore?.toFixed(1) || '-',
        c.mark?.midExamScore?.toFixed(1) || '-',
        c.mark?.finalExamScore?.toFixed(1) || '-',
        c.weightedTotal.toFixed(1),
        c.grade
      ]);

      autoTable(doc, {
        startY: 55,
        head,
        body,
        styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica', fontSize: 10 },
        headStyles: { fillColor: [21, 101, 192] },
        theme: 'grid'
      });

      // Overall average and Rank
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(11);
      doc.text(`ጠቅላላ አማካይ (Overall Average): ${pData.average.toFixed(1)}%`, 14, finalY + 15);
      doc.text(`ደረጃ (Global Rank): ${pData.globalRank}`, 14, finalY + 22);
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Attendance: Eligibility Report
   */
  static async generateEligibilityReportPDF(eventId: string): Promise<Buffer> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const report = await EligibilityService.checkEventEligibility(eventId);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fontLoaded = await this.loadFont(doc);

    doc.setFontSize(16);
    doc.text(`የፈተና መፈተኛ መስፈርት (Eligibility Report)`, 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`ኩነት (Event): ${report.eventTitle}`, 14, 35);
    doc.text(`ቀን (Date): ${report.eventDate.toLocaleDateString()}`, 14, 42);

    doc.text(`Eligible Students`, 14, 55);
    autoTable(doc, {
      startY: 60,
      head: [['ተማሪ ስም', 'Chore', 'Sunday', 'Total']],
      body: report.eligibleMembers.map(m => [m.fullName, m.scores.choreScore, m.scores.sundayScore, m.scores.totalScore]),
      styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica' }
    });

    doc.addPage();
    doc.text(`Ineligible Students`, 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [['ተማሪ ስም', 'Reasons']],
      body: report.ineligibleMembers.map(m => [m.fullName, m.reasons.join(', ')]),
      styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica' }
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Attendance: Student Report
   */
  static async generateAttendanceReportPDF(academicYearId: string, showAbsentDates: boolean): Promise<Buffer> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const students = await prisma.user.findMany({
      where: { enrollments: { some: { courseClass: { academicYearId }, status: 'ACTIVE' } } },
      include: {
        attendances: {
          where: { event: { courseClass: { academicYearId } } },
          include: { attendanceType: true, event: true }
        }
      }
    });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fontLoaded = await this.loadFont(doc);

    doc.setFontSize(16);
    doc.text(`የተማሪዎች አቴንዳንስ ሪፖርት (Student Attendance Report)`, 105, 20, { align: 'center' });

    const head = [['ተማሪ ስም', 'Total Attended', 'Total Permissions', 'Score', showAbsentDates ? 'Absent Dates' : ''].filter(Boolean)];
    const body = students.map(s => {
      const attended = s.attendances.filter(a => a.attendanceType.value === 1).length;
      const permissions = s.attendances.filter(a => a.attendanceType.value === 0.5).length;
      const score = attended + (permissions * 0.5);

      const row: any[] = [s.fullName, attended, permissions, score];
      if (showAbsentDates) {
        const absents = s.attendances.filter(a => a.attendanceType.value === 0).map(a => a.event.date.toLocaleDateString());
        row.push(absents.join(', ') || 'None');
      }
      return row;
    });

    autoTable(doc, {
      startY: 35,
      head,
      body,
      styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica', fontSize: 9 }
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Attendance: Instructor Report
   */
  static async generateInstructorReportPDF(academicYearId: string): Promise<Buffer> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const instructors = await prisma.instructor.findMany({
        include: {
            attendances: {
                where: { event: { courseClass: { academicYearId } } },
                include: { attendanceType: true, event: true, instructor: true }
            },
            courseYears: {
                where: { courseClass: { academicYearId } },
                include: { course: true }
            }
        }
    });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fontLoaded = await this.loadFont(doc);

    let isFirstPage = true;
    for (const inst of instructors) {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        doc.setFontSize(16);
        doc.text(`የመምህር የሥራ ሪፖርት: ${inst.fullName}`, 14, 20);

        // Group by course taught
        const courseRecords: Map<string, any> = new Map();
        for (const cy of inst.courseYears) {
            const taughtAttendances = inst.attendances.filter(a => a.courseId === cy.courseId && a.attendanceType.value >= 1);
            const absentAttendances = inst.attendances.filter(a => a.courseId === cy.courseId && a.attendanceType.value === 0);

            const hoursTaught = taughtAttendances.reduce((sum, a) => sum + (a.durationHours || 1.0), 0);
            const required = cy.course.requiredHours || 0;
            const diff = hoursTaught - required;

            courseRecords.set(cy.courseId, {
                courseName: cy.course.name,
                hoursTaught,
                required,
                diff,
                absents: absentAttendances
            });
        }

        let startY = 30;
        for (const record of Array.from(courseRecords.values())) {
            doc.setFontSize(12);
            doc.text(`ኮርስ: ${record.courseName}`, 14, startY);

            autoTable(doc, {
                startY: startY + 5,
                head: [['Hours Taught', 'Required Hours', 'Difference']],
                body: [[
                    record.hoursTaught,
                    record.required,
                    `${record.diff > 0 ? '+' : ''}${record.diff} hours ${record.diff >= 0 ? 'more' : 'less'} than required`
                ]],
                styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica' }
            });

            if (record.absents.length > 0) {
                const nextY = (doc as any).lastAutoTable.finalY + 5;
                doc.setFontSize(10);
                doc.text('Absence History:', 14, nextY);

                // For each absent record, try to find if there was a substitute record for the same event
                const body = await Promise.all(record.absents.map(async (a: any) => {
                  const substituteRecord = await prisma.instructorAttendance.findFirst({
                    where: {
                      eventId: a.eventId,
                      substituteForId: inst.id,
                      attendanceType: { value: { gte: 1 } }
                    },
                    include: { instructor: true }
                  });

                  return [
                    a.event.date.toLocaleDateString(),
                    a.absenceReason || 'Not provided',
                    substituteRecord ? `Covered by ${substituteRecord.instructor.fullName}` : 'No substitute'
                  ];
                }));

                autoTable(doc, {
                    startY: nextY + 3,
                    head: [['Date', 'Reason', 'Substitute']],
                    body: body,
                    styles: { font: fontLoaded ? 'NotoSansEthiopic' : 'helvetica' }
                });
            }
            startY = (doc as any).lastAutoTable.finalY + 15;
        }
    }

    return Buffer.from(doc.output('arraybuffer'));
  }
}
