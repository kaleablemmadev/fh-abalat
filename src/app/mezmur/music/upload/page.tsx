import prisma from "@/src/lib/prisma";
import MusicUploadForm from "./components/MusicUploadForm";

async function getAdminId() {
  const admin = await prisma.user.findFirst({
    where: { type: "ADMIN" }
  }) || await prisma.user.findFirst({
    where: { type: "SUPERADMIN" }
  });
  return admin?.id || "system-admin";
}

export default async function MezmurMusicUploadPage() {
  const categories = await prisma.musicCategory.findMany({
    orderBy: { name: "asc" }
  });

  const adminId = await getAdminId();

  return (
    <div className="py-6">
      <MusicUploadForm
        categories={categories as any}
        adminId={adminId}
      />
    </div>
  );
}
