import prisma from "@/src/lib/prisma";
import CoursePermissionList from "./components/CoursePermissionList";

export default async function CoursePermissionsPage() {
  const [permissions, permissionTypes, students] = await Promise.all([
    prisma.permission.findMany({
      where: { mode: "COURSE" },
      include: {
        member: true,
        permissionType: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.permissionType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { memberType: "COURSE_STUDENT", isActive: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Course Student Permissions
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Manage excused absences for students. Approved permissions count towards exam eligibility.
        </p>
      </div>

      <CoursePermissionList
        initialPermissions={permissions}
        permissionTypes={permissionTypes}
        students={students}
      />
    </div>
  );
}
