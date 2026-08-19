import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/src/lib/prisma";
import { generateAccessCode } from "@/src/lib/utils";
import { getEthiopianToday } from "@/src/lib/ethiopiancal";

const EXCEL_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const HEADERS = [
  "ተ.ቁ. (No.)",
  "ሙሉ ስም (Full Name)",
  "የክርስትና ስም (Christian Name)",
  "ፆታ (Gender)",
  "ዕድሜ (Age)",
  "የምዝገባ ቀን (Registration Date)",
];

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function parseGender(value: unknown): "MALE" | "FEMALE" | null {
  const normalized = text(value).toLowerCase();
  if (["ወ", "ወንድ", "m", "male"].includes(normalized)) return "MALE";
  if (["ሴ", "ሴት", "f", "female"].includes(normalized)) return "FEMALE";
  return null;
}

function parseRegistrationDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${value.getFullYear()}`;
  }

  const valueText = text(value);
  if (!valueText) return null;
  const parts = valueText.replace(/\//g, "-").split("-");
  if (parts.length !== 3) return valueText;

  const [first, second, third] = parts.map(Number);
  if ([first, second, third].some(Number.isNaN)) return valueText;
  if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
    return `${String(first).padStart(2, "0")}-${String(second).padStart(2, "0")}-${String(third).padStart(4, "0")}`;
  }
  return valueText;
}

function parseRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The workbook does not contain a worksheet");

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (rows.length < 2) throw new Error("The workbook does not contain member rows");

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    const fullName = text(row[1]);
    const christianName = text(row[2]) || null;
    const gender = parseGender(row[3]);
    const ageText = text(row[4]);
    const age = Number(ageText);
    const registerDate = parseRegistrationDate(row[5]);
    const errors: string[] = [];

    if (!fullName) errors.push("Full name is required");
    if (!gender) errors.push("Gender must be ወ, ሴ, male, female, m, or f");
    if (!ageText || !Number.isInteger(age) || age < 1 || age > 120) errors.push("Age must be a whole number from 1 to 120");
    if (registerDate === null) errors.push("Registration date is required");

    return {
      rowNumber,
      fullName,
      christianName,
      gender,
      age,
      registerDate,
      errors,
    };
  });
}

export async function GET() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    HEADERS,
    [1, "ማሕሌት ክንፈ", "ወለተ ሰንበት", "ሴ", 20, "12-02-2011"],
    [2, "Full Name", "Christian Name", "ወ", 25, "01-01-2018"],
  ]);
  worksheet["!cols"] = [
    { wch: 12 }, { wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 28 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": EXCEL_CONTENT_TYPE,
      "Content-Disposition": "attachment; filename=abalat_members_template.xlsx",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required" }, { status: 400 });
    }

    const rows = parseRows(Buffer.from(await file.arrayBuffer()));
    const errors: { row: number; error: string }[] = [];
    let created = 0;
    const yearDigits = getEthiopianToday().year.toString().slice(-2);

    for (let offset = 0; offset < rows.length; offset += 50) {
      const chunk = rows.slice(offset, offset + 50);
      const validRows = chunk.filter((row) => {
        if (row.errors.length) {
          errors.push(...row.errors.map((error) => ({ row: row.rowNumber, error })));
          return false;
        }
        return true;
      });

      if (validRows.length === 0) continue;
      const names = validRows.map((row) => row.fullName);
      const existing = await prisma.user.findMany({
        where: {
          type: "MEMBER",
          fullName: { in: names },
        },
        select: { fullName: true, christianName: true },
      });
      const existingKeys = new Set(existing.map((member) => member.fullName?.trim().toLowerCase()));

      for (const row of validRows) {
        const key = row.fullName.trim().toLowerCase();
        if (existingKeys.has(key)) {
          errors.push({ row: row.rowNumber, error: "A member with this full name already exists" });
          continue;
        }

        try {
          let privateId = generateAccessCode(yearDigits);
          for (let attempt = 0; attempt < 20; attempt++) {
            const duplicate = await prisma.user.findUnique({ where: { privateId } });
            if (!duplicate) break;
            privateId = generateAccessCode(yearDigits);
          }

          await prisma.user.create({
            data: {
              fullName: row.fullName,
              christianName: row.christianName,
              gender: row.gender!,
              age: row.age,
              registerDate: row.registerDate,
              roles: { set: ["REGULAR_MEMBER"] },
              type: "MEMBER",
              mode: "ABALAT",
              privateId,
            },
          });
          existingKeys.add(key);
          created++;
        } catch (error: any) {
          errors.push({ row: row.rowNumber, error: error?.code === "P2002" ? "Duplicate member record" : "Failed to create member" });
        }
      }
    }

    return NextResponse.json({ success: true, totalRows: rows.length, created, failed: errors.length, errors });
  } catch (error) {
    console.error("Abalat member import error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to import members" }, { status: 500 });
  }
}
