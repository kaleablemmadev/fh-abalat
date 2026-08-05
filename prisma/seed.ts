import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('Starting database seed...');

  // Clean up existing data (with error handling)
  console.log('Cleaning up existing data...');
  try {
    await prisma.instructorAttendance.deleteMany();
  } catch (e) {
    console.log('Skipping instructorAttendance cleanup (table may not exist yet)');
  }
  try {
    await prisma.attendance.deleteMany();
  } catch (e) {
    console.log('Skipping attendance cleanup');
  }
  try {
    await prisma.courseFreeDay.deleteMany();
  } catch (e) {
    console.log('Skipping courseFreeDay cleanup');
  }
  try {
    await prisma.mark.deleteMany();
  } catch (e) {
    console.log('Skipping mark cleanup');
  }
  try {
    await prisma.courseEnrollment.deleteMany();
  } catch (e) {
    console.log('Skipping courseEnrollment cleanup');
  }
  try {
    await prisma.courseYear.deleteMany();
  } catch (e) {
    console.log('Skipping courseYear cleanup');
  }
  try {
    await prisma.courseClass.deleteMany();
  } catch (e) {
    console.log('Skipping courseClass cleanup');
  }
  try {
    await prisma.course.deleteMany();
  } catch (e) {
    console.log('Skipping course cleanup');
  }
  try {
    await prisma.instructor.deleteMany();
  } catch (e) {
    console.log('Skipping instructor cleanup');
  }
  try {
    await prisma.department.deleteMany();
  } catch (e) {
    console.log('Skipping department cleanup');
  }
  try {
    await prisma.academicYear.deleteMany();
  } catch (e) {
    console.log('Skipping academicYear cleanup');
  }
  try {
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Skipping user cleanup');
  }
  try {
    await prisma.attendanceType.deleteMany();
  } catch (e) {
    console.log('Skipping attendanceType cleanup');
  }

  // Create attendance types
  console.log('Creating attendance types...');
  const presentType = await prisma.attendanceType.create({
    data: {
      name: 'Present',
      value: 1,
      isDefault: true,
      mode: 'COURSE',
    },
  });

  const absentType = await prisma.attendanceType.create({
    data: {
      name: 'Absent',
      value: 0,
      isDefault: false,
      mode: 'COURSE',
    },
  });

  const lateType = await prisma.attendanceType.create({
    data: {
      name: 'Late',
      value: 0.5,
      isDefault: false,
      mode: 'COURSE',
    },
  });

  const excusedType = await prisma.attendanceType.create({
    data: {
      name: 'Excused',
      value: 0.8,
      isDefault: false,
      mode: 'COURSE',
    },
  });

  // Create departments
  console.log('Creating departments...');
  const theologyDept = await prisma.department.create({
    data: {
      name: 'Theology',
      code: 'THEO',
      description: 'Theological Studies Department',
      isActive: true,
    },
  });

  const bibleDept = await prisma.department.create({
    data: {
      name: 'Biblical Studies',
      code: 'BIBL',
      description: 'Biblical Studies Department',
      isActive: true,
    },
  });

  // Create instructors
  console.log('Creating instructors...');
  const instructor1 = await prisma.instructor.create({
    data: {
      fullName: 'Dr. Abraham Tesfaye',
      email: 'abraham.tesfaye@example.com',
      phoneNumber: '+251911123456',
      departmentId: theologyDept.id,
      isActive: true,
    },
  });

  const instructor2 = await prisma.instructor.create({
    data: {
      fullName: 'Prof. Sara Mengistu',
      email: 'sara.mengistu@example.com',
      phoneNumber: '+251911234567',
      departmentId: bibleDept.id,
      isActive: true,
    },
  });

  const instructor3 = await prisma.instructor.create({
    data: {
      fullName: 'Dr. Yosef Kassa',
      email: 'yosef.kassa@example.com',
      phoneNumber: '+251911345678',
      departmentId: theologyDept.id,
      isActive: true,
    },
  });

  // Create courses with required hours
  console.log('Creating courses...');
  const course1 = await prisma.course.create({
    data: {
      name: 'Introduction to Theology',
      description: 'Fundamental concepts in Christian theology',
      topics: ['Biblical Foundations', 'Church History', 'Systematic Theology'],
      credits: 3,
      requiredHours: 48, // 12 weeks * 4 hours
      instructorId: instructor1.id,
      departmentId: theologyDept.id,
      isGiven: true,
      classTypes: ['KEDAMAY', 'KALEAY'],
      semesterPreference: 'FIRST',
      attendanceWeight: 10,
      midExamWeight: 25,
      assignmentWeight: 15,
      finalExamWeight: 50,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Old Testament Studies',
      description: 'Comprehensive study of Old Testament books',
      topics: ['Pentateuch', 'Historical Books', 'Wisdom Literature', 'Prophets'],
      credits: 4,
      requiredHours: 64, // 16 weeks * 4 hours
      instructorId: instructor2.id,
      departmentId: bibleDept.id,
      isGiven: true,
      classTypes: ['SALSAY', 'RABEAY'],
      semesterPreference: 'SECOND',
      attendanceWeight: 10,
      midExamWeight: 25,
      assignmentWeight: 15,
      finalExamWeight: 50,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      name: 'New Testament Survey',
      description: 'Survey of New Testament writings and teachings',
      topics: ['Gospels', 'Acts', 'Pauline Epistles', 'General Epistles', 'Revelation'],
      credits: 3,
      requiredHours: 72, // 12 weeks * 6 hours (Keremt intensive)
      instructorId: instructor3.id,
      departmentId: theologyDept.id,
      isGiven: true,
      classTypes: ['KEREMT'],
      semesterPreference: 'BOTH',
      attendanceWeight: 10,
      midExamWeight: 25,
      assignmentWeight: 15,
      finalExamWeight: 50,
    },
  });

  const course4 = await prisma.course.create({
    data: {
      name: 'Christian Ethics',
      description: 'Ethical principles and moral theology',
      topics: ['Moral Theology', 'Social Teachings', 'Bioethics', 'Professional Ethics'],
      credits: 2,
      requiredHours: 32, // 8 weeks * 4 hours
      instructorId: instructor1.id,
      departmentId: theologyDept.id,
      isGiven: true,
      classTypes: ['KEDAMAY', 'KALEAY', 'SALSAY', 'RABEAY'],
      semesterPreference: 'BOTH',
      attendanceWeight: 10,
      midExamWeight: 25,
      assignmentWeight: 15,
      finalExamWeight: 50,
    },
  });

  // Create academic year
  console.log('Creating academic year...');
  const currentYear = new Date().getFullYear() - 8; // Ethiopian year
  const academicYear = await prisma.academicYear.create({
    data: {
      year: `${currentYear} E.C.`,
      startDate: new Date(currentYear - 1, 9, 1), // Approx Ethiopian Meskerem
      endDate: new Date(currentYear, 7, 1), // Approx Ethiopian Sene
      isActive: true,
      s1Start: new Date(currentYear - 1, 9, 1),
      s1End: new Date(currentYear, 1, 1),
      s2Start: new Date(currentYear, 1, 15),
      s2End: new Date(currentYear, 7, 1),
      s1MidExamDate: new Date(currentYear, 11, 15),
      s1FinalExamDate: new Date(currentYear, 0, 30),
      s2MidExamDate: new Date(currentYear, 5, 15),
      s2FinalExamDate: new Date(currentYear, 6, 30),
      midExamMinAttendance: 5,
      finalExamMinAttendance: 8,
    },
  });

  // Create course classes
  console.log('Creating course classes...');
  const kedamayClass = await prisma.courseClass.create({
    data: {
      name: 'KEDAMAY',
      year: `${currentYear} E.C.`,
      startDate: academicYear.startDate,
      endDate: academicYear.endDate,
      isActive: true,
      academicYearId: academicYear.id,
    },
  });

  const kaleayClass = await prisma.courseClass.create({
    data: {
      name: 'KALEAY',
      year: `${currentYear} E.C.`,
      startDate: academicYear.startDate,
      endDate: academicYear.endDate,
      isActive: true,
      academicYearId: academicYear.id,
    },
  });

  const salsayClass = await prisma.courseClass.create({
    data: {
      name: 'SALSAY',
      year: `${currentYear} E.C.`,
      startDate: academicYear.startDate,
      endDate: academicYear.endDate,
      isActive: true,
      academicYearId: academicYear.id,
    },
  });

  const keremtClass = await prisma.courseClass.create({
    data: {
      name: 'KEREMT',
      year: `${currentYear} E.C.`,
      startDate: academicYear.startDate,
      endDate: academicYear.endDate,
      isActive: true,
      academicYearId: academicYear.id,
    },
  });

  // Create course years
  console.log('Creating course years...');
  const courseYear1 = await prisma.courseYear.create({
    data: {
      courseId: course1.id,
      courseClassId: kedamayClass.id,
      year: academicYear.year,
      semester: 'FIRST',
      startDate: academicYear.s1Start!,
      endDate: academicYear.s1End!,
      attendanceWeight: course1.attendanceWeight,
      midExamWeight: course1.midExamWeight,
      assignmentWeight: course1.assignmentWeight,
      finalExamWeight: course1.finalExamWeight,
      isActive: true,
      instructorId: course1.instructorId,
    },
  });

  const courseYear2 = await prisma.courseYear.create({
    data: {
      courseId: course1.id,
      courseClassId: kaleayClass.id,
      year: academicYear.year,
      semester: 'FIRST',
      startDate: academicYear.s1Start!,
      endDate: academicYear.s1End!,
      attendanceWeight: course1.attendanceWeight,
      midExamWeight: course1.midExamWeight,
      assignmentWeight: course1.assignmentWeight,
      finalExamWeight: course1.finalExamWeight,
      isActive: true,
      instructorId: course1.instructorId,
    },
  });

  const courseYear3 = await prisma.courseYear.create({
    data: {
      courseId: course2.id,
      courseClassId: salsayClass.id,
      year: academicYear.year,
      semester: 'SECOND',
      startDate: academicYear.s2Start!,
      endDate: academicYear.s2End!,
      attendanceWeight: course2.attendanceWeight,
      midExamWeight: course2.midExamWeight,
      assignmentWeight: course2.assignmentWeight,
      finalExamWeight: course2.finalExamWeight,
      isActive: true,
      instructorId: course2.instructorId,
    },
  });

  const courseYear4 = await prisma.courseYear.create({
    data: {
      courseId: course3.id,
      courseClassId: keremtClass.id,
      year: academicYear.year,
      semester: 'FIRST',
      startDate: academicYear.s1Start!,
      endDate: academicYear.s1End!,
      attendanceWeight: course3.attendanceWeight,
      midExamWeight: course3.midExamWeight,
      assignmentWeight: course3.assignmentWeight,
      finalExamWeight: course3.finalExamWeight,
      isActive: true,
      instructorId: course3.instructorId,
    },
  });

  // Add course4 to Keremt for second semester instead of course3
  const courseYear5 = await prisma.courseYear.create({
    data: {
      courseId: course4.id,
      courseClassId: keremtClass.id,
      year: academicYear.year,
      semester: 'SECOND',
      startDate: academicYear.s2Start!,
      endDate: academicYear.s2End!,
      attendanceWeight: course4.attendanceWeight,
      midExamWeight: course4.midExamWeight,
      assignmentWeight: course4.assignmentWeight,
      finalExamWeight: course4.finalExamWeight,
      isActive: true,
      instructorId: course4.instructorId,
    },
  });

  // Create sample course-free days
  console.log('Creating course-free days...');
  const freeDay1 = await prisma.courseFreeDay.create({
    data: {
      courseYearId: courseYear1.id,
      date: new Date(currentYear - 1, 10, 1), // Ethiopian Tikimt (holidays)
      reason: 'Ethiopian Holiday - Meskel',
      isAnnual: true,
      ethiopianYear: currentYear,
      ethiopianMonth: 10,
      ethiopianDay: 1,
      notificationsSent: false,
    },
  });

  const freeDay2 = await prisma.courseFreeDay.create({
    data: {
      courseYearId: courseYear1.id,
      date: new Date(currentYear - 1, 11, 30), // Ethiopian Hidar (Christmas)
      reason: 'Ethiopian Holiday - Lidet',
      isAnnual: true,
      ethiopianYear: currentYear,
      ethiopianMonth: 11,
      ethiopianDay: 30,
      notificationsSent: false,
    },
  });

  const freeDay3 = await prisma.courseFreeDay.create({
    data: {
      courseYearId: courseYear4.id,
      date: new Date(currentYear, 0, 20), // Ethiopian Tir (one-time holiday)
      reason: 'Conference - Regional Theological Conference',
      isAnnual: false,
      ethiopianYear: currentYear,
      ethiopianMonth: 1,
      ethiopianDay: 20,
      notificationsSent: false,
    },
  });

  // Create admin user
  console.log('Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fh-abalat.com',
      fullName: 'System Administrator',
      type: 'ADMIN',
      memberType: 'REGULAR_MEMBER',
      isActive: true,
      passwordHash: 'hashed_password_here', // In production, use proper hashing
      privateId: 'ADM001',
    },
  });

  console.log('Seed completed successfully!');
  console.log('\nCreated data summary:');
  console.log(`- Departments: 2`);
  console.log(`- Instructors: 3`);
  console.log(`- Courses: 4`);
  console.log(`- Academic Year: 1`);
  console.log(`- Course Classes: 4`);
  console.log(`- Course Years: 5`);
  console.log(`- Course-Free Days: 3`);
  console.log(`- Attendance Types: 4`);
  console.log(`- Admin User: 1`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
