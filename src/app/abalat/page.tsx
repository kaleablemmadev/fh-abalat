import Link from 'next/link';
import { ArrowRight, BarChart3, Calendar, CheckSquare, Clock, FilePlus2, ShieldPlus } from 'lucide-react';
import prisma from '@/src/lib/prisma';
import { EligibilityService } from '@/src/services/eligibility.service';
import { dateToEthiopian, ethiopianToGregorianDate, ethMonthNames, getEthiopianToday } from '@/src/lib/ethiopiancal';

function dayStart(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function dayEnd(date: Date) { const value = new Date(date); value.setHours(23, 59, 59, 999); return value; }
function currentWeekRange(date: Date) {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return { start: dayStart(monday), end: dayEnd(sunday) };
}
function monthRange(year: number, month: number) {
  const start = ethiopianToGregorianDate({ year, month, day: 1 });
  const next = month === 13 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const end = ethiopianToGregorianDate({ year: next.year, month: next.month, day: 1 });
  return { start: new Date(start.year, start.month - 1, start.day), end: new Date(end.year, end.month - 1, end.day) };
}

export default async function AbalatTodayPage() {
  const today = getEthiopianToday();
  const now = new Date();
  const weekRange = currentWeekRange(now);
  const [weekEvents, recentEvents, members] = await Promise.all([
      prisma.event.findMany({
        where: { mode: 'ABALAT', courseClassId: null, isAcademicTimeline: false, eventType: { in: ['CHORE', 'SUNDAY'] }, date: { gte: weekRange.start, lte: weekRange.end } },
      orderBy: { date: 'asc' },
    }),
    prisma.event.findMany({
      where: { mode: 'ABALAT', courseClassId: null, isAcademicTimeline: false, eventType: 'EVENT', isRecurring: true, date: { gte: now } },
      include: { eligibilityRule: { include: { criteria: true } } }, orderBy: { date: 'asc' }, take: 2,
    }),
    prisma.user.findMany({
      where: { mode: 'ABALAT', type: 'MEMBER', courseClassId: null, NOT: { roles: { has: 'COURSE_STUDENT' } } },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  const recentReports = await Promise.all(recentEvents.map(async (event) => ({ event, report: await EligibilityService.checkEventEligibility(event.id) })));
  const currentMonthNumber = Number(Object.entries(ethMonthNames).find(([, name]) => name === today.month)?.[0] ?? 1);
  const monthSelections = Array.from({ length: 3 }, (_, index) => {
    let year = today.year;
    let month = currentMonthNumber - (2 - index);
    while (month <= 0) { month += 13; year -= 1; }
    return { year, month };
  });
  const monthlyAttendance = await Promise.all(monthSelections.map(async ({ year, month }) => {
    const range = monthRange(year, month);
    const attendances = await prisma.attendance.findMany({
      where: { mode: 'ABALAT', member: { type: 'MEMBER', courseClassId: null, NOT: { roles: { has: 'COURSE_STUDENT' } } }, event: { mode: 'ABALAT', courseClassId: null, isAcademicTimeline: false, eventType: { in: ['CHORE', 'SUNDAY'] }, date: { gte: range.start, lt: range.end } }, attendanceType: { mode: 'ABALAT' } },
      include: { event: true, attendanceType: true },
    });
    const scores = new Map<string, { sunday: number; chore: number }>();
    for (const attendance of attendances) {
      const name = attendance.attendanceType.name.toLowerCase();
      const value = name.includes('permission') || name.includes('excused') ? 0.5 : attendance.attendanceType.value;
      const score = scores.get(attendance.memberId) ?? { sunday: 0, chore: 0 };
      if (attendance.event.eventType === 'CHORE') score.chore += value;
      if (attendance.event.eventType === 'SUNDAY') score.sunday += value;
      scores.set(attendance.memberId, score);
    }
    return {
      label: ethMonthNames[month],
      year,
      scores: members.map((member) => ({
        ...member,
        ...(scores.get(member.id) ?? { sunday: 0, chore: 0 }),
      })),
    };
  }));

  return <div className="space-y-6 animate-fade-in pb-10">
    <div className="border-b pb-5" style={{ borderColor: 'hsl(var(--border))' }}>
      <p className="text-xs font-semibold" style={{ color: 'hsl(160 60% 55%)' }}>የዛሬ እይታ</p>
      <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>ዛሬ</h1>
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{today.month} {today.day}፣ {today.year} ዓ.ም. · {members.length} የአባላት መዝገቦች</p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/abalat/permission-types/new"
        className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold"
        style={{ background: 'hsl(160 70% 32%)', color: '#fff' }}
      >
        <FilePlus2 size={15} />
        አዲስ የፈቃድ አይነት
      </Link>
      <Link
        href="/abalat/eligibility-rules/new"
        className="inline-flex items-center gap-1.5 rounded border px-3 py-2 text-sm font-semibold"
        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
      >
        <ShieldPlus size={15} />
        አዲስ የብቁነት መስፈርት
      </Link>
    </div>

    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">የዚህ ሳምንት አቴንዳንስ</h2><Clock size={18} /></div>
      {weekEvents.length === 0 ? (
        <div className="rounded-lg border p-5 text-sm" style={{ borderColor: 'hsl(var(--border))' }}>
          በዚህ ሳምንት የሚሞላ አቴንዳንስ የለም።
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {weekEvents.map((event) => {
            const ethDate = event.ethiopianMonth && event.ethiopianDay
              ? { month: ethMonthNames[event.ethiopianMonth], day: event.ethiopianDay, year: event.ethiopianYear ?? today.year }
              : dateToEthiopian(event.date);
            const label = event.eventType === 'CHORE' ? 'የሠርክ' : 'የእሑድ';
            const eventDate = new Date(event.date);
            const isToday = eventDate.getFullYear() === now.getFullYear()
              && eventDate.getMonth() === now.getMonth()
              && eventDate.getDate() === now.getDate();
            return (
              <Link
                key={event.id}
                href={`/abalat/events/${event.id}/attendance`}
                className={`flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-[hsl(var(--accent))] ${isToday ? 'ring-2 ring-[hsl(160_70%_42%)] shadow-lg shadow-[hsl(160_70%_32%/0.18)]' : ''}`}
                style={{
                  borderColor: isToday ? 'hsl(160 70% 42%)' : 'hsl(var(--border))',
                  background: isToday ? 'hsl(160 35% 13%)' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <CheckSquare size={isToday ? 24 : 19} style={{ color: isToday ? 'hsl(160 70% 60%)' : undefined }} />
                  <div>
                    <p className={isToday ? 'text-base font-bold' : 'text-sm font-semibold'}>{event.title} · {ethDate.month} {ethDate.day} · {label}</p>
                    <p className="text-xs opacity-70">{isToday ? 'የዛሬ አቴንዳንስ · አሁን ይሙሉ' : 'አቴንዳንስ ለመሙላት ይግቡ'}</p>
                  </div>
                </div>
                {isToday && <span className="mr-2 rounded px-2 py-1 text-xs font-bold" style={{ background: 'hsl(160 70% 32%)', color: '#fff' }}>ዛሬ</span>}
                <ArrowRight size={isToday ? 19 : 16} />
              </Link>
            );
          })}
        </div>
      )}
    </section>

    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">የቅርብ ጊዜ ሁለት በዓላት</h2><Calendar size={18} /></div><div className="grid gap-3 md:grid-cols-2">{recentReports.map(({ event, report }) => { const ethDate = dateToEthiopian(event.date); return <Link key={event.id} href={`/abalat/events/${event.id}/eligibility`} className="rounded-lg border p-4 hover:bg-[hsl(var(--accent))]" style={{ borderColor: 'hsl(var(--border))' }}><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{event.title}</p><p className="text-xs mt-1 opacity-70">{ethDate.month} {ethDate.day}፣ {ethDate.year}</p></div><ArrowRight size={16} /></div><div className="mt-4 flex gap-5 text-xs"><span><strong style={{ color: 'hsl(160 60% 55%)' }}>{report.eligibleMembers.length}</strong> ያሟሉ</span><span><strong style={{ color: 'hsl(0 55% 55%)' }}>{report.ineligibleMembers.length}</strong> ያላሟሉ</span></div></Link>; })}</div></section>

    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">የመጨረሻ ሶስት ወራት አቴንዳንስ</h2><BarChart3 size={18} /></div><div className="max-h-[430px] overflow-auto rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}><table className="min-w-[760px] w-full text-xs"><thead><tr style={{ background: 'hsl(var(--muted))' }}><th rowSpan={2} className="sticky left-0 z-10 p-2 text-left" style={{ background: 'hsl(var(--muted))' }}>ቁ.</th><th rowSpan={2} className="sticky left-8 z-10 p-2 text-left min-w-[150px]" style={{ background: 'hsl(var(--muted))' }}>ሙሉ ስም</th>{monthlyAttendance.map((month) => <th key={`${month.year}-${month.label}`} colSpan={2} className="border-l p-2 text-center" style={{ borderColor: 'hsl(var(--border))' }}>{month.label} {month.year}</th>)}<th colSpan={2} className="border-l p-2 text-center" style={{ borderColor: 'hsl(var(--border))' }}>ጠቅላላ</th></tr><tr style={{ background: 'hsl(var(--muted))' }}>{monthlyAttendance.flatMap((month) => [<th key={`${month.label}-s`} className="border-l p-2 text-center">እሑድ</th>, <th key={`${month.label}-c`} className="p-2 text-center">ሠርክ</th>])}<th className="border-l p-2 text-center">እሑድ</th><th className="p-2 text-center">ሠርክ</th></tr></thead><tbody>{members.map((member, index) => <tr key={member.id} className="border-t" style={{ borderColor: 'hsl(var(--border))' }}><td className="sticky left-0 z-10 p-2" style={{ background: 'hsl(var(--card))' }}>{index + 1}.</td><td className="sticky left-8 z-10 p-2 font-medium" style={{ background: 'hsl(var(--card))' }}>{member.fullName ?? 'ስም የለም'}</td>{monthlyAttendance.flatMap((month) => { const score = month.scores.find((item) => item.id === member.id) ?? { sunday: 0, chore: 0 }; return [<td key={`${month.label}-${member.id}-s`} className="border-l p-2 text-center">{score.sunday}</td>, <td key={`${month.label}-${member.id}-c`} className="p-2 text-center">{score.chore}</td>]; })}<td className="border-l p-2 text-center font-semibold">{monthlyAttendance.reduce((sum, month) => sum + (month.scores.find((item) => item.id === member.id)?.sunday ?? 0), 0)}</td><td className="p-2 text-center font-semibold">{monthlyAttendance.reduce((sum, month) => sum + (month.scores.find((item) => item.id === member.id)?.chore ?? 0), 0)}</td></tr>)}</tbody></table></div><Link href="/abalat/reports/monthly-attendance" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: 'hsl(160 60% 55%)' }}>ዝርዝር ሪፖርት <ArrowRight size={14} /></Link></section>
  </div>;
}
