import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEthiopianToday, formatEthiopianDate } from "@/src/lib/ethiopiancal";

// Types from Prisma (defined in schema.prisma)
// Note: Using string literals for enums to avoid import issues if client generation is slightly different
// But since we ran prisma generate, we can try importing them.
// If they fail, we'll fallback to literal strings.

// Schema matching firecourse's FormData shape
const webhookSchema = z.object({
  formType: z.enum(['bega', 'keremt', 'bega-distance', 'e-learning']),
  fullName: z.string().min(2),
  phone: z.string().min(9),
  secondary_phone: z.string().optional().nullable(),
  age: z.union([z.string(), z.number()]).transform((v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }),
  academic_level: z.string().optional().nullable(),
  address: z.string().min(3),
  class: z.string().optional().nullable(),
  timestamp: z.string().optional().nullable(),
});

const CLASS_MAPPING: Record<string, string> = {
  'ቀዳማይ': 'KEDAMAY',
  'ካልዓይ': 'KALEAY',
  'ካልአይ': 'KALEAY', // fallback for different spellings
  'ሣልሳይ': 'SALSAY',
  'ራብዓይ': 'RABEAY',
};

export async function POST(request: NextRequest) {
  try {
    // 1. Shared Secret Check
    const secret = request.headers.get("x-webhook-secret");
    const expectedSecret = process.env.REGISTRATION_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate Payload
    const body = await request.json();
    const validation = webhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 3. Reject inactive forms
    if (data.formType === 'bega-distance' || data.formType === 'e-learning') {
      console.warn(`Attempted submission from inactive form: ${data.formType}`);
      return NextResponse.json(
        { error: `Form type ${data.formType} is currently inactive.` },
        { status: 400 }
      );
    }

    // 4. Map Form to CourseClassType
    let targetClassType: string;
    if (data.formType === 'keremt') {
      targetClassType = 'KEREMT';
    } else {
      // Bega
      if (!data.class || !CLASS_MAPPING[data.class]) {
        return NextResponse.json(
          { error: `Invalid or missing class for Bega form: ${data.class}` },
          { status: 400 }
        );
      }
      targetClassType = CLASS_MAPPING[data.class];
    }

    // 5. Get current Ethiopian year for class lookup
    const ethToday = getEthiopianToday();
    const ethYear = String(ethToday.year);

    // 6. Find or Create User + Registration + Enrollment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find matching CourseClass
      // Use any to bypass strict type checking if Prisma types are problematic in this environment
      const courseClass = await (tx.courseClass as any).findUnique({
        where: {
          name_year: {
            name: targetClassType,
            year: ethYear,
          },
        },
      });

      if (!courseClass) {
        throw new Error(`Course class ${targetClassType} for year ${ethYear} not found in system.`);
      }

      // Find or create User
      let user = await tx.user.findFirst({
        where: {
          fullName: data.fullName,
          phoneNumber: data.phone,
        },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            fullName: data.fullName,
            phoneNumber: data.phone,
            address: data.address,
            age: data.age,
            type: 'MEMBER',
            memberType: 'COURSE_STUDENT',
            isActive: true,
          },
        });
      }

      // Create CourseRegistration
      const registration = await (tx as any).courseRegistration.create({
        data: {
          memberId: user.id,
          formType: data.formType === 'bega' ? 'BEGA' : 'KEREMT',
          phoneNumber: data.phone,
          secondaryPhone: data.secondary_phone,
          age: data.age,
          academicLevel: data.academic_level,
          address: data.address,
          rawClassLabel: data.class,
          submittedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
        },
      });

      // Create ClassEnrollment (if not already exists)
      const existingEnrollment = await tx.courseEnrollment.findUnique({
        where: {
          courseClassId_studentId: {
            courseClassId: courseClass.id,
            studentId: user.id,
          },
        },
      });

      if (!existingEnrollment) {
        await tx.courseEnrollment.create({
          data: {
            studentId: user.id,
            courseClassId: courseClass.id,
            status: 'ACTIVE',
            enrolledDate: formatEthiopianDate(ethToday, 'short'),
          },
        });
      }

      return { memberId: user.id, registrationId: registration.id };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
