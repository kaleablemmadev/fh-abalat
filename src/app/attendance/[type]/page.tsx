// /attendance/[type]/page.tsx
import prisma from "@/src/lib/prisma";
import MultiMonthGrid from "../components/MultiMonthGrid";
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
  const admin = await prisma.user.findFirst({ 
    where: { type: "ADMIN" } 
  }) || await prisma.user.findFirst({ 
    where: { type: "SUPERADMIN" } 
  });
  return admin?.id || "dummy-admin-id";
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
      const gregDate = ethiopianDateToDate(ethDay);
      
      // Check if event exists
      let event = await prisma.event.findFirst({
        where: {
          ethiopianYear: currentEthYear,
          ethiopianMonth: currentEthMonth,
          ethiopianDay: ethDay.day,
          title: { contains: 'Chore' },
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
            eventType: 'CHORE', // <-- ADD THIS
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
  const members = await prisma.user.findMany({
    where: { type: "MEMBER" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  // Fetch AttendanceTypes
  const attendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { name: "asc" },
  });

  const permissionType = attendanceTypes.find(t =>
    t.name.toLowerCase().includes('permission')
  );

  // Fetch existing attendance
  const eventIds = generatedEvents.map(e => e.id);
  const existingAttendances = await prisma.attendance.findMany({
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
          { label: 'Attendance', href: `/attendance/${type}` },
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
            {type} Attendance
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {monthName} {currentEthYear} ዓ.ም. • {generatedEvents.length} {type === 'sunday' ? 'Sundays' : 'Chore days'}
          </p>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/attendance/${type}?month=${prevMonth}&year=${prevYear}`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            Previous
          </Link>
          <Link
            href={`/attendance/${type}`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            Today
          </Link>
          <Link
            href={`/attendance/${type}?month=${nextMonth}&year=${nextYear}`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            Next
          </Link>
          <Link
            href={`/attendance/${type}/list`}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            View Past
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
            href={`/attendance/chore?month=${currentEthMonth}&year=${currentEthYear}`}
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
            Chore
          </Link>
          <Link
            href={`/attendance/sunday?month=${currentEthMonth}&year=${currentEthYear}`}
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
            Sunday
          </Link>
        </div>
      </div>

      <MultiMonthGrid
        events={generatedEvents}
        members={members}
        attendanceTypes={attendanceTypes}
        initialAttendance={existingAttendances}
        permissionTypeId={permissionType?.id || null}
        type={type}
        currentEthYear={currentEthYear}
        currentEthMonth={currentEthMonth}
      />
    </div>
  );
}