import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import CategoryDetailsClient from "./components/CategoryDetailsClient";

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const category = await prisma.musicCategory.findUnique({
    where: { id },
    include: {
      musicFiles: {
        include: {
          categories: true,
          uploadedBy: { select: { fullName: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!category) notFound();

  const allCategories = await prisma.musicCategory.findMany({ select: { id: true, name: true } });

  const admin = await prisma.user.findFirst({ where: { type: "ADMIN" } }) || await prisma.user.findFirst({ where: { type: "SUPERADMIN" } });
  const adminId = admin?.id || "system-admin";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        <p className="text-sm mt-0.5 opacity-50">{category.description || "የምድብ ስብስብ"}</p>
      </div>

      <CategoryDetailsClient
        category={category as any}
        allCategories={allCategories}
        adminId={adminId}
      />
    </div>
  );
}
