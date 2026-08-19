// /abalat/attendance/[type]/page.tsx
import prisma from "@/src/lib/prisma";
import MultiMonthGrid from "../components/MultiMonthGrid";
import AttendanceExcelImport from "../components/AttendanceExcelImport";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  getEthiopianToday,
  ethMonthNames,
  getChoreDaysInMonth,
  getSundaysInMonth,
  ethiopianDateToDate,
  dateToEthiopian,
  getEthiopianMonthDaysCount
} from "@/src/lib/ethiopiancal";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";

async function getAdminId() {
  try {
    const admin = await prisma.user.findFirst({ 
      where: { type: "ADMIN" } 
    }) || await prisma.user.findFirst({ 
      where: { type: "SUPERADMIN" } 
    });
    return admin?.id || "dummy-admin-id";
  } catch (error) {
    console.error('Database connection error in getAdminId:', error);
    // Return a dummy ID to prevent page crash
    return "dummy-admin-id";
  }
}

export default async function MultiMonthAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { type } = await params;
  const { month, year } = await searchParams;

  const validTypes = ['chore', 'sunday'];
  if (!validTypes.includes(type)) {
    notFound();
  }

  // Get current Ethiopian date
  const todayEth = getEthiopianToday();
  
  // Determine which Ethiopian month/year to show
  let currentEthMonth = month ? parseInt(month, 10) : 1;
  const currentEthYear = year ? parseInt(year, 10) : todayEth.year;
  
  // If no month provided, try to find current month
  if (!month) {
    for (const [key, value] of Object.entries(ethMonthNames)) {
      if (value === todayEth.month) {
        currentEthMonth = parseInt(key);
        break;
      }
    }
  }
  
  const monthName = ethMonthNames[currentEthMonth] || '';
  const adminId = await getAdminId();

  // Get event dates for this Ethiopian month
  const generatedEvents: Array<{ 
    id: string; 
    title: string; 
    date: Date; 
    ethDate: { year: number; month: string; day: number } 
  }> = [];

  if (type === 'chore') {
    // Get all chore days for the month
    const choreDays = getChoreDaysInMonth(currentEthYear, currentEthMonth);
    
    // Create or find events for each chore day
    for (const ethDay of choreDays) {
      try {
        const gregDate = ethiopianDateToDate(ethDay);
        
        // Check if event exists
        let event = await prisma.event.findFirst({
          where: {
            ethiopianYear: currentEthYear,
            ethiopianMonth: currentEthMonth,
            ethiopianDay: ethDay.day,
            title: { contains: 'Chore' },
            courseClassId: null,
          },
        });
        
        if (!event) {
          event = await prisma.event.create({
            data: {
              title: `Chore Attendance`,
              date: gregDate,
              ethiopianYear: currentEthYear,
              ethiopianMonth: currentEthMonth,
              ethiopianDay: ethDay.day,
              eventType: 'CHORE',
              createdById: adminId,
            },
          });
        }
        
        generatedEvents.push({
          id: event.id,
          title: event.title,
          date: event.date,
          ethDate: ethDay,
        });
      } catch (error) {
        console.error(`Error processing chore day ${ethDay.day}:`, error);
        continue;
      }
    }
} else if (type === 'sunday') {
    // Get all Sundays in the month - FIXED with manual date mapping
    const daysInMonth = getEthiopianMonthDaysCount(currentEthYear, currentEthMonth);
    const monthName = ethMonthNames[currentEthMonth];
    
    // Known mapping for July 2024 as reference:
    // Ethiopian Hamle 5, 2024 = Gregorian July 13, 2024 (Saturday)
    // Ethiopian Hamle 6, 2024 = Gregorian July 14, 2024 (Sunday)
    // Ethiopian Hamle 12, 2024 = Gregorian July 20, 2024 (Saturday)
    // Ethiopian Hamle 13, 2024 = Gregorian July 21, 2024 (Sunday)
    // Ethiopian Hamle 19, 2024 = Gregorian July 27, 2024 (Saturday)
    // Ethiopian Hamle 20, 2024 = Gregorian July 28, 2024 (Sunday)
    
    // We need to check each day of the month and see if it's Sunday
    for (let day = 1; day <= daysInMonth; day++) {
      try {
        // Convert Ethiopian date to Gregorian
        const ethDay = { year: currentEthYear, month: monthName, day };
        const gregDate = ethiopianDateToDate(ethDay);
        
        // Check if it's Sunday (day 0 is Sunday in JavaScript)
        if (gregDate.getDay() === 0) {
          // Check if event exists
          let event = await prisma.event.findFirst({
            where: {
              ethiopianYear: currentEthYear,
              ethiopianMonth: currentEthMonth,
              ethiopianDay: day,
              title: { contains: 'Sunday' },
              courseClassId: null,
            },
          });
          
          if (!event) {
            event = await prisma.event.create({
              data: {
                title: `Sunday Morning Attendance`,
                date: gregDate,
                ethiopianYear: currentEthYear,
                ethiopianMonth: currentEthMonth,
                ethiopianDay: ethDay.day,
                eventType: 'SUNDAY', // <-- ADD THIS
                createdById: adminId,
              },
            });
          }
          
          generatedEvents.push({
            id: event.id,
            title: event.title,
            date: event.date,
            ethDate: { year: currentEthYear, month: monthName, day },
          });
        }
      } catch (error) {
        // Skip invalid dates
        console.error(`Error processing day ${day}:`, error);
        continue;
      }
    }
  }

  // Fetch Members
  let members: Array<{ id: string; fullName: string | null }> = [];
  try {
    members = await prisma.user.findMany({
      where: {
        type: "MEMBER",
        roles: { has: "REGULAR_MEMBER" },
        NOT: { roles: { has: "COURSE_STUDENT" } },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    members = [];
  }

  // Fetch AttendanceTypes
  let allAttendanceTypes: Array<{ id: string; name: string; value: number }> = [];
  try {
    allAttendanceTypes = await prisma.attendanceType.findMany({
      where: { mode: "ABALAT" },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error('Error fetching attendance types:', error);
    allAttendanceTypes = [];
  }

  // Filter out "Late"
  const attendanceTypes = allAttendanceTypes.filter(t => t.name.toLowerCase() !== 'late');

  const permissionType = attendanceTypes.find(t =>
    t.name.toLowerCase().includes('permission')
  );

  // Fetch approved permissions for members in this view
  const memberIds = members.map(m => m.id);
  let approvedPermissions: Array<{ 
    memberId: string; 
    permissionType: { 
      appliesToChore: boolean; 
      appliesToSunday: boolean; 
    }; 
    ethiopianStartDate: string | null;
  }> = [];
  try {
    approvedPermissions = await prisma.permission.findMany({
      where: {
        memberId: { in: memberIds },
        status: 'APPROVED',
      },
      include: {
        permissionType: true,
      },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    approvedPermissions = [];
  }

  // Pre-calculate auto-fill records based on permissions
  const { isMemberExcusedForEvent } = await import("@/src/services/permission.service");
  const autoFillRecords: Array<{ memberId: string; eventId: string; attendanceTypeId: string }> = [];

  if (permissionType) {
    for (const event of generatedEvents) {
      const eventType = type.toUpperCase() as 'CHORE' | 'SUNDAY';
      const ethDate = dateToEthiopian(event.date);

      for (const member of members) {
        const memberPermissions = approvedPermissions.filter(p => p.memberId === member.id);

        for (const permission of memberPermissions) {
          const isExcused = await isMemberExcusedForEvent(
            permission.permissionType,
            ethDate,
            event.date,
            eventType,
            permission.ethiopianStartDate
          );

          if (isExcused) {
            autoFillRecords.push({
              memberId: member.id,
              eventId: event.id,
              attendanceTypeId: permissionType.id,
            });
            break; // Stop checking other permissions for this member-event
          }
        }
      }
    }
  }

  // Fetch existing attendance
  const eventIds = generatedEvents.map(e => e.id);
  let existingAttendances: Array<{ 
    memberId: string; 
    eventId: string; 
    attendanceTypeId: string; 
    permissionId: string | null 
  }> = [];
  try {
    existingAttendances = await prisma.attendance.findMany({
      where: {
        eventId: { in: eventIds },
      },
      select: { 
        memberId: true, 
        eventId: true, 
        attendanceTypeId: true, 
        permissionId: true 
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    existingAttendances = [];
  }

  // Navigation URLs
  const prevMonth = currentEthMonth === 1 ? 13 : currentEthMonth - 1;
  const prevYear = currentEthMonth === 1 ? currentEthYear - 1 : currentEthYear;
  const nextMonth = currentEthMonth === 13 ? 1 : currentEthMonth + 1;
  const nextYear = currentEthMonth === 13 ? currentEthYear + 1 : currentEthYear;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'አቴንዳንስ', href: `/abalat/attendance/${type}` },
          { label: `${monthName} ${currentEthYear}` },
        ]}
      />

      {/* Page header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div>
          <h1
            className="text-xl font-bold tracking-tight capitalize"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {type === 'chore' ? "የሠርክ" : "የእሑድ"} አቴንዳንስ
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {monthName} {currentEthYear} ዓ.ም. • {generatedEvents.length} {type === 'sunday' ? 'እሑድ ጉባዔያት' : 'የሠርክ ቀናት'}
          </p>
        </div>

        <AttendanceExcelImport type={type as 'chore' | 'sunday'} />
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/abalat/attendance/${type}?month=${prevMonth}&year=${prevYear}`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            ያለፈ ወር
          </Link>
          <Link
            href={`/abalat/attendance/${type}`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            አሁን ወር
          </Link>
          <Link
            href={`/abalat/attendance/${type}?month=${nextMonth}&year=${nextYear}`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            ቀጣይ ወር
          </Link>
          <Link
            href={`/abalat/attendance/${type}/list`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            የቀደመ አቴንዳንስ ዝርዝር
          </Link>
        </div>

        {/* Segmented control */}
        <div
          className="inline-flex items-center p-0.5 rounded"
          style={{
            background: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <Link
            href={`/abalat/attendance/chore?month=${currentEthMonth}&year=${currentEthYear}`}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150"
            style={
              type === 'chore'
                ? {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }
                : {
                    background: 'transparent',
                    color: 'hsl(var(--muted-foreground))',
                  }
            }
          >
            የሠርክ
          </Link>
          <Link
            href={`/abalat/attendance/sunday?month=${currentEthMonth}&year=${currentEthYear}`}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150"
            style={
              type === 'sunday'
                ? {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }
                : {
                    background: 'transparent',
                    color: 'hsl(var(--muted-foreground))',
                  }
            }
          >
            የእሑድ
          </Link>
        </div>
      </div>

      <MultiMonthGrid
        key={`${type}_${currentEthYear}_${currentEthMonth}`}
        events={generatedEvents}
        members={members}
        attendanceTypes={attendanceTypes}
        initialAttendance={existingAttendances}
        autoFillRecords={autoFillRecords}
        permissionTypeId={permissionType?.id || null}
        type={type}
        currentEthYear={currentEthYear}
        currentEthMonth={currentEthMonth}
      />
    </div>
  );
}