import prisma from "@/src/lib/prisma";
import * as XLSX from "xlsx";

export type ImportType = "instructors" | "courses" | "marks";

export class ExcelService {
  /**
   * Generates a template buffer for Excel download
   */
  static generateTemplate(type: ImportType): Buffer {
    const wb = XLSX.utils.book_new();
    let data: any[] = [];
    let sheetName = "Template";

    if (type === "instructors") {
      sheetName = "Instructors";
      data = [
        ["Full Name", "Email", "Phone No.", "Department"],
        ["John Doe", "john@example.com", "0911223344", "Theology"],
        ["Jane Smith", "jane@example.com", "0922334455", "History"],
      ];
    } else if (type === "courses") {
      sheetName = "Courses";
      data = [
        [
          "Course Name", "Description", "Topics", "Credits", "Teaching Hours",
          "Instructor", "Department", "Permanent Class", "Semester",
          "Weight: Assignment", "Weight: Mid Exam", "Weight: Final Exam", "Weight: Attendance"
        ],
        [
          "Introduction to Geez", "Basics of the Geez language", "Alphabet", 3, 30,
          "John Doe", "Theology", "KEDAMAY", "FIRST", 15, 25, 50, 10
        ],
        ["", "", "Grammar", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "Vocabulary", "", "", "", "", "", "", "", "", "", ""],
      ];
    } else if (type === "marks") {
      sheetName = "Course Name Here";
      data = [
        ["No.", "Student Name", "Attendance (Optional)", "Assignment", "Mid Exam", "Final Exam"],
        [1, "Student A", 10, 15, 25, 50],
        [2, "Student B", 9, 14, 22, 48],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // If marks, maybe add a second example sheet
    if (type === "marks") {
      const ws2 = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws2, "Another Course");
    }

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Imports instructors from Excel buffer
   */
  static async importInstructors(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const results = { success: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        const fullName = row["Full Name"];
        const email = row["Email"];
        const phone = row["Phone No."];
        const deptName = row["Department"];

        if (!fullName) continue;

        // Resolve department
        let departmentId: string | undefined;
        if (deptName) {
          const dept = await prisma.department.findUnique({ where: { name: deptName } });
          if (!dept) {
             throw new Error(`Department "${deptName}" not found for instructor ${fullName}`);
          }
          departmentId = dept.id;
        } else {
          // Find or fallback to a default if necessary, but here we require it or make it optional
          const firstDept = await prisma.department.findFirst();
          departmentId = firstDept?.id;
        }

        if (!departmentId) throw new Error(`No departments available in the system.`);

        await prisma.instructor.upsert({
          where: { fullName },
          update: {
            email: email || null,
            phoneNumber: phone?.toString() || null,
            departmentId,
          },
          create: {
            fullName,
            email: email || null,
            phoneNumber: phone?.toString() || null,
            departmentId,
          },
        });

        results.success++;
      } catch (e: any) {
        results.errors.push(e.message);
      }
    }

    return results;
  }

  /**
   * Imports courses from Excel buffer
   */
  static async importCourses(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Use AOA to handle the multi-row topics correctly
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = data[0];
    const rows = data.slice(1);

    const results = { success: 0, errors: [] as string[] };
    let currentCourse: any = null;

    for (const row of rows) {
      try {
        const name = row[0]; // Course Name
        const topic = row[2]; // Topic column

        if (name) {
          // If we have a name, this is a new course row
          if (currentCourse) {
            await this.saveCourse(currentCourse);
            results.success++;
          }

          currentCourse = {
            name,
            description: row[1],
            topics: topic ? [topic] : [],
            credits: parseInt(row[3]) || 0,
            requiredHours: parseInt(row[4]) || 0,
            instructorName: row[5],
            deptName: row[6],
            permanentClass: row[7],
            semester: row[8],
            wAssignment: parseFloat(row[9]) || 15,
            wMid: parseFloat(row[10]) || 25,
            wFinal: parseFloat(row[11]) || 50,
            wAttendance: parseFloat(row[12]) || 10,
          };
        } else if (currentCourse && topic) {
          // This is a continuation row for topics
          currentCourse.topics.push(topic);
        }
      } catch (e: any) {
        results.errors.push(e.message);
      }
    }

    // Save the last course
    if (currentCourse) {
      try {
        await this.saveCourse(currentCourse);
        results.success++;
      } catch (e: any) {
        results.errors.push(e.message);
      }
    }

    return results;
  }

  private static async saveCourse(data: any) {
    const dept = await prisma.department.findUnique({ where: { name: data.deptName } });
    if (!dept) throw new Error(`Department "${data.deptName}" not found for course ${data.name}`);

    const inst = await prisma.instructor.findUnique({ where: { fullName: data.instructorName } });
    if (!inst) throw new Error(`Instructor "${data.instructorName}" not found for course ${data.name}`);

    await prisma.course.upsert({
      where: { name: data.name },
      update: {
        description: data.description,
        topics: data.topics,
        credits: data.credits,
        requiredHours: data.requiredHours,
        instructorId: inst.id,
        departmentId: dept.id,
        semesterPreference: data.semester as any,
        assignmentWeight: data.wAssignment,
        midExamWeight: data.wMid,
        finalExamWeight: data.wFinal,
        attendanceWeight: data.wAttendance,
        classTypes: [data.permanentClass as any],
      },
      create: {
        name: data.name,
        description: data.description,
        topics: data.topics,
        credits: data.credits,
        requiredHours: data.requiredHours,
        instructorId: inst.id,
        departmentId: dept.id,
        semesterPreference: data.semester as any,
        assignmentWeight: data.wAssignment,
        midExamWeight: data.wMid,
        finalExamWeight: data.wFinal,
        attendanceWeight: data.wAttendance,
        classTypes: [data.permanentClass as any],
      },
    });
  }

  /**
   * Imports marks from Excel buffer (Multi-sheet)
   */
  static async importMarks(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const results = { success: 0, sheetsProcessed: 0, errors: [] as string[] };

    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) throw new Error("No active academic year found. Cannot import marks.");

    for (const sheetName of workbook.SheetNames) {
      try {
        const course = await prisma.course.findUnique({
          where: { name: sheetName },
          include: { courseYears: { where: { year: activeYear.year } } }
        });

        if (!course) {
          results.errors.push(`Sheet "${sheetName}": No course found with this name.`);
          continue;
        }

        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        results.sheetsProcessed++;

        for (const row of rows) {
          const studentName = row["Student Name"];
          if (!studentName) continue;

          const student = await prisma.user.findFirst({
            where: { fullName: studentName, type: "MEMBER" }
          });

          if (!student) {
            results.errors.push(`Sheet "${sheetName}": Student "${studentName}" not found.`);
            continue;
          }

          // Resolve CourseYear for this student's class
          const enrollment = await prisma.courseEnrollment.findFirst({
            where: { studentId: student.id, status: "ACTIVE" },
            include: { courseClass: true }
          });

          if (!enrollment || !enrollment.courseClassId) {
             results.errors.push(`Sheet "${sheetName}": Student "${studentName}" is not enrolled in any active class.`);
             continue;
          }

          const courseYear = await prisma.courseYear.findFirst({
            where: {
              courseId: course.id,
              courseClassId: enrollment.courseClassId || undefined,
              year: activeYear.year
            }
          });

          if (!courseYear) {
            results.errors.push(`Sheet "${sheetName}": Course "${course.name}" is not assigned to class "${enrollment.courseClass?.name}" for this year.`);
            continue;
          }

          // Update Mark
          const mid = parseFloat(row["Mid Exam"]);
          const assignment = parseFloat(row["Assignment"]);
          const final = parseFloat(row["Final Exam"]);

          await prisma.mark.upsert({
            where: {
              studentId_courseYearId: {
                studentId: student.id,
                courseYearId: courseYear.id
              }
            },
            update: {
              midExamScore: isNaN(mid) ? undefined : mid,
              assignmentScore: isNaN(assignment) ? undefined : assignment,
              finalExamScore: isNaN(final) ? undefined : final,
            },
            create: {
              studentId: student.id,
              courseYearId: courseYear.id,
              midExamScore: isNaN(mid) ? undefined : mid,
              assignmentScore: isNaN(assignment) ? undefined : assignment,
              finalExamScore: isNaN(final) ? undefined : final,
            }
          });

          results.success++;
        }
      } catch (e: any) {
        results.errors.push(`Sheet "${sheetName}": ${e.message}`);
      }
    }

    return results;
  }
}
