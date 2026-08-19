import prisma from "@/src/lib/prisma";
import MezmurPermissionList from "./components/MezmurPermissionList";

export default async function MezmurPermissionsPage() {
  const [permissions, permissionTypes, members] = await Promise.all([
    prisma.permission.findMany({
      where: { mode: "MEZMUR" },
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
      where: {
        type: "MEMBER",
        isActive: true,
        OR: [
          { roles: { has: "REGULAR_MEMBER" } },
          { mezmurEnrollments: { some: { status: "ACTIVE" } } }
        ]
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          የመዝሙር ጥናት ፈቃዶች
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          ለመዝሙር ጥናቶች ላለመገኘት አባላት የሚሰጣቸውን ፈቃዶች መከታተያ
        </p>
      </div>

      <MezmurPermissionList
        initialPermissions={permissions}
        permissionTypes={permissionTypes}
        members={members}
      />
    </div>
  );
}
