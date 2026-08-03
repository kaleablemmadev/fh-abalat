import prisma from "@/src/lib/prisma";
import MonthlyPlanClient from "./components/MonthlyPlanClient";
import { getEthiopianToday } from "@/src/lib/ethiopiancal";

export default async function MonthlyPlanPage() {
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

  const today = getEthiopianToday();

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ወርኃዊ የአገልግሎት መዝሙራት</h1>
        <p className="text-sm opacity-70">በወር ውስጥ ባሉት የአገልግሎት ቀናት የሚዘመሩትን መዝሙራት አስቀምጡ</p>
      </div>
      <MonthlyPlanClient musicFiles={musicFiles} currentEthiopianDate={today} />
    </div>
  );
}
