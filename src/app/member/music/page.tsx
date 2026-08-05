import prisma from "@/src/lib/prisma";
import MemberMusicLibraryClient from "./components/MemberMusicLibraryClient";

export default async function MemberMusicPage() {
  const files = await prisma.musicFile.findMany({
    include: {
      categories: true,
      uploadedBy: {
        select: { fullName: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const categories = await prisma.musicCategory.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          የመዝሙር መዝገብ
        </h1>
        <p className="text-sm mt-0.5 opacity-50">
          ለመዝሙር ጥናት የሚሆኑ መዝሙሮች
        </p>
      </div>

      <MemberMusicLibraryClient
        initialFiles={files as any}
        categories={categories as any}
      />
    </div>
  );
}
