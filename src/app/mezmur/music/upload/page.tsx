import prisma from "@/src/lib/prisma";
import MusicUploadForm from "./components/MusicUploadForm";

async function getAdminId() {
  try {
    const admin = await prisma.user.findFirst({
      where: { type: "ADMIN" }
    }) || await prisma.user.findFirst({
      where: { type: "SUPERADMIN" }
    });
    return admin?.id || "system-admin";
  } catch (error) {
    console.error('Database connection error in getAdminId:', error);
    return "system-admin";
  }
}

export default async function MezmurMusicUploadPage() {
  let categories: Array<any> = [];
  try {
    categories = await prisma.musicCategory.findMany({
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error('Error fetching music categories:', error);
    categories = [];
  }

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
