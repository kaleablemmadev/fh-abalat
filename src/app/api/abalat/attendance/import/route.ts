import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/src/lib/prisma";
import {
  ethMonthNames,
  ethiopianToGregorianDate,
  getChoreDaysInMonth,
  getEthiopianToday,
  getSundaysInMonth,
} from "@/src/lib/ethiopiancal";

const CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
type ImportType = "chore" | "sunday";
type Status = "1" | "0" | "P";

type EventColumn = {
  column: number;
  month: number;
  day: number;
  eventId: string;
};

function getImportType(value: string | null): ImportType {
  if (value === "chore" || value === "sunday") return value;
  throw new Error("Attendance type must be chore or sunday");
}

function normalizeStatus(value: unknown): Status | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "1" || normalized === "0" || normalized === "P") return normalized;
  return null;
}

async function getAdminId() {
  const admin = await prisma.user.findFirst({ where: { type: "ADMIN", mode: "ABALAT" } })
    ?? await prisma.user.findFirst({ where: { type: "SUPERADMIN", mode: "ABALAT" } });
  if (!admin) throw new Error("No Abalat admin is available to mark attendance");
  return admin.id;
}

async function getAttendanceTypes() {
  const types = await prisma.attendanceType.findMany({ where: { mode: "ABALAT" } });
  const find = (names: string[]) => types.find((type) => names.some((name) => type.name.toLowerCase().includes(name)));
  const ensure = async (current: typeof types[number] | undefined, name: string, value: number) => {
    if (current) return current;
    return prisma.attendanceType.create({
      data: {
        name: `Abalat ${name}`,
        value,
        mode: "ABALAT",
        isDefault: value === 1,
      },
    });
  };

  const attended = await ensure(find(["attend", "present", "yes"]), "Present", 1);
  const permission = await ensure(find(["permission", "excused"]), "Permission", 0.5);
  const absent = await ensure(find(["absent", "no"]), "Absent", 0);
  return { attended, permission, absent };
}

async function getEventColumns(type: ImportType, year: number): Promise<EventColumn[]> {
  const days = type === "chore"
    ? Array.from({ length: 13 }, (_, index) => getChoreDaysInMonth(year, index + 1))
    : Array.from({ length: 13 }, (_, index) => getSundaysInMonth(year, index + 1));
  const flattened = days.flat();
  const eventType = type === "chore" ? "CHORE" : "SUNDAY";
  const adminId = await getAdminId();
  const columns: EventColumn[] = [];

  for (let index = 0; index < flattened.length; index++) {
    const ethDate = flattened[index];
    let event = await prisma.event.findFirst({
      where: {
        eventType,
        ethiopianYear: year,
        ethiopianMonth: Object.entries(ethMonthNames).find(([, name]) => name === ethDate.month)?.[0] ? Number(Object.entries(ethMonthNames).find(([, name]) => name === ethDate.month)?.[0]) : undefined,
        ethiopianDay: ethDate.day,
        courseClassId: null,
        mode: "ABALAT",
      },
    });

    if (!event) {
      const month = Number(Object.entries(ethMonthNames).find(([, name]) => name === ethDate.month)?.[0]);
      const gregorian = ethiopianToGregorianDate({ year, month, day: ethDate.day });
      event = await prisma.event.create({
        data: {
          title: type === "chore" ? "Chore Attendance" : "Sunday Morning Attendance",
          date: new Date(gregorian.year, gregorian.month - 1, gregorian.day),
          ethiopianYear: year,
          ethiopianMonth: month,
          ethiopianDay: ethDate.day,
          eventType,
          createdById: adminId,
          mode: "ABALAT",
          courseClassId: null,
        },
      });
    }

    columns.push({ column: index + 2, month: event.ethiopianMonth!, day: event.ethiopianDay!, eventId: event.id });
  }
  return columns;
}

function buildWorkbook(type: ImportType, year: number, members: { fullName: string | null }[], columns: EventColumn[]) {
  const firstHeader: unknown[] = ["No.", "Full Name"];
  const secondHeader: unknown[] = ["", ""];
  let previousMonth = 0;
  for (const column of columns) {
    firstHeader.push(column.month === previousMonth ? "" : ethMonthNames[column.month]);
    secondHeader.push(column.day);
    previousMonth = column.month;
  }

  const rows = members.map((member, index) => [index + 1, member.fullName ?? "", ...columns.map(() => "")]);
  const worksheet = XLSX.utils.aoa_to_sheet([firstHeader, secondHeader, ...rows]);
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
  ];
  let start = 2;
  while (start < firstHeader.length) {
    let end = start;
    while (end + 1 < firstHeader.length && firstHeader[end + 1] === "") end++;
    if (end > start) merges.push({ s: { r: 0, c: start }, e: { r: 0, c: end } });
    start = end + 1;
  }
  worksheet["!merges"] = merges;
  worksheet["!cols"] = [{ wch: 8 }, { wch: 30 }, ...columns.map(() => ({ wch: 8 }))];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${type}-${year}`);
  const instructions = XLSX.utils.aoa_to_sheet([
    ["Attendance values"],
    ["1", "Attended"],
    ["P or p", "Permission / excused"],
    ["0", "Absent"],
    ["Blank", "No attendance value will be imported"],
  ]);
  XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export async function GET(request: NextRequest) {
  try {
    const type = getImportType(new URL(request.url).searchParams.get("type"));
    const year = getEthiopianToday().year;
    const columns = await getEventColumns(type, year);
    const members = await prisma.user.findMany({
      where: { type: "MEMBER", roles: { has: "REGULAR_MEMBER" }, NOT: { roles: { has: "COURSE_STUDENT" } }, mode: "ABALAT" },
      select: { fullName: true },
      orderBy: { fullName: "asc" },
    });
    const buffer = buildWorkbook(type, year, members, columns);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPE,
        "Content-Disposition": `attachment; filename=abalat_${type}_attendance_${year}.xlsx`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create attendance template" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = getImportType(String(formData.get("type") ?? ""));
    if (!(file instanceof File)) return NextResponse.json({ error: "Excel file is required" }, { status: 400 });

    const year = getEthiopianToday().year;
    const columns = await getEventColumns(type, year);
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return NextResponse.json({ error: "The workbook has no worksheet" }, { status: 400 });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    if (rows.length < 3) return NextResponse.json({ error: "The workbook has no member rows" }, { status: 400 });

    const members = await prisma.user.findMany({
      where: { type: "MEMBER", roles: { has: "REGULAR_MEMBER" }, NOT: { roles: { has: "COURSE_STUDENT" } }, mode: "ABALAT" },
      select: { id: true, fullName: true },
    });
    const memberByName = new Map(members.map((member) => [member.fullName?.trim().toLowerCase(), member]));
    const attendanceTypes = await getAttendanceTypes();
    const adminId = await getAdminId();
    const saved = new Set<string>();
    const errors: { row: number; error: string }[] = [];

    for (let offset = 2; offset < rows.length; offset += 25) {
      const chunk = rows.slice(offset, offset + 25);
      const records: { memberId: string; eventId: string; attendanceTypeId: string; month: number; day: number }[] = [];
      for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
        const row = chunk[rowIndex];
        const rowNumber = offset + rowIndex + 1;
        const name = String(row[1] ?? "").trim();
        const member = memberByName.get(name.toLowerCase());
        if (!member) {
          errors.push({ row: rowNumber, error: `Member not found: ${name || "empty name"}` });
          continue;
        }
        for (const column of columns) {
          // Empty cells mean "do not save or change attendance for this slot".
          if (row[column.column] === null || row[column.column] === undefined || String(row[column.column]).trim() === "") {
            continue;
          }
          const status = normalizeStatus(row[column.column]);
          if (!status) continue;
          const attendanceTypeId = status === "1" ? attendanceTypes.attended.id : status === "P" ? attendanceTypes.permission.id : attendanceTypes.absent.id;
          records.push({ memberId: member.id, eventId: column.eventId, attendanceTypeId, month: column.month, day: column.day });
        }
      }

      for (let recordOffset = 0; recordOffset < records.length; recordOffset += 100) {
        const recordChunk = records.slice(recordOffset, recordOffset + 100);
        const existing = await prisma.attendance.findMany({
          where: {
            memberId: { in: [...new Set(recordChunk.map((record) => record.memberId))] },
            eventId: { in: [...new Set(recordChunk.map((record) => record.eventId))] },
          },
          select: { memberId: true, eventId: true },
        });
        const existingKeys = new Set(existing.map((record) => `${record.memberId}:${record.eventId}`));
        const newRecords = recordChunk.filter((record) => !existingKeys.has(`${record.memberId}:${record.eventId}`));
        const existingRecords = recordChunk.filter((record) => existingKeys.has(`${record.memberId}:${record.eventId}`));

        await prisma.$transaction(async (tx) => {
          if (newRecords.length) {
            await tx.attendance.createMany({
              data: newRecords.map((record) => ({
                memberId: record.memberId,
                eventId: record.eventId,
                attendanceTypeId: record.attendanceTypeId,
                markedById: adminId,
                mode: "ABALAT" as const,
              })),
            });
          }
          for (const record of existingRecords) {
            await tx.attendance.update({
              where: { memberId_eventId: { memberId: record.memberId, eventId: record.eventId } },
              data: { attendanceTypeId: record.attendanceTypeId, markedById: adminId, mode: "ABALAT" },
            });
          }
        }, { maxWait: 60000, timeout: 60000 });
        newRecords.forEach((record) => saved.add(`${record.month}:${record.day}`));
      }
    }

    const savedDates = [...saved].map((value) => {
      const [month, day] = value.split(":").map(Number);
      return `${ethMonthNames[month]} ${day}`;
    });
    return NextResponse.json({ success: true, savedCount: saved.size, savedDates, errors });
  } catch (error) {
    console.error("Abalat attendance import error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to import attendance" }, { status: 500 });
  }
}
