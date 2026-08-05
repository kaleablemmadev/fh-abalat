import prisma from "@/src/lib/prisma";
import MemberCategoryList from "./components/MemberCategoryList";

export default async function MemberMusicCategoriesPage() {
  const categories = await prisma.musicCategory.findMany({
    include: {
      musicFiles: {
        select: {
          id: true,
          title: true,
          language: true,
        },
        orderBy: { title: 'asc' }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          የመዝሙር ምድቦች
        </h1>
        <p className="text-sm mt-0.5 opacity-50">
          መዝሙራትን በምድብ ተመልከት
        </p>
      </div>

      <MemberCategoryList categories={categories as any} />
    </div>
  );
}
