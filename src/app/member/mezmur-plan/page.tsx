import prisma from "@/src/lib/prisma";
import MemberMezmurPlanClient from "./components/MemberMezmurPlanClient";
import { getEthiopianToday, ethMonthNames } from "@/src/lib/ethiopiancal";

export default async function MemberMezmurPlanPage() {
  const today = getEthiopianToday();
  
  // Find month number
  let currentMonthNumber = 1;
  for (const [key, value] of Object.entries(ethMonthNames)) {
    if (value === today.month) {
      currentMonthNumber = parseInt(key);
      break;
    }
  }

  // Fetch the schedule for the current month
  const schedules = await prisma.monthlyMezmurSchedule.findMany({
    where: {
      year: today.year,
      month: currentMonthNumber,
    },
    include: {
      musicFiles: {
        include: {
          categories: true,
        },
      },
    },
    orderBy: { day: 'asc' }
  });

  // Fetch all music files for download functionality
  const musicFiles = await prisma.musicFile.findMany({
    select: {
      id: true,
      title: true,
      fileUrl: true,
      lyrics: true,
      language: true,
      interpretation: true,
    },
    orderBy: { title: 'asc' }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ወርኃዊ የአገልግሎት መዝሙራት</h1>
        <p className="text-sm opacity-70">
          ለ{today.month} {today.year} የሚሆኑ የአገልግሎት መዝሙራት
        </p>
      </div>

      <MemberMezmurPlanClient 
        schedules={schedules} 
        musicFiles={musicFiles}
        currentMonth={currentMonthNumber}
        currentYear={today.year}
      />
    </div>
  );
}
