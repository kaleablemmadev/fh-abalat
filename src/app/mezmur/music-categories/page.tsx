import prisma from "@/src/lib/prisma";
import CategoryList from "./components/CategoryList";

export default async function MezmurCategoriesPage() {
  const categories = await prisma.musicCategory.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Music Categories</h1>
        <p className="text-sm opacity-50">Organize your music library with custom tags and groups</p>
      </div>

      <CategoryList initialCategories={categories as any} />
    </div>
  );
}
